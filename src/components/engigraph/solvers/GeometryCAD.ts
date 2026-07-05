export class GeometryCAD {
    /**
     * Translates calculateFillet without paper.js
     * Returns points for rendering a fillet arc between two intersecting lines.
     */
    static calculateFillet(p1: {x: number, y: number}, intersect: {x: number, y: number}, p2: {x: number, y: number}, radius: number) {
        const v1x = p1.x - intersect.x;
        const v1y = p1.y - intersect.y;
        const len1 = Math.sqrt(v1x*v1x + v1y*v1y);
        const n1x = v1x / len1;
        const n1y = v1y / len1;

        const v2x = p2.x - intersect.x;
        const v2y = p2.y - intersect.y;
        const len2 = Math.sqrt(v2x*v2x + v2y*v2y);
        const n2x = v2x / len2;
        const n2y = v2y / len2;

        const dot = n1x * n2x + n1y * n2y;
        const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
        
        if (angle < 0.01) return null; // Lines are parallel

        const d = radius / Math.tan(angle / 2);
        
        const tp1 = { x: intersect.x + n1x * d, y: intersect.y + n1y * d };
        const tp2 = { x: intersect.x + n2x * d, y: intersect.y + n2y * d };
        
        const bisectorX = n1x + n2x;
        const bisectorY = n1y + n2y;
        const blen = Math.sqrt(bisectorX*bisectorX + bisectorY*bisectorY);
        const bnx = bisectorX / blen;
        const bny = bisectorY / blen;

        const distToCenter = radius / Math.sin(angle / 2);
        const center = { x: intersect.x + bnx * distToCenter, y: intersect.y + bny * distToCenter };
        
        return { center, tp1, tp2 };
    }

    /**
     * Translates generateGearPath without paper.js
     * Returns an array of points for an SVG polyline or polygon.
     */
    static generateGearPoints(teeth: number, module: number, pressureAngleDeg: number = 20): number[] {
        const pressureAngle = pressureAngleDeg * Math.PI / 180;
        const pitchRadius = (module * teeth) / 2;
        const baseRadius = pitchRadius * Math.cos(pressureAngle);
        const outerRadius = pitchRadius + module;
        const rootRadius = pitchRadius - (1.25 * module);
        const points: number[] = [];
        const steps = 12;
        const toothAngle = Math.PI / (2 * teeth);
        
        const inv = (phi: number) => Math.tan(phi) - phi;
        const thetaP = inv(Math.acos(baseRadius / pitchRadius));
        
        const polarToCartesian = (r: number, theta: number) => {
            return { x: r * Math.cos(theta), y: r * Math.sin(theta) };
        };

        for (let i = 0; i < teeth; i++) {
            const centerAngle = (i / teeth) * Math.PI * 2;
            
            // Root start
            let pt = polarToCartesian(rootRadius, centerAngle - toothAngle);
            points.push(pt.x, pt.y);
            
            // Involute curve up
            for (let j = 0; j <= steps; j++) {
                const r = baseRadius + (outerRadius - baseRadius) * (j / steps);
                if (baseRadius / r > 1) continue;
                const theta = inv(Math.acos(baseRadius / r));
                pt = polarToCartesian(r, centerAngle - toothAngle - (thetaP - theta));
                points.push(pt.x, pt.y);
            }
            
            // Top land
            const thetaO = inv(Math.acos(baseRadius / outerRadius));
            pt = polarToCartesian(outerRadius, centerAngle + toothAngle + (thetaP - thetaO));
            points.push(pt.x, pt.y);
            
            // Involute curve down
            for (let j = steps; j >= 0; j--) {
                const r = baseRadius + (outerRadius - baseRadius) * (j / steps);
                if (baseRadius / r > 1) continue;
                const theta = inv(Math.acos(baseRadius / r));
                pt = polarToCartesian(r, centerAngle + toothAngle + (thetaP - theta));
                points.push(pt.x, pt.y);
            }
            
            // Root end
            pt = polarToCartesian(rootRadius, centerAngle + toothAngle);
            points.push(pt.x, pt.y);
        }
        
        return points;
    }
}
