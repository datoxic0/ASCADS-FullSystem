import paper from 'https://esm.sh/paper';

/**
 * HTML Templates for the Property Panel
 */
export const PropertyTemplates = {
    renderHeader: (type) => `
        <div class="prop-row" style="font-size: 15px; border-bottom: 1px solid #444; padding-bottom: 10px; margin-bottom: 20px;">
            <strong style="letter-spacing: 0.1em; color: var(--accent);">${type.toUpperCase()}</strong>
        </div>
    `,

    renderEngineeringProps: (item) => {
        let baseOptions = '';
        const itType = item.data.instrumentType;
        const isSet = itType === 'set-square' || itType === 'set-square-slider';
        
        // Find the triangle if it's a paired set
        let triangleItem = null;
        if (item.data.instrumentType?.startsWith('paired')) {
             triangleItem = item.children.find(c => c.data && c.data.isSlider);
        } else if (isSet) {
             triangleItem = item;
        }

        if (triangleItem) {
            const angle = triangleItem.data.angle;
            const currentBase = triangleItem.data.activeBase || 0;
            if (angle === 30) {
                baseOptions = `
                    <div class="prop-row">
                        <label>Triangle Working Base</label>
                        <select id="prop-instrument-base" class="pro-select-sm">
                            <option value="0" ${currentBase == 0 ? 'selected' : ''}>Short Base</option>
                            <option value="1" ${currentBase == 1 ? 'selected' : ''}>Mid Base</option>
                            <option value="2" ${currentBase == 2 ? 'selected' : ''}>Long Base</option>
                        </select>
                    </div>
                `;
            } else {
                baseOptions = `
                    <div class="prop-row">
                        <label>Triangle Working Base</label>
                        <select id="prop-instrument-base" class="pro-select-sm">
                            <option value="0" ${currentBase == 0 ? 'selected' : ''}>Equal Base 1</option>
                            <option value="1" ${currentBase == 1 ? 'selected' : ''}>Equal Base 2</option>
                            <option value="2" ${currentBase == 2 ? 'selected' : ''}>Hypotenuse Base</option>
                        </select>
                    </div>
                `;
            }
        }

        let lockOptions = '';
        if (item.data.instrumentType === 'ruler' || item.data.instrumentType === 'paired-set') {
            const isVert = Math.abs((item.data.rotation || 0) % 180) === 90;
            lockOptions = `
                <div class="prop-row">
                    <label>T-Square Orientation</label>
                    <div class="btn-switch">
                        <button class="small-tab-btn ${!isVert ? 'active' : ''}" id="btn-lock-horiz">Horizontal</button>
                        <button class="small-tab-btn ${isVert ? 'active' : ''}" id="btn-lock-vert">Vertical</button>
                    </div>
                </div>
            `;
        }

        return `
        ${lockOptions}
        ${baseOptions}
        <div class="prop-row">
            <label>Engineering Tolerance</label>
            <select id="prop-eng-tolerance" class="pro-select-sm">
                <option value="none">None</option>
                <option value="±0.1" ${item.data.tolerance === '±0.1' ? 'selected' : ''}>±0.1mm (High Precision)</option>
                <option value="±0.5" ${item.data.tolerance === '±0.5' ? 'selected' : ''}>±0.5mm (Standard)</option>
                <option value="IT9" ${item.data.tolerance === 'IT9' ? 'selected' : ''}>ISO IT9 (Casting)</option>
            </select>
        </div>
        <div class="prop-row">
            <label>Datum Reference</label>
            <input type="text" id="prop-eng-datum" value="${item.data.datum || ''}" placeholder="e.g. A, B, C" class="pro-input">
        </div>
    `
    },

    renderMechatronicProps: (item) => {
        if (item.data.type !== 'component') return '';
        const pt = item.data.partType;
        return `
            ${pt === 'resistor' ? `
                <div class="prop-row"><label>Resistance (Ω)</label>
                <input type="number" id="prop-elec-resistance" value="${item.data.resistance || 1000}" class="pro-input"></div>` : ''}
            ${pt === 'battery_18650' ? `
                <div class="prop-row"><label>Voltage (V)</label>
                <input type="number" id="prop-elec-voltage" value="${item.data.voltage || 3.7}" step="0.1" class="pro-input"></div>` : ''}
            ${pt === 'switch_spst' ? `
                <div class="prop-row"><label>State</label>
                <select id="prop-elec-switch" class="pro-select-sm">
                    <option value="open" ${item.data.state === 'open' ? 'selected' : ''}>Open (OFF)</option>
                    <option value="closed" ${item.data.state === 'closed' ? 'selected' : ''}>Closed (ON)</option>
                </select></div>` : ''}
            ${pt === 'dc_motor_generic' || pt === 'nema17' ? `
                <div class="prop-row"><label>Simulation Speed (deg/frame)</label>
                <input type="number" id="prop-mech-speed" value="${item.data.speed || 5}" class="pro-input"></div>` : ''}
            ${pt === 'servo_sg90' ? `
                <div class="prop-row"><label>Servo Target Angle (°)</label>
                <input type="number" id="prop-mech-angle" value="${item.data.targetAngle || 90}" min="0" max="180" class="pro-input"></div>` : ''}
        `;
    },

    renderGeneralProps: (item, hexColor, currentRot, styleOptions, layerOptions) => `
        <div class="prop-row"><label>Color Profile</label><input type="color" id="prop-color" value="${hexColor}" class="pro-input-color"></div>
        <div class="prop-row"><label>Weight</label><input type="number" id="prop-width" value="${item.strokeWidth || 1}" step="0.5" class="pro-input"></div>
        <div class="prop-row"><label>Rotation (°)</label><input type="number" id="prop-rotation" value="${currentRot}" step="0.1" class="pro-input"></div>
        <div class="prop-row"><label>Style</label><select id="prop-style" class="pro-select-sm">${styleOptions}</select></div>
        <div class="prop-row"><label>Layer</label><select id="prop-layer" class="pro-select-sm">${layerOptions}</select></div>
    `,

    renderPlacementProps: (item, sF, posX, posY, realWidth, realHeight, realLen) => `
        <div class="prop-group">
            <div style="margin-bottom:12px; color: var(--accent); font-weight:bold; letter-spacing: 0.05em; font-size: 10px; opacity: 0.8;">PRECISION PLACEMENT</div>
            <div class="prop-row-inline" style="display:flex; gap:10px; margin-bottom:12px;">
                <label style="width:20px; align-self:center; font-weight:bold; color:var(--text-dim);">X</label><input type="number" id="prop-pos-x" value="${posX}" step="0.01" class="pro-input" style="flex:1">
                <label style="width:20px; align-self:center; font-weight:bold; color:var(--text-dim);">Y</label><input type="number" id="prop-pos-y" value="${posY}" step="0.01" class="pro-input" style="flex:1">
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:12px;">
                <div class="prop-col">
                    <label style="font-size:9px; color:var(--accent)">BREADTH / LENGTH</label>
                    <input type="number" id="prop-dim-width" value="${realWidth}" step="0.1" class="pro-input">
                </div>
                <div class="prop-col">
                    <label style="font-size:9px; color:var(--accent)">HEIGHT / DEPTH</label>
                    <input type="number" id="prop-dim-height" value="${realHeight}" step="0.1" class="pro-input">
                </div>
            </div>
            <div style="margin-top:15px; border-top: 1px solid #444; padding-top: 10px;"><strong>Path Length:</strong> <span style="color: #00ff00; letter-spacing: 0.05em;">${realLen} mm</span></div>
            ${item.data.type === 'circle' ? `<div class="prop-row" style="margin-top:5px;"><label>Radius (mm)</label><input type="number" id="prop-param-radius" value="${(item.bounds.width / 2 * sF).toFixed(4)}" step="0.01" class="pro-input"></div>` : ''}
            ${item.data.type === 'gear' ? `
                <div class="prop-row"><label>Teeth Count</label><input type="number" id="prop-gear-teeth" value="${item.data.teeth || 18}" class="pro-input"></div>
                <div class="prop-row"><label>Module (m)</label><input type="number" id="prop-gear-module" value="${item.data.module || 5}" step="0.5" class="pro-input"></div>
            ` : ''}
            ${item.data.metadata ? `<div style="color: var(--accent); margin-top:8px; border-top: 1px solid #444; padding-top:8px;">${item.data.metadata}</div>` : ''}
        </div>
    `,

    renderAdvancedMetrics: (props, material, thickness, library) => {
        const density = library[material]?.density || 0.001;
        const mass = props.area * thickness * density;
        return `
            <div style="margin-top:5px; border-top: 1px solid #444; padding-top:5px; font-size: 10px; color: #aaa;">
                <div style="display:flex; justify-content:space-between"><strong>Area:</strong> <span>${props.area.toFixed(2)} mm²</span></div>
                <div style="display:flex; justify-content:space-between"><strong>Mass:</strong> <span style="color:var(--accent)">${mass.toFixed(3)} g</span></div>
                <div class="prop-row" style="margin-top:5px">
                    <label>Material</label>
                    <select id="prop-mech-material" class="pro-select-sm" style="width:100%">
                        ${Object.keys(library).map(m => `<option value="${m}" ${m === material ? 'selected' : ''}>${m}</option>`).join('')}
                    </select>
                </div>
                <div class="prop-row">
                    <label>Thickness (mm)</label>
                    <input type="number" id="prop-mech-thickness" value="${thickness}" step="0.1" class="pro-input">
                </div>
            </div>
        `;
    },

    renderActions: () => `
        <div class="prop-actions" style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
           <button class="btn-action" id="btn-prop-smooth"><i data-prop-icon="sparkles"></i> Smooth</button>
           <button class="btn-action" id="btn-prop-duplicate"><i data-prop-icon="copy"></i> Clone</button>
        </div>
        <button class="btn-primary" id="btn-delete-entity" style="background:#d32f2f; margin-top: 10px; width: 100%;"><i data-prop-icon="trash-2"></i> Delete Entity</button>
    `
};