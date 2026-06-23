// Thermal / Noise Simulation Engine - Web Worker
export {};

// Ported from engine-simulation-noise.ts

let running = false;
let gridSize = 100;
let temperatureField: number[] = [];
let heatSources: {x: number, y: number, temp: number}[] = [];

self.onmessage = (e) => {
    const { type, payload } = e.data;

    switch (type) {
        case 'INIT':
            gridSize = payload.gridSize || 100;
            initFields();
            self.postMessage({ type: 'STATUS', message: 'Thermal Engine Initialized' });
            break;
        case 'START':
            running = true;
            simulateLoop();
            break;
        case 'STOP':
            running = false;
            break;
        case 'ADD_SOURCE':
            heatSources.push({ x: payload.x, y: payload.y, temp: payload.temp });
            break;
        case 'CLEAR_SOURCES':
            heatSources = [];
            break;
    }
};

function initFields() {
    temperatureField = Array(gridSize * gridSize).fill(20); // Base temp 20C
}

function simulateLoop() {
    if (!running) return;

    // Apply heat sources
    for (const source of heatSources) {
        const index = Math.floor(source.x) + Math.floor(source.y) * gridSize;
        if (index >= 0 && index < temperatureField.length) {
            temperatureField[index] = source.temp;
        }
    }

    // Basic thermal diffusion (Laplacian convolution)
    const nextField = [...temperatureField];
    const alpha = 0.1; // Diffusion rate

    for (let y = 1; y < gridSize - 1; y++) {
        for (let x = 1; x < gridSize - 1; x++) {
            const i = x + y * gridSize;
            
            const center = temperatureField[i];
            const top = temperatureField[i - gridSize];
            const bottom = temperatureField[i + gridSize];
            const left = temperatureField[i - 1];
            const right = temperatureField[i + 1];

            const laplacian = top + bottom + left + right - 4 * center;
            
            // Cool down slightly towards ambient (20C)
            const cooling = (20 - center) * 0.01;

            nextField[i] = center + (alpha * laplacian) + cooling;
        }
    }

    temperatureField = nextField;

    self.postMessage({
        type: 'RENDER',
        payload: {
            temperature: [...temperatureField]
        }
    });

    setTimeout(simulateLoop, 33); // ~30 FPS for thermal (slower propagation)
}
