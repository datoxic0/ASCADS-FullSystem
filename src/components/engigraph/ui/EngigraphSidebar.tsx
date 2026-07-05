import React from 'react';
import { useEngigraphStore } from '../store/useEngigraphStore';
import { Layers, Info, ChevronDown, ChevronLeft, Plus, Eye, EyeOff } from 'lucide-react';

export const EngigraphSidebar: React.FC = () => {
    const { leftSidebarOpen, toggleLeftSidebar, selectedIds, elements, layers, addLayer, toggleLayerVisibility } = useEngigraphStore();
    const selectedElement = selectedIds.length === 1 ? elements.find(el => el.id === selectedIds[0]) : null;

    if (!leftSidebarOpen) {
        return (
            <div className="hidden lg:flex w-10 bg-[#141618] border-r border-slate-800 flex-col items-center py-4 shrink-0 h-full">
                <button onClick={toggleLeftSidebar} className="p-2 hover:bg-slate-800 rounded text-slate-400" title="Expand Sidebar">
                    <Layers size={18} />
                </button>
            </div>
        );
    }

    return (
        <aside className="absolute left-0 top-0 bottom-0 z-40 lg:relative w-64 h-full bg-[#141618] border-r border-slate-800 flex flex-col shrink-0 shadow-2xl lg:shadow-none">
            {/* Layers Panel */}
            <div className="flex flex-col flex-1 border-b border-slate-800">
                <header className="flex items-center justify-between px-3 py-2 bg-[#0e0e11] text-slate-300 border-b border-slate-800 cursor-pointer">
                    <div className="flex items-center gap-2">
                        <ChevronDown size={14} />
                        <span className="font-bold text-[10px] tracking-widest uppercase">Layer Manager</span>
                    </div>
                    <button onClick={toggleLeftSidebar} className="text-slate-500 hover:text-white" title="Collapse Sidebar">
                        <ChevronLeft size={16} />
                    </button>
                </header>
                <div className="flex-1 overflow-y-auto p-2">
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">SANS 10111 Layers</div>
                    
                    {layers.map(layer => (
                        <div key={layer.id} className="flex items-center justify-between p-2 mb-1 hover:bg-slate-800/50 rounded border border-transparent text-xs text-slate-400">
                            <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleLayerVisibility(layer.id)}>
                                {layer.visible ? <Eye size={14} className="text-cyan-400" /> : <EyeOff size={14} />}
                                <span className={layer.visible ? 'text-slate-200' : ''}>{layer.name}</span>
                            </div>
                            <div className="w-3 h-3 rounded-full border border-slate-500" style={{ backgroundColor: layer.color }}></div>
                        </div>
                    ))}
                    
                    <button 
                        onClick={() => {
                            const name = prompt("Enter new layer name:");
                            if (name) addLayer(name, "#" + Math.floor(Math.random()*16777215).toString(16));
                        }}
                        className="flex items-center justify-center gap-1 w-full mt-2 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-white rounded border border-dashed border-slate-700 transition-colors"
                    >
                        <Plus size={14} /> New Layer
                    </button>
                </div>
            </div>

            {/* Entity Inspector Panel */}
            <div className="flex flex-col h-[40%] bg-[#0e0e11]">
                <header className="flex items-center px-3 py-2 bg-[#0e0e11] text-slate-300 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                        <Info size={14} />
                        <span className="font-bold text-[10px] tracking-widest uppercase">Entity Inspector</span>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-4 flex flex-col">
                    {selectedElement ? (
                        <div className="w-full flex flex-col gap-2 text-xs">
                            <div className="flex justify-between border-b border-slate-700/50 pb-1">
                                <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">ID</span>
                                <span className="text-cyan-400 font-mono text-[10px]">{selectedElement.id}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-700/50 pb-1">
                                <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Type</span>
                                <span className="text-slate-300 capitalize text-[10px]">{selectedElement.type}</span>
                            </div>
                            {selectedElement.partType && (
                                <div className="flex justify-between border-b border-slate-700/50 pb-1">
                                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Part</span>
                                    <span className="text-emerald-400 capitalize text-[10px]">{selectedElement.partType}</span>
                                </div>
                            )}
                            <div className="flex justify-between border-b border-slate-700/50 pb-1">
                                <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Position</span>
                                <span className="text-slate-400 font-mono text-[10px]">
                                    X: {Math.round(selectedElement.x || 0)}, Y: {Math.round(selectedElement.y || 0)}
                                </span>
                            </div>
                            {selectedElement.type === 'component' && (
                                <div className="mt-2 bg-slate-900/50 border border-slate-700 rounded p-2 flex flex-col gap-1">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-700 pb-1 mb-1">Live State</span>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400 text-[10px]">Power</span>
                                        <span className={selectedElement.isPowered ? "text-emerald-400" : "text-rose-400"}>
                                            {selectedElement.isPowered ? "ACTIVE" : "OFF"}
                                        </span>
                                    </div>
                                    {selectedElement.currentAngle !== undefined && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-400 text-[10px]">Angle</span>
                                            <span className="text-cyan-400 font-mono">{Math.round(selectedElement.currentAngle)}°</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-[10px] text-slate-600 uppercase tracking-widest text-center">No entity selected<br/>Click an object to view its parametric properties.</p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};
