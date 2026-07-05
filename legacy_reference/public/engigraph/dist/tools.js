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
        if (toolId === 'pan')
            this.app.canvas.style.cursor = 'grab';
        else if (toolId === 'select')
            this.app.canvas.style.cursor = 'default';
        else
            this.app.canvas.style.cursor = 'crosshair';
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
        if (this.tempPath)
            this.tempPath.remove();
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
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi90b29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssTUFBTSxzQkFBc0IsQ0FBQztBQUN6QyxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBQ3JELE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUN4RCxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUN4RCxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFDOUMsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFFdkQ7O0dBRUc7QUFDSCxNQUFNLE9BQU8sV0FBVztJQUNwQixZQUFZLEdBQUc7UUFDWCxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNmLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxhQUFhLEdBQUcsRUFBRSxDQUFDO1FBQ3hCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBRXBCLGNBQWM7UUFDZCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksWUFBWSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMzQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksY0FBYyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMvQyxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztRQUM1QixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksZUFBZSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNs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RSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQzFDLElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDOUIsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7UUFDaEMsQ0FBQztRQUNELElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxhQUFhLEdBQUcsRUFBRSxDQUFDO0lBQzVCLENBQUM7SUFFRCxTQUFTO1FBQ0wsTUFBTSxJQUFJLEdBQUcsSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDOUIsSUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDakUsSUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDakUsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDN0QsSUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDckUsQ0FBQztDQWtCSiJ9