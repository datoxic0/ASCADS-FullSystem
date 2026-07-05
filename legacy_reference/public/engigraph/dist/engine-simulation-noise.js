import paper from 'https://esm.sh/paper';
// Basic procedural noise map for texture generation locally without external dependencies
function pseudoNoise(x, y, t) {
    const scale = parseInt((Math.sin(x * 12.9898 + y * 78.233 + t * 0.01) * 43758.5453) * 1000) % 255;
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
        }
        else {
            this.canvasOverlay.style.display = 'none';
            cancelAnimationFrame(this.animationFrame);
            this.app.ai.logAI("System", "Material Simulation Deactivated.");
        }
    }
    runLoop() {
        if (!this.isActive)
            return;
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
            if (size.width < 10 || size.height < 10)
                return;
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
                        if (!geo.item.contains(projPt))
                            continue;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5naW5lLXNpbXVsYXRpb24tbm9pc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9lbmdpbmUtc2ltdWxhdGlvbi1ub2lzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssTUFBTSxzQkFBc0IsQ0FBQztBQUV6QywwRkFBMEY7QUFDMUYsU0FBUyxXQUFXLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO0lBQ3hCLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFDLE9BQU8sR0FBRyxDQUFDLEdBQUMsTUFBTSxHQUFHLENBQUMsR0FBQyxJQUFJLENBQUMsR0FBRyxVQUFVLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUM7SUFDNUYsT0FBTyxLQUFLLEdBQUcsR0FBRyxDQUFDO0FBQ3ZCLENBQUM7QUFFRCxNQUFNLE9BQU8sc0JBQXNCO0lBQy9CLFlBQVksR0FBRztRQUNYLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2YsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7UUFDdEIsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7UUFDMUIsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7UUFDaEIsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7UUFDM0IsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7UUFFZCxJQUFJLENBQUMsTUFBTSxHQUFHO1lBQ1YsUUFBUSxFQUFFLEVBQUU7WUFDWixTQUFTLEVBQUUsR0FBRztZQUNkLFFBQVEsRUFBRSxDQUFDO1lBQ1gsS0FBSyxFQUFFLEdBQUc7WUFDVixTQUFTLEVBQUUsQ0FBQztZQUNaLFNBQVMsRUFBRSxTQUFTO1NBQ3ZCLENBQUM7SUFDTixDQUFDO0lBRUQsV0FBVztRQUNQLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDdEIs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