import paper from 'https://esm.sh/paper';
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
            }
            else if (this.activeHandle.data.role === 'slide-handle') {
                const slider = this.handleTarget.children.find(c => c.data && c.data.isSlider);
                this.handleTarget.data._slideStartPos = slider.position.clone();
                this.handleTarget.data._dragStartPoint = event.point.clone();
            }
            else {
                this.lastAngle = (event.point.subtract(this.handleTarget.position)).angle;
                this.lastDist = event.point.getDistance(this.handleTarget.position);
            }
            return true;
        }
        const hit = paper.project.hitTest(event.point, {
            segments: true, stroke: true, fill: true, tolerance: 10,
            match: (h) => {
                if (!h.item || !h.item.layer || h.item.layer.name === 'grid_layer')
                    return false;
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
                    if (curr.data && curr.data.isInstrument) {
                        instrumentHit = curr;
                        break;
                    }
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
        }
        else {
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
                    const limitMin = isDrafter ? 40 : -rulerWidth / 2 + 40;
                    const limitMax = isDrafter ? rulerWidth + 20 : rulerWidth / 2 - 40;
                    const clampedX = Math.max(limitMin, Math.min(limitMax, newLocalX));
                    const h = slider.data.angle === 30 ? (220 * this.app.scaleFactor * Math.sqrt(3)) : (220 * this.app.scaleFactor);
                    // T-square top is -20, Drafter top is -12
                    const yOffset = isDrafter ? -12 : -20;
                    slider.position = new paper.Point(clampedX, yOffset - (h / 2));
                }
            }
            else if (this.activeHandle.data.role === 'rotation-handle') {
                const currentPos = event.point.subtract(this.handleTarget.position);
                if (currentPos.length < 1)
                    return true;
                let angle = currentPos.angle;
                const isBaseInstrument = this.handleTarget.data.instrumentType === 'ruler' ||
                    this.handleTarget.data.instrumentType === 'paired-set' ||
                    this.handleTarget.data.instrumentType === 'paired-drafter';
                if (isBaseInstrument) {
                    // Strict locking for T-Squares / Bases: Only 0, 90, 180, 270
                    angle = Math.round(angle / 90) * 90;
                }
                else {
                    // High precision for others
                    angle = Math.round(angle * 10) / 10;
                }
                const delta = angle - this.lastAngle;
                if (Math.abs(delta) > 0.01) {
                    this.handleTarget.rotate(delta, this.handleTarget.position);
                    this.handleTarget.data.rotation = (this.handleTarget.data.rotation || 0) + delta;
                    this.lastAngle = angle;
                }
            }
            else if (this.activeHandle.data.role === 'resize-handle') {
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
            if (items.length > 0)
                this.app.ui.properties.updateProperties(items[items.length - 1]);
            return true;
        }
        return false;
    }
    straightenEntityToInstrument(entity, instrument) {
        if (!entity || !instrument || entity === instrument)
            return;
        const now = Date.now();
        if (this._lastStraightenTime && now - this._lastStraightenTime < 50)
            return;
        this._lastStraightenTime = now;
        // Determine the base rotation of the instrument
        const instrumentBaseRot = instrument.rotation || 0;
        // Find relevant snapping increments based on instrument geometry
        let snapIncrements = [0, 90, 180, 270]; // Default T-Square/Drafter axes
        const findTriangle = (item) => {
            if (item.data.angle)
                return item;
            return item.children?.find(c => c.data && c.data.angle);
        };
        const tri = findTriangle(instrument);
        if (tri) {
            const angle = tri.data.angle;
            if (angle === 30)
                snapIncrements = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
            else if (angle === 45)
                snapIncrements = [0, 45, 90, 135, 180, 225, 270, 315];
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
                if (diff > 180)
                    diff -= 360;
                if (diff < -180)
                    diff += 360;
                if (Math.abs(diff) < minDiff) {
                    minDiff = Math.abs(diff);
                    bestAngle = absoluteTarget;
                }
            });
            const newP2 = p1.add(new paper.Point({ angle: bestAngle, length: length }));
            entity.segments[1].point = newP2;
        }
        else {
            // For complex objects, snap the overall rotation to the nearest increment
            let bestRot = instrumentBaseRot;
            let minDiff = Infinity;
            const currentRot = entity.rotation || 0;
            snapIncrements.forEach(inc => {
                const absoluteTarget = (instrumentBaseRot + inc) % 360;
                let diff = (currentRot - absoluteTarget) % 360;
                if (diff > 180)
                    diff -= 360;
                if (diff < -180)
                    diff += 360;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbC1zZWxlY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi90b29sLXNlbGVjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssTUFBTSxzQkFBc0IsQ0FBQztBQUd6Qzs7R0FFRztBQUNILE1BQU0sT0FBTyxnQkFBZ0I7SUFDekIsWUFBWSxHQUFHLEVBQUUsT0FBTztRQUNwQixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNmLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxLQUFLLENBQUM7SUFDdEMsQ0FBQztJQUVELGVBQWUsQ0FBQyxLQUFLO1FBQ2pCLHlEQUF5RDtRQUN6RCxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFO1lBQ2pELFFBQVEsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUk7WUFDckUsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVE7U0FDOUQsQ0FBQyxDQUFDO1FBRUgsSUFBSSxTQUFTLEVBQUUsQ0FBQztZQUNaLElBQUksQ0FBQyxZQUFZLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQztZQUNuQyxJQUFJLENB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