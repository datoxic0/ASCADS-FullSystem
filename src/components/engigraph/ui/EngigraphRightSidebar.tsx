import React from 'react';
import { useEngigraphStore, DrawingObject } from '../store/useEngigraphStore';
import { ChevronRight, FileCheck, ShieldCheck, SlidersHorizontal, Cpu, Battery, Settings, Lightbulb } from 'lucide-react';

export const EngigraphRightSidebar: React.FC = () => {
    const { rightSidebarOpen, toggleRightSidebar, elements, updateElement, selectedIds, setActiveTool, setActivePartType, sheetLayout, setSheetLayout, toggleAiAssistant } = useEngigraphStore();
    
    // Properties panel shows details for the first selected element
    const selectedElement = selectedIds.length > 0 ? elements.find(el => el.id === selectedIds[0]) : null;

    if (!rightSidebarOpen) {
        return (
            <div className="hidden lg:flex w-10 bg-[#141618] border-l border-slate-800 flex-col items-center py-4 shrink-0 h-full">
                <button onClick={toggleRightSidebar} className="p-2 hover:bg-slate-800 rounded text-slate-400" title="Expand Properties">
                    <SlidersHorizontal size={18} />
                </button>
            </div>
        );
    }

    const handleChange = (id: string, updates: Partial<DrawingObject>) => {
        updateElement(id, updates);
    };

    const handleComponentDrag = (partType: string) => {
        setActiveTool('component');
        setActivePartType(partType);
    };

    return (
        <aside className="absolute right-0 top-0 bottom-0 z-40 lg:relative w-64 h-full bg-[#141618] border-l border-slate-800 flex flex-col shrink-0 shadow-2xl lg:shadow-none">
            <header className="flex items-center justify-between px-3 py-2 bg-[#0e0e11] text-slate-300 border-b border-slate-800">
                <span className="font-bold text-[10px] tracking-widest uppercase">Component Library</span>
                <button onClick={toggleRightSidebar} className="text-slate-500 hover:text-white" title="Collapse">
                    <ChevronRight size={16} />
                </button>
            </header>
            
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-4">
                
                {selectedElement ? (
                    <div className="flex flex-col gap-3 pb-4">
                        <h3 className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-1 px-1">
                            {selectedElement.type.toUpperCase()} {selectedElement.partType ? `- ${selectedElement.partType}` : ''}
                        </h3>

                        {(selectedElement.type === 'line' || selectedElement.type === 'wire') && (
                            <>
                                <div className="flex flex-col gap-1 px-1">
                                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Stroke Color</label>
                                    <input type="color" value={selectedElement.stroke || '#00f2ff'} onChange={(e) => handleChange(selectedElement.id, { stroke: e.target.value })} className="w-full h-8 bg-[#0e0e11] border border-slate-700 rounded cursor-pointer" />
                                </div>
                                <div className="flex flex-col gap-1 px-1">
                                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Stroke Width</label>
                                    <input type="number" value={selectedElement.strokeWidth || 2} onChange={(e) => handleChange(selectedElement.id, { strokeWidth: parseFloat(e.target.value) })} className="w-full bg-[#0e0e11] border border-slate-700 rounded text-xs text-slate-200 px-2 py-1.5" />
                                </div>
                            </>
                        )}

                        {selectedElement.type === 'component' && (
                            <>
                                {['resistor'].includes(selectedElement.partType || '') && (
                                    <div className="flex flex-col gap-1 px-1">
                                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Resistance (Ω)</label>
                                        <input type="number" value={selectedElement.resistance || 1000} onChange={(e) => handleChange(selectedElement.id, { resistance: parseFloat(e.target.value) })} className="w-full bg-[#0e0e11] border border-slate-700 rounded text-xs text-slate-200 px-2 py-1.5" />
                                    </div>
                                )}
                                {['battery', 'battery_18650'].includes(selectedElement.partType || '') && (
                                    <div className="flex flex-col gap-1 px-1">
                                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Voltage (V)</label>
                                        <input type="number" value={selectedElement.voltage || 3.7} onChange={(e) => handleChange(selectedElement.id, { voltage: parseFloat(e.target.value) })} className="w-full bg-[#0e0e11] border border-slate-700 rounded text-xs text-slate-200 px-2 py-1.5" />
                                    </div>
                                )}
                                {['switch_spst', 'button', 'switch'].includes(selectedElement.partType || '') && (
                                    <div className="flex flex-col gap-1 px-1">
                                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">State</label>
                                        <select 
                                            value={selectedElement.state || 'open'} 
                                            onChange={(e) => handleChange(selectedElement.id, { state: e.target.value })}
                                            className="w-full bg-[#0e0e11] border border-slate-700 rounded text-[10px] text-slate-200 px-2 py-1.5"
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
                    <div className="text-center text-[10px] text-slate-500 uppercase tracking-widest italic pb-4 px-4">
                        Select an element to edit properties.
                    </div>
                )}

                <div className="flex flex-col gap-1 px-1">
                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Sheet Layout</label>
                    <select 
                        value={sheetLayout}
                        onChange={(e) => setSheetLayout(e.target.value)}
                        className="w-full bg-[#0e0e11] border border-slate-700 rounded text-[10px] text-slate-200 p-1.5 focus:border-cyan-500 focus:outline-none"
                    >
                        <option value="none">No Template</option>
                        <option value="A4">A4 (210x297mm)</option>
                        <option value="A3">A3 (420x297mm)</option>
                        <option value="A2">A2 (594x420mm)</option>
                        <option value="A1">A1 (841x594mm)</option>
                        <option value="A0">A0 (1189x841mm)</option>
                    </select>
                </div>

                <div className="mt-2 pt-4 flex flex-col gap-2 px-1">
                    <button onClick={toggleAiAssistant} className="w-full bg-cyan-900/40 hover:bg-cyan-900/60 border border-cyan-800 text-cyan-400 text-[10px] uppercase tracking-widest font-bold py-2 rounded transition-colors shadow-[0_0_10px_rgba(8,145,178,0.2)]">
                        Run Validation
                    </button>
                    <button onClick={toggleAiAssistant} className="w-full bg-indigo-900/30 hover:bg-indigo-900/50 border border-indigo-800 text-indigo-400 text-[10px] uppercase tracking-widest font-bold py-2 rounded transition-colors flex items-center justify-center gap-1.5">
                        <ShieldCheck size={14} /> AI Compliance Audit
                    </button>
                </div>
            </div>
            
            <footer className="p-3 bg-[#0e0e11] border-t border-slate-800 text-[9px] text-slate-600 uppercase tracking-widest leading-tight text-center">
                <p>Developed by Siyabonga B Phakathi</p>
                <p>The Voice & Eye of Bhambatha Inc.</p>
            </footer>
        </aside>
    );
};
