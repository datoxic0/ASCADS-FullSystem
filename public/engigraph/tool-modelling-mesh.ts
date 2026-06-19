import paper from 'https://esm.sh/paper';

/**
 * Soft Transform and Path Refinement Operations
 */
export class MeshOps {
    static handleSculpt(app, pt, isStart, delta = null) {
        const radius = 50 / app.viewManager.getZoom();
        const items = paper.project.activeLayer.children;
        items.forEach(item => {
            if (item.className === 'Path' && !item.guide) {
                item.segments.forEach(seg => {
                    const d = seg.point.getDistance(pt);
                    if (d < radius) {
                        const factor = (1 - d / radius) * 0.8;
                        if (!isStart && delta) {
                            seg.point = seg.point.add(delta.multiply(factor));
                        }
                    }
                });
            }
        });
    }

    static handleSubdivide(app, pt) {
        const h = paper.project.hitTest(pt, { stroke: true, tolerance: 10 });
        if (!h || h.item.className !== 'Path') return;
        
        const path = h.item;
        const locations = [];
        for (let i = 0; i < path.curves.length; i++) {
            locations.push(path.curves[i].getLocationAt(path.curves[i].length / 2));
        }
        locations.reverse().forEach(loc => path.divideAt(loc));
        path.smooth({ type: 'catmull-rom' });
        app.ai.logAI("System", "Path subdivided and smoothed.");
        app.history.pushState();
    }
}