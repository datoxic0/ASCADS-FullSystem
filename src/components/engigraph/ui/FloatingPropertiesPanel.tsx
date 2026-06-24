import React, { useState, useRef, useEffect } from 'react';
import { useEngigraphStore, DrawingObject } from '../store/useEngigraphStore';
import { X, GripHorizontal } from 'lucide-react';

export const FloatingPropertiesPanel: React.FC = () => {
    const { elements, selectedIds, updateElement } = useEngigraphStore();
    
    const [pos, setPos] = useState({ x: 20, y: 80 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const [isVisible, setIsVisible] = useState(true);

    const selectedElement = selectedIds.length === 1 ? elements.find(el => el.id === selectedIds[0]) : null;

    useEffect(() => {
        if (selectedIds.length > 0) setIsVisible(true);
    }, [selectedIds]);

    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDragging(true);
        dragStart.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (isDragging) {
            setPos({
                x: e.clientX - dragStart.current.x,
                y: e.clientY - dragStart.current.y
            });
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    if (!isVisible || !selectedElement) return null;

    const handleChange = (updates: Partial<DrawingObject>) => {
        updateElement(selectedElement.id, updates);
    };

    return (
        <div 
            className="absolute z-50 w-64 bg-[#1e293b]/95 backdrop-blur-md border border-slate-600 shadow-2xl rounded overflow-hidden flex flex-col"
            style={{ left: pos.x, top: pos.y }}
        >
            <div 
                className="bg-slate-800 border-b border-slate-700 p-2 flex items-center justify-between cursor-move select-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                <div className="flex items-center gap-2 text-slate-300">
                    <GripHorizontal size={14} className="text-slate-500" />
                    <span className="text-xs font-bold uppercase tracking-wider">Properties</span>
                </div>
                <button onClick={() => setIsVisible(false)} className="text-slate-500 hover:text-white p-1 rounded hover:bg-slate-700">
                    <X size={14} />
                </button>
            </div>

            <div className="p-4 flex flex-col gap-3 text-sm">
                <div className="flex justify-between border-b border-slate-700 pb-2">
                    <span className="text-slate-400">Type</span>
                    <span className="text-cyan-400 font-medium capitalize">{selectedElement.type} {selectedElement.partType ? `- ${selectedElement.partType}` : ''}</span>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">Color</label>
                    <input 
                        type="color" 
                        value={selectedElement.stroke || '#ffffff'} 
                        onChange={e => handleChange({ stroke: e.target.value })}
                        className="w-full h-8 bg-slate-900 border border-slate-700 rounded cursor-pointer"
                    />
                </div>

                {(selectedElement.type === 'line' || selectedElement.type === 'wire' || selectedElement.type === 'rect' || selectedElement.type === 'circle' || selectedElement.type === 'dimension') && (
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-400">Stroke Width</label>
                        <input 
                            type="number" 
                            min="0.5" step="0.5"
                            value={selectedElement.strokeWidth || 1} 
                            onChange={e => handleChange({ strokeWidth: parseFloat(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                        />
                    </div>
                )}

                {selectedElement.type === 'text' && (
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-400">Text Content</label>
                        <input 
                            type="text" 
                            value={selectedElement.text || ''} 
                            onChange={e => handleChange({ text: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                        />
                    </div>
                )}

                {selectedElement.type === 'component' && selectedElement.partType === 'resistor' && (
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-400">Resistance (Ω)</label>
                        <input 
                            type="number" 
                            value={selectedElement.resistance || 1000} 
                            onChange={e => handleChange({ resistance: parseFloat(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
