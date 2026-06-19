import paper from 'https://esm.sh/paper';

// Basic procedural noise map for texture generation locally without external dependencies
function pseudoNoise(x, y, t) {
    const scale = parseInt((Math.sin(x*12.9898 + y*78.233 + t*0.01) * 43758.5453) * 1000) % 255;
    return scale / 255;
}

export class MaterialNoiseSimulator {
    constructor(app) {
        this.app = app;
        this.isActive = false;
        this.canvasOverlay = null;
        this.ctx = null;
        this.animationFrame = null;
        this.time = 0;
        
        this.params = {
            gridSize: 20,
            noiseFreq: 0.1,
            noiseAmp: 2,
            speed: 0.5,
            lineWidth: 2,
            lineColor: '#ffaa00'
        };
    }

    initOverlay() {
        if (!this.canvasOverlay) {
            this.canvasOverlay = document.createElement('canvas');
            this.canvasOverlay.style.position = 'absolute';
            this.canvasOverlay.style.top = '0';
            this.canvasOverlay.style.left = '0';
            this.canvasOverlay.style.pointerEvents = 'none'; // Click through
            this.canvasOverlay.style.zIndex = '49'; // Below Flow Simulator
            this.canvasOverlay.style.opacity = '0.6';
            
            const container = document.getElementById('canvas-container');
            if (container) {
                container.appendChild(this.canvasOverlay);
                this.resize();
                window.addEventListener('resize', () => this.resize());
            }
        }
    }

    resize() {
        if (this.canvasOverlay) {
            const container = document.getElementById('canvas-container');
            if (container) {
                this.canvasOverlay.width = container.clientWidth;
                this.canvasOverlay.height = container.clientHeight;
                this.ctx = this.canvasOverlay.getContext('2d');
            }
        }
    }

    toggle() {
        this.isActive = !this.isActive;
        if (this.isActive) {
            this.initOverlay();
            this.canvasOverlay.style.display = 'block';
            this.app.ai.logAI("System", "Material Grain & Heatmap Simulation Activated.");
            this.runLoop();
        } else {
            this.canvasOverlay.style.display = 'none';
            cancelAnimationFrame(this.animationFrame);
            this.app.ai.logAI("System", "Material Simulation Deactivated.");
        }
    }

    runLoop() {
        if (!this.isActive) return;

        const w = this.canvasOverlay.width;
        const h = this.canvasOverlay.height;
        this.ctx.clearRect(0, 0, w, h);

        this.time += this.params.speed;

        const geometries = [];
        paper.project.layers['geometry_layer'].children.forEach(item => {
            if (item.className === 'Path' || item.className === 'CompoundPath' || item.data?.type === 'component') {
                geometries.push({
                    bounds: item.bounds,
                    isComponent: item.data?.type === 'component',
                    item: item
                });
            }
        });

        this.ctx.lineWidth = this.params.lineWidth;
        this.ctx.lineCap = 'round';

        // Instead of full screen grid, map the noisy grid ONLY over geometries to simulate surface properties/heat
        geometries.forEach(geo => {
            const vb = paper.project.view.projectToView(geo.bounds.topLeft);
            const size = paper.project.view.projectToView(geo.bounds.bottomRight).subtract(vb);
            
            if(size.width < 10 || size.height < 10) return;

            const gridScale = Math.max(10, size.width / this.params.gridSize);
            const cols = Math.ceil(size.width / gridScale);
            const rows = Math.ceil(size.height / gridScale);

            // Change color depending on if it's a structural element or electronic component
            let strokeColor = geo.isComponent ? 'rgba(255, 50, 0, 0.8)' : 'rgba(100, 255, 200, 0.5)';

            for (let x = 0; x < cols; x++) {
                for (let y = 0; y < rows; y++) {
                    const pos_x = vb.x + (x * gridScale);
                    const pos_y = vb.y + (y * gridScale);

                    // Skip points outside actual path if it's not a rectangular bounding box
                    if (!geo.isComponent && geo.item.className === 'Path') {
                        const projPt = paper.project.view.viewToProject(new paper.Point(pos_x, pos_y));
                        if (!geo.item.contains(projPt)) continue;
                    }

                    const n = pseudoNoise(pos_x * this.params.noiseFreq, pos_y * this.params.noiseFreq, this.time);
                    const angle = n * Math.PI; 
                    const length = gridScale * 0.8 * n;

                    this.ctx.strokeStyle = strokeColor;
                    this.ctx.save();
                    this.ctx.translate(pos_x, pos_y);
                    this.ctx.rotate(angle);
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(-length / 2, 0);
                    this.ctx.lineTo(length / 2, 0);
                    this.ctx.stroke();
                    this.ctx.restore();
                }
            }
        });

        this.animationFrame = requestAnimationFrame(() => this.runLoop());
    }
}
