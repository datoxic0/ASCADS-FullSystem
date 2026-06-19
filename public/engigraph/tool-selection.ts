import paper from 'https://esm.sh/paper';
import * as geom from './geometry.js';

/**
 * Handles Selection logic, Marquee selection, and Instrument handles.
 */
export class SelectionManager {
    constructor(app, manager) {
        this.app = app;
        this.manager = manager;
        this.activeHandle = null;
        this.handleTarget = null;
        this.lastAngle = null;
        this.lastDist = null;
        this._handleUpdatePending = false;
    }

    handleMouseDown(event) {
        // High-priority hit test for instrument handles (guides)
        const handleHit = paper.project.hitTest(event.point, {
            segments: true, stroke: true, fill: true, tolerance: 15, guides: true,
            match: (h) => h.item && h.item.data && h.item.data.isHandle
        });

        if (handleHit) {
            this.activeHandle = handleHit.item;
            this.handleTarget = handleHit.item.parent; // Target is the group containing the handle
            
            if (this.activeHandle.data.role === 'terminal-handle') {
                const startPoint = this.activeHandle.bounds.center.clone();
                paper.project.deselectAll();
                
                // Switch tool
                this.manager.setTool('wire');
                
                // Initialize wire routing
                this.manager.startPoint = startPoint;
                this.manager.tempPath = new paper.Path.Line(startPoint, startPoint);
                this.manager.tempPath.strokeColor = this.app.themeColors.geometry;
                this.manager.tempPath.strokeWidth = 2;
                this.manager.tempPath.data = { type: 'wire' };
                
                // Clear active handle
                this.activeHandle = null;
                this.handleTarget = null;
                return true;
            } else if (this.activeHandle.data.role === 'slide-handle') {
                const slider = this.handleTarget.children.find(c => c.data && c.data.isSlider);
                this.handleTarget.data._slideStartPos = slider.position.clone();
                this.handleTarget.data._dragStartPoint = event.point.clone();
            } else {
                this.lastAngle = (event.point.subtract(this.handleTarget.position)).angle;
                this.lastDist = event.point.getDistance(this.handleTarget.position);
            }
            return true;
        }

        const hit = paper.project.hitTest(event.point, {
            segments: true, stroke: true, fill: true, tolerance: 10,
            match: (h) => {
                if (!h.item || !h.item.layer || h.item.layer.name === 'grid_layer') return false;
                return true;
            }
        });

        if (!event.modifiers.shift) {
            // Before deselecting all, check if we are performing a precision click:
            const selection = paper.project.selectedItems.filter(i => !i.data.isInstrument);
            
            // Find if we hit an instrument while having something else selected
            let instrumentHit = null;
            if (hit) {
                let curr = hit.item;
                while (curr) {
                    if (curr.data && curr.data.isInstrument) { instrumentHit = curr; break; }
                    curr = curr.parent;
                }
            }

            if (selection.length > 0 && instrumentHit) {
                selection.forEach(item => this.straightenEntityToInstrument(item, instrumentHit));
                return true;
            }

            paper.project.deselectAll();
            paper.project.getItems({ data: d => d && d.role && d.role.endsWith('-handle') })
                         .forEach(h => h.visible = false);
        }

        if (hit) {
            let target = hit.item;
            while (target.parent && target.parent.className !== 'Layer' && target.parent !== paper.project) {
                target = target.parent;
            }

            target.selected = !target.selected;
            this.manager.selection = target.selected ? target : null;
            
            if (target.data.isInstrument || target.data.type === 'component') {
                // Ensure handles exist (dynamically generates them if not present)
                if (target.selected) {
                    this.manager.drawing.addInstrumentHandles(target);
                }
                
                target.children.forEach(c => {
                    if (c.data && c.data.role && c.data.role.endsWith('-handle')) {
                        c.visible = target.selected;
                    }
                });
            }

            this.app.ui.properties.updateProperties(this.manager.selection);
        } else {
            // Start marquee
            this.manager.marquee = new paper.Path.Rectangle(event.point, new paper.Size(1, 1));
            this.manager.marquee.strokeColor = '#0088ff';
            this.manager.marquee.dashArray = [4, 2];
            this.manager.marquee.guide = true;
            this.manager.selection = null;
            this.app.ui.properties.updateProperties(null);
        }
        return false;
    }

    handleMouseDrag(event) {
        if (this.activeHandle && this.handleTarget) {
            if (this.activeHandle.data.role === 'slide-handle') {
                const slider = this.handleTarget.children.find(c => c.data && c.data.isSlider);
                const base = this.handleTarget.children.find(c => c.data && c.data.role === 'instrument-base');
                if (slider && base) {
                    const isDrafter = this.handleTarget.data.instrumentType === 'paired-drafter';
                    const baseRot = (this.handleTarget.rotation || 0) * Math.PI / 180;
                    const dir = new paper.Point(Math.cos(baseRot), Math.sin(baseRot));
                    
                    const totalDelta = event.point.subtract(this.handleTarget.data._dragStartPoint);
                    const projection = totalDelta.dot(dir);
                    
                    const startLocalPos = this.handleTarget.globalToLocal(this.handleTarget.data._slideStartPos);
                    const newLocalX = startLocalPos.x + projection;
                    
                    // Sliding limits based on instrument type
                    const rulerWidth = isDrafter ? (250 * this.app.scaleFactor) : (300 * this.app.scaleFactor);
                    const limitMin = isDrafter ? 40 : -rulerWidth/2 + 40;
                    const limitMax = isDrafter ? rulerWidth + 20 : rulerWidth/2 - 40;
                    const clampedX = Math.max(limitMin, Math.min(limitMax, newLocalX));
                    
                    const h = slider.data.angle === 30 ? (220 * this.app.scaleFactor * Math.sqrt(3)) : (220 * this.app.scaleFactor);
                    // T-square top is -20, Drafter top is -12
                    const yOffset = isDrafter ? -12 : -20;
                    slider.position = new paper.Point(clampedX, yOffset - (h / 2));
                }
            } else if (this.activeHandle.data.role === 'rotation-handle') {
                const currentPos = event.point.subtract(this.handleTarget.position);
                if (currentPos.length < 1) return true;
                
                let angle = currentPos.angle;
                const isBaseInstrument = this.handleTarget.data.instrumentType === 'ruler' || 
                                         this.handleTarget.data.instrumentType === 'paired-set' || 
                                         this.handleTarget.data.instrumentType === 'paired-drafter';
                
                if (isBaseInstrument) {
                    // Strict locking for T-Squares / Bases: Only 0, 90, 180, 270
                    angle = Math.round(angle / 90) * 90;
                } else {
                    // High precision for others
                    angle = Math.round(angle * 10) / 10;
                }

                const delta = angle - this.lastAngle;
                if (Math.abs(delta) > 0.01) {
                    this.handleTarget.rotate(delta, this.handleTarget.position);
                    this.handleTarget.data.rotation = (this.handleTarget.data.rotation || 0) + delta;
                    this.lastAngle = angle;
                }
            } else if (this.activeHandle.data.role === 'resize-handle') {
                const distance = event.point.getDistance(this.handleTarget.position);
                const scale = (this.lastDist > 0.1) ? distance / this.lastDist : 1;
                
                // Uniformly scale the entire group to maintain instrument proportions
                this.handleTarget.scale(scale, this.handleTarget.position);
                this.lastDist = distance;
            }
            // Throttle handle updates to prevent call stack overflow and UI freezing
            if (!this._handleUpdatePending) {
                this._handleUpdatePending = true;
                requestAnimationFrame(() => {
                    if (this.handleTarget && this.handleTarget.project) {
                        this.manager.drawing.addInstrumentHandles(this.handleTarget);
                        // Refresh properties panel only if visible to save CPU
                        if (this.manager.selection === this.handleTarget) {
                            this.app.ui.properties.updateProperties(this.handleTarget);
                        }
                    }
                    this._handleUpdatePending = false;
                });
            }
            return true;
        }

        if (this.manager.marquee) {
            this.manager.marquee.remove();
            this.manager.marquee = new paper.Path.Rectangle(this.manager.startPoint, event.point);
            this.manager.marquee.strokeColor = '#0088ff';
            this.manager.marquee.dashArray = [4, 2];
            this.manager.marquee.guide = true;
            return true;
        }

        if (this.manager.selection && !event.modifiers.shift) {
            const currentProcessedPoint = this.app.viewManager.getProcessedPoint(event.point);
            const totalDeltaSinceStart = currentProcessedPoint.subtract(this.manager.startPoint);
            const distMM = (totalDeltaSinceStart.length / this.app.scaleFactor).toFixed(2);
            
            // USE PROCESSED MOVE DELTA FOR STABILITY
            const rawDelta = event.delta.clone();
            let moveDelta = rawDelta;

            // STABILITY: Never allow rotation during body drag. Instruments must stay stable.
            // Locking logic only for translation.

            (document.getElementById('status-msg') || {}).textContent = `Moving Selection: ${distMM}mm`;
            
            // INSTRUMENT SNAPPING AND SLIDE-LOCKING
            if (this.manager.selection.data.instrumentType === 'set-square' || this.manager.selection.data.instrumentType === 'drafter') {
                const rulers = paper.project.getItems({
                    data: d => d && (d.instrumentType === 'ruler' || d.instrumentType === 'paired-set' || d.instrumentType === 'paired-drafter')
                });

                for (const ruler of rulers) {
                    const rRot = ruler.rotation || 0;
                    const rAngle = rRot * Math.PI / 180;
                    const rDir = new paper.Point(Math.cos(rAngle), Math.sin(rAngle));
                    const rNormal = new paper.Point(-rDir.y, rDir.x);
                    
                    // Ruler edge detection (Rulers/T-squares are height 40, top is -20)
                    const rTopEdgePoint = ruler.position.add(rNormal.multiply(-20));
                    const triBottomPoint = new paper.Point(this.manager.selection.bounds.centerX, this.manager.selection.bounds.bottom);
                    const distToEdge = (triBottomPoint.subtract(rTopEdgePoint)).dot(rNormal);
                    
                    if (Math.abs(distToEdge) < 10) { 
                        moveDelta = moveDelta.add(rNormal.multiply(-distToEdge));
                        // Lock to horizontal/vertical axis of the ruler
                        const parallelComp = moveDelta.dot(rDir);
                        moveDelta = rDir.multiply(parallelComp);
                        (document.getElementById('status-msg') || {}).textContent = "LOCKED: Instrument sliding along working edge.";
                        break;
                    }
                }
            }

            this.manager.selection.position = this.manager.selection.position.add(moveDelta);
            this.app.ui.properties.updateProperties(this.manager.selection);
            
            if (this.manager.selection.data.isInstrument) {
                if (!this._handleUpdatePending) {
                    this._handleUpdatePending = true;
                    // Debounce handle updates to ensure 60fps movement
                    setTimeout(() => {
                        if (this.manager.selection && this.manager.selection.project) {
                            this.manager.drawing.addInstrumentHandles(this.manager.selection);
                        }
                        this._handleUpdatePending = false;
                    }, 16);
                }
            }
            return true;
        }
        return false;
    }

    handleMouseUp() {
        if (this.activeHandle) {
            this.activeHandle = null;
            this.handleTarget = null;
            this.lastAngle = null;
            this.lastDist = null;
            return true;
        }

        if (this.manager.marquee) {
            const items = paper.project.getItems({
                inside: this.manager.marquee.bounds,
                match: (item) => item.layer && item.layer.name !== 'grid_layer' && !item.guide
            });
            items.forEach(item => item.selected = true);
            this.manager.marquee.remove();
            this.manager.marquee = null;
            if (items.length > 0) this.app.ui.properties.updateProperties(items[items.length - 1]);
            return true;
        }
        return false;
    }

    straightenEntityToInstrument(entity, instrument) {
        if (!entity || !instrument || entity === instrument) return;
        
        const now = Date.now();
        if (this._lastStraightenTime && now - this._lastStraightenTime < 50) return;
        this._lastStraightenTime = now;

        // Determine the base rotation of the instrument
        const instrumentBaseRot = instrument.rotation || 0;
        
        // Find relevant snapping increments based on instrument geometry
        let snapIncrements = [0, 90, 180, 270]; // Default T-Square/Drafter axes
        
        const findTriangle = (item) => {
            if (item.data.angle) return item;
            return item.children?.find(c => c.data && c.data.angle);
        };
        
        const tri = findTriangle(instrument);
        if (tri) {
            const angle = tri.data.angle;
            if (angle === 30) snapIncrements = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
            else if (angle === 45) snapIncrements = [0, 45, 90, 135, 180, 225, 270, 315];
        }

        if (entity.className === 'Path' && entity.segments.length === 2) {
            const p1 = entity.segments[0].point;
            const p2 = entity.segments[1].point;
            const length = p1.getDistance(p2);
            const currentAngle = p2.subtract(p1).angle;
            
            // Find the closest snapped angle relative to the instrument's base rotation
            let bestAngle = instrumentBaseRot;
            let minDiff = Infinity;
            
            snapIncrements.forEach(inc => {
                const absoluteTarget = (instrumentBaseRot + inc) % 360;
                let diff = (currentAngle - absoluteTarget) % 360;
                if (diff > 180) diff -= 360;
                if (diff < -180) diff += 360;
                
                if (Math.abs(diff) < minDiff) {
                    minDiff = Math.abs(diff);
                    bestAngle = absoluteTarget;
                }
            });
            
            const newP2 = p1.add(new paper.Point({ angle: bestAngle, length: length }));
            entity.segments[1].point = newP2;
        } else {
            // For complex objects, snap the overall rotation to the nearest increment
            let bestRot = instrumentBaseRot;
            let minDiff = Infinity;
            const currentRot = entity.rotation || 0;

            snapIncrements.forEach(inc => {
                const absoluteTarget = (instrumentBaseRot + inc) % 360;
                let diff = (currentRot - absoluteTarget) % 360;
                if (diff > 180) diff -= 360;
                if (diff < -180) diff += 360;
                if (Math.abs(diff) < minDiff) {
                    minDiff = Math.abs(diff);
                    bestRot = absoluteTarget;
                }
            });
            entity.rotation = bestRot;
        }
        
        this.app.ui.properties.updateProperties(entity);
        this.app.history.pushState();
        (document.getElementById('status-msg') || {}).textContent = `Precision Alignment: Entity corrected to ${instrument.data.instrumentType} top-side plane.`;
        paper.view.update();
    }
}