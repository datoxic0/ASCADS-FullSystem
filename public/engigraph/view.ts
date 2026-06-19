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
        if (!this.app.layers.grid || !paper.view) return;
        
        // Debounce drawing to improve interaction smoothness
        if (this._gridTimer) cancelAnimationFrame(this._gridTimer);
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
            if (zoom > 5.0) { step = 1.0; subStep = 0.1; }
            else if (zoom > 1.2) { step = 10.0; subStep = 1.0; }
            else if (zoom < 0.25) { step = 100.0; subStep = 20.0; }

            // Optimization: Cache grid state to prevent redraw on micro-movements
            const viewKey = `${Math.round(paper.view.center.x / 2)},${Math.round(paper.view.center.y / 2)},${zoom.toFixed(2)},${this.app.isIsometric}`;
            if (this._lastViewKey === viewKey) return;
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
                if (!isMajor && zoom < 0.5) continue; // Throttle minor grid for performance
                const target = isMajor ? majorPath : minorPath;
                target.moveTo(x, bounds.top);
                target.lineTo(x, bounds.bottom);
            }
            for (let y = startY; y <= endY; y += subStep) {
                const isMajor = Math.abs(y % step) < (subStep * 0.1);
                if (!isMajor && zoom < 0.5) continue;
                const target = isMajor ? majorPath : minorPath;
                target.moveTo(bounds.left, y);
                target.lineTo(bounds.right, y);
            }
        } else {
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
                if (!isMajor && zoom < 0.5) continue;
                const target = isMajor ? majorPath : minorPath;
                target.moveTo(bounds.left, bounds.left * tan30 + b);
                target.lineTo(bounds.right, bounds.right * tan30 + b);
            }

            // 3. 150-degree Diagonal Lines
            const aMin = bounds.top + bounds.left * tan30;
            const aMax = bounds.bottom + bounds.right * tan30;
            for (let b = Math.floor(aMin / subStep) * subStep; b <= aMax; b += subStep) {
                const isMajor = Math.abs(b % step) < (subStep * 0.1);
                if (!isMajor && zoom < 0.5) continue;
                const target = isMajor ? majorPath : minorPath;
                target.moveTo(bounds.left, -bounds.left * tan30 + b);
                target.lineTo(bounds.right, -bounds.right * tan30 + b);
            }
        }
        
        } finally {
            if (prevActive) prevActive.activate();
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
            if (this.app.currentTool === 'select') this.app.canvas.style.cursor = 'default';
            else if (this.app.currentTool === 'pan') this.app.canvas.style.cursor = 'grab';
            else this.app.canvas.style.cursor = 'crosshair';
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
                    targetAngle = directions.reduce((prev, curr) => 
                        Math.abs(curr - vec.angle) < Math.abs(prev - vec.angle) ? curr : prev
                    );
                } else {
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
        } else if (type === 'midpoint') {
            path.setAttribute("d", "M 6 1 L 11 10 L 1 10 Z"); // Triangle
            indicator.classList.add('snap-midpoint');
        } else if (type === 'intersection') {
            path.setAttribute("d", "M 2 2 L 10 10 M 10 2 L 2 10"); // Cross (X)
            indicator.classList.add('snap-intersection');
        } else if (type === 'center') {
            path.setAttribute("d", "M 6 2 A 4 4 0 1 1 5.9 2 Z M 6 6 L 6 6.1"); // Circle with dot
            indicator.classList.add('snap-center');
        } else {
            path.setAttribute("d", "M 2 2 L 10 10 M 10 2 L 2 10"); // Default X
        }
        
        svg.appendChild(path);
        indicator.appendChild(svg);
    }

    hideSnapIndicator() {
        const indicator = document.getElementById('snap-indicator');
        if (indicator) indicator.style.display = 'none';
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