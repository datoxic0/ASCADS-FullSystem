import React, { useState, useEffect, useRef } from 'react';
import { useEngigraphStore } from '../store/useEngigraphStore';
import { X, GripHorizontal } from 'lucide-react';

export const MicrocontrollerIDE: React.FC = () => {
    const { elements, selectedIds, updateElement } = useEngigraphStore();
    
    // Only show if exactly one element is selected and it's an MCU
    const activeElement = selectedIds.length === 1 ? elements.find(el => el.id === selectedIds[0]) : null;
    const isMcu = activeElement && ['arduino_uno', 'esp32', 'rpi_pico'].includes(activeElement.partType || '');

    const [code, setCode] = useState('');
    const [isVisible, setIsVisible] = useState(true);
    const [pos, setPos] = useState({ x: 300, y: 500 }); // Avoid toolbar
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (isMcu && activeElement) {
            setCode(activeElement.mcuCode || '// Write JS logic here\n// Access: inputs.D2, outputs.D5\n\nif (inputs.D2) {\n  outputs.D5 = true;\n}');
            setIsVisible(true);
        }
    }, [selectedIds, isMcu, activeElement]);

    const handlePointerDown = (e: React.PointerEvent) => {
        e.stopPropagation();
        setIsDragging(true);
        dragStart.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        e.stopPropagation();
        if (isDragging) {
            let newX = e.clientX - dragStart.current.x;
            let newY = e.clientY - dragStart.current.y;
            
            const maxX = window.innerWidth - 288;
            const maxY = window.innerHeight - 40;
            
            if (newX < 0) newX = 0;
            if (newX > maxX) newX = maxX;
            if (newY < 0) newY = 0;
            if (newY > maxY) newY = maxY;

            setPos({ x: newX, y: newY });
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        e.stopPropagation();
        setIsDragging(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    if (!isMcu || !activeElement || !isVisible) return null;

    return (
        <div 
            className="absolute z-[100] w-72 bg-[#1f1f23] border border-slate-700 rounded-lg shadow-2xl flex flex-col pointer-events-auto overflow-hidden"
            style={{ left: pos.x, top: pos.y }}
        >
            <div 
                className="flex justify-between items-center bg-[#0e0e11] px-3 py-2 border-b border-slate-700 cursor-move select-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                <div className="flex items-center gap-2">
                    <GripHorizontal size={14} className="text-slate-500" />
                    <div className="text-cyan-400 font-mono text-sm font-bold">MCU Firmware</div>
                    <div className="text-xs text-slate-400">({activeElement.partType})</div>
                </div>
                <button 
                    onClick={() => setIsVisible(false)} 
                    className="text-slate-500 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                >
                    <X size={14} />
                </button>
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
