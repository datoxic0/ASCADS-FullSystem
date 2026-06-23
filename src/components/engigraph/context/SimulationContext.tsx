import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

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

    const [cfdData, setCfdData] = useState(null);
    const [thermalData, setThermalData] = useState(null);
    const [acousticData, setAcousticData] = useState(null);

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

        return () => {
            cfdWorker.current?.terminate();
            thermalWorker.current?.terminate();
            acousticWorker.current?.terminate();
        };
    }, []);

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
