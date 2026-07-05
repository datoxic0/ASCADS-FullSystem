import { createIcons, Eye, EyeOff, Trash2 } from 'https://esm.sh/lucide';
import paper from 'https://esm.sh/paper';
export class LayerPanel {
    constructor(app, ui) {
        this.app = app;
        this.ui = ui;
    }
    updateLayerUI() {
        const list = document.getElementById('layer-list');
        if (!list)
            return;
        list.innerHTML = '';
        paper.project.layers.forEach(layer => {
            if (layer.name === 'grid_layer')
                return;
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
                    </button>` : ''}
            `;
            item.onclick = (e) => {
                if (e.target.closest('.layer-vis-toggle') || e.target.closest('.btn-layer-del'))
                    return;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWktbGF5ZXJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vdWktbGF5ZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxXQUFXLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUN6RSxPQUFPLEtBQUssTUFBTSxzQkFBc0IsQ0FBQztBQUV6QyxNQUFNLE9BQU8sVUFBVTtJQUNuQixZQUFZLEdBQUcsRUFBRSxFQUFFO1FBQ2YsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDZixJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztJQUNqQixDQUFDO0lBRUQsYUFBYTtRQUNULE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDbkQsSUFBSSxDQUFDLElBQUk7WUFBRSxPQUFPO1FBQ2xCLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO1FBRXBCLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNqQyxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssWUFBWTtnQkFBRSxPQUFPO1lBRXhDLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDM0MsSUFBSSxDQUFDLFNBQVMsR0FBRyxjQUFjLEtBQUssS0FBSyxLQUFLLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNyRixNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztZQUV0RCxJQUFJLENBQUMsU0FBUyxHQUFHOzswQ0FFYSxXQUFXOzRCQUN6QixLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUMsV0FBVyxFQUFFOztrQkFFeEQsQ0FBQyxDQUFDLGdCQUFnQixFQUFFLGtCQUFrQixFQUFFLG9CQUFvQixFQUFFLFlBQVksRUFBRSxvQkFBb0IsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDM0k7OzhCQUVVLENBQUMsQ0FBQyxDQUFDLEVBQ2pCO2FBQ0gsQ0FBQztZQUVGLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRTtnQkFDakIsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDO29CQUFFLE9BQU87Z0JBQ3hGLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDakIsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3pCLENBQUMsQ0FBQztZQUVGLElBQUksQ0FBQyxhQUFhLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRTtnQkFDcEQsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUNwQixLQUFLLENBQUMsT0FBTyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQztnQkFDL0IsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3pCLENBQUMsQ0FBQztZQUVGLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUNwRCxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUNULE1BQU0sQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRTtvQkFDbkIsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO29CQUNwQixJQUFJLE9BQU8sQ0FBQyxpQkFBaUIsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO3dCQUNqRSxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7d0JBQ2YsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7d0JBQ25DLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztvQkFDekIsQ0FBQztnQkFDTCxDQUFDLENBQUM7WUFDTixDQUFDO1lBQ0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMzQixDQUFDLENBQUMsQ0FBQztRQUNILFdBQVcsQ0FBQztZQUNSLEtBQUssRUFBRSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFO1lBQzlCLFFBQVEsRUFBRSxpQkFBaUI7U0FDOUIsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKIn0=