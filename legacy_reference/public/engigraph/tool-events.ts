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
        if (this.app.viewManager.isPanning) return;

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
            if (geometryLayer) geometryLayer.activate();
            else if (paper.project.layers.length > 0) paper.project.layers[0].activate();
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
        } else if (['ruler', 'set-square-30', 'set-square-45', 'protractor', 'gear', 'drafter', 'set-paired-30', 'set-paired-45', 'set-paired-drafter'].includes(tool)) {
            const instrument = this.manager.drawing.handleMouseDown(tool, point);
            if (!instrument) return;
            instrument.opacity = 1.0;
            instrument.guide = false;
            instrument.selected = true; // Auto-select on drop to show handles
            if (this.manager.tempPath) {
                this.manager.tempPath.remove();
                this.manager.tempPath = null;
            }
            this.manager.setTool('select');
            this.app.history.pushState();
        } else if (['line', 'circle', 'rect', 'spline', 'arc', 'polygon', 'ellipse', 'rounded_rect'].includes(tool)) {
            this.manager.tempPath = this.manager.drawing.handleMouseDown(tool, point);
        } else if (tool === 'select') {
            this.manager.selectionManager.handleMouseDown(event);
        } else if (['dim-linear', 'dim-radial'].includes(tool)) {
            this.manager.tempPath = new paper.Path.Line(point, point);
            this.manager.tempPath.strokeColor = '#00ff00';
            this.manager.tempPath.dashArray = [4, 4];
        } else if (tool === 'dim-smart') {
            this.manager.annotations.handleSmartDim(event.point);
        } else if (tool === 'wire') {
            this.manager.tempPath = new paper.Path.Line(point, point);
            this.manager.tempPath.strokeColor = this.app.themeColors.geometry;
            this.manager.tempPath.strokeWidth = 2;
            this.manager.tempPath.data = { type: 'wire' };
        } else if (tool === 'text') {
            const content = prompt("Enter text note:", "NOTE 1");
            if (content) {
                const textLayer = paper.project.layers['text_layer'] || paper.project.activeLayer;
                const prev = paper.project.activeLayer;
                textLayer.activate();
                new paper.PointText({ point, content, fillColor: 'var(--text-main)', fontSize: 12, fontFamily: 'Segoe UI' }).data.type = 'text';
                prev.activate();
            }
        } else if (tool === 'sculpt') {
            this.manager.modelling.handleSculpt(point, true);
        } else if (['offset', 'mirror', 'trim', 'extend', 'array-linear', 'subdivide', 'bisect', 'fillet'].includes(tool)) {
            const handlerName = `handle${tool.charAt(0).toUpperCase() + tool.slice(1).replace(/-./g, x => x[1].toUpperCase())}`;
            if (this.manager.modelling[handlerName]) {
                this.manager.modelling[handlerName](point);
            }
        } else if (tool === 'leader') {
            this.manager.tempPath = new paper.Path.Line(point, point);
            this.manager.tempPath.strokeColor = 'var(--text-main)';
            this.manager.tempPath.dashArray = [2, 2];
        } else if (tool === 'ref-scale') {
            this.manager.clickSequence.push(point);
            if (this.manager.clickSequence.length === 2) {
                const d = this.manager.clickSequence[0].getDistance(this.manager.clickSequence[1]);
                const real = prompt("Enter actual distance (mm):", (d * (1/this.app.scaleFactor)).toFixed(2));
                if (real) this.app.scaleFactor = d / parseFloat(real);
                this.manager.clickSequence = [];
            }
        }
    }

    handleMouseDrag(event) {
        if (this.app.viewManager.isPanning) return;
        const point = this.app.viewManager.getProcessedPoint(event.point);
        const tool = this.app.currentTool;

        if (tool === 'select') {
            if (this.manager.selectionManager.handleMouseDrag(event)) return;
        }

        if (tool === 'place-component' && this.manager.activeComponent) {
            this.manager.activeComponent.position = point;
            return;
        }

        if (tool === 'sculpt') {
            this.manager.modelling.handleSculpt(point, false, event.delta);
            return;
        }

        if (!this.manager.tempPath || !this.manager.startPoint) return;

        if (['line', 'circle', 'rect', 'spline', 'arc', 'polygon', 'ellipse', 'rounded_rect'].includes(tool)) {
            this.manager.tempPath = this.manager.drawing.handleMouseDrag(tool, point, this.manager.startPoint, this.manager.tempPath);
        } else if (['dim-linear', 'dim-radial'].includes(tool)) {
            this.manager.tempPath.segments[1].point = point;
        } else if (tool === 'wire') {
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
            } else {
                // Vertical first
                this.manager.tempPath.add(new paper.Point(p1.x, p2.y));
            }
            this.manager.tempPath.add(p2);
        }
    }

    handleMouseUp(event) {
        if (this.app.viewManager.isPanning) return;
        const point = this.app.viewManager.getProcessedPoint(event.point);
        const tool = this.app.currentTool;
        let changed = false;

        if (tool === 'select') {
            if (this.manager.selectionManager.handleMouseUp(event)) changed = true;
        }
        
        if (tool === 'dim-linear' && this.manager.tempPath) {
            this.manager.annotations.createDimension(this.manager.startPoint, point, (this.manager.startPoint.getDistance(point) * (1/this.app.scaleFactor)).toFixed(2));
            this.manager.tempPath.remove(); this.manager.tempPath = null;
            changed = true;
        } else if (tool === 'dim-radial' && this.manager.tempPath) {
            this.manager.annotations.createRadialDimension(this.manager.startPoint, point, (this.manager.startPoint.getDistance(point) * (1/this.app.scaleFactor)).toFixed(2));
            this.manager.tempPath.remove(); this.manager.tempPath = null;
            changed = true;
        } else if (tool === 'leader' && this.manager.tempPath) {
            const txt = prompt("Leader text:", "NOTE");
            if (txt) {
                this.manager.annotations.createLeader(this.manager.startPoint, point, txt);
            }
            this.manager.tempPath.remove(); this.manager.tempPath = null;
            changed = true;
        } else if (tool === 'spline' && this.manager.tempPath) {
            this.manager.tempPath.simplify(10);
            this.manager.tempPath.smooth({ type: 'catmull-rom' });
            this.manager.tempPath.data.type = 'spline';
            this.manager.tempPath = null;
            changed = true;
        } else if (['line', 'circle', 'rect', 'wire', 'polygon', 'ellipse', 'rounded_rect'].includes(tool) && this.manager.tempPath) {
            this.manager.tempPath.data.type = tool;
            this.manager.tempPath = null;
            changed = true;
        } else if (tool === 'sculpt' || (tool === 'select' && !changed)) {
            changed = true;
        }

        if (changed) this.app.history.pushState();
    }

    handleMouseMove(event) {
        const p = this.app.viewManager.getProcessedPoint(event.point);
        const dx = geom.formatCoord(p.x, this.app.scaleFactor);
        const dy = geom.formatCoord(p.y, this.app.scaleFactor);
        const coordDisplay = document.getElementById('coord-display');
        if (coordDisplay) coordDisplay.textContent = `X: ${dx} Y: ${dy}`;

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
                        this.manager.tempPath.children.forEach(c => { if(c.data && c.data.isHandle) c.visible = false; });
                    }
                }
            } else if (this.manager.tempPath) {
                this.manager.tempPath.position = p;
            }
        } else {
            // Only remove if it's truly a guide instrument
            if (this.manager.tempPath && this.manager.tempPath.guide && this.manager.tempPath.data && this.manager.tempPath.data.isInstrument) {
                this.manager.tempPath.remove();
                this.manager.tempPath = null;
            }
        }
    }
}