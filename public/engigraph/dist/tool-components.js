import paper from 'https://esm.sh/paper';
import { PartFactory } from './tool-parts-factory.js';
/**
 * Mechanical Components Library
 */
export class ComponentLibrary {
    constructor(app, manager) {
        this.app = app;
        this.manager = manager;
    }
    getPart(type) {
        let group = new paper.Group();
        const strokeColor = this.app.activeColor || this.app.themeColors.geometry;
        // Comprehensive mapping of parts to the central factory
        if (PartFactory[type]) {
            PartFactory[type](group, strokeColor);
        }
        else {
            console.warn(`Part definition for ${type} not found in Factory.`);
        }
        // Metadata tagging
        group.data.type = 'component';
        group.data.partType = type;
        group.strokeWidth = group.strokeWidth || 1.2;
        // Ensure every piece of the component has a color
        group.children.forEach(c => {
            if (!c.strokeColor && !c.fillColor)
                c.strokeColor = strokeColor;
        });
        return group;
    }
    startPlacement(type) {
        const geomLayer = this.app.layers.geometry;
        geomLayer.visible = true;
        geomLayer.locked = false;
        geomLayer.activate();
        this.app.ui.layers.updateLayerUI();
        const part = this.getPart(type);
        part.position = paper.view.center;
        this.manager.activeComponent = part;
        this.manager.setTool('place-component', type);
        this.app.ai.logAI("System", `Ready to place: ${type.toUpperCase()}`);
    }
    placeAt(type, point) {
        const part = this.getPart(type);
        part.position = new paper.Point(point);
        part.data.id = Math.random().toString(36).substr(2, 9);
        this.app.layers.geometry.addChild(part);
        return part;
    }
    toggleComponentState(component) {
        const type = component.data.partType;
        const libDef = window.ASCADComponentLibrary ? window.ASCADComponentLibrary[type.toUpperCase()] : null;
        // Custom logic based on type
        if (type === 'switch_spst') {
            component.data.state = component.data.state === 'open' ? 'closed' : 'open';
            // Animate Lever
            const lever = component.children.find(c => c.data && c.data.role === 'lever');
            if (lever) {
                if (component.data.state === 'closed') {
                    lever.rotate(30, lever.firstSegment.point); // Close switch
                    lever.strokeColor = '#00ff00';
                }
                else {
                    lever.rotate(-30, lever.firstSegment.point); // Open switch
                    lever.strokeColor = component.strokeColor;
                }
            }
            this.app.ai.logAI("Interactive", `Switch toggled to ${component.data.state}`);
        }
        else if (type === 'button') {
            // Momentary push
            component.data.state = true;
            setTimeout(() => {
                if (component && component.data)
                    component.data.state = false;
                paper.view.update();
            }, 200);
            this.app.ai.logAI("Interactive", `Button Pushed`);
        }
        else {
            this.app.ai.logAI("Interactive", `${libDef?.name || type} does not support manual toggling.`);
        }
        paper.view.update();
        this.app.history.pushState();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbC1jb21wb25lbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vdG9vbC1jb21wb25lbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBSyxNQUFNLHNCQUFzQixDQUFDO0FBQ3pDLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUV0RDs7R0FFRztBQUNILE1BQU0sT0FBTyxnQkFBZ0I7SUFDekIsWUFBWSxHQUFHLEVBQUUsT0FBTztRQUNwQixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNmLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO0lBQzNCLENBQUM7SUFFRCxPQUFPLENBQUMsSUFBSTtRQUNSLElBQUksS0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzlCLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQztRQUUxRSx3REFBd0Q7UUFDeEQsSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUNwQixXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQzFDLENBQUM7YUFBTSxDQUFDO1lBQ0osT0FBTyxDQUFDLElBQUksQ0FBQyx1QkFBdUIsSUFBSSx3QkFBd0IsQ0FBQyxDQUFDO1FBQ3RFLENBQUM7UUFFRCxtQkFBbUI7UUFDbkIsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsV0FBVyxDQUFDO1FBQzlCLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztRQUMzQixLQUFLLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxXQUFXLElBQUksR0FBRyxDQUFDO1FBRTdDLGtEQUFrRDtRQUNsRCxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxD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