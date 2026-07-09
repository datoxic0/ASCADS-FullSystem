import { DrawingObject, DRCViolation, EngigraphState } from '../store/useEngigraphStore';

export class DRCEngine {
    static check(elements: DrawingObject[], rules: EngigraphState['pcbRules']): DRCViolation[] {
        const violations: DRCViolation[] = [];
        
        // Find all tracks (wires)
        const wires = elements.filter(el => el.type === 'wire' && el.points);

        // Check track width
        wires.forEach(wire => {
            const width = wire.strokeWidth || 2;
            if (width < rules.minTrackWidth) {
                violations.push({
                    id: `drc-width-${wire.id}`,
                    type: 'width',
                    message: `Track width ${width}mm is less than minimum ${rules.minTrackWidth}mm`,
                    elementIds: [wire.id],
                    x: wire.points ? wire.points[0] : 0,
                    y: wire.points ? wire.points[1] : 0,
                });
            }
        });

        // Basic Clearance Checks: Distance between lines of DIFFERENT nets
        for (let i = 0; i < wires.length; i++) {
            for (let j = i + 1; j < wires.length; j++) {
                const w1 = wires[i];
                const w2 = wires[j];
                
                // If they share the same logical net, they are allowed to touch/overlap
                if (w1.netId && w2.netId && w1.netId === w2.netId) continue;
                // If they are on different layers, they don't violate clearance
                if (w1.boardLayer !== w2.boardLayer) continue;

                const pts1 = w1.points!;
                const pts2 = w2.points!;

                // O(n^2) segment check
                for (let a = 0; a < pts1.length - 2; a += 2) {
                    const p1 = { x: pts1[a], y: pts1[a+1] };
                    const p2 = { x: pts1[a+2], y: pts1[a+3] };
                    
                    for (let b = 0; b < pts2.length - 2; b += 2) {
                        const p3 = { x: pts2[b], y: pts2[b+1] };
                        const p4 = { x: pts2[b+2], y: pts2[b+3] };

                        const dist = this.distBetweenSegments(p1, p2, p3, p4);
                        // Using clearance constraint (min clearance)
                        if (dist < rules.minClearance - 0.001) { // 0.001 epsilon for floating point
                            violations.push({
                                id: `drc-clearance-${w1.id}-${w2.id}-${a}-${b}`,
                                type: 'clearance',
                                message: `Clearance violation: ${dist.toFixed(1)}mm < ${rules.minClearance}mm`,
                                elementIds: [w1.id, w2.id],
                                x: (p1.x + p3.x) / 2,
                                y: (p1.y + p3.y) / 2,
                            });
                        }
                    }
                }
            }
        }

        return violations;
    }

    private static distBetweenSegments(
        p1: {x:number, y:number}, p2: {x:number, y:number},
        p3: {x:number, y:number}, p4: {x:number, y:number}
    ): number {
        // Fast bounding box reject
        const minX1 = Math.min(p1.x, p2.x), maxX1 = Math.max(p1.x, p2.x);
        const minY1 = Math.min(p1.y, p2.y), maxY1 = Math.max(p1.y, p2.y);
        const minX2 = Math.min(p3.x, p4.x), maxX2 = Math.max(p3.x, p4.x);
        const minY2 = Math.min(p3.y, p4.y), maxY2 = Math.max(p3.y, p4.y);
        
        if (maxX1 < minX2 || minX1 > maxX2 || maxY1 < minY2 || minY1 > maxY2) {
            const dx = Math.max(minX1 - maxX2, minX2 - maxX1, 0);
            const dy = Math.max(minY1 - maxY2, minY2 - maxY1, 0);
            return Math.sqrt(dx*dx + dy*dy);
        }
        
        // Exact distance
        const d1 = this.pointToSegment(p1, p3, p4);
        const d2 = this.pointToSegment(p2, p3, p4);
        const d3 = this.pointToSegment(p3, p1, p2);
        const d4 = this.pointToSegment(p4, p1, p2);

        // Also check if they intersect
        if (this.segmentsIntersect(p1, p2, p3, p4)) return 0;

        return Math.min(d1, d2, d3, d4);
    }

    private static pointToSegment(p: {x:number, y:number}, a: {x:number, y:number}, b: {x:number, y:number}): number {
        const l2 = (a.x - b.x)**2 + (a.y - b.y)**2;
        if (l2 === 0) return Math.sqrt((p.x - a.x)**2 + (p.y - a.y)**2);
        let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        const proj = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
        return Math.sqrt((p.x - proj.x)**2 + (p.y - proj.y)**2);
    }

    private static segmentsIntersect(
        p1: {x:number, y:number}, p2: {x:number, y:number},
        p3: {x:number, y:number}, p4: {x:number, y:number}
    ): boolean {
        const det = (p2.x - p1.x) * (p4.y - p3.y) - (p4.x - p3.x) * (p2.y - p1.y);
        if (det === 0) return false;
        const lambda = ((p4.y - p3.y) * (p4.x - p1.x) + (p3.x - p4.x) * (p4.y - p1.y)) / det;
        const gamma = ((p1.y - p2.y) * (p4.x - p1.x) + (p2.x - p1.x) * (p4.y - p1.y)) / det;
        return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    }
}
