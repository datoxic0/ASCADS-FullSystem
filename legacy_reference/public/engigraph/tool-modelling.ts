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