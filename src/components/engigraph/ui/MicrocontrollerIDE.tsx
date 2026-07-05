import React, { useState, useEffect } from 'react';
import { useEngigraphStore } from '../store/useEngigraphStore';

export const MicrocontrollerIDE: React.FC = () => {
    const { elements, selectedIds, updateElement } = useEngigraphStore();
    
    // Only show if exactly one element is selected and it's an MCU
    const activeElement = selectedIds.length === 1 ? elements.find(el => el.id === selectedIds[0]) : null;
    const isMcu = activeElement && ['arduino_uno', 'esp32', 'rpi_pico'].includes(activeElement.partType || '');

    const [code, setCode] = useState('');

    useEffect(() => {
        if (isMcu && activeElement) {
            setCode(activeElement.mcuCode || '// Write JS logic here\n// Access: inputs.D2, outputs.D5\n\nif (inputs.D2) {\n  outputs.D5 = true;\n}');
        }
    }, [selectedIds, isMcu]);

    if (!isMcu || !activeElement) return null;

    return (
        <div className="absolute bottom-10 right-10 w-72 bg-[#1f1f23] border border-slate-700 rounded-lg shadow-2xl flex flex-col pointer-events-auto overflow-hidden">
            <div className="flex justify-between items-center bg-[#0e0e11] px-3 py-2 border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <div className="text-cyan-400 font-mono text-sm font-bold">MCU Firmware</div>
                    <div className="text-xs text-slate-400">({activeElement.partType})</div>
                </div>
            </div>
            
            <div className="p-4 flex flex-col gap-3">
                <span className="text-xs text-slate-400 text-center">
                    Launch the VS Code Integrated Development Environment to write and flash C/C++ firmware to this microcontroller.
                </span>
                <button 
                    onClick={() => useEngigraphStore.getState().openIde(activeElement.id)}
                    className="w-full bg-cyan-700 hover:bg-cyan-600 text-white text-xs py-2 rounded transition-colors font-semibold shadow"
                >
                    Open VS Code IDE
                </button>
            </div>
        </div>
    );
};
