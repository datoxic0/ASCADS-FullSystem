import paper from 'https://esm.sh/paper';
// Using a basic embedded pseudo-random/noise generator for standalone integrity,
// avoiding external dependencies like canvas-sketch-util if not universally available in this app.

// Simple fallback 2D Perlin Noise implementation for the flow field
const PERLIN_YWRAPB = 4;
const PERLIN_YWRAP = 1 << PERLIN_YWRAPB;
const PERLIN_ZWRAPB = 8;
const PERLIN_ZWRAP = 1 << PERLIN_ZWRAPB;
const PERLIN_SIZE = 4095;
let perlin;

function scaled_cosine(i) {
    return 0.5 * (1.0 - Math.cos(i * Math.PI));
}

function noise2D(x, y) {
    if (perlin == null) {
        perlin = new Array(PERLIN_SIZE + 1);
        for (let i = 0; i < PERLIN_SIZE + 1; i++) {
            perlin[i] = Math.random();
        }
    }
    x = Math.abs(x);
    y = Math.abs(y);
    let xi = Math.floor(x);
    let yi = Math.floor(y);
    let xf = x - xi;
    let yf = y - yi;
    let rxf, ryf;
    let r = 0;
    let ampl = 0.5;
    let n1, n2, n3;
    
    // Hardcoded 4 octaves for fluidity
    for (let o = 0; o < 4; o++) {
        let of = xi + (yi << PERLIN_YWRAPB);
        rxf = scaled_cosine(xf);
        ryf = scaled_cosine(yf);
        n1 = perlin[of & PERLIN_SIZE];
        n1 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n1);
        n2 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
        n2 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n2);
        n1 += ryf * (n2 - n1);
        
        r += n1 * ampl;
        ampl *= 0.5;
        xi <<= 1;
        xf *= 2;
        yi <<= 1;
        yf *= 2;
        if (xf >= 1.0) { xi++; xf--; }
        if (yf >= 1.0) { yi++; yf--; }
    }
    return r;
}

class FlowAgent {
    constructor(x, y) {
        this.pos = new paper.Point(x, y);
        this.vel = new paper.Point(0, 0);
        this.color = '#00aaff';
    }

    update(angle, speed, boundsRect, hitItems) {
        const targetVel = new paper.Point({ angle: angle * (180 / Math.PI), length: speed });
        
        // Fluid obstacle avoidance - check if agent is near a drawn geometry
        let avoidance = new paper.Point(0, 0);
        hitItems.forEach(item => {
            if(item.className === 'Path' && !item.guide) {
                const nearest = item.getNearestPoint(this.pos);
                if (nearest) {
                    const d = nearest.getDistance(this.pos);
                    if (d < 30) {
                        // Repel from geometry to simulate fluid boundary layer
                        const repel = this.pos.subtract(nearest).normalize().multiply((30 - d) / 10);
                        avoidance = avoidance.add(repel);
                        // Shift color to red/orange for high pressure/turbulence
                        this.color = `rgba(255, ${Math.max(0, 150 - (30-d)*5)}, 0, 0.8)`;
                    }
                }
            }
        });

        if (avoidance.length > 0) {
            this.vel = this.vel.add(avoidance).normalize().multiply(speed);
        } else {
            this.vel = targetVel;
            this.color = 'rgba(0, 150, 255, 0.4)'; // Smooth blue flow
        }

        this.pos = this.pos.add(this.vel);
        this.wrap(boundsRect);
    }

    wrap(bounds) {
        if (this.pos.x < bounds.x) this.pos.x = bounds.width;
        if (this.pos.x > bounds.width) this.pos.x = bounds.x;
        if (this.pos.y < bounds.y) this.pos.y = bounds.height;
        if (this.pos.y > bounds.height) this.pos.y = bounds.y;
    }

    draw(ctx, extScale) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, 1.5 * extScale, 0, Math.PI * 2);
        ctx.fill();
    }
}

export class FluidFlowSimulator {
    constructor(app) {
        this.app = app;
        this.isActive = false;
        this.canvasOverlay = null;
        this.ctx = null;
        this.agents = [];
        this.animationFrame = null;
        
        this.params = {
            agents: 1500,
            speed: 2,
            noiseFreq: 0.003,
            noiseAmp: 1.5,
            trail: 0.85
        };
    }

    initOverlay() {
        if (!this.canvasOverlay) {
            this.canvasOverlay = document.createElement('canvas');
            this.canvasOverlay.style.position = 'absolute';
            this.canvasOverlay.style.top = '0';
            this.canvasOverlay.style.left = '0';
            this.canvasOverlay.style.pointerEvents = 'none'; // Click through
            this.canvasOverlay.style.zIndex = '50';
            this.canvasOverlay.style.opacity = '0.9';
            
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
            this.app.ai.logAI("System", "CFD / Fluid Flow Simulation Activated.");
            
            // Generate agents spread across current view
            this.agents = [];
            const w = this.canvasOverlay.width;
            const h = this.canvasOverlay.height;
            for (let i = 0; i < this.params.agents; i++) {
                this.agents.push(new FlowAgent(Math.random() * w, Math.random() * h));
            }
            
            this.runLoop();
        } else {
            this.canvasOverlay.style.display = 'none';
            cancelAnimationFrame(this.animationFrame);
            this.app.ai.logAI("System", "CFD Simulation Deactivated.");
        }
    }

    runLoop() {
        if (!this.isActive) return;

        const w = this.canvasOverlay.width;
        const h = this.canvasOverlay.height;

        // Trail effect
        this.ctx.fillStyle = `rgba(15, 20, 25, ${1 - this.params.trail})`;
        this.ctx.fillRect(0, 0, w, h);

        const bounds = { x: 0, y: 0, width: w, height: h };
        
        // Optimizing geometry lookups: find major paths
        const geometries = [];
        paper.project.layers['geometry_layer'].children.forEach(item => {
            if (item.className === 'Path' || item.className === 'CompoundPath') {
                geometries.push(item);
            }
        });

        // View transformation mapping
        const view = paper.project.view;
        
        this.agents.forEach(agent => {
            // Convert pixel position to view coordinates for noise sampling
            const pt = view.viewToProject(agent.pos);
            const n = noise2D(pt.x * this.params.noiseFreq, pt.y * this.params.noiseFreq);
            const angle = n * Math.PI * 2 * this.params.noiseAmp;

            // Map agent view coords to project coords for boundary collision
            const projPos = view.viewToProject(agent.pos);
            const dummyAgent = { pos: projPos, vel: agent.vel }; // Mock wrapper
            
            agent.update(angle, this.params.speed, bounds, geometries);
            agent.draw(this.ctx, 1.0);
        });

        this.animationFrame = requestAnimationFrame(() => this.runLoop());
    }
}
