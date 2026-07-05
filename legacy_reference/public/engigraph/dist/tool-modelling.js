import { GeometricOps } from './tool-modelling-geometric.js';
import { MeshOps } from './tool-modelling-mesh.js';
import { ParametricOps } from './tool-modelling-parametrics.js';
import { ManufacturingOps } from './tool-modelling-manufacturing.js';
/**
 * Facade for Advanced Modelling & Mesh Operations
 */
export class ModellingTools {
    constructor(app, manager) {
        this.app = app;
        this.manager = manager;
        this.lastOffsetDist = 10;
    }
    handleSculpt(pt, isStart, delta = null) {
        MeshOps.handleSculpt(this.app, pt, isStart, delta);
    }
    handleOffset(pt) {
        ParametricOps.handleOffset(this.app, this, pt);
    }
    handleMirror(pt) {
        ParametricOps.handleMirror(this.app, this.manager, pt);
    }
    handleSubdivide(pt) {
        MeshOps.handleSubdivide(this.app, pt);
    }
    handleBisect(pt) {
        GeometricOps.handleBisect(this.app, pt);
    }
    handleFillet(pt) {
        GeometricOps.handleFillet(this.app, pt);
    }
    handleTrim(pt) {
        GeometricOps.handleTrim(this.app, pt);
    }
    handleExtend(pt) {
        GeometricOps.handleExtend(this.app, pt);
    }
    handleArrayLinear(pt) {
        ParametricOps.handleArrayLinear(this.app, this.manager, pt);
    }
    handleGenerateEnclosure() {
        ManufacturingOps.handleGenerateEnclosure(this.app);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbC1tb2RlbGxpbmcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi90b29sLW1vZGVsbGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sK0JBQStCLENBQUM7QUFDN0QsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLDBCQUEwQixDQUFDO0FBQ25ELE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxpQ0FBaUMsQ0FBQztBQUNoRSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxtQ0FBbUMsQ0FBQztBQUVyRTs7R0FFRztBQUNILE1BQU0sT0FBTyxjQUFjO0lBQ3ZCLFlBQVksR0FBRyxFQUFFLE9BQU87UUFDcEIsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDZixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsY0FBYyxHQUFHLEVBQUUsQ0FBQztJQUM3QixDQUFDO0lBRUQsWUFBWSxDQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUUsS0FBSyxHQUFHLElBQUk7UUFDbEMsT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDdkQsQ0FBQztJQUVELFlBQVksQ0FBQyxFQUFFO1FBQ1gsYUFBYSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBRUQsWUFBWSxDQUFDLEVBQUU7UUFDWCxhQUFhLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRUQsZUFBZSxDQUFDLEVBQUU7UUFDZCxPQUFPLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVELFlBQVksQ0FBQyxFQUFFO1FBQ1gsWUFBWSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFFRCxZQUFZLENBQUMsRUFBRTtRQUNYLFlBQVksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBRUQsVUFBVSxDQUFDLEVBQUU7UUFDVCxZQUFZLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVELFlBQVksQ0FBQyxFQUFFO1FBQ1gsWUFBWSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFFRCxpQkFBaUIsQ0FBQyxFQUFFO1FBQ2hCLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDaEUsQ0FBQztJQUVELHVCQUF1QjtRQUNuQixnQkFBZ0IsQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDdkQsQ0FBQztDQUNKIn0=