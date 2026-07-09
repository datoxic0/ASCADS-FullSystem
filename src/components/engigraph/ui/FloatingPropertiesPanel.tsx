import React, { useState, useRef, useEffect } from 'react';
import { useEngigraphStore, DrawingObject } from '../store/useEngigraphStore';
import { X, GripHorizontal } from 'lucide-react';

export const FloatingPropertiesPanel: React.FC = () => {
    const { elements, selectedIds, updateElement, probeData, openIde } = useEngigraphStore();
    
    const [pos, setPos] = useState({ x: 300, y: 150 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const [isVisible, setIsVisible] = useState(true);

    const selectedElement = selectedIds.length === 1 ? elements.find(el => el.id === selectedIds[0]) : null;

    useEffect(() => {
        if (selectedIds.length > 0) setIsVisible(true);
    }, [selectedIds]);

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
            
            const maxX = window.innerWidth - 256;
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

    if (!isVisible || !selectedElement) return null;

    const handleChange = (updates: Partial<DrawingObject>) => {
        updateElement(selectedElement.id, updates);
    };

    return (
        <div 
            className="absolute z-[100] w-64 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 shadow-2xl rounded-lg overflow-hidden flex flex-col"
            style={{ left: pos.x, top: pos.y }}
        >
            <div 
                className="bg-slate-950/80 border-b border-slate-700/50 p-2.5 flex items-center justify-between cursor-move select-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                <div className="flex items-center gap-2 text-slate-300">
                    <GripHorizontal size={14} className="text-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Properties</span>
                </div>
                <button onClick={() => setIsVisible(false)} className="text-slate-500 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors">
                    <X size={14} />
                </button>
            </div>

            <div className="p-4 flex flex-col gap-4 text-sm">
                <div className="flex justify-between border-b border-slate-700/50 pb-2">
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Type</span>
                    <span className="text-slate-300 font-medium capitalize text-[11px]">{selectedElement.type} {selectedElement.partType ? `- ${selectedElement.partType}` : ''}</span>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Color</label>
                    <input 
                        type="color" 
                        value={selectedElement.stroke || '#ffffff'} 
                        onChange={e => handleChange({ stroke: e.target.value })}
                        className="w-full h-8 bg-slate-900 border border-slate-700/50 rounded cursor-pointer p-0"
                    />
                </div>

                {(selectedElement.type === 'line' || selectedElement.type === 'wire' || selectedElement.type === 'rect' || selectedElement.type === 'circle' || selectedElement.type === 'dimension') && (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Stroke Width</label>
                        <input 
                            type="number" 
                            min="0.5" step="0.5"
                            value={selectedElement.strokeWidth || 1} 
                            onChange={e => handleChange({ strokeWidth: parseFloat(e.target.value) })}
                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded px-2 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                    </div>
                )}

                {selectedElement.type === 'text' && (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Text Content</label>
                        <input 
                            type="text" 
                            value={selectedElement.text || ''} 
                            onChange={e => handleChange({ text: e.target.value })}
                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded px-2 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                    </div>
                )}

                {selectedElement.type === 'component' && (
                    <div className="space-y-4">
                        {selectedElement.partType === 'resistor' && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Resistance (Ω)</label>
                                <input 
                                    type="number" 
                                    value={selectedElement.resistance || 1000} 
                                    onChange={e => handleChange({ resistance: parseFloat(e.target.value) })}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded px-2 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                                />
                            </div>
                        )}
                        {selectedElement.partType === 'battery_18650' && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Voltage (V)</label>
                                <input 
                                    type="number" 
                                    value={selectedElement.voltage || 3.7} 
                                    onChange={e => handleChange({ voltage: parseFloat(e.target.value) })}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded px-2 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                                />
                            </div>
                        )}
                        {(selectedElement.partType === 'dc_motor_generic' || selectedElement.partType === 'nema17') && (
                            <>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Speed (RPM)</label>
                                    <input 
                                        type="number" 
                                        value={selectedElement.speed || 5} 
                                        onChange={e => handleChange({ speed: parseFloat(e.target.value) })}
                                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded px-2 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Max Current (mA)</label>
                                    <input 
                                        type="number" 
                                        value={selectedElement.powerDrawMA || 500} 
                                        onChange={e => handleChange({ powerDrawMA: parseFloat(e.target.value) })}
                                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded px-2 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                                    />
                                </div>
                            </>
                        )}
                        {selectedElement.partType === 'switch_spst' && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Switch State</label>
                                <select 
                                    value={selectedElement.state || 'open'} 
                                    onChange={e => handleChange({ state: e.target.value })}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded px-2 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                                >
                                    <option value="open">Open (OFF)</option>
                                    <option value="closed">Closed (ON)</option>
                                </select>
                            </div>
                        )}
                    </div>
                )}

                {selectedElement.type === 'component' && (
                    <div className="mt-2 pt-2 border-t border-slate-700/50 flex flex-col gap-1">
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1">Live Simulation</span>
                        <div className="flex justify-between">
                            <span className="text-slate-400 text-[10px]">Power State:</span>
                            <span className={`text-[10px] font-bold ${selectedElement.isPowered ? 'text-amber-400' : 'text-slate-500'}`}>
                                {selectedElement.isPowered ? 'ACTIVE' : 'IDLE'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400 text-[10px]">Probe Voltage:</span>
                            <span className="text-[10px] font-bold text-cyan-400">
                                {probeData[selectedElement.id] ? probeData[selectedElement.id][probeData[selectedElement.id].length - 1].toFixed(2) : '0.00'} V
                            </span>
                        </div>
                        {selectedElement.partType !== 'battery_18650' && (
                            <div className="flex justify-between mt-1">
                                <span className="text-slate-400 text-[10px]">Temperature:</span>
                                <span className={`text-[10px] font-bold ${(selectedElement.temperature || 20) > 60 ? 'text-red-500' : ((selectedElement.temperature || 20) > 40 ? 'text-orange-400' : 'text-emerald-400')}`}>
                                    {Math.floor(selectedElement.temperature || 20)} °C
                                </span>
                            </div>
                        )}
                        {selectedElement.isBurnedOut && (
                            <div className="mt-1 p-1 bg-red-900/50 border border-red-500/50 rounded flex items-center justify-center">
                                <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Destroyed</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
