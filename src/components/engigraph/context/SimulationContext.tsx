import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useEngigraphStore, DrawingObject } from '../store/useEngigraphStore';

interface SimulationContextType {
    startCFD: () => void;
    stopCFD: () => void;
    addCFDDensity: (x: number, y: number, amount: number) => void;
    
    startThermal: () => void;
    stopThermal: () => void;
    addHeatSource: (x: number, y: number, temp: number) => void;
    
    startAcoustic: () => void;
    stopAcoustic: () => void;
    addAcousticSource: (x: number, y: number, frequency: number) => void;

    runLogicSimulation: () => void;
    isLogicRunning: boolean;
    toggleLogicSimulation: () => void;

    cfdData: any;
    thermalData: any;
    acousticData: any;
}

const SimulationContext = createContext<SimulationContextType | null>(null);

export const useSimulation = () => {
    const ctx = useContext(SimulationContext);
    if (!ctx) throw new Error("useSimulation must be used within SimulationProvider");
    return ctx;
};

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const cfdWorker = useRef<Worker | null>(null);
    const thermalWorker = useRef<Worker | null>(null);
    const acousticWorker = useRef<Worker | null>(null);
    const logicWorker = useRef<Worker | null>(null);

    const [cfdData, setCfdData] = useState(null);
    const [thermalData, setThermalData] = useState(null);
    const [acousticData, setAcousticData] = useState(null);
    const [isLogicRunning, setIsLogicRunning] = useState(false);

    // Get the store directly to avoid stale closures in intervals
    const store = useEngigraphStore();

    useEffect(() => {
        // Initialize workers
        cfdWorker.current = new Worker(new URL('../solvers/cfd.worker.ts', import.meta.url), { type: 'module' });
        cfdWorker.current.onmessage = (e) => {
            if (e.data.type === 'RENDER') setCfdData(e.data.payload);
        };
        cfdWorker.current.postMessage({ type: 'INIT', payload: { gridSize: 100 } });

        thermalWorker.current = new Worker(new URL('../solvers/thermal.worker.ts', import.meta.url), { type: 'module' });
        thermalWorker.current.onmessage = (e) => {
            if (e.data.type === 'RENDER') setThermalData(e.data.payload);
        };
        thermalWorker.current.postMessage({ type: 'INIT', payload: { gridSize: 100 } });

        acousticWorker.current = new Worker(new URL('../solvers/acoustic.worker.ts', import.meta.url), { type: 'module' });
        acousticWorker.current.onmessage = (e) => {
            if (e.data.type === 'RENDER') setAcousticData(e.data.payload);
        };
        acousticWorker.current.postMessage({ type: 'INIT', payload: { gridSize: 100 } });

        logicWorker.current = new Worker(new URL('../solvers/logic.worker.ts', import.meta.url), { type: 'module' });
        logicWorker.current.onmessage = (e) => {
            if (e.data.type === 'LOGIC_RESULT') {
                useEngigraphStore.getState().setElements(e.data.elements);
            }
        };

        return () => {
            cfdWorker.current?.terminate();
            thermalWorker.current?.terminate();
            acousticWorker.current?.terminate();
            logicWorker.current?.terminate();
        };
    }, []);

    const runLogicSimulation = () => {
        const elements = useEngigraphStore.getState().elements;
        logicWorker.current?.postMessage({ type: 'SIMULATE', elements });
    };

    useEffect(() => {
        let interval: any;
        if (isLogicRunning) {
            interval = setInterval(() => {
                runLogicSimulation();
            }, 100); // 10Hz logic tick
        }
        return () => clearInterval(interval);
    }, [isLogicRunning]);

    const value: SimulationContextType = {
        startCFD: () => cfdWorker.current?.postMessage({ type: 'START' }),
        stopCFD: () => cfdWorker.current?.postMessage({ type: 'STOP' }),
        addCFDDensity: (x, y, amount) => cfdWorker.current?.postMessage({ type: 'ADD_DENSITY', payload: { x, y, amount } }),

        startThermal: () => thermalWorker.current?.postMessage({ type: 'START' }),
        stopThermal: () => thermalWorker.current?.postMessage({ type: 'STOP' }),
        addHeatSource: (x, y, temp) => thermalWorker.current?.postMessage({ type: 'ADD_SOURCE', payload: { x, y, temp } }),

        startAcoustic: () => acousticWorker.current?.postMessage({ type: 'START' }),
        stopAcoustic: () => acousticWorker.current?.postMessage({ type: 'STOP' }),
        addAcousticSource: (x, y, frequency) => acousticWorker.current?.postMessage({ type: 'ADD_SOURCE', payload: { x, y, frequency } }),

        runLogicSimulation,
        isLogicRunning,
        toggleLogicSimulation: () => setIsLogicRunning(!isLogicRunning),

        cfdData,
        thermalData,
        acousticData
    };

    return (
        <SimulationContext.Provider value={value}>
            {children}
        </SimulationContext.Provider>
    );
};

