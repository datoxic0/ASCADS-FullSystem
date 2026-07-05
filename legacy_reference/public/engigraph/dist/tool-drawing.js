import { InstrumentDrawing } from './tool-drawing-instruments.js';
import { ShapeDrawing } from './tool-drawing-shapes.js';
import { InstrumentHandles } from './tool-drawing-handles.js';
/**
 * Facilitator for standard geometry and instrument drawing tools.
 * Refactored into specialized sub-modules for improved maintainability.
 */
export class DrawingTools {
    constructor(app, manager) {
        this.app = app;
        this.manager = manager;
    }
    handleMouseDown(type, point) {
        if (type === 'set-paired-drafter') {
            return InstrumentDrawing.createPairedDrafterSet(this.app, point);
        }
        if (type.startsWith('set-paired')) {
            const ruler = InstrumentDrawing.createPairedSet(this.app, point, type);
            // Paired set creates two items, we return the ruler for temporary visibility
            return ruler;
        }
        if (type === 'drafter')
            return InstrumentDrawing.createDrafter(this.app, point);
        if (type === 'ruler')
            return InstrumentDrawing.createRuler(this.app, point);
        if (type.startsWith('set-square')) {
            const angle = type === 'set-square-30' ? 30 : 45;
            return InstrumentDrawing.createSetSquare(this.app, point, angle);
        }
        if (type === 'protractor')
            return InstrumentDrawing.createProtractor(this.app, point);
        if (type === 'arc')
            return ShapeDrawing.handleArc(this.app, this.manager, point);
        return ShapeDrawing.createPrimitive(this.app, type, point);
    }
    // removed function handleMouseDown(type, point) { ... massive switch case ... } {}
    addInstrumentHandles(group) {
        InstrumentHandles.add(this.app, group);
    }
    // removed function addInstrumentHandles(group) { ... handle creation logic ... } {}
    handleMouseDrag(type, point, startPoint, tempPath) {
        return ShapeDrawing.updateShapeOnDrag(this.app, type, point, startPoint, tempPath);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbC1kcmF3aW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vdG9vbC1kcmF3aW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLCtCQUErQixDQUFDO0FBQ2xFLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQztBQUN4RCxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQztBQUU5RDs7O0dBR0c7QUFDSCxNQUFNLE9BQU8sWUFBWTtJQUNyQixZQUFZLEdBQUcsRUFBRSxPQUFPO1FBQ3BCLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2YsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7SUFDM0IsQ0FBQztJQUVELGVBQWUsQ0FBQyxJQUFJLEVBQUUsS0FBSztRQUN2QixJQUFJLElBQUksS0FBSyxvQkFBb0IsRUFBRSxDQUFDO1lBQ2hDLE9BQU8saUJBQWlCLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNyRSxDQUFDO1FBQ0QsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUM7WUFDaEMsTUFBTSxLQUFLLEdBQUcsaUJBQWlCLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3ZFLDZFQUE2RTtZQUM3RSxPQUFPLEtBQUssQ0FBQztRQUNqQixDQUFDO1FBQ0QsSUFBSSxJQUFJLEtBQUssU0FBUztZQUFFLE9BQU8saUJBQWlCLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDaEYsSUFBSSxJQUFJLEtBQUssT0FBTztZQUFFLE9BQU8saUJBQWlCLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDNUUsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUM7WUFDaEMsTUFBTSxLQUFLLEdBQUcsSUFBSSxLQUFLLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDakQsT0FBTyxpQkFBaUIsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDckUsQ0FBQztRQUNELElBQUksSUFBSSxLQUFLLFlBQVk7WUFBRSxPQUFPLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDdEYsSUFBSSxJQUFJLEtBQUssS0FBSztZQUFFLE9BQU8sWUFBWSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFakYsT0FBTyxZQUFZLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQy9ELENBQUM7SUFFRCxtRkFBbUY7SUFFbkYsb0JBQW9CLENBQUMsS0FBSztRQUN0QixpQkFBaUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRUQsb0ZBQW9GO0lBRXBGLGVBQWUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxRQUFRO1FBQzdDLE9BQU8sWUFBWSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDdkYsQ0FBQztDQUdKIn0=