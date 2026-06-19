import paper from 'https://esm.sh/paper';

/**
 * High-Performance Snapping Engine & Spatial Indexing
 */

export function snapToGrid(pt, step = 1.0) {
    const epsilon = 1e-10;
    return new paper.Point(
        (Math.round((pt.x + epsilon) / step) * step),
        (Math.round((pt.y + epsilon) / step) * step)
    );
}

export function snapToIsoGrid(pt, step = 1.0) {
    const cos30 = Math.cos(Math.PI / 6);
    const sin30 = Math.sin(Math.PI / 6);
    let u = pt.x * cos30 + pt.y * sin30;
    let v = -pt.x * cos30 + pt.y * sin30;
    u = Math.round(u / step) * step;
    v = Math.round(v / step) * step;
    return new paper.Point((u - v) / (2 * cos30), (u + v) / (2 * sin30));
}

export function snapToAngle(vector, pivot, increments = 15) {
    const angle = vector.angle;
    const snappedAngle = Math.round(angle / increments) * increments;
    return pivot.add(new paper.Point({ angle: snappedAngle, length: vector.length }));
}

export function findInstrumentSnap(point, paperProject, tolerance = 15) {
    const constructionLayer = paperProject.layers['construction_layer'];
    if (!constructionLayer || !constructionLayer.visible) return null;
    const candidates = [];

    constructionLayer.children.forEach(group => {
        if (!group.data) return;
        if (group.data.type === 'instrument-guide') {
            const mainPath = group.children.find(c => c.className === 'Path' && !c.data?.role);
            if (mainPath) {
                const nearest = mainPath.getNearestPoint(point);
                const d = nearest.getDistance(point);
                if (d < tolerance) candidates.push({ point: nearest, dist: d });
            }
        } else if (group.data.type === 'protractor-guide') {
            const center = group.position;
            const distToCenter = point.getDistance(center);
            const radius = group.bounds.width / 2;
            if (distToCenter > radius * 0.4 && distToCenter < radius * 1.2) {
                const angle = (point.subtract(center)).angle;
                const snapInc = distToCenter > radius * 0.8 ? 1 : 5;
                const snappedPoint = center.add(new paper.Point({ angle: Math.round(angle / snapInc) * snapInc, length: distToCenter }));
                candidates.push({ point: snappedPoint, dist: snappedPoint.getDistance(point) });
            }
        }
    });

    if (candidates.length > 0) {
        candidates.sort((a, b) => a.dist - b.dist);
        return candidates[0].point;
    }
    return null;
}

export class SpatialHash {
    constructor(cellSize = 100) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }
    _getKey(x, y) { return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`; }
    clear() { this.grid.clear(); }
    insert(item) {
        const b = item.bounds;
        for (let x = Math.floor(b.left / this.cellSize); x <= Math.floor(b.right / this.cellSize); x++) {
            for (let y = Math.floor(b.top / this.cellSize); y <= Math.floor(b.bottom / this.cellSize); y++) {
                const key = `${x},${y}`;
                if (!this.grid.has(key)) this.grid.set(key, []);
                this.grid.get(key).push(item);
            }
        }
    }
    query(point, radius) {
        const results = new Set();
        const startX = Math.floor((point.x - radius) / this.cellSize);
        const endX = Math.floor((point.x + radius) / this.cellSize);
        const startY = Math.floor((point.y - radius) / this.cellSize);
        const endY = Math.floor((point.y + radius) / this.cellSize);
        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                const cell = this.grid.get(`${x},${y}`);
                if (cell) cell.forEach(item => results.add(item));
            }
        }
        return Array.from(results);
    }
}

const spatialHash = new SpatialHash(200);
let snapCache = { timestamp: 0, items: [] };

export function findSnapPoint(point, paperProject, tolerance = 10) {
    try {
        if (!paperProject?.layers) return null;
        const now = Date.now();
        const snapCandidates = [];

        if (now - snapCache.timestamp > 250 || snapCache.items.length === 0) {
            spatialHash.clear();
            const items = [];
            paperProject.layers.forEach(l => {
                if (l.visible && !l.locked && l.name !== 'grid_layer') {
                    l.children.forEach(item => { if (!item.guide) { items.push(item); spatialHash.insert(item); } });
                }
            });
            snapCache = { timestamp: now, items };
        }

        const instSnap = findInstrumentSnap(point, paperProject, tolerance * 1.5);
        if (instSnap) snapCandidates.push({ point: instSnap, type: 'instrument', dist: instSnap.getDistance(point) });

        const nearbyItems = spatialHash.query(point, tolerance);
        const searchRect = new paper.Rectangle(point.x - tolerance, point.y - tolerance, tolerance * 2, tolerance * 2);

        nearbyItems.forEach((itemA, i) => {
            if (itemA.segments) {
                itemA.segments.forEach(seg => { if (searchRect.contains(seg.point)) snapCandidates.push({ point: seg.point, type: 'endpoint', dist: seg.point.getDistance(point) }); });
            }
            if (itemA.className === 'Path' && itemA.length > 0) {
                const mid = itemA.getPointAt(itemA.length / 2);
                if (searchRect.contains(mid)) snapCandidates.push({ point: mid, type: 'midpoint', dist: mid.getDistance(point) });
            }
            if (itemA.data && (itemA.data.type === 'circle' || itemA.data.type === 'rect' || itemA.data.type === 'component')) {
                if (searchRect.contains(itemA.position)) snapCandidates.push({ point: itemA.position, type: 'center', dist: itemA.position.getDistance(point) });
            }
            for (let j = i + 1; j < nearbyItems.length; j++) {
                if (typeof itemA.getIntersections === 'function') {
                    try {
                        const inters = itemA.getIntersections(nearbyItems[j]);
                        inters.forEach(inter => { if (searchRect.contains(inter.point)) snapCandidates.push({ point: inter.point, type: 'intersection', dist: inter.point.getDistance(point) }); });
                    } catch(e) {}
                }
            }
        });

        if (snapCandidates.length === 0) {
            const hit = paperProject.hitTest(point, { stroke: true, fill: true, tolerance: tolerance, match: h => !h.item.guide });
            if (hit && hit.point) snapCandidates.push({ point: hit.point, type: 'on-path', dist: hit.point.getDistance(point) });
        }

        if (snapCandidates.length > 0) {
            const priority = { 'instrument': 0, 'intersection': 1, 'endpoint': 2, 'midpoint': 3, 'center': 4, 'on-path': 5 };
            snapCandidates.sort((a, b) => (priority[a.type] || 99) - (priority[b.type] || 99) || a.dist - b.dist);
            return { point: snapCandidates[0].point, type: snapCandidates[0].type };
        }
    } catch (e) { console.error("Snap engine failure:", e); }
    return null;
}