import paper from 'https://esm.sh/paper';

export class AcousticSimulator {
    constructor(app) {
        this.app = app;
        this.isActive = false;
        this.canvasOverlay = null;
        this.ctx = null;
        this.animationFrame = null;
        
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.source = null;
        this.microphoneInitialized = false;

        this.params = {
            barCount: 128,
            smoothing: 0.85,
            sensitivity: 1.5,
            colorMode: 'heat'
        };
    }

    initOverlay() {
        if (!this.canvasOverlay) {
            this.canvasOverlay = document.createElement('canvas');
            this.canvasOverlay.style.position = 'absolute';
            this.canvasOverlay.style.top = '0';
            this.canvasOverlay.style.left = '0';
            this.canvasOverlay.style.pointerEvents = 'none'; // Click through
            this.canvasOverlay.style.zIndex = '51';
            this.canvasOverlay.style.opacity = '0.7';
            
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

    async initMicrophone() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.source = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.source.connect(this.analyser);

            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            this.microphoneInitialized = true;
            this.app.ai.logAI("System", "Microphone linked. Vibration Analysis Active.");
        } catch (err) {
            console.error('Error accessing microphone:', err);
            this.app.ai.logAI("System", "Failed to access microphone for vibration analysis.");
            this.microphoneInitialized = false;
        }
    }

    toggle() {
        this.isActive = !this.isActive;
        if (this.isActive) {
            this.initOverlay();
            this.canvasOverlay.style.display = 'block';
            if (!this.microphoneInitialized) {
                this.initMicrophone();
            }
            this.runLoop();
        } else {
            this.canvasOverlay.style.display = 'none';
            cancelAnimationFrame(this.animationFrame);
            this.app.ai.logAI("System", "Acoustic Simulation Deactivated.");
        }
    }

    runLoop() {
        if (!this.isActive) return;

        const w = this.canvasOverlay.width;
        const h = this.canvasOverlay.height;

        this.ctx.clearRect(0, 0, w, h);

        if (!this.microphoneInitialized) {
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            this.ctx.font = '20px sans-serif';
            this.ctx.fillText('Initializing Acoustic Sensor...', 20, 40);
        } else {
            this.analyser.smoothingTimeConstant = this.params.smoothing;
            this.analyser.getByteFrequencyData(this.dataArray);

            const barCount = Math.min(this.params.barCount, this.analyser.frequencyBinCount);
            
            // Map the acoustic visualization around the Mechatronic Components (e.g. motors)
            const motors = [];
            paper.project.layers['geometry_layer'].children.forEach(item => {
                if (item.data && (item.data.partType === 'nema17' || item.data.partType === 'dc_motor_generic' || item.data.partType === 'servo_sg90')) {
                    motors.push(item);
                }
            });

            if (motors.length > 0) {
                // Radial visualization representing motor vibration
                motors.forEach(motor => {
                    const viewPos = paper.project.view.projectToView(motor.position);
                    const radius = (motor.bounds.width * paper.project.view.zoom) / 2 + 10;
                    
                    const slice = (Math.PI * 2) / barCount;
                    for (let i = 0; i < barCount; i++) {
                        const angle = slice * i;
                        const value = this.dataArray[i];
                        const barHeight = (value / 255) * h * 0.15 * this.params.sensitivity;
                        const barWidth = (Math.PI * 2 * radius) / barCount * 0.8;

                        this.ctx.fillStyle = `rgb(255, ${255 - value}, 0)`; // Heat map colors

                        this.ctx.save();
                        this.ctx.translate(viewPos.x, viewPos.y);
                        this.ctx.rotate(angle);
                        this.ctx.fillRect(radius, -barWidth/2, barHeight, barWidth);
                        this.ctx.restore();
                    }
                });
            } else {
                // Linear fallback at bottom if no motors
                const barWidth = w / barCount;
                for (let i = 0; i < barCount; i++) {
                    const value = this.dataArray[i];
                    const barHeight = (value / 255) * h * 0.3 * this.params.sensitivity;
                    const x = i * barWidth;
                    const y = h - barHeight;
                    
                    this.ctx.fillStyle = `rgba(0, 255, 100, ${value/255})`;
                    this.ctx.fillRect(x, y, barWidth - 1, barHeight);
                }
            }
        }

        this.animationFrame = requestAnimationFrame(() => this.runLoop());
    }
}
