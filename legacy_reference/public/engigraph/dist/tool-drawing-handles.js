import paper from 'https://esm.sh/paper';
/**
 * Handles technical UI interaction layers (handles) for instruments.
 */
export const InstrumentHandles = {
    add: (app, group) => {
        if (!group || !group.children || group._updatingHandles)
            return;
        group._updatingHandles = true;
        try {
            let rotHandle = group.children.find(c => c.data && c.data.role === 'rotation-handle');
            let sizeHandle = group.children.find(c => c.data && c.data.role === 'resize-handle');
            // CRITICAL: Calculate handle positions based ONLY on the base element 
            // to avoid bounds-recalculation feedback loops that cause freezes.
            const baseElement = group.children.find(c => c.data && c.data.role === 'instrument-base') || group.firstChild;
            if (!baseElement)
                return;
            // Use internal path bounds to avoid including the handles in the bounding box
            const bounds = baseElement.bounds;
            const color = '#00f2ff';
            const isComponent = group.data.type === 'component';
            const isSelected = group.selected;
            const currentAngle = group.rotation || 0;
            // Calculate distance based on current geometry
            const radius = Math.max(bounds.width, bounds.height) / 2;
            const dist = radius + 30;
            if (!isComponent) {
                if (!rotHandle) {
                    rotHandle = new paper.Path.Circle({ center: [0, 0], radius: 10, fillColor: color, strokeColor: '#fff', strokeWidth: 2 });
                    rotHandle.data = { role: 'rotation-handle', isHandle: true };
                    rotHandle.guide = true;
                    group.addChild(rotHandle);
                }
                const rotDist = (group.data.instrumentType === 'drafter' || group.data.instrumentType === 'paired-drafter') ? 100 : dist;
                rotHandle.position = new paper.Point({ angle: -135, length: rotDist });
                rotHandle.visible = isSelected;
                rotHandle.bringToFront();
                if (!sizeHandle) {
                    sizeHandle = new paper.Path.Rectangle({ point: [-7, -7], size: [14, 14], fillColor: color, strokeColor: '#fff', strokeWidth: 2 });
                    sizeHandle.data = { role: 'resize-handle', isHandle: true };
                    sizeHandle.guide = true;
                    group.addChild(sizeHandle);
                }
                const sizeDist = (group.data.instrumentType === 'drafter' || group.data.instrumentType === 'paired-drafter') ? 100 : dist;
                sizeHandle.position = new paper.Point({ angle: 135, length: sizeDist });
                sizeHandle.visible = isSelected;
                sizeHandle.bringToFront();
            }
            // Add Slide Handle for paired sets
            if (group.data.instrumentType?.startsWith('paired')) {
                let slideHandle = group.children.find(c => c.data && c.data.role === 'slide-handle');
                const slider = group.children.find(c => c.data && c.data.isSlider);
                if (slider) {
                    if (!slideHandle) {
                        slideHandle = new paper.Path.Circle({ radius: 12, fillColor: 'rgba(0, 136, 255, 0.9)', strokeColor: '#fff', strokeWidth: 2 });
                        slideHandle.data = { role: 'slide-handle', isHandle: true };
                        slideHandle.guide = true;
                        group.addChild(slideHandle);
                    }
                    // Position handle on the slider's center in LOCAL coordinates
                    slideHandle.position = group.globalToLocal(slider.position).add([0, 20]);
                    slideHandle.visible = isSelected;
                    slideHandle.bringToFront();
                }
            }
        }
        finally {
            group._updatingHandles = false;
        }
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbC1kcmF3aW5nLWhhbmRsZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi90b29sLWRyYXdpbmctaGFuZGxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssTUFBTSxzQkFBc0IsQ0FBQztBQUl6Qzs7R0FFRztBQUNILE1BQU0sQ0FBQyxNQUFNLGlCQUFpQixHQUFHO0lBQzdCLEdBQUcsRUFBRSxDQUFDLEdBQVEsRUFBRSxLQUFxQixFQUFFLEVBQUU7UUFDckMsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLElBQUksS0FBSyxDQUFDLGdCQUFnQjtZQUFFLE9BQU87UUFDaEUsS0FBSyxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQztRQUU5QixJQUFJLENBQUM7WUFDRCxJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssaUJBQWlCLENBQUMsQ0FBQztZQUN0RixJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssZUFBZSxDQUFDLENBQUM7WUFFckYsdUVBQXVFO1lBQ3ZFLG1FQUFtRTtZQUNuRSxNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssaUJBQWlCLENBQUMsSUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDO1lBQzlHLElBQUksQ0FBQyxXQUFXO2dCQUFFLE9BQU87WUFFekIsOEVBQThFO1lBQzlFLE1BQU0sTUFBTSxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUM7WUFDbEMsTUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDO1lBQ3hCLE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLFdBQVcsQ0FBQztZQUNwRCxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDO1lBQ2xDLE1BQU0sWUFBWSxHQUFHLEtBQUssQ0FBQyxRQUFRLElBQUksQ0FBQyxDQUFDO1lBRXpDLCtDQUErQztZQUMvQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN6RCxNQUFNLElBQUksR0FBRyxNQUFNLEdBQUcsRUFBRSxDQUFDO1lBRXpCLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDZixJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQ2IsU0FBUyxHQUFHLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ3pILFNBQVMsQ0FBQyxJQUFJLEdBQUcsRUFBRSxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDO29CQUM3RCxTQUFTLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztvQkFDdkIsS0FBSyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDOUIsQ0FBQztnQkFFRCxNQUFNLE9BQU8sR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsY0FBYyxLQUFLLFNBQVMsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsS0FBSyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDekgsU0FBUyxDQUFDLFFBQVEsR0FBRyxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7Z0JBQ3ZFLFNBQVMsQ0FBQyxPQUFPLEdBQUcsVUFBVSxDQUFDO2dCQUMvQixTQUFTLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBRXpCLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztvQkFDZCxVQUFVLEdBQUcsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDbEksVUFBVSxDQUFDLElBQUksR0FBRyxFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDO29CQUM1RCxVQUFVLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztvQkFDeEIsS0FBSyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDL0IsQ0FBQztnQkFFRCxNQUFNLFFBQVEsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsY0FBYyxLQUFLLFNBQVMsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsS0FBSyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUgsVUFBVSxDQUFDLFFBQVEsR0FBRyxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUN4RSxVQUFVLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQztnQkFDaEMsVUFBVSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQzlCLENBQUM7WUFFRCxtQ0FBbUM7WUFDbkMsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDbEQsSUFBSSxXQUFXLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLGNBQWMsQ0FBQyxDQUFDO2dCQUNyRixNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDbkUsSUFBSSxNQUFNLEVBQUUsQ0FBQztvQkFDVCxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7d0JBQ2YsV0FBVyxHQUFHLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBRSx3QkFBd0IsRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUM5SCxXQUFXLENBQUMsSUFBSSxHQUFHLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUM7d0JBQzVELFdBQVcsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO3dCQUN6QixLQUFLLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO29CQUNoQyxDQUFDO29CQUNELDhEQUE4RDtvQkFDOUQsV0FBVyxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDekUsV0FBVyxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUM7b0JBQ2pDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDL0IsQ0FBQztZQUNMLENBQUM7UUFHTCxDQUFDO2dCQUFTLENBQUM7WUFDUCxLQUFLLENBQUMsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDO1FBQ25DLENBQUM7SUFDTCxDQUFDO0NBQ0osQ0FBQyJ9