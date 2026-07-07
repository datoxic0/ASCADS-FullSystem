import React, { useEffect, useRef } from 'react';
import { EngigraphRibbon } from './ui/EngigraphRibbon';
import { Engigraph3D } from './canvas/Engigraph3D';
import { EngigraphIDE } from './ui/EngigraphIDE';
import { DatasheetImporter } from './ui/DatasheetImporter';
import { OscilloscopePanel } from './ui/OscilloscopePanel';
import { EngigraphSidebar } from './ui/EngigraphSidebar';
import { EngigraphRightSidebar } from './ui/EngigraphRightSidebar';
import { EngigraphCanvas } from './canvas/EngigraphCanvas';
import { EngigraphFooter } from './ui/EngigraphFooter';
import { EcosystemAdapter } from './solvers/EcosystemAdapter';
import { useEngigraphStore } from './store/useEngigraphStore';

import { FloatingPropertiesPanel } from './ui/FloatingPropertiesPanel';
import { MicrocontrollerIDE } from './ui/MicrocontrollerIDE';
import { VirtualConsole } from './ui/VirtualConsole';
import { Oscilloscope } from './ui/Oscilloscope';
import { DigitizeModal } from './ui/DigitizeModal';
import { AIAssistantPanel } from './ui/AIAssistantPanel';
import { HybridOpsPanel } from './ui/HybridOpsPanel';

export const Engigraph2D: React.FC = () => {
    const { isTerminalOpen, isScopeOpen, toggleTerminal, toggleScope, elements, setElements, isSimulationRunning } = useEngigraphStore();

    useEffect(() => {
        // Run Universal Ecosystem Simulation at 10Hz
        const timer = setInterval(() => {
            const state = useEngigraphStore.getState();
            if (!state.isSimulationRunning) return;
            const currentElements = state.elements;
            if (currentElements.length === 0) return;

            const newElements = EcosystemAdapter.tick(currentElements);
            if (newElements !== currentElements) {
                state.setElements(newElements);
            }
        }, 100);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col w-full h-full bg-[#0a0b0c] text-slate-200 overflow-hidden font-sans">
            <EngigraphRibbon />
            
            {/* The 3D Overlay View */}
            <Engigraph3D />

            <main className="flex-1 flex overflow-hidden relative">
                <EngigraphSidebar />
                
                <div className="flex-1 relative flex flex-col">
                    {/* Top Overlay tools (like snapping/zoom readouts) could go here */}
                    
                    <EngigraphCanvas />
                    <EngigraphIDE />
                    
                    {/* Context/Property Overlays */}
                    <FloatingPropertiesPanel />
                    <MicrocontrollerIDE />
                    <DigitizeModal />
                    <DatasheetImporter />
                    <OscilloscopePanel />
                    <AIAssistantPanel />
                    <HybridOpsPanel />
                    
                    {/* Engineering Instruments */}
                    {isTerminalOpen && <VirtualConsole />}
                    {isScopeOpen && <Oscilloscope />}
                </div>

                <EngigraphRightSidebar />
            </main>

            <EngigraphFooter />
        </div>
    );
};

