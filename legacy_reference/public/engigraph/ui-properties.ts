import { createIcons, Trash2, Sparkles, Copy, MousePointer2 } from 'https://esm.sh/lucide';
import paper from 'https://esm.sh/paper';
import * as geom from './geometry.js';
import { PropertyTemplates } from './ui-properties-templates.js';
import { PropertyHandlers } from './ui-properties-handlers.js';

/**
 * Orchestrator for the Property Panel UI
 */
export class PropertyPanel {
    constructor(app, ui) {
        this.app = app;
        this.ui = ui;
    }

    updateProperties(item) {
        const panel = document.getElementById('properties-panel');
        if (!panel) return;
        if (!item) {
            panel.innerHTML = '<p class="empty-state">No entity selected</p>';
            return;
        }

        const type = item.data.type || item.className;
        let hexColor = '#ffffff';
        try { if (item.strokeColor) hexColor = item.strokeColor.toCSS(true); } catch (e) {}
        
        const sF = 1 / this.app.scaleFactor;
        const realLen = item.length ? (item.length * sF).toFixed(4) : 'N/A';
        const posX = (item.position.x * sF).toFixed(4);
        const posY = (item.position.y * sF).toFixed(4);
        const bounds = item.strokeBounds || item.bounds;
        const realWidth = (bounds.width * sF).toFixed(4);
        const realHeight = (bounds.height * sF).toFixed(4);

        const layerOptions = paper.project.layers
            .filter(l => l.name !== 'grid_layer')
            .map(l => `<option value="${l.name}" ${l === item.layer ? 'selected' : ''}>${l.name.replace('_layer', '').toUpperCase()}</option>`)
            .join('');

        const lineStyles = [
            { id: 'continuous', name: 'Continuous', dash: [] },
            { id: 'dashed', name: 'Hidden (Dashed)', dash: [6, 3] },
            { id: 'center', name: 'Center (Long-Short)', dash: [12, 3, 3, 3] },
            { id: 'phantom', name: 'Phantom', dash: [12, 2, 2, 2, 2, 2] }
        ];
        const styleOptions = lineStyles.map(s => `<option value="${s.id}" ${JSON.stringify(item.dashArray) === JSON.stringify(s.dash) ? 'selected' : ''}>${s.name}</option>`).join('');

        // Advanced Metrics logic
        let advancedHtml = '';
        if (item.closed && item.segments.length > 2) {
            const props = geom.calculatePathProperties(item, this.app.scaleFactor);
            if (props) {
                advancedHtml = PropertyTemplates.renderAdvancedMetrics(props, item.data.material || 'PLA', item.data.thickness || 3.0, this.app.materialLibrary);
            }
        }

        // Assemble Content
        const currentRot = Math.round((item.data.rotation || 0) * 10) / 10;
        const potential = item.data.nodePotential !== undefined ? `${item.data.nodePotential.toFixed(2)}V` : 'N/A';

        panel.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:10px">
                ${PropertyTemplates.renderHeader(type)}
                <div class="prop-group" style="background: rgba(0, 255, 0, 0.05); border-color: #225522;">
                    <strong style="color: #00ff00; font-size: 10px;">REAL-TIME TELEMETRY</strong>
                    <div style="display:flex; justify-content:space-between; margin-top:5px;">
                        <span>Node Potential:</span>
                        <span style="color:#00ff00; font-family:monospace;">${potential}</span>
                    </div>
                </div>
                ${PropertyTemplates.renderMechatronicProps(item)}
                ${PropertyTemplates.renderEngineeringProps(item)}
                ${PropertyTemplates.renderGeneralProps(item, hexColor, currentRot, styleOptions, layerOptions)}
                ${PropertyTemplates.renderPlacementProps(item, sF, posX, posY, realWidth, realHeight, realLen)}
                ${item.data.isInstrument ? `
                    <div class="prop-group" style="background: rgba(0, 242, 255, 0.1); border-color: var(--accent);">
                        <strong style="color: var(--accent); display:block; margin-bottom: 5px;">INSTRUMENT CONTROLS</strong>
                        <p style="font-size: 10px; color: #ccc; margin-bottom: 8px;">Select a drawing entity first, then click this instrument on canvas to straighten it.</p>
                        <button class="btn-action" style="width:100%;" onclick="app.tools.setTool('select')">
                           <i data-prop-icon="mouse-pointer-2"></i> Use Selection Alignment
                        </button>
                    </div>
                ` : ''}
                ${advancedHtml}
                ${PropertyTemplates.renderActions()}
            </div>
        `;

        this.attachListeners(item);
        createIcons({ 
            icons: { Trash2, Sparkles, Copy, MousePointer2 },
            nameAttr: 'data-prop-icon' 
        });
    }

    attachListeners(item) {
        PropertyHandlers.handleElectrical(item, this.app);
        PropertyHandlers.handleEngineering(item, this.app);
        PropertyHandlers.handleMechanical(item, this.app);
        PropertyHandlers.handlePlacement(item, this.app);
        PropertyHandlers.handleGeneral(item, this.app);
        PropertyHandlers.handleActions(item, this.app);
    }
}