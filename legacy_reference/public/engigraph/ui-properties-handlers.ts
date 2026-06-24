import paper from 'https://esm.sh/paper';
import * as geom from './geometry.js';

/**
 * Event Handlers for Property Changes
 */
export class PropertyHandlers {
    static handleElectrical(item, app) {
        const resInput = document.getElementById('prop-elec-resistance');
        if (resInput) resInput.onchange = (e) => { item.data.resistance = parseFloat(e.target.value); app.history.pushState(); };
        
        const voltInput = document.getElementById('prop-elec-voltage');
        if (voltInput) voltInput.onchange = (e) => { item.data.voltage = parseFloat(e.target.value); app.history.pushState(); };
        
        const switchInput = document.getElementById('prop-elec-switch');
        if (switchInput) switchInput.onchange = (e) => { 
            item.data.state = e.target.value; 
            const lever = item.children.find(c => c.data && c.data.role === 'lever');
            if (lever) lever.segments[1].point = item.position.add(e.target.value === 'closed' ? [5, 0] : [5, -8]);
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
                } else if (item.data.isInstrument && item.data.instrumentType.includes('set-square')) {
                    tri = item;
                }

                if (tri) {
                    const angle = tri.data.angle;
                    // Pivot is always bottom-left (0,0) in our factory
                    const pivot = tri.localToGlobal(new paper.Point(0,0));
                    
                    let rot = 0;
                    if (angle === 30) {
                        // 0: Short base (horizontal)
                        // 1: Long base (rotate to horizontal)
                        // 2: Hypotenuse (rotate to horizontal)
                        if (baseIdx === 0) rot = 0;
                        if (baseIdx === 1) rot = -90;
                        if (baseIdx === 2) rot = 150; // Aligns hypotenuse to x-axis
                    } else { // 45 deg
                        if (baseIdx === 0) rot = 0;
                        if (baseIdx === 1) rot = -90;
                        if (baseIdx === 2) rot = 135; // Aligns hypotenuse to x-axis
                    }

                    const currentLocalRot = tri.data.localRotation || 0;
                    tri.rotate(rot - currentLocalRot, pivot);
                    tri.data.localRotation = rot;
                    tri.data.activeBase = baseIdx;
                    
                    // Re-align to ruler/base if part of a set
                    if (item.data.instrumentType?.startsWith('paired')) {
                        const rulerHeight = item.data.instrumentType === 'paired-drafter' ? 24 : 40;
                        const localPivot = item.globalToLocal(pivot);
                        localPivot.y = -rulerHeight/2;
                        
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
        if (tolInput) tolInput.onchange = (e) => { item.data.tolerance = e.target.value; app.history.pushState(); };

        const datumInput = document.getElementById('prop-eng-datum');
        if (datumInput) datumInput.onchange = (e) => { item.data.datum = e.target.value.toUpperCase(); app.history.pushState(); };
    }

    static handleMechanical(item, app) {
        const speedInput = document.getElementById('prop-mech-speed');
        if (speedInput) speedInput.onchange = (e) => { item.data.speed = parseFloat(e.target.value); app.history.pushState(); };

        const angleInput = document.getElementById('prop-mech-angle');
        if (angleInput) angleInput.onchange = (e) => { item.data.targetAngle = parseFloat(e.target.value); app.history.pushState(); };
        
        const matInput = document.getElementById('prop-mech-material');
        if (matInput) matInput.onchange = (e) => { 
            item.data.material = e.target.value; 
            app.ui.properties.updateProperties(item); 
            app.history.pushState(); 
        };
        
        const thickInput = document.getElementById('prop-mech-thickness');
        if (thickInput) thickInput.onchange = (e) => { 
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
        if (xInput) xInput.onchange = updatePos;
        if (yInput) yInput.onchange = updatePos;

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
        if (widthInput) widthInput.onchange = updateDimensions;
        if (heightInput) heightInput.onchange = updateDimensions;

        const radiusInput = document.getElementById('prop-param-radius');
        if (radiusInput) radiusInput.onchange = (e) => {
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
                newItem.data.type = 'gear'; newItem.data.teeth = teeth; newItem.data.module = module;
                newItem.selected = true; app.tools.selection = newItem;
                app.ui.properties.updateProperties(newItem);
                app.history.pushState();
            };
            if (teethInput) teethInput.onchange = updateGear;
            if (moduleInput) moduleInput.onchange = updateGear;
        }
    }

    static handleGeneral(item, app) {
        document.getElementById('prop-color').oninput = (e) => { if (item.strokeColor) item.strokeColor = e.target.value; };
        document.getElementById('prop-width').oninput = (e) => { const val = parseFloat(e.target.value); if (!isNaN(val)) item.strokeWidth = val; };
        document.getElementById('prop-rotation').onchange = (e) => {
            let angle = parseFloat(e.target.value);
            if (!isNaN(angle)) {
                // Strict precision drafting: instruments should stay 0.1 deg accurate unless it's a T-Square
                const isLockedInstrument = item.data.instrumentType === 'ruler' || item.data.instrumentType?.startsWith('paired');
                if (isLockedInstrument) {
                    // T-Squares and sets ONLY allow 0, 90, 180, 270 as per user's strict vertical/horizontal request
                    angle = Math.round(angle / 90) * 90;
                    e.target.value = angle;
                } else {
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
            if (targetLayer) { targetLayer.addChild(item); app.ui.layers.updateLayerUI(); app.history.pushState(); }
        };
    }

    static handleActions(item, app) {
        document.getElementById('btn-prop-smooth').onclick = () => { item.smooth?.({ type: 'catmull-rom' }); app.history.pushState(); };
        document.getElementById('btn-prop-duplicate').onclick = () => {
            const clone = item.clone();
            clone.position = clone.position.add(new paper.Point(20, 20));
            clone.selected = true; item.selected = false;
            app.tools.selection = clone; app.ui.properties.updateProperties(clone);
            app.history.pushState();
        };
        document.getElementById('btn-delete-entity').onclick = () => { item.remove(); app.ui.properties.updateProperties(null); app.history.pushState(); };
    }
}