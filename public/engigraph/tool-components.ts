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
        } else {
            console.warn(`Part definition for ${type} not found in Factory.`);
        }

        // Metadata tagging
        group.data.type = 'component';
        group.data.partType = type;
        group.strokeWidth = group.strokeWidth || 1.2;
        
        // Ensure every piece of the component has a color
        group.children.forEach(c => {
            if (!c.strokeColor && !c.fillColor) c.strokeColor = strokeColor;
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
                } else {
                    lever.rotate(-30, lever.firstSegment.point); // Open switch
                    lever.strokeColor = component.strokeColor;
                }
            }
            this.app.ai.logAI("Interactive", `Switch toggled to ${component.data.state}`);
        } else if (type === 'button') {
            // Momentary push
            component.data.state = true;
            setTimeout(() => {
                if (component && component.data) component.data.state = false;
                paper.view.update();
            }, 200);
            this.app.ai.logAI("Interactive", `Button Pushed`);
        } else {
            this.app.ai.logAI("Interactive", `${libDef?.name || type} does not support manual toggling.`);
        }

        paper.view.update();
        this.app.history.pushState();
    }
}