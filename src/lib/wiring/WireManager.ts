/**
 * WireManager - Shared logic for interactive wires across sections.
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * Calculates the shortest distance from a point (px, py) to a line segment defined by (x1,y1) and (x2,y2).
 */
export function getDistanceToLineSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const l2 = Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  
  const projX = x1 + t * (x2 - x1);
  const projY = y1 + t * (y2 - y1);
  
  return Math.hypot(px - projX, py - projY);
}

/**
 * Finds if a point intersects with a polyline (array of points) within a given tolerance.
 * Returns the index of the segment it hit, or -1 if no hit.
 */
export function getSegmentHit(px: number, py: number, points: Point[], tolerance = 6): number {
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dist = getDistanceToLineSegment(px, py, p1.x, p1.y, p2.x, p2.y);
    if (dist <= tolerance) {
      return i;
    }
  }
  return -1;
}

/**
 * Given a start and end point, returns default orthogonal routing points.
 */
export function calculateOrthogonalPoints(start: Point, end: Point, routing: 'HVH' | 'VHV' = 'HVH'): Point[] {
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  
  if (routing === 'HVH') {
    return [
      start,
      { x: midX, y: start.y },
      { x: midX, y: end.y },
      end
    ];
  } else {
    return [
      start,
      { x: start.x, y: midY },
      { x: end.x, y: midY },
      end
    ];
  }
}

/**
 * Formats points into a flattened array [x1, y1, x2, y2, ...] for Konva.
 */
export function pointsToKonvaFlat(points: Point[]): number[] {
  return points.flatMap(p => [p.x, p.y]);
}

/**
 * Converts a flattened array back to Point[]
 */
export function konvaFlatToPoints(flat: number[]): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < flat.length; i += 2) {
    points.push({ x: flat[i], y: flat[i + 1] });
  }
  return points;
}

/**
 * Formats points into an SVG path data string (M x y L x y ...)
 */
export function pointsToSvgPath(points: Point[]): string {
  if (points.length === 0) return '';
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`;
  }
  return path;
}
