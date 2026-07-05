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
        if (!panel)
            return;
        if (!item) {
            panel.innerHTML = '<p class="empty-state">No entity selected</p>';
            return;
        }
        const type = item.data.type || item.className;
        let hexColor = '#ffffff';
        try {
            if (item.strokeColor)
                hexColor = item.strokeColor.toCSS(true);
        }
        catch (e) { }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWktcHJvcGVydGllcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3VpLXByb3BlcnRpZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUMzRixPQUFPLEtBQUssTUFBTSxzQkFBc0IsQ0FBQztBQUN6QyxPQUFPLEtBQUssSUFBSSxNQUFNLGVBQWUsQ0FBQztBQUN0QyxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSw4QkFBOEIsQ0FBQztBQUNqRSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQztBQUUvRDs7R0FFRztBQUNILE1BQU0sT0FBTyxhQUFhO0lBQ3RCLFlBQVksR0FBRyxFQUFFLEVBQUU7UUFDZixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNmLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO0lBQ2pCLENBQUM7SUFFRCxnQkFBZ0IsQ0FBQyxJQUFJO1FBQ2pCLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUMxRCxJQUFJLENBQUMsS0FBSztZQUFFLE9BQU87UUFDbkIsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ1IsS0FBSyxDQUFDLFNBQVMsR0FBRywrQ0FBK0MsQ0FBQztZQUNsRSxPQUFPO1FBQ1gsQ0FBQztRQUVELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUM7UUFDOUMsSUFBSSxRQUFRLEdBQUcsU0FBUyxDQUFDO1FBQ3pCLElBQUksQ0FBQztZQUFDLElBQUksSUFBSSxDQUFDLFdBQVc7Z0JBQUUsUUFBUSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQUMs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