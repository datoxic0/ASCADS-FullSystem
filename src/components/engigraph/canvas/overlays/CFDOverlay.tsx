import React, { useEffect, useRef } from 'react';
import { useEngigraphStore } from '../../store/useEngigraphStore';

const PERLIN_YWRAPB = 4;
const PERLIN_YWRAP = 1 << PERLIN_YWRAPB;
const PERLIN_ZWRAPB = 8;
const PERLIN_ZWRAP = 1 << PERLIN_ZWRAPB;
const PERLIN_SIZE = 4095;
let perlin: number[] | null = null;

function scaled_cosine(i: number) {
    return 0.5 * (1.0 - Math.cos(i * Math.PI));
}

function noise2D(x: number, y: number) {
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
    let n1, n2;
    
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
    pos: { x: number, y: number };
    vel: { x: number, y: number };
    color: string;

    constructor(x: number, y: number) {
        this.pos = { x, y };
        this.vel = { x: 0, y: 0 };
        this.color = '#00aaff';
    }

    update(angle: number, speed: number, boundsRect: {x: number, y: number, width: number, height: number}, components: any[]) {
        const targetVelX = Math.cos(angle) * speed;
        const targetVelY = Math.sin(angle) * speed;
        
        let avoidX = 0;
        let avoidY = 0;
        let nearComponent = false;

        for (const comp of components) {
            if (comp.type !== 'component' && comp.type !== 'rect') continue;
            
            const cx = comp.x || 0;
            const cy = comp.y || 0;

            const dx = this.pos.x - cx;
            const dy = this.pos.y - cy;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < 40) {
                nearComponent = true;
                const repelStr = (40 - dist) / 10;
                avoidX += (dx / dist) * repelStr;
                avoidY += (dy / dist) * repelStr;
                this.color = `rgba(255, ${Math.max(0, 150 - (40-dist)*5)}, 0, 0.8)`;
            }
        }

        if (nearComponent) {
            const avoidLen = Math.sqrt(avoidX*avoidX + avoidY*avoidY);
            if (avoidLen > 0) {
                this.vel.x += (avoidX / avoidLen) * speed;
                this.vel.y += (avoidY / avoidLen) * speed;
            }
        } else {
            this.vel.x = targetVelX;
            this.vel.y = targetVelY;
            this.color = 'rgba(0, 150, 255, 0.4)';
        }

        const vlen = Math.sqrt(this.vel.x*this.vel.x + this.vel.y*this.vel.y);
        if (vlen > 0) {
            this.vel.x = (this.vel.x / vlen) * speed;
            this.vel.y = (this.vel.y / vlen) * speed;
        }

        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
        this.wrap(boundsRect);
    }

    wrap(bounds: {x: number, y: number, width: number, height: number}) {
        if (this.pos.x < bounds.x) this.pos.x = bounds.width;
        if (this.pos.x > bounds.width) this.pos.x = bounds.x;
        if (this.pos.y < bounds.y) this.pos.y = bounds.height;
        if (this.pos.y > bounds.height) this.pos.y = bounds.y;
    }

    draw(ctx: CanvasRenderingContext2D, extScale: number) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, 1.5 * extScale, 0, Math.PI * 2);
        ctx.fill();
    }
}

export const CFDOverlay: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const elements = useEngigraphStore(state => state.elements);
    const view = useEngigraphStore(state => state.view);
    
    // Store refs to avoid dependency loops in requestAnimationFrame
    const elementsRef = useRef(elements);
    const viewRef = useRef(view);

    useEffect(() => {
        elementsRef.current = elements;
    }, [elements]);

    useEffect(() => {
        viewRef.current = view;
    }, [view]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const agents: FlowAgent[] = [];
        for (let i = 0; i < 1500; i++) {
            agents.push(new FlowAgent(Math.random() * canvas.width, Math.random() * canvas.height));
        }

        const params = { speed: 2, noiseFreq: 0.003, noiseAmp: 1.5, trail: 0.85 };
        let animationFrameId: number;

        const renderLoop = () => {
            const w = canvas.width;
            const h = canvas.height;

            ctx.fillStyle = `rgba(15, 20, 25, ${1 - params.trail})`;
            ctx.fillRect(0, 0, w, h);

            const bounds = { x: 0, y: 0, width: w, height: h };
            
            // Map components to screen space for collision
            const currentView = viewRef.current;
            const mappedComponents = elementsRef.current.map(el => ({
                ...el,
                x: (el.x || 0) * currentView.zoom + currentView.x,
                y: (el.y || 0) * currentView.zoom + currentView.y
            }));

            agents.forEach(agent => {
                // Apply reverse transform to sample noise in world space
                const worldX = (agent.pos.x - currentView.x) / currentView.zoom;
                const worldY = (agent.pos.y - currentView.y) / currentView.zoom;
                
                const n = noise2D(worldX * params.noiseFreq, worldY * params.noiseFreq);
                const angle = n * Math.PI * 2 * params.noiseAmp;
                
                agent.update(angle, params.speed, bounds, mappedComponents);
                agent.draw(ctx, currentView.zoom);
            });

            animationFrameId = requestAnimationFrame(renderLoop);
        };

        renderLoop();

        const handleResize = () => {
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none z-50 opacity-90"
        />
    );
};
