import paper from 'https://esm.sh/paper';
import { DrawingTools } from './tool-drawing.js';
import { ModellingTools } from './tool-modelling.js';
import { AnnotationTools } from './tool-annotations.js';
import { ComponentLibrary } from './tool-components.js';
import { ToolEvents } from './tool-events.js';
import { SelectionManager } from './tool-selection.js';

/**
 * Refactored Tool Manager: Delegates to specialized modules for Events and Selection.
 */
export class ToolManager {
    constructor(app) {
        this.app = app;
        this.tempPath = null;
        this.startPoint = null;
        this.clickSequence = [];
        this.selection = null;
        this.marquee = null;

        // Sub-modules
        this.drawing = new DrawingTools(app, this);
        this.modelling = new ModellingTools(app, this);
        this.activeComponent = null;
        this.annotations = new AnnotationTools(app, this);
        this.components = new ComponentLibrary(app, this);
        
        // Specialized logic modules
        this.events = new ToolEvents(app, this);
        this.selectionManager = new SelectionManager(app, this);
    }

    setTool(toolId, partType = null) {
        // Don't reset if we are just starting to place a component, 
        // as the component is created right before this call.
        if (toolId !== 'place-component') {
            this.resetTemp();
        }
        
        this.app.currentTool = toolId;
        
        // Context-aware help messages for the status bar
        const toolHelp = {
            'select': 'Select and transform entities. Use Shift to multi-select.',
            'pan': 'Middle-click or Drag to pan the workspace.',
            'line': 'Click and drag to draw a precision line.',
            'circle': 'Click center and drag to define radius.',
            'rect': 'Click and drag for a rectangular profile.',
            'arc': 'Click 3 points to define a geometric arc.',
            'bisect': 'Click near an intersection of two lines to bisect.',
            'fillet': 'Click the intersection of two lines to round the corner.',
            'trim': 'Click a line segment between two intersections to trim it.',
            'extend': 'Click near the end of a line to extend it to the next boundary.',
            'offset': 'Select a path, then click to offset it by a distance.',
            'ruler': 'Click to place a persistent scale ruler.',
            'set-square-30': 'Click to place a 30/60° set square guide.',
            'set-square-45': 'Click to place a 45° set square guide.',
            'protractor': 'Click to place a 360° protractor guide.',
            'gear': 'Click to place a precision involute gear.',
            'wire': 'Click and drag to route electrical connections.',
            'dim-smart': 'Click any entity to automatically generate ISO dimensions.'
        };

        const msg = toolHelp[toolId] || `Command: ${toolId.toUpperCase()}${partType ? ` (${partType})` : ''}`;
        (document.getElementById('status-msg') || {}).textContent = msg;
        
        if (toolId === 'pan') this.app.canvas.style.cursor = 'grab';
        else if (toolId === 'select') this.app.canvas.style.cursor = 'default';
        else this.app.canvas.style.cursor = 'crosshair';

        // Update Ribbon UI Highlights
        document.querySelectorAll('.tool-btn').forEach(btn => {
            if (btn.dataset.tool || btn.dataset.part) {
                const isToolMatch = btn.dataset.tool === toolId && !partType;
                const isPartMatch = partType && btn.dataset.part === partType;
                btn.classList.toggle('tool-active', isToolMatch || isPartMatch);
            }
        });
    }

    resetTemp() {
        if (this.tempPath) this.tempPath.remove();
        if (this.activeComponent) {
            this.activeComponent.remove();
            this.activeComponent = null;
        }
        this.tempPath = null;
        this.startPoint = null;
        this.clickSequence = [];
    }

    initTools() {
        const tool = new paper.Tool();
        tool.onMouseDown = (event) => this.events.handleMouseDown(event);
        tool.onMouseDrag = (event) => this.events.handleMouseDrag(event);
        tool.onMouseUp = (event) => this.events.handleMouseUp(event);
        tool.onMouseMove = (event) => this.events.handleMouseMove(event);
    }

    // removed handleMouseDown() {}
    // removed handleMouseDrag() {}
    // removed handleMouseUp() {}
    // removed handleMouseMove() {}
    // removed straightenEntityToInstrument() {}
    // removed updateInstrumentHandles() {}

    // removed createRadialDimension() {}
    // removed handleBisect() {}
    // removed handleFillet() {}
    // removed handleSmartDim() {}
    // removed handleSculpt() {}
    // removed handleOffset() {}
    // removed handleMirror() {}
    // removed handleSubdivide() {}
    // removed insertPart() {}
}