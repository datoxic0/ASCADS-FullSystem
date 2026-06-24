import paper from 'https://esm.sh/paper';

/**
 * Industrial CAD Algorithms (Gears, Symbols, Section Analysis)
 */

export function createThirdAngleSymbol(center, size = 20) {
    const group = new paper.Group();
    const s = size;
    const c1 = new paper.Path.Circle(center, s * 0.25);
    const c2 = new paper.Path.Circle(center, s * 0.5);
    const offsetX = s * 1.2;
    const cone = new paper.Path([
        center.add([offsetX, -s * 0.5]), center.add([offsetX + s, -s * 0.25]),
        center.add([offsetX + s, s * 0.25]), center.add([offsetX, s * 0.5])
    ]);
    cone.closed = true;
    const cl1 = new paper.Path.Line(center.subtract([s*0.7, 0]), center.add([s * 2.5, 0]));
    const cl2 = new paper.Path.Line(center.subtract([0, s*0.7]), center.add([0, s * 0.7]));
    const cl3 = new paper.Path.Line(center.add([offsetX + s*0.5, -s*0.7]), center.add([offsetX + s*0.5, s*0.7]));
    
    [c1, c2, cone].forEach(p => { p.strokeColor = 'var(--text-main)'; p.strokeWidth = 1; });
    [cl1, cl2, cl3].forEach(p => { p.strokeColor = 'var(--accent)'; p.strokeWidth = 0.5; p.dashArray = [5, 2, 1, 2]; });
    group.addChildren([c1, c2, cone, cl1, cl2, cl3]);
    group.data = { type: 'projection_symbol', metadata: "Third Angle Projection Symbol (SANS 10111)" };
    return group;
}

export function calculateFillet(p1, intersect, p2, radius) {
    const v1 = p1.subtract(intersect).normalize();
    const v2 = p2.subtract(intersect).normalize();
    const angle = Math.acos(v1.dot(v2));
    const d = radius / Math.tan(angle / 2);
    const tp1 = intersect.add(v1.multiply(d));
    const tp2 = intersect.add(v2.multiply(d));
    const bisector = v1.add(v2).normalize();
    const center = intersect.add(bisector.multiply(radius / Math.sin(angle / 2)));
    return { center, tp1, tp2, through: center.subtract(bisector.multiply(radius)) };
}

export function generateGearPath(teeth, module, pressureAngleDeg = 20) {
    const pressureAngle = pressureAngleDeg * Math.PI / 180;
    const pitchRadius = (module * teeth) / 2;
    const baseRadius = pitchRadius * Math.cos(pressureAngle);
    const outerRadius = pitchRadius + module;
    const rootRadius = pitchRadius - (1.25 * module);
    const path = new paper.Path();
    const steps = 12;
    const toothAngle = Math.PI / (2 * teeth);
    const inv = (phi) => Math.tan(phi) - phi;
    const thetaP = inv(Math.acos(baseRadius / pitchRadius));
    
    for (let i = 0; i < teeth; i++) {
        const centerAngle = (i / teeth) * Math.PI * 2;
        path.lineTo(new paper.Point({ length: rootRadius, angle: (centerAngle - toothAngle) * 180 / Math.PI }));
        for (let j = 0; j <= steps; j++) {
            const r = baseRadius + (outerRadius - baseRadius) * (j / steps);
            const theta = inv(Math.acos(baseRadius / r));
            path.lineTo(new paper.Point({ length: r, angle: (centerAngle - toothAngle - (thetaP - theta)) * 180 / Math.PI }));
        }
        const thetaO = inv(Math.acos(baseRadius / outerRadius));
        path.arcTo(new paper.Point({ length: outerRadius, angle: (centerAngle + toothAngle + (thetaP - thetaO)) * 180 / Math.PI }));
        for (let j = steps; j >= 0; j--) {
            const r = baseRadius + (outerRadius - baseRadius) * (j / steps);
            const theta = inv(Math.acos(baseRadius / r));
            path.lineTo(new paper.Point({ length: r, angle: (centerAngle + toothAngle + (thetaP - theta)) * 180 / Math.PI }));
        }
        path.lineTo(new paper.Point({ length: rootRadius, angle: (centerAngle + toothAngle) * 180 / Math.PI }));
    }
    path.closed = true;
    return path;
}

export function calculatePathProperties(path, scale = 1.0) {
    if (!path.closed || path.segments.length < 3) return null;
    const segs = path.segments;
    let area = 0, cx = 0, cy = 0, ixx = 0, iyy = 0;
    for (let i = 0; i < segs.length; i++) {
        const p1 = segs[i].point;
        const p2 = segs[(i + 1) % segs.length].point;
        const cross = (p1.x * p2.y - p2.x * p1.y);
        area += cross; cx += (p1.x + p2.x) * cross; cy += (p1.y + p2.y) * cross;
        ixx += (p1.y * p1.y + p1.y * p2.y + p2.y * p2.y) * cross;
        iyy += (p1.x * p1.x + p1.x * p2.x + p2.x * p2.x) * cross;
    }
    area /= 2;
    if (Math.abs(area) < 1e-6) return null;
    const s = 1 / scale;
    return {
        area: Math.abs(area) * s * s,
        perimeter: path.length * s,
        centroid: new paper.Point((cx / (6 * area)) * s, (cy / (6 * area)) * s),
        ixx: Math.abs(ixx / 12) * Math.pow(s, 4),
        iyy: Math.abs(iyy / 12) * Math.pow(s, 4)
    };
}