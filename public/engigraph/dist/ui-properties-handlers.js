import paper from 'https://esm.sh/paper';
import * as geom from './geometry.js';
/**
 * Event Handlers for Property Changes
 */
export class PropertyHandlers {
    static handleElectrical(item, app) {
        const resInput = document.getElementById('prop-elec-resistance');
        if (resInput)
            resInput.onchange = (e) => { item.data.resistance = parseFloat(e.target.value); app.history.pushState(); };
        const voltInput = document.getElementById('prop-elec-voltage');
        if (voltInput)
            voltInput.onchange = (e) => { item.data.voltage = parseFloat(e.target.value); app.history.pushState(); };
        const switchInput = document.getElementById('prop-elec-switch');
        if (switchInput)
            switchInput.onchange = (e) => {
                item.data.state = e.target.value;
                const lever = item.children.find(c => c.data && c.data.role === 'lever');
                if (lever)
                    lever.segments[1].point = item.position.add(e.target.value === 'closed' ? [5, 0] : [5, -8]);
                app.history.pushState();
            };
    }
    static handleEngineering(item, app) {
        // T-Square Locking
        const btnHoriz = document.getElementById('btn-lock-horiz');
        const btnVert = document.getElementById('btn-lock-vert');
        if (btnHoriz && btnVert) {
            btnHoriz.onclick = () => {
                item.rotate(0 - (item.data.rotation || 0), item.position);
                item.data.rotation = 0;
                app.ui.properties.updateProperties(item);
                app.history.pushState();
            };
            btnVert.onclick = () => {
                item.rotate(90 - (item.data.rotation || 0), item.position);
                item.data.rotation = 90;
                app.ui.properties.updateProperties(item);
                app.history.pushState();
            };
        }
        const baseInput = document.getElementById('prop-instrument-base');
        if (baseInput) {
            baseInput.onchange = (e) => {
                const baseIdx = parseInt(e.target.value);
                let tri = null;
                if (item.data.instrumentType?.startsWith('paired')) {
                    tri = item.children.find(c => c.data && c.data.isSlider);
                }
                else if (item.data.isInstrument && item.data.instrumentType.includes('set-square')) {
                    tri = item;
                }
                if (tri) {
                    const angle = tri.data.angle;
                    // Pivot is always bottom-left (0,0) in our factory
                    const pivot = tri.localToGlobal(new paper.Point(0, 0));
                    let rot = 0;
                    if (angle === 30) {
                        // 0: Short base (horizontal)
                        // 1: Long base (rotate to horizontal)
                        // 2: Hypotenuse (rotate to horizontal)
                        if (baseIdx === 0)
                            rot = 0;
                        if (baseIdx === 1)
                            rot = -90;
                        if (baseIdx === 2)
                            rot = 150; // Aligns hypotenuse to x-axis
                    }
                    else { // 45 deg
                        if (baseIdx === 0)
                            rot = 0;
                        if (baseIdx === 1)
                            rot = -90;
                        if (baseIdx === 2)
                            rot = 135; // Aligns hypotenuse to x-axis
                    }
                    const currentLocalRot = tri.data.localRotation || 0;
                    tri.rotate(rot - currentLocalRot, pivot);
                    tri.data.localRotation = rot;
                    tri.data.activeBase = baseIdx;
                    // Re-align to ruler/base if part of a set
                    if (item.data.instrumentType?.startsWith('paired')) {
                        const rulerHeight = item.data.instrumentType === 'paired-drafter' ? 24 : 40;
                        const localPivot = item.globalToLocal(pivot);
                        localPivot.y = -rulerHeight / 2;
                        // Recalculate center based on new base alignment
                        const newGlobalPivot = item.localToGlobal(localPivot);
                        const currentBounds = tri.bounds;
                        const offsetFromPivot = tri.position.subtract(pivot);
                        tri.position = newGlobalPivot.add(offsetFromPivot);
                    }
                    app.history.pushState();
                    paper.view.update();
                }
            };
        }
        const tolInput = document.getElementById('prop-eng-tolerance');
        if (tolInput)
            tolInput.onchange = (e) => { item.data.tolerance = e.target.value; app.history.pushState(); };
        const datumInput = document.getElementById('prop-eng-datum');
        if (datumInput)
            datumInput.onchange = (e) => { item.data.datum = e.target.value.toUpperCase(); app.history.pushState(); };
    }
    static handleMechanical(item, app) {
        const speedInput = document.getElementById('prop-mech-speed');
        if (speedInput)
            speedInput.onchange = (e) => { item.data.speed = parseFloat(e.target.value); app.history.pushState(); };
        const angleInput = document.getElementById('prop-mech-angle');
        if (angleInput)
            angleInput.onchange = (e) => { item.data.targetAngle = parseFloat(e.target.value); app.history.pushState(); };
        const matInput = document.getElementById('prop-mech-material');
        if (matInput)
            matInput.onchange = (e) => {
                item.data.material = e.target.value;
                app.ui.properties.updateProperties(item);
                app.history.pushState();
            };
        const thickInput = document.getElementById('prop-mech-thickness');
        if (thickInput)
            thickInput.onchange = (e) => {
                item.data.thickness = parseFloat(e.target.value);
                app.ui.properties.updateProperties(item);
                app.history.pushState();
            };
    }
    static handlePlacement(item, app) {
        const xInput = document.getElementById('prop-pos-x');
        const yInput = document.getElementById('prop-pos-y');
        const updatePos = () => {
            const nx = parseFloat(xInput.value) * app.scaleFactor;
            const ny = parseFloat(yInput.value) * app.scaleFactor;
            if (!isNaN(nx) && !isNaN(ny)) {
                item.position = new paper.Point(nx, ny);
                app.history.pushState();
                paper.view.update();
            }
        };
        if (xInput)
            xInput.onchange = updatePos;
        if (yInput)
            yInput.onchange = updatePos;
        const widthInput = document.getElementById('prop-dim-width');
        const heightInput = document.getElementById('prop-dim-height');
        const updateDimensions = () => {
            const newW = parseFloat(widthInput.value) * app.scaleFactor;
            const newH = parseFloat(heightInput.value) * app.scaleFactor;
            if (!isNaN(newW) && !isNaN(newH) && newW > 0 && newH > 0) {
                const scaleX = newW / item.bounds.width;
                const scaleY = newH / item.bounds.height;
                item.scale(scaleX, scaleY, item.bounds.center);
                app.history.pushState();
                paper.view.update();
                app.ui.properties.updateProperties(item);
            }
        };
        if (widthInput)
            widthInput.onchange = updateDimensions;
        if (heightInput)
            heightInput.onchange = updateDimensions;
        const radiusInput = document.getElementById('prop-param-radius');
        if (radiusInput)
            radiusInput.onchange = (e) => {
                const newR = parseFloat(e.target.value) * app.scaleFactor;
                if (!isNaN(newR)) {
                    const center = item.position;
                    const oldStyle = { color: item.strokeColor, width: item.strokeWidth };
                    item.remove();
                    const newItem = new paper.Path.Circle(center, newR);
                    newItem.strokeColor = oldStyle.color;
                    newItem.strokeWidth = oldStyle.width;
                    newItem.data.type = 'circle';
                    newItem.selected = true;
                    app.tools.selection = newItem;
                    app.ui.properties.updateProperties(newItem);
                }
            };
        const teethInput = document.getElementById('prop-gear-teeth');
        const moduleInput = document.getElementById('prop-gear-module');
        if (teethInput || moduleInput) {
            const updateGear = () => {
                const teeth = parseInt(teethInput?.value) || 18;
                const module = parseFloat(moduleInput?.value) || 5;
                const center = item.position;
                const oldStyle = { color: item.strokeColor, width: item.strokeWidth };
                item.remove();
                const newItem = geom.generateGearPath(teeth, module, 20);
                newItem.position = center;
                newItem.strokeColor = oldStyle.color;
                newItem.strokeWidth = oldStyle.width;
                newItem.data.type = 'gear';
                newItem.data.teeth = teeth;
                newItem.data.module = module;
                newItem.selected = true;
                app.tools.selection = newItem;
                app.ui.properties.updateProperties(newItem);
                app.history.pushState();
            };
            if (teethInput)
                teethInput.onchange = updateGear;
            if (moduleInput)
                moduleInput.onchange = updateGear;
        }
    }
    static handleGeneral(item, app) {
        document.getElementById('prop-color').oninput = (e) => { if (item.strokeColor)
            item.strokeColor = e.target.value; };
        document.getElementById('prop-width').oninput = (e) => { const val = parseFloat(e.target.value); if (!isNaN(val))
            item.strokeWidth = val; };
        document.getElementById('prop-rotation').onchange = (e) => {
            let angle = parseFloat(e.target.value);
            if (!isNaN(angle)) {
                // Strict precision drafting: instruments should stay 0.1 deg accurate unless it's a T-Square
                const isLockedInstrument = item.data.instrumentType === 'ruler' || item.data.instrumentType?.startsWith('paired');
                if (isLockedInstrument) {
                    // T-Squares and sets ONLY allow 0, 90, 180, 270 as per user's strict vertical/horizontal request
                    angle = Math.round(angle / 90) * 90;
                    e.target.value = angle;
                }
                else {
                    // Other instruments like protractors or set squares allow 0.1 deg precision
                    angle = Math.round(angle * 10) / 10;
                }
                const current = item.data.rotation || 0;
                item.rotate(angle - current, item.position);
                item.data.rotation = angle;
                app.history.pushState();
                paper.view.update();
            }
        };
        document.getElementById('prop-style').onchange = (e) => {
            const styles = { 'continuous': [], 'dashed': [6, 3], 'center': [12, 3, 3, 3], 'phantom': [12, 2, 2, 2, 2, 2] };
            item.dashArray = styles[e.target.value];
            app.history.pushState();
        };
        document.getElementById('prop-layer').onchange = (e) => {
            const targetLayer = paper.project.layers.find(l => l.name === e.target.value);
            if (targetLayer) {
                targetLayer.addChild(item);
                app.ui.layers.updateLayerUI();
                app.history.pushState();
            }
        };
    }
    static handleActions(item, app) {
        document.getElementById('btn-prop-smooth').onclick = () => { item.smooth?.({ type: 'catmull-rom' }); app.history.pushState(); };
        document.getElementById('btn-prop-duplicate').onclick = () => {
            const clone = item.clone();
            clone.position = clone.position.add(new paper.Point(20, 20));
            clone.selected = true;
            item.selected = false;
            app.tools.selection = clone;
            app.ui.properties.updateProperties(clone);
            app.history.pushState();
        };
        document.getElementById('btn-delete-entity').onclick = () => { item.remove(); app.ui.properties.updateProperties(null); app.history.pushState(); };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWktcHJvcGVydGllcy1oYW5kbGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3VpLXByb3BlcnRpZXMtaGFuZGxlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLLE1BQU0sc0JBQXNCLENBQUM7QUFDekMsT0FBTyxLQUFLLElBQUksTUFBTSxlQUFlLENBQUM7QUFFdEM7O0dBRUc7QUFDSCxNQUFNLE9BQU8sZ0JBQWdCO0lBQ3pCLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsR0FBRztRQUM3QixNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFDakUsSUFBSSxRQUFRO1lBQUUsUUFBUSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXpILE1BQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQUMvRCxJQUFJLFNBQVM7WUFBRSxTQUFTLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFeEgsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQ2hFLElBQUksV0FBVztZQUFFLFdBQVcsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFB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