import paper from 'https://esm.sh/paper';

/**
 * Compliance and Design Standards Validation Engine.
 */
export class ValidationEngine {
    constructor(app) {
        this.app = app;
    }

    run() {
        const res = document.getElementById('validation-results');
        if (!res) return;
        
        const std = document.getElementById('standard-select')?.value || this.app.currentStandard;
        const unDim = this.app.layers.geometry.children.length - this.app.layers.dimensions.children.length;
        
        let errors = [];
        const geomItems = this.app.layers.geometry.children || [];
        const dimItems = this.app.layers.dimensions.children || [];

        if (geomItems.length === 0) errors.push("Drawing is empty.");
        
        let totalGeomLength = 0;
        let visibleLinesHaveThickWeight = true;
        let incorrectColors = false;

        geomItems.forEach(item => {
            if (item.className === 'Path' && item.length) totalGeomLength += item.length;
            if (item.strokeWidth < 0.5) visibleLinesHaveThickWeight = false; // SANS dictates 0.5 - 0.7mm for visible outlines
            if (item.strokeColor && item.strokeColor.toCSS(true) === '#ff0000') incorrectColors = true; // Drawing shouldn't have raw red outlines
        });

        // Heuristic: A dimension roughly covers 50-100 units of geometry on average. 
        const expectedDims = Math.floor(totalGeomLength / 150);
        const dimDeficit = expectedDims - dimItems.length;

        const hasTitleBlock = !!document.getElementById('sheet-project')?.value;

        // Advanced Logic: Check for dangling paths or overlapping geometries
        let danglingLines = 0;
        let overlappingCount = 0;
        const checkGeom = geomItems.filter(i => i.className === 'Path' && i.length > 0);
        
        for (let i = 0; i < checkGeom.length; i++) {
            const path1 = checkGeom[i];
            
            // Check dangling (open paths that should be closed profiles in mechanical CAD)
            if (!path1.closed && path1.length > 5) {
                // If neither start nor end intersects another path, it's dangling
                let startConnected = false;
                let endConnected = false;
                for (let j = 0; j < checkGeom.length; j++) {
                    if (i === j) continue;
                    const path2 = checkGeom[j];
                    if (path1.firstSegment.point.getDistance(path2.getNearestPoint(path1.firstSegment.point)) < 2) startConnected = true;
                    if (path1.lastSegment.point.getDistance(path2.getNearestPoint(path1.lastSegment.point)) < 2) endConnected = true;
                }
                if (!startConnected || !endConnected) danglingLines++;
            }

            // Check overlapping geometries
            for (let j = i + 1; j < checkGeom.length; j++) {
                const path2 = checkGeom[j];
                const intersections = path1.getIntersections(path2);
                if (intersections.length > 2) {
                    overlappingCount++;
                }
            }
        }

        if (danglingLines > 0) errors.push(`Detected ${danglingLines} dangling/unconnected lines.`);
        if (overlappingCount > 2) errors.push(`Warning: Detected high number of complex overlapping geometries.`);

        if (std === 'SANS') {
            const hasProjectionSymbol = paper.project.getItems({ data: { type: 'projection_symbol' } }).length > 0;
            if (!hasProjectionSymbol) errors.push("Missing Third Angle Projection Symbol (SANS 10111).");
            if (dimDeficit > 2) errors.push(`Insufficient dimensioning. Add ~${dimDeficit} more dimensions to fully define the part.`);
            if (!visibleLinesHaveThickWeight) errors.push("Visible outlines must use thick line weights (type A).");
            if (!hasTitleBlock) errors.push("Title block metadata missing.");
        } else {
            if (dimDeficit > 3) errors.push("Missing Dimensions.");
            if (incorrectColors) errors.push("ISO specifies strict monochrome or layer-designated plotting styles.");
        }

        if (errors.length > 0) {
            res.innerHTML = errors.map(e => `<span class="badge" style="background:#d32f2f; display:block; margin-bottom:4px;">${e}</span>`).join('');
        } else {
            res.innerHTML = `<span class="badge success">${std} Compliant</span>`;
        }
    }
}