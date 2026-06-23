// Acoustic Simulation Engine - Web Worker
export {};

// Ported from engine-simulation-acoustic.ts

let running = false;
let gridSize = 100;
let waveField: number[] = [];
let waveVelocity: number[] = [];
let sources: {x: number, y: number, frequency: number, phase: number}[] = [];
let time = 0;

self.onmessage = (e) => {
    const { type, payload } = e.data;

    switch (type) {
        case 'INIT':
            gridSize = payload.gridSize || 100;
            initFields();
            self.postMessage({ type: 'STATUS', message: 'Acoustic Engine Initialized' });
            break;
        case 'START':
            running = true;
            simulateLoop();
            break;
        case 'STOP':
            running = false;
            break;
        case 'ADD_SOURCE':
            sources.push({ x: payload.x, y: payload.y, frequency: payload.frequency || 1.0, phase: 0 });
            break;
    }
};

function initFields() {
    waveField = Array(gridSize * gridSize).fill(0);
    waveVelocity = Array(gridSize * gridSize).fill(0);
}

function simulateLoop() {
    if (!running) return;

    // Apply sources (Oscillators)
    for (const source of sources) {
        const index = Math.floor(source.x) + Math.floor(source.y) * gridSize;
        if (index >= 0 && index < waveField.length) {
            waveField[index] = Math.sin(source.phase) * 10;
            source.phase += source.frequency;
        }
    }

    // 2D Wave Equation Simulation
    const c = 0.5; // Wave speed
    const dt = 1;
    const dx = 1;

    const nextVelocity = [...waveVelocity];
    const nextField = [...waveField];

    for (let y = 1; y < gridSize - 1; y++) {
        for (let x = 1; x < gridSize - 1; x++) {
            const i = x + y * gridSize;
            
            const center = waveField[i];
            const top = waveField[i - gridSize];
            const bottom = waveField[i + gridSize];
            const left = waveField[i - 1];
            const right = waveField[i + 1];

            const laplacian = top + bottom + left + right - 4 * center;
            
            // F = m * a  =>  dv/dt = c^2 * laplacian
            const acceleration = (c * c) * (laplacian / (dx * dx));
            
            nextVelocity[i] += acceleration * dt;
            nextVelocity[i] *= 0.99; // Damping
            
            nextField[i] += nextVelocity[i] * dt;
        }
    }

    waveVelocity = nextVelocity;
    waveField = nextField;
    time += dt;

    self.postMessage({
        type: 'RENDER',
        payload: {
            pressure: [...waveField]
        }
    });

    setTimeout(simulateLoop, 16); // ~60 FPS
}
