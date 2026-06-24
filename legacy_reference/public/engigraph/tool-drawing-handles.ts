import paper from 'https://esm.sh/paper';
import { CircuitUtils } from './engine-circuit-utils.js';
import { EngigraphGroup, CircuitComponentData, TerminalHandle, PinDefinition } from './types.js';

/**
 * Handles technical UI interaction layers (handles) for instruments.
 */
export const InstrumentHandles = {
    add: (app: any, group: EngigraphGroup) => {
        if (!group || !group.children || group._updatingHandles) return;
        group._updatingHandles = true;
        
        try {
            let rotHandle = group.children.find(c => c.data && c.data.role === 'rotation-handle');
            let sizeHandle = group.children.find(c => c.data && c.data.role === 'resize-handle');

            // CRITICAL: Calculate handle positions based ONLY on the base element 
            // to avoid bounds-recalculation feedback loops that cause freezes.
            const baseElement = group.children.find(c => c.data && c.data.role === 'instrument-base') || group.firstChild;
            if (!baseElement) return;

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


        } finally {
            group._updatingHandles = false;
        }
    }
};