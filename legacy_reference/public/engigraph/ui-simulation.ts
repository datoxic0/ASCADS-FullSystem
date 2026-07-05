/**
 * Real-time Waveform Analysis and Oscilloscope UI
 */
export class SimulationUI {
    constructor(app) {
        this.app = app;
        this.canvas = document.getElementById('scope-canvas');
        this.ctx = this.canvas?.getContext('2d');
        this.isActive = false;
        this.animationFrame = null;
    }

    toggleScope(show = true) {
        const panel = document.getElementById('oscilloscope-panel');
        if (show) {
            panel.classList.remove('hidden');
            this.isActive = true;
            this.startLoop();
        } else {
            panel.classList.add('hidden');
            this.isActive = false;
            cancelAnimationFrame(this.animationFrame);
        }
    }

    startLoop() {
        const loop = () => {
            if (!this.isActive) return;
            this.draw();
            this.animationFrame = requestAnimationFrame(loop);
        };
        loop();
    }

    draw() {
        if (!this.ctx || !this.canvas) return;
        const w = this.canvas.width = this.canvas.offsetWidth;
        const h = this.canvas.height = this.canvas.offsetHeight;
        const ctx = this.ctx;

        ctx.clearRect(0, 0, w, h);

        // Draw Grid
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
        for (let y = 0; y < h; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

        // Draw Waveform for selected probe (defaulting to net 0 for now)
        const data = this.app.circuit.scopeData[0] || [];
        if (data.length < 2) return;

        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ff00';
        ctx.beginPath();

        const step = w / (data.length - 1);
        data.forEach((val, i) => {
            const x = i * step;
            const y = val === 1 ? h * 0.2 : h * 0.8;
            if (i === 0) ctx.moveTo(x, y);
            else {
                // Square wave logic: move horizontal then jump vertical
                const prevY = data[i-1] === 1 ? h * 0.2 : h * 0.8;
                ctx.lineTo(x, prevY);
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        ctx.shadowBlur = 0;

        (document.getElementById('scope-status') || {}).textContent = `Logic Analyzer: Net 0 | Frequency: ${this.app.circuit.isRunning ? 'Active' : 'Halted'}`;
    }
}