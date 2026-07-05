import paper from 'https://esm.sh/paper';
import * as geom from './geometry.js';

/**
 * Classical Geometric CAD Operations (Trim, Extend, Fillet, Bisect)
 */
export class GeometricOps {
    static handleBisect(app, pt) {
        const hitOptions = { stroke: true, tolerance: 40, match: h => h.item.className === 'Path' && h.item.segments.length === 2 };
        const hs = paper.project.hitTestAll(pt, hitOptions);
        const ps = hs.map(h => h.item).filter((v, i, a) => a.indexOf(v) === i).slice(0, 2);

        if (ps.length < 2) {
            (document.getElementById('status-msg') || {}).textContent = "Select two converging lines to bisect.";
            return;
        }

        const i = geom.getIntersection(ps[0].segments[0].point, ps[0].segments[1].point, ps[1].segments[0].point, ps[1].segments[1].point);
        if (i) {
            const getFarPoint = (line, inter) => line.segments[0].point.getDistance(inter) > line.segments[1].point.getDistance(inter) ? line.segments[0].point : line.segments[1].point;
            const p1 = getFarPoint(ps[0], i);
            const p2 = getFarPoint(ps[1], i);
            const v1 = p1.subtract(i).normalize();
            const v2 = p2.subtract(i).normalize();
            const bisectorDir = v1.add(v2).normalize();
            
            const bisector = new paper.Path.Line(i, i.add(bisectorDir.multiply(500)));
            bisector.strokeColor = 'var(--accent)';
            bisector.dashArray = [10, 4, 2, 4];
            bisector.strokeWidth = 0.5;
            bisector.data.type = 'bisector';
            app.layers.construction.addChild(bisector);
            
            app.ai.logAI("System", "Geometric Bisector generated.");
            app.history.pushState();
        }
    }

    static handleFillet(app, pt) {
        const hitOptions = { stroke: true, tolerance: 30, match: h => h.item.className === 'Path' && h.item.segments.length === 2 };
        const hs = paper.project.hitTestAll(pt, hitOptions);
        const ps = hs.map(h => h.item).filter((v, i, a) => a.indexOf(v) === i).slice(0, 2);

        if (ps.length < 2) {
            app.ai.logAI("System", "Select two intersecting lines for fillet.");
            return;
        }

        const rInput = prompt("Enter fillet radius (mm):", "10");
        if (rInput === null) return;
        const r = parseFloat(rInput) * app.scaleFactor;

        const intersect = geom.getIntersection(ps[0].segments[0].point, ps[0].segments[1].point, ps[1].segments[0].point, ps[1].segments[1].point);
        if (!intersect) return;

        const v1 = ps[0].segments[0].point.getDistance(intersect) > ps[0].segments[1].point.getDistance(intersect) ? ps[0].segments[0].point.subtract(intersect).normalize() : ps[0].segments[1].point.subtract(intersect).normalize();
        const v2 = ps[1].segments[0].point.getDistance(intersect) > ps[1].segments[1].point.getDistance(intersect) ? ps[1].segments[0].point.subtract(intersect).normalize() : ps[1].segments[1].point.subtract(intersect).normalize();

        const res = geom.calculateFillet(intersect.add(v1), new paper.Point(intersect), intersect.add(v2), r);
        
        if (res && res.tp1 && res.tp2 && res.through) {
            const arc = new paper.Path.Arc(res.tp1, res.through, res.tp2);
            arc.strokeColor = 'var(--geometry-default)';
            arc.strokeWidth = ps[0].strokeWidth;
            arc.data.type = 'fillet';
            app.layers.geometry.addChild(arc);

            [ {line: ps[0], tp: res.tp1}, {line: ps[1], tp: res.tp2} ].forEach(obj => {
                const d1 = obj.line.segments[0].point.getDistance(obj.tp);
                const d2 = obj.line.segments[1].point.getDistance(obj.tp);
                if (d1 < d2) obj.line.segments[0].point = obj.tp;
                else obj.line.segments[1].point = obj.tp;
            });
            app.history.pushState();
        }
    }

    static handleTrim(app, pt) {
        const hit = paper.project.hitTest(pt, { stroke: true, tolerance: 10, match: h => !h.item.guide });
        if (!hit || hit.item.className !== 'Path') return;

        const path = hit.item;
        const intersections = [];
        
        // Use spatial query for performance if we had many items, but for now we iterate layers
        paper.project.layers.forEach(layer => {
            if (!layer.visible || layer.name === 'grid_layer') return;
            layer.children.forEach(other => {
                if (other !== path && other.className === 'Path' && !other.guide) {
                    const inters = path.getIntersections(other);
                    inters.forEach(i => intersections.push(i.offset));
                }
            });
        });

        if (intersections.length === 0) {
            path.remove();
        } else {
            // Include start and end of path
            intersections.push(0, path.length);
            // Sort offsets numerically
            intersections.sort((a, b) => a - b);
            
            // Remove duplicates and near-duplicates
            const uniqueInters = [];
            for(let i=0; i<intersections.length; i++) {
                if (i === 0 || intersections[i] - uniqueInters[uniqueInters.length-1] > 0.001) {
                    uniqueInters.push(intersections[i]);
                }
            }

            const clickOffset = path.getNearestLocation(pt).offset;
            
            // Find which segment the user clicked on
            for (let i = 0; i < uniqueInters.length - 1; i++) {
                if (clickOffset >= uniqueInters[i] && clickOffset <= uniqueInters[i+1]) {
                    // We split the path into three parts: head, target (to remove), and tail
                    const tail = path.splitAt(uniqueInters[i+1]);
                    const target = path.splitAt(uniqueInters[i]);
                    
                    if (target) target.remove();
                    else if (i === 0) path.remove(); // The path itself was the target

                    app.ai.logAI("System", "Precision segment trimmed.");
                    break;
                }
            }
        }
        app.history.pushState();
        paper.view.update();
    }

    static handleExtend(app, pt) {
        const hit = paper.project.hitTest(pt, { 
            stroke: true, tolerance: 10, 
            match: h => (h.item.className === 'Path' || h.item.className === 'Line') && h.item.segments.length === 2 
        });
        if (!hit) return;

        const path = hit.item;
        const isStart = hit.point.getDistance(path.segments[0].point) < hit.point.getDistance(path.segments[1].point);
        const near = isStart ? path.segments[0].point : path.segments[1].point;
        const far = isStart ? path.segments[1].point : path.segments[0].point;
        const dir = near.subtract(far).normalize();

        const ray = new paper.Path.Line(near, near.add(dir.multiply(2000)));
        ray.visible = false;
        let bestDist = Infinity, bestPt = null;

        paper.project.activeLayer.children.forEach(other => {
            if (other !== path && (other.className === 'Path' || other.className === 'CompoundPath')) {
                const inters = ray.getIntersections(other);
                inters.forEach(i => {
                    const d = near.getDistance(i.point);
                    if (d > 0.1 && d < bestDist) { bestDist = d; bestPt = i.point; }
                });
            }
        });
        ray.remove();
        if (bestPt) {
            if (isStart) path.segments[0].point = bestPt;
            else path.segments[1].point = bestPt;
            app.history.pushState();
        }
    }
}