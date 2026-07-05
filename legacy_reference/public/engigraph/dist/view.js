import paper from 'https://esm.sh/paper';
import * as geom from './geometry.js';
/**
 * View, Grid, and Navigation Manager
 */
export class ViewManager {
    constructor(app) {
        this.app = app;
        this.isPanning = false;
        this.lastMousePos = null;
    }
    drawGrid() {
        if (!this.app.layers.grid || !paper.view)
            return;
        // Debounce drawing to improve interaction smoothness
        if (this._gridTimer)
            cancelAnimationFrame(this._gridTimer);
        this._gridTimer = requestAnimationFrame(() => this._performGridDraw());
    }
    _performGridDraw() {
        const prevActive = paper.project.activeLayer;
        try {
            this.app.layers.grid.locked = false;
            this.app.layers.grid.activate();
            const zoom = paper.view.zoom;
            let step = 10.0;
            let subStep = 1.0;
            // Adaptive Grid Resolution
            if (zoom > 5.0) {
                step = 1.0;
                subStep = 0.1;
            }
            else if (zoom > 1.2) {
                step = 10.0;
                subStep = 1.0;
            }
            else if (zoom < 0.25) {
                step = 100.0;
                subStep = 20.0;
            }
            // Optimization: Cache grid state to prevent redraw on micro-movements
            const viewKey = `${Math.round(paper.view.center.x / 2)},${Math.round(paper.view.center.y / 2)},${zoom.toFixed(2)},${this.app.isIsometric}`;
            if (this._lastViewKey === viewKey)
                return;
            this._lastViewKey = viewKey;
            this.app.layers.grid.removeChildren();
            const bounds = paper.view.bounds.clone().expand(step * 4); // Slightly larger buffer for smoother pans
            const style = getComputedStyle(document.documentElement);
            const colorMajor = style.getPropertyValue('--grid-major').trim() || '#444';
            const colorMinor = style.getPropertyValue('--grid-minor').trim() || '#222';
            if (!this.app.isIsometric) {
                const startX = Math.floor(bounds.left / subStep) * subStep;
                const endX = Math.ceil(bounds.right / subStep) * subStep;
                const startY = Math.floor(bounds.top / subStep) * subStep;
                const endY = Math.ceil(bounds.bottom / subStep) * subStep;
                // Optimization: Use a single CompoundPath for minor and major grids
                const majorPath = new paper.CompoundPath({ strokeColor: colorMajor, strokeWidth: 0.7, guide: true });
                const minorPath = new paper.CompoundPath({ strokeColor: colorMinor, strokeWidth: 0.3, guide: true });
                for (let x = startX; x <= endX; x += subStep) {
                    const isMajor = Math.abs(x % step) < (subStep * 0.1);
                    if (!isMajor && zoom < 0.5)
                        continue; // Throttle minor grid for performance
                    const target = isMajor ? majorPath : minorPath;
                    target.moveTo(x, bounds.top);
                    target.lineTo(x, bounds.bottom);
                }
                for (let y = startY; y <= endY; y += subStep) {
                    const isMajor = Math.abs(y % step) < (subStep * 0.1);
                    if (!isMajor && zoom < 0.5)
                        continue;
                    const target = isMajor ? majorPath : minorPath;
                    target.moveTo(bounds.left, y);
                    target.lineTo(bounds.right, y);
                }
            }
            else {
                const tan30 = Math.tan(Math.PI / 6);
                const cos30 = Math.cos(Math.PI / 6);
                const majorPath = new paper.CompoundPath({ strokeColor: colorMajor, strokeWidth: 0.8, guide: true });
                const minorPath = new paper.CompoundPath({ strokeColor: colorMinor, strokeWidth: 0.4, guide: true });
                // 1. Vertical Lines
                const vStep = subStep * cos30;
                const endX = Math.ceil(bounds.right / vStep) * vStep;
                for (let x = Math.floor(bounds.left / vStep) * vStep; x <= endX; x += vStep) {
                    const isMajor = Math.abs(x % (step * cos30)) < (vStep * 0.1);
                    const target = isMajor ? majorPath : minorPath;
                    target.moveTo(x, bounds.top);
                    target.lineTo(x, bounds.bottom);
                }
                // 2. 30-degree Diagonal Lines
                const bMin = bounds.top - bounds.right * tan30;
                const bMax = bounds.bottom - bounds.left * tan30;
                for (let b = Math.floor(bMin / subStep) * subStep; b <= bMax; b += subStep) {
                    const isMajor = Math.abs(b % step) < (subStep * 0.1);
                    if (!isMajor && zoom < 0.5)
                        continue;
                    const target = isMajor ? majorPath : minorPath;
                    target.moveTo(bounds.left, bounds.left * tan30 + b);
                    target.lineTo(bounds.right, bounds.right * tan30 + b);
                }
                // 3. 150-degree Diagonal Lines
                const aMin = bounds.top + bounds.left * tan30;
                const aMax = bounds.bottom + bounds.right * tan30;
                for (let b = Math.floor(aMin / subStep) * subStep; b <= aMax; b += subStep) {
                    const isMajor = Math.abs(b % step) < (subStep * 0.1);
                    if (!isMajor && zoom < 0.5)
                        continue;
                    const target = isMajor ? majorPath : minorPath;
                    target.moveTo(bounds.left, -bounds.left * tan30 + b);
                    target.lineTo(bounds.right, -bounds.right * tan30 + b);
                }
            }
        }
        finally {
            if (prevActive)
                prevActive.activate();
            this.app.layers.grid.locked = true;
        }
        paper.view.update();
    }
    initNavigation() {
        // Robust resize handling to prevent "ResizeObserver loop completed with undelivered notifications"
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                if (paper.view) {
                    const width = Math.floor(entry.contentRect.width);
                    const height = Math.floor(entry.contentRect.height);
                    // Only update if dimensions actually changed to avoid infinite loops
                    if (width !== Math.floor(paper.view.viewSize.width) ||
                        height !== Math.floor(paper.view.viewSize.height)) {
                        const oldCenter = paper.view.center.clone();
                        const oldZoom = paper.view.zoom;
                        paper.view.viewSize = new paper.Size(width, height);
                        paper.view.center = oldCenter;
                        paper.view.zoom = oldZoom;
                        // Force grid update to cover newly exposed workspace areas
                        this.drawGrid();
                    }
                }
            }
        });
        resizeObserver.observe(this.app.canvas.parentElement); // Observe parent to be more stable
        this.app.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const mousePos = paper.view.viewToProject(new paper.Point(e.offsetX, e.offsetY));
            const zoomFactor = 1.1;
            const oldZoom = paper.view.zoom;
            let newZoom = e.deltaY < 0 ? oldZoom * zoomFactor : oldZoom / zoomFactor;
            this.setZoom(newZoom, mousePos);
        }, { passive: false });
        this.app.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 1 || (e.button === 0 && this.app.currentTool === 'pan')) {
                this.isPanning = true;
                this.lastMousePos = new paper.Point(e.clientX, e.clientY);
                this.app.canvas.style.cursor = 'grabbing';
            }
        });
        window.addEventListener('mousemove', (e) => {
            if (this.isPanning && this.lastMousePos) {
                const mousePos = new paper.Point(e.clientX, e.clientY);
                const delta = mousePos.subtract(this.lastMousePos).divide(paper.view.zoom);
                // Update center and immediately redraw grid to keep it "infinite"
                paper.view.center = paper.view.center.subtract(delta);
                this.lastMousePos = mousePos;
                this.drawGrid();
            }
        });
        window.addEventListener('mouseup', () => {
            this.isPanning = false;
            if (this.app.currentTool === 'select')
                this.app.canvas.style.cursor = 'default';
            else if (this.app.currentTool === 'pan')
                this.app.canvas.style.cursor = 'grab';
            else
                this.app.canvas.style.cursor = 'crosshair';
        });
    }
    getProcessedPoint(rawPoint) {
        let p = rawPoint;
        // 1. Object & Instrument Snap (Highest priority)
        if (this.app.snapSettings.object) {
            const snap = geom.findSnapPoint(p, paper.project);
            if (snap && snap.point) {
                this.showSnapIndicator(snap);
                return snap.point;
            }
        }
        // 2. Ortho / Angle Constraints (Project raw mouse before grid snapping to maintain direction)
        if (this.app.tools.startPoint && (this.app.snapSettings.ortho || this.app.snapSettings.angleSnap)) {
            const vec = p.subtract(this.app.tools.startPoint);
            if (vec.length > 0.1) {
                let targetAngle;
                if (this.app.snapSettings.ortho) {
                    const directions = this.app.isIsometric ? [-150, -90, -30, 30, 90, 150] : [0, 90, 180, -90];
                    targetAngle = directions.reduce((prev, curr) => Math.abs(curr - vec.angle) < Math.abs(prev - vec.angle) ? curr : prev);
                }
                else {
                    targetAngle = Math.round(vec.angle / 15) * 15;
                }
                // Mathematical projection onto the constrained vector
                const rad = targetAngle * Math.PI / 180;
                const dir = new paper.Point(Math.cos(rad), Math.sin(rad));
                const projectionDist = vec.dot(dir);
                p = this.app.tools.startPoint.add(dir.multiply(projectionDist));
            }
        }
        // 3. Grid Snap (Apply to the constrained point)
        if (this.app.snapSettings.grid) {
            const step = this.app.snapSettings.gridStep || 1.0;
            const gridP = this.app.isIsometric ? geom.snapToIsoGrid(p, step) : geom.snapToGrid(p, step);
            p = gridP;
        }
        this.hideSnapIndicator();
        return p;
    }
    showSnapIndicator(snap) {
        let indicator = document.getElementById('snap-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'snap-indicator';
            document.getElementById('canvas-container').appendChild(indicator);
        }
        const point = snap.point || snap;
        const type = snap.type || 'default';
        const viewPoint = paper.view.projectToView(point);
        indicator.style.display = 'flex';
        indicator.style.alignItems = 'center';
        indicator.style.justifyContent = 'center';
        indicator.style.left = (viewPoint.x - 6) + 'px'; // Center 12x12
        indicator.style.top = (viewPoint.y - 6) + 'px';
        // Reset classes
        indicator.className = 'snap-icon';
        indicator.innerHTML = ''; // Clear SVG
        // Draw the exact CAD symbols!
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", "12");
        svg.setAttribute("height", "12");
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("stroke", "var(--accent, #00ff00)");
        path.setAttribute("stroke-width", "1.5");
        path.setAttribute("fill", "none");
        if (type === 'endpoint') {
            path.setAttribute("d", "M 1 1 L 11 1 L 11 11 L 1 11 Z"); // Square
            indicator.classList.add('snap-endpoint');
        }
        else if (type === 'midpoint') {
            path.setAttribute("d", "M 6 1 L 11 10 L 1 10 Z"); // Triangle
            indicator.classList.add('snap-midpoint');
        }
        else if (type === 'intersection') {
            path.setAttribute("d", "M 2 2 L 10 10 M 10 2 L 2 10"); // Cross (X)
            indicator.classList.add('snap-intersection');
        }
        else if (type === 'center') {
            path.setAttribute("d", "M 6 2 A 4 4 0 1 1 5.9 2 Z M 6 6 L 6 6.1"); // Circle with dot
            indicator.classList.add('snap-center');
        }
        else {
            path.setAttribute("d", "M 2 2 L 10 10 M 10 2 L 2 10"); // Default X
        }
        svg.appendChild(path);
        indicator.appendChild(svg);
    }
    hideSnapIndicator() {
        const indicator = document.getElementById('snap-indicator');
        if (indicator)
            indicator.style.display = 'none';
    }
    setZoom(level, center) {
        const minZoom = 0.005;
        const maxZoom = 50.0;
        const oldZoom = paper.view.zoom;
        const newZoom = Math.min(Math.max(level, minZoom), maxZoom);
        if (newZoom !== oldZoom) {
            const viewPos = center ? center : paper.view.center;
            const beta = oldZoom / newZoom;
            const pc = viewPos.subtract(paper.view.center);
            paper.view.zoom = newZoom;
            if (center) {
                // Adjust center to keep mouse position fixed
                const mpos = paper.view.viewToProject(paper.view.projectToView(center));
                paper.view.center = paper.view.center.add(center.subtract(mpos));
            }
            (document.getElementById('zoom-display') || {}).textContent = `Zoom: ${Math.round(paper.view.zoom * 100)}%`;
            // Throttled grid redraw on zoom
            this.drawGrid();
        }
    }
    zoomByFactor(factor) {
        this.setZoom(paper.view.zoom * factor);
    }
    getZoom() {
        return paper.view.zoom;
    }
    zoomExtents() {
        const geomLayer = paper.project.layers['geometry_layer'];
        const dimLayer = paper.project.layers['dimensions_layer'];
        if (!geomLayer) {
            this.setZoom(1.0);
            paper.view.center = new paper.Point(0, 0);
            return;
        }
        const bounds = dimLayer ? geomLayer.bounds.unite(dimLayer.bounds) : geomLayer.bounds;
        if (!bounds || bounds.isEmpty()) {
            this.setZoom(1.0);
            paper.view.center = new paper.Point(0, 0);
            return;
        }
        const padding = 100;
        const vSize = paper.view.viewSize;
        const zoomX = (vSize.width - padding) / bounds.width;
        const zoomY = (vSize.height - padding) / bounds.height;
        const newZoom = Math.min(zoomX, zoomY, 2.0);
        paper.view.center = bounds.center;
        this.setZoom(newZoom);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3ZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLLE1BQU0sc0JBQXNCLENBQUM7QUFDekMsT0FBTyxLQUFLLElBQUksTUFBTSxlQUFlLENBQUM7QUFFdEM7O0dBRUc7QUFDSCxNQUFNLE9BQU8sV0FBVztJQUNwQixZQUFZLEdBQUc7UUFDWCxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNmLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO0lBQzdCLENBQUM7SUFFRCxRQUFRO1FBQ0osSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJO1lBQUUsT0FBTztRQUVqRCxxREFBcUQ7UUFDckQsSUFBSSxJQUFJLENBQUMsVUFBVTtZQUFFLG9CQUFvQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMzRCxJQUFJLENBQUMsVUFBVSxHQUFHLHFCQUFxQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUM7SUFDM0UsQ0FBQztJQUVELGdCQUFnQjtRQUNaLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDO1FBQzdDLElBQUksQ0FBQztZQUNELElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUVoQyxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztZQUM3QixJQUFJLElBQUksR0FBRyxJQUFJLENBQUM7WUFDaEIsSUFBSSxPQUFP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