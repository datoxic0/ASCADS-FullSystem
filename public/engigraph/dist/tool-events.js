import paper from 'https://esm.sh/paper';
import * as geom from './geometry.js';
/**
 * Handles routing of global tool events to specific sub-tool managers.
 */
export class ToolEvents {
    constructor(app, manager) {
        this.app = app;
        this.manager = manager;
    }
    handleMouseDown(event) {
        if (this.app.viewManager.isPanning)
            return;
        // Handle Interactive Components (Right-Click)
        if (event.event && event.event.button === 2) {
            // Find component under cursor
            const hitResult = paper.project.hitTest(event.point, {
                fill: true, stroke: true, segments: true, tolerance: 5
            });
            if (hitResult && hitResult.item) {
                // Traverse up to find the group with data.type === 'component'
                let item = hitResult.item;
                while (item && item.data.type !== 'component' && item.parent) {
                    item = item.parent;
                }
                if (item && item.data.type === 'component') {
                    // Trigger interaction!
                    this.manager.components.toggleComponentState(item);
                    return; // Stop further processing
                }
            }
        }
        if (paper.project.activeLayer && (paper.project.activeLayer.name === 'grid_layer' || paper.project.activeLayer.locked)) {
            const geometryLayer = paper.project.layers['geometry_layer'];
            if (geometryLayer)
                geometryLayer.activate();
            else if (paper.project.layers.length > 0)
                paper.project.layers[0].activate();
            this.app.ui.layers.updateLayerUI();
        }
        const point = this.app.viewManager.getProcessedPoint(event.point);
        this.manager.startPoint = point;
        const tool = this.app.currentTool;
        if (tool === 'place-component' && this.manager.activeComponent) {
            this.manager.activeComponent.position = point;
            this.manager.activeComponent.selected = false;
            this.manager.activeComponent.opacity = 1.0;
            this.manager.activeComponent.locked = false;
            this.manager.activeComponent.data.type = 'component';
            this.manager.activeComponent.data.id = Math.random().toString(36).substr(2, 9);
            this.manager.activeComponent = null;
            this.manager.setTool('select');
            this.app.history.pushState();
        }
        else if (['ruler', 'set-square-30', 'set-square-45', 'protractor', 'gear', 'drafter', 'set-paired-30', 'set-paired-45', 'set-paired-drafter'].includes(tool)) {
            const instrument = this.manager.drawing.handleMouseDown(tool, point);
            if (!instrument)
                return;
            instrument.opacity = 1.0;
            instrument.guide = false;
            instrument.selected = true; // Auto-select on drop to show handles
            if (this.manager.tempPath) {
                this.manager.tempPath.remove();
                this.manager.tempPath = null;
            }
            this.manager.setTool('select');
            this.app.history.pushState();
        }
        else if (['line', 'circle', 'rect', 'spline', 'arc', 'polygon', 'ellipse', 'rounded_rect'].includes(tool)) {
            this.manager.tempPath = this.manager.drawing.handleMouseDown(tool, point);
        }
        else if (tool === 'select') {
            this.manager.selectionManager.handleMouseDown(event);
        }
        else if (['dim-linear', 'dim-radial'].includes(tool)) {
            this.manager.tempPath = new paper.Path.Line(point, point);
            this.manager.tempPath.strokeColor = '#00ff00';
            this.manager.tempPath.dashArray = [4, 4];
        }
        else if (tool === 'dim-smart') {
            this.manager.annotations.handleSmartDim(event.point);
        }
        else if (tool === 'wire') {
            this.manager.tempPath = new paper.Path.Line(point, point);
            this.manager.tempPath.strokeColor = this.app.themeColors.geometry;
            this.manager.tempPath.strokeWidth = 2;
            this.manager.tempPath.data = { type: 'wire' };
        }
        else if (tool === 'text') {
            const content = prompt("Enter text note:", "NOTE 1");
            if (content) {
                const textLayer = paper.project.layers['text_layer'] || paper.project.activeLayer;
                const prev = paper.project.activeLayer;
                textLayer.activate();
                new paper.PointText({ point, content, fillColor: 'var(--text-main)', fontSize: 12, fontFamily: 'Segoe UI' }).data.type = 'text';
                prev.activate();
            }
        }
        else if (tool === 'sculpt') {
            this.manager.modelling.handleSculpt(point, true);
        }
        else if (['offset', 'mirror', 'trim', 'extend', 'array-linear', 'subdivide', 'bisect', 'fillet'].includes(tool)) {
            const handlerName = `handle${tool.charAt(0).toUpperCase() + tool.slice(1).replace(/-./g, x => x[1].toUpperCase())}`;
            if (this.manager.modelling[handlerName]) {
                this.manager.modelling[handlerName](point);
            }
        }
        else if (tool === 'leader') {
            this.manager.tempPath = new paper.Path.Line(point, point);
            this.manager.tempPath.strokeColor = 'var(--text-main)';
            this.manager.tempPath.dashArray = [2, 2];
        }
        else if (tool === 'ref-scale') {
            this.manager.clickSequence.push(point);
            if (this.manager.clickSequence.length === 2) {
                const d = this.manager.clickSequence[0].getDistance(this.manager.clickSequence[1]);
                const real = prompt("Enter actual distance (mm):", (d * (1 / this.app.scaleFactor)).toFixed(2));
                if (real)
                    this.app.scaleFactor = d / parseFloat(real);
                this.manager.clickSequence = [];
            }
        }
    }
    handleMouseDrag(event) {
        if (this.app.viewManager.isPanning)
            return;
        const point = this.app.viewManager.getProcessedPoint(event.point);
        const tool = this.app.currentTool;
        if (tool === 'select') {
            if (this.manager.selectionManager.handleMouseDrag(event))
                return;
        }
        if (tool === 'place-component' && this.manager.activeComponent) {
            this.manager.activeComponent.position = point;
            return;
        }
        if (tool === 'sculpt') {
            this.manager.modelling.handleSculpt(point, false, event.delta);
            return;
        }
        if (!this.manager.tempPath || !this.manager.startPoint)
            return;
        if (['line', 'circle', 'rect', 'spline', 'arc', 'polygon', 'ellipse', 'rounded_rect'].includes(tool)) {
            this.manager.tempPath = this.manager.drawing.handleMouseDrag(tool, point, this.manager.startPoint, this.manager.tempPath);
        }
        else if (['dim-linear', 'dim-radial'].includes(tool)) {
            this.manager.tempPath.segments[1].point = point;
        }
        else if (tool === 'wire') {
            // Manhattan / Orthogonal routing for wires
            const p1 = this.manager.startPoint;
            const p2 = point;
            const dx = Math.abs(p2.x - p1.x);
            const dy = Math.abs(p2.y - p1.y);
            this.manager.tempPath.removeSegments();
            this.manager.tempPath.add(p1);
            if (dx > dy) {
                // Horizontal first
                this.manager.tempPath.add(new paper.Point(p2.x, p1.y));
            }
            else {
                // Vertical first
                this.manager.tempPath.add(new paper.Point(p1.x, p2.y));
            }
            this.manager.tempPath.add(p2);
        }
    }
    handleMouseUp(event) {
        if (this.app.viewManager.isPanning)
            return;
        const point = this.app.viewManager.getProcessedPoint(event.point);
        const tool = this.app.currentTool;
        let changed = false;
        if (tool === 'select') {
            if (this.manager.selectionManager.handleMouseUp(event))
                changed = true;
        }
        if (tool === 'dim-linear' && this.manager.tempPath) {
            this.manager.annotations.createDimension(this.manager.startPoint, point, (this.manager.startPoint.getDistance(point) * (1 / this.app.scaleFactor)).toFixed(2));
            this.manager.tempPath.remove();
            this.manager.tempPath = null;
            changed = true;
        }
        else if (tool === 'dim-radial' && this.manager.tempPath) {
            this.manager.annotations.createRadialDimension(this.manager.startPoint, point, (this.manager.startPoint.getDistance(point) * (1 / this.app.scaleFactor)).toFixed(2));
            this.manager.tempPath.remove();
            this.manager.tempPath = null;
            changed = true;
        }
        else if (tool === 'leader' && this.manager.tempPath) {
            const txt = prompt("Leader text:", "NOTE");
            if (txt) {
                this.manager.annotations.createLeader(this.manager.startPoint, point, txt);
            }
            this.manager.tempPath.remove();
            this.manager.tempPath = null;
            changed = true;
        }
        else if (tool === 'spline' && this.manager.tempPath) {
            this.manager.tempPath.simplify(10);
            this.manager.tempPath.smooth({ type: 'catmull-rom' });
            this.manager.tempPath.data.type = 'spline';
            this.manager.tempPath = null;
            changed = true;
        }
        else if (['line', 'circle', 'rect', 'wire', 'polygon', 'ellipse', 'rounded_rect'].includes(tool) && this.manager.tempPath) {
            this.manager.tempPath.data.type = tool;
            this.manager.tempPath = null;
            changed = true;
        }
        else if (tool === 'sculpt' || (tool === 'select' && !changed)) {
            changed = true;
        }
        if (changed)
            this.app.history.pushState();
    }
    handleMouseMove(event) {
        const p = this.app.viewManager.getProcessedPoint(event.point);
        const dx = geom.formatCoord(p.x, this.app.scaleFactor);
        const dy = geom.formatCoord(p.y, this.app.scaleFactor);
        const coordDisplay = document.getElementById('coord-display');
        if (coordDisplay)
            coordDisplay.textContent = `X: ${dx} Y: ${dy}`;
        if (this.app.currentTool === 'place-component' && this.manager.activeComponent) {
            this.manager.activeComponent.position = p;
            this.manager.activeComponent.opacity = 0.6;
        }
        const instruments = ['ruler', 'set-square-30', 'set-square-45', 'protractor', 'gear', 'drafter', 'set-paired-30', 'set-paired-45', 'set-paired-drafter'];
        if (instruments.includes(this.app.currentTool)) {
            if (!this.manager.tempPath) {
                this.manager.tempPath = this.manager.drawing.handleMouseDown(this.app.currentTool, p);
                if (this.manager.tempPath) {
                    this.manager.tempPath.opacity = 0.4;
                    this.manager.tempPath.guide = true;
                    // Prevent handle flickering on preview
                    if (this.manager.tempPath.children) {
                        this.manager.tempPath.children.forEach(c => { if (c.data && c.data.isHandle)
                            c.visible = false; });
                    }
                }
            }
            else if (this.manager.tempPath) {
                this.manager.tempPath.position = p;
            }
        }
        else {
            // Only remove if it's truly a guide instrument
            if (this.manager.tempPath && this.manager.tempPath.guide && this.manager.tempPath.data && this.manager.tempPath.data.isInstrument) {
                this.manager.tempPath.remove();
                this.manager.tempPath = null;
            }
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbC1ldmVudHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi90b29sLWV2ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssTUFBTSxzQkFBc0IsQ0FBQztBQUN6QyxPQUFPLEtBQUssSUFBSSxNQUFNLGVBQWUsQ0FBQztBQUV0Qzs7R0FFRztBQUNILE1BQU0sT0FBTyxVQUFVO0lBQ25CLFlBQVksR0FBRyxFQUFFLE9BQU87UUFDcEIsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDZixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztJQUMzQixDQUFDO0lBRUQsZUFBZSxDQUFDLEtBQUs7UUFDakIsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxTQUFTO1lBQUUsT0FBTztRQUUzQyw4Q0FBOEM7UUFDOUMsSUFBSSxLQUFLLENBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQzFDLDhCQUE4QjtZQUM5QixNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFO2dCQUNqRCxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsQ0FBQzthQUN6RCxDQUFDLENBQUM7WUFDSCxJQUFJLFNBQVMsSUFBSSxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQzlCLCtEQUErRDtnQkFDL0QsSUFBSSxJQUFJLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQztnQkFDMUIsT0FBTyxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssV0FBVyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDM0QsSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7Z0JBQ3ZCLENBQUM7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