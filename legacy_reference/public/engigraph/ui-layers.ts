import { createIcons, Eye, EyeOff, Trash2 } from 'https://esm.sh/lucide';
import paper from 'https://esm.sh/paper';

export class LayerPanel {
    constructor(app, ui) {
        this.app = app;
        this.ui = ui;
    }

    updateLayerUI() {
        const list = document.getElementById('layer-list');
        if (!list) return;
        list.innerHTML = '';
        
        paper.project.layers.forEach(layer => {
            if (layer.name === 'grid_layer') return;
            
            const item = document.createElement('div');
            item.className = `layer-item ${layer === paper.project.activeLayer ? 'active' : ''}`;
            const visibleIcon = layer.visible ? 'eye' : 'eye-off';
            
            item.innerHTML = `
                <div class="layer-info" style="display:flex; align-items:center; gap:10px; flex:1">
                    <i data-layer-icon="${visibleIcon}" class="layer-vis-toggle"></i>
                    <span>${layer.name.replace('_layer', '').toUpperCase()}</span>
                </div>
                ${!['geometry_layer', 'dimensions_layer', 'construction_layer', 'text_layer', 'mechatronics_layer', 'electrotech_layer'].includes(layer.name) ? 
                    `<button class="btn-layer-del" title="Delete Layer" style="background:none; border:none; color:var(--text-dim); cursor:pointer;">
                        <i data-layer-icon="trash-2" style="width:12px"></i>
                    </button>` : ''
                }
            `;

            item.onclick = (e) => {
                if (e.target.closest('.layer-vis-toggle') || e.target.closest('.btn-layer-del')) return;
                layer.activate();
                this.updateLayerUI();
            };

            item.querySelector('.layer-vis-toggle').onclick = (e) => {
                e.stopPropagation();
                layer.visible = !layer.visible;
                this.updateLayerUI();
            };

            const delBtn = item.querySelector('.btn-layer-del');
            if (delBtn) {
                delBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete layer "${layer.name.replace('_layer', '')}"?`)) {
                        layer.remove();
                        paper.project.layers[0].activate();
                        this.updateLayerUI();
                    }
                };
            }
            list.appendChild(item);
        });
        createIcons({ 
            icons: { Eye, EyeOff, Trash2 },
            nameAttr: 'data-layer-icon' 
        });
    }
}