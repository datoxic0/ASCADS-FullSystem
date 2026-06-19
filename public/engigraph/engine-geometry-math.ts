import paper from 'https://esm.sh/paper';

/**
 * Basic Vector Math & Formatting Utilities
 */

export const Point = (x, y) => ({ x, y });

export function dist(p1, p2) {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

export function lerp(p1, p2, t) {
    return new paper.Point(
        p1.x + (p2.x - p1.x) * t,
        p1.y + (p2.y - p1.y) * t
    );
}

export function angleBetween(p1, p2) {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

export function projectPointToLine(pt, l1, l2) {
    const dx = l2.x - l1.x;
    const dy = l2.y - l1.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return l1;
    const t = Math.max(0, Math.min(1, ((pt.x - l1.x) * dx + (pt.y - l1.y) * dy) / lenSq));
    return {
        x: l1.x + t * dx,
        y: l1.y + t * dy
    };
}

export function getIntersection(l1p1, l1p2, l2p1, l2p2) {
    const x1 = l1p1.x, y1 = l1p1.y, x2 = l1p2.x, y2 = l1p2.y;
    const x3 = l2p1.x, y3 = l2p1.y, x4 = l2p2.x, y4 = l2p2.y;
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (Math.abs(denom) < 1e-10) return null; 
    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    return new paper.Point(x1 + ua * (x2 - x1), y1 + ua * (y2 - y1));
}

export function getNormal(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return new paper.Point(-dy, dx).normalize();
}

export function formatCoord(val, scaleFactor = 1.0) {
    if (val === undefined || val === null) return "0.00";
    return (val * (1 / scaleFactor)).toFixed(2);
}