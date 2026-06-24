import paper from 'https://esm.sh/paper';
import * as geom from './geometry.js';

/**
 * Parametric Transformations (Offset, Mirror, Array)
 */
export class ParametricOps {
    static handleOffset(app, modellingInstance, pt) {
        const h = paper.project.hitTest(pt, { stroke: true, tolerance: 10 });
        if (!h || h.item.className !== 'Path') return;
        
        let dInput = prompt("Enter Offset distance (mm):", modellingInstance.lastOffsetDist || "10");
        if (dInput === null) return;
        let d = parseFloat(dInput) || 10;
        modellingInstance.lastOffsetDist = d;
        const offsetVal = d * app.scaleFactor;

        const original = h.item;
        let offset;
        if (original.segments.length === 2 && !original.closed) {
            const p1 = original.segments[0].point;
            const p2 = original.segments[1].point;
            const normal = geom.getNormal(p1, p2);
            const side = pt.subtract(geom.projectPointToLine(pt, p1, p2)).dot(normal) > 0 ? 1 : -1;
            offset = new paper.Path.Line(p1.add(normal.multiply(offsetVal * side)), p2.add(normal.multiply(offsetVal * side)));
        } else {
            offset = original.clone();
            const scale = 1 + (offsetVal / (original.bounds.width / 2));
            offset.scale(scale, original.bounds.center);
        }
        offset.strokeColor = 'var(--accent)';
        offset.strokeWidth = original.strokeWidth;
        app.layers.geometry.addChild(offset);
        app.history.pushState();
    }

    static handleMirror(app, manager, pt) {
        if (!manager.selection) return;
        const mirror = manager.selection.clone();
        mirror.scale(-1, 1, pt);
        mirror.selected = true;
        manager.selection.selected = false;
        manager.selection = mirror;
        app.history.pushState();
    }

    static handleArrayLinear(app, manager, pt) {
        if (!manager.selection) return;
        const count = parseInt(prompt("Enter count:", "3")) || 3;
        const spacing = parseFloat(prompt("Enter spacing (mm):", "50")) || 50;
        const dir = prompt("Direction (X/Y):", "X").toUpperCase();
        const delta = new paper.Point(dir === 'X' ? spacing * app.scaleFactor : 0, dir === 'Y' ? spacing * app.scaleFactor : 0);

        for (let i = 1; i < count; i++) {
            const clone = manager.selection.clone();
            clone.position = clone.position.add(delta.multiply(i));
        }
        app.history.pushState();
    }
}