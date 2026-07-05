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
        if (!res)
            return;
        const std = document.getElementById('standard-select')?.value || this.app.currentStandard;
        const unDim = this.app.layers.geometry.children.length - this.app.layers.dimensions.children.length;
        let errors = [];
        const geomItems = this.app.layers.geometry.children || [];
        const dimItems = this.app.layers.dimensions.children || [];
        if (geomItems.length === 0)
            errors.push("Drawing is empty.");
        let totalGeomLength = 0;
        let visibleLinesHaveThickWeight = true;
        let incorrectColors = false;
        geomItems.forEach(item => {
            if (item.className === 'Path' && item.length)
                totalGeomLength += item.length;
            if (item.strokeWidth < 0.5)
                visibleLinesHaveThickWeight = false; // SANS dictates 0.5 - 0.7mm for visible outlines
            if (item.strokeColor && item.strokeColor.toCSS(true) === '#ff0000')
                incorrectColors = true; // Drawing shouldn't have raw red outlines
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
                    if (i === j)
                        continue;
                    const path2 = checkGeom[j];
                    if (path1.firstSegment.point.getDistance(path2.getNearestPoint(path1.firstSegment.point)) < 2)
                        startConnected = true;
                    if (path1.lastSegment.point.getDistance(path2.getNearestPoint(path1.lastSegment.point)) < 2)
                        endConnected = true;
                }
                if (!startConnected || !endConnected)
                    danglingLines++;
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
        if (danglingLines > 0)
            errors.push(`Detected ${danglingLines} dangling/unconnected lines.`);
        if (overlappingCount > 2)
            errors.push(`Warning: Detected high number of complex overlapping geometries.`);
        if (std === 'SANS') {
            const hasProjectionSymbol = paper.project.getItems({ data: { type: 'projection_symbol' } }).length > 0;
            if (!hasProjectionSymbol)
                errors.push("Missing Third Angle Projection Symbol (SANS 10111).");
            if (dimDeficit > 2)
                errors.push(`Insufficient dimensioning. Add ~${dimDeficit} more dimensions to fully define the part.`);
            if (!visibleLinesHaveThickWeight)
                errors.push("Visible outlines must use thick line weights (type A).");
            if (!hasTitleBlock)
                errors.push("Title block metadata missing.");
        }
        else {
            if (dimDeficit > 3)
                errors.push("Missing Dimensions.");
            if (incorrectColors)
                errors.push("ISO specifies strict monochrome or layer-designated plotting styles.");
        }
        if (errors.length > 0) {
            res.innerHTML = errors.map(e => `<span class="badge" style="background:#d32f2f; display:block; margin-bottom:4px;">${e}</span>`).join('');
        }
        else {
            res.innerHTML = `<span class="badge success">${std} Compliant</span>`;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5naW5lLXZhbGlkYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9lbmdpbmUtdmFsaWRhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssTUFBTSxzQkFBc0IsQ0FBQztBQUV6Qzs7R0FFRztBQUNILE1BQU0sT0FBTyxnQkFBZ0I7SUFDekIsWUFBWSxHQUFHO1FBQ1gsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7SUFDbkIsQ0FBQztJQUVELEdBQUc7UUFDQyxNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDMUQsSUFBSSxDQUFDLEdBQUc7WUFBRSxPQUFPO1FBRWpCLE1BQU0sR0FBRyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsaUJBQWlCLENBQUMsRUFBRSxLQUFLLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUM7UUFDMUYsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUM7UUFFcEcsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO1FBQ2hCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDO1FBQzFELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDO1FBRTNELElBQUksU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDO1lBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBRTdELElBQUksZUFBZSxHQUFHLENBQUMsQ0FBQztRQUN4QixJQUFJLDJC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