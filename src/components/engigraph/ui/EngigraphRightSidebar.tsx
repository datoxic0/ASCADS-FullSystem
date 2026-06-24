import React from 'react';
import { useEngigraphStore, DrawingObject } from '../store/useEngigraphStore';
import { ChevronRight, FileCheck, ShieldCheck, SlidersHorizontal } from 'lucide-react';

export const EngigraphRightSidebar: React.FC = () => {
    const { rightSidebarOpen, toggleRightSidebar, elements, updateElement, selectedIds } = useEngigraphStore();
    
    // Properties panel shows details for the first selected element
    const selectedElement = selectedIds.length > 0 ? elements.find(el => el.id === selectedIds[0]) : null;

    if (!rightSidebarOpen) {
        return (
            <div className="w-10 bg-[#1e293b] border-l border-[#334155] flex flex-col items-center py-4 shrink-0">
                <button onClick={toggleRightSidebar} className="p-2 hover:bg-slate-700 rounded text-slate-400" title="Expand Properties">
                    <SlidersHorizontal size={18} />
                </button>
            </div>
        );
    }

    const handleChange = (id: string, updates: Partial<DrawingObject>) => {
        updateElement(id, updates);
    };

    return (
        <aside className="w-64 bg-[#1e293b] border-l border-[#334155] flex flex-col shrink-0">
            <header className="flex items-center justify-between px-3 py-2 bg-[#0f172a] text-slate-300 border-b border-[#334155]">
                <span className="font-semibold text-xs tracking-wider uppercase">Properties & Standards</span>
                <button onClick={toggleRightSidebar} className="text-slate-500 hover:text-white" title="Collapse">
                    <ChevronRight size={16} />
                </button>
            </header>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                
                {selectedElement ? (
                    <div className="flex flex-col gap-3 border-b border-slate-700 pb-4">
                        <h3 className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider mb-2">
                            {selectedElement.type.toUpperCase()} {selectedElement.partType ? `- ${selectedElement.partType}` : ''}
                        </h3>

                        {(selectedElement.type === 'line' || selectedElement.type === 'wire') && (
                            <>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] text-slate-400 font-bold uppercase">Stroke Color</label>
                                    <input type="color" value={selectedElement.stroke || '#00f2ff'} onChange={(e) => handleChange(selectedElement.id, { stroke: e.target.value })} className="w-full h-8 bg-slate-900 border border-slate-700 rounded cursor-pointer" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] text-slate-400 font-bold uppercase">Stroke Width</label>
                                    <input type="number" value={selectedElement.strokeWidth || 2} onChange={(e) => handleChange(selectedElement.id, { strokeWidth: parseFloat(e.target.value) })} className="w-full bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 px-2 py-1.5" />
                                </div>
                            </>
                        )}

                        {selectedElement.type === 'component' && (
                            <>
                                {['resistor'].includes(selectedElement.partType || '') && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] text-slate-400 font-bold uppercase">Resistance (Ω)</label>
                                        <input type="number" value={selectedElement.resistance || 1000} onChange={(e) => handleChange(selectedElement.id, { resistance: parseFloat(e.target.value) })} className="w-full bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 px-2 py-1.5" />
                                    </div>
                                )}
                                {['battery_18650'].includes(selectedElement.partType || '') && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] text-slate-400 font-bold uppercase">Voltage (V)</label>
                                        <input type="number" value={selectedElement.voltage || 3.7} onChange={(e) => handleChange(selectedElement.id, { voltage: parseFloat(e.target.value) })} className="w-full bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 px-2 py-1.5" />
                                    </div>
                                )}
                                {['switch_spst', 'button'].includes(selectedElement.partType || '') && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] text-slate-400 font-bold uppercase">State</label>
                                        <select 
                                            value={selectedElement.state || 'open'} 
                                            onChange={(e) => handleChange(selectedElement.id, { state: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 px-2 py-1.5"
                                        >
                                            <option value="open">Open (OFF)</option>
                                            <option value="closed">Closed (ON)</option>
                                        </select>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    <div className="text-center text-xs text-slate-500 italic pb-4 border-b border-slate-700">
                        Select an element to edit properties.
                    </div>
                )}

                <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sheet Layout</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 p-1.5 focus:border-cyan-500 focus:outline-none">
                        <option value="none">No Template</option>
                        <option value="A4">A4 (210x297mm)</option>
                        <option value="A3">A3 (420x297mm)</option>
                        <option value="A2">A2 (594x420mm)</option>
                        <option value="A1">A1 (841x594mm)</option>
                        <option value="A0">A0 (1189x841mm)</option>
                    </select>
                </div>

                <div className="mt-2 pt-4 border-t border-slate-700 flex flex-col gap-2">
                    <button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold py-2 rounded transition-colors shadow-[0_0_10px_rgba(8,145,178,0.3)]">
                        Run Validation
                    </button>
                    <button className="w-full bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-300 text-xs font-bold py-2 rounded transition-colors flex items-center justify-center gap-1.5">
                        <ShieldCheck size={14} /> AI Compliance Audit
                    </button>
                </div>
            </div>
            
            <footer className="p-3 bg-slate-900 border-t border-slate-700 text-[9px] text-slate-500 leading-tight text-center">
                <p>Developed by Siyabonga B Phakathi</p>
                <p>The Voice & Eye of Bhambatha Inc. © 2026</p>
            </footer>
        </aside>
    );
};
