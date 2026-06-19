import paper from 'https://esm.sh/paper';
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
        if (type === 'drafter') return InstrumentDrawing.createDrafter(this.app, point);
        if (type === 'ruler') return InstrumentDrawing.createRuler(this.app, point);
        if (type.startsWith('set-square')) {
            const angle = type === 'set-square-30' ? 30 : 45;
            return InstrumentDrawing.createSetSquare(this.app, point, angle);
        }
        if (type === 'protractor') return InstrumentDrawing.createProtractor(this.app, point);
        if (type === 'arc') return ShapeDrawing.handleArc(this.app, this.manager, point);
        
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

    // removed function handleMouseDrag(type, point, startPoint, tempPath) { ... massive if/else ... } {}
}