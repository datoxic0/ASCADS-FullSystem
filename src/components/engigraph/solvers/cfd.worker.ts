// CFD Simulation Engine - Web Worker
export {};

// Ported from engine-simulation-flow.ts

let running = false;
let gridSize = 100;
let resolution = 10;
let velocityField: any[] = [];
let densityField: any[] = [];

self.onmessage = (e) => {
    const { type, payload } = e.data;

    switch (type) {
        case 'INIT':
            gridSize = payload.gridSize || 100;
            resolution = payload.resolution || 10;
            initFields();
            self.postMessage({ type: 'STATUS', message: 'CFD Engine Initialized' });
            break;
        case 'START':
            running = true;
            simulateLoop();
            break;
        case 'STOP':
            running = false;
            break;
        case 'ADD_DENSITY':
            addDensity(payload.x, payload.y, payload.amount);
            break;
        case 'ADD_VELOCITY':
            addVelocity(payload.x, payload.y, payload.amountX, payload.amountY);
            break;
    }
};

function initFields() {
    velocityField = Array(gridSize * gridSize).fill({ x: 0, y: 0 });
    densityField = Array(gridSize * gridSize).fill(0);
}

function simulateLoop() {
    if (!running) return;

    // Simplified Navier-Stokes steps for fluid dynamics simulation
    // Diffuse -> Advect -> Project
    // In a real implementation, we'd run the full solvers here.
    
    // Simulate some basic density decay for visualization
    for (let i = 0; i < densityField.length; i++) {
        if (densityField[i] > 0) {
            densityField[i] *= 0.99; // Decay
        }
    }

    // Post results back to the main thread for rendering
    self.postMessage({
        type: 'RENDER',
        payload: {
            density: [...densityField],
            velocity: [...velocityField]
        }
    });

    setTimeout(simulateLoop, 16); // ~60 FPS
}

function addDensity(x: number, y: number, amount: number) {
    const index = Math.floor(x) + Math.floor(y) * gridSize;
    if (index >= 0 && index < densityField.length) {
        densityField[index] += amount;
    }
}

function addVelocity(x: number, y: number, amountX: number, amountY: number) {
    const index = Math.floor(x) + Math.floor(y) * gridSize;
    if (index >= 0 && index < velocityField.length) {
        velocityField[index] = { 
            x: velocityField[index].x + amountX, 
            y: velocityField[index].y + amountY 
        };
    }
}
