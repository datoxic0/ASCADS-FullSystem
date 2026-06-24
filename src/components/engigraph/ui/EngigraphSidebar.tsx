import React from 'react';
import { useEngigraphStore } from '../store/useEngigraphStore';
import { Layers, Info, ChevronDown, ChevronLeft, Plus, Eye, EyeOff } from 'lucide-react';

export const EngigraphSidebar: React.FC = () => {
    const { leftSidebarOpen, toggleLeftSidebar } = useEngigraphStore();

    if (!leftSidebarOpen) {
        return (
            <div className="w-10 bg-[#141618] border-r border-slate-800 flex flex-col items-center py-4 shrink-0">
                <button onClick={toggleLeftSidebar} className="p-2 hover:bg-slate-800 rounded text-slate-400" title="Expand Sidebar">
                    <Layers size={18} />
                </button>
            </div>
        );
    }

    return (
        <aside className="w-64 bg-[#141618] border-r border-slate-800 flex flex-col shrink-0">
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
                    
                    <div className="flex items-center justify-between p-2 mb-1 bg-cyan-900/20 rounded border border-cyan-800 text-xs text-cyan-400">
                        <div className="flex items-center gap-2">
                            <Eye size={14} />
                            <span>Type A (Visible)</span>
                        </div>
                        <div className="w-3 h-3 rounded-full bg-white border border-slate-500"></div>
                    </div>
                    <div className="flex items-center justify-between p-2 mb-1 hover:bg-slate-800/50 rounded border border-transparent text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                            <Eye size={14} />
                            <span>Type E (Hidden)</span>
                        </div>
                        <div className="w-3 h-3 rounded-full bg-slate-500 border border-slate-600 border-dashed"></div>
                    </div>
                    <div className="flex items-center justify-between p-2 mb-1 hover:bg-slate-800/50 rounded border border-transparent text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                            <Eye size={14} />
                            <span>Type G (Center)</span>
                        </div>
                        <div className="w-3 h-3 rounded-full bg-red-400 border border-red-500"></div>
                    </div>
                    <div className="flex items-center justify-between p-2 mb-1 hover:bg-slate-800/50 rounded border border-transparent text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                            <Eye size={14} />
                            <span>Dimensions</span>
                        </div>
                        <div className="w-3 h-3 rounded-full bg-blue-400 border border-blue-500"></div>
                    </div>
                    <div className="flex items-center justify-between p-2 mb-1 hover:bg-slate-800/50 rounded border border-transparent text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                            <Eye size={14} />
                            <span>Circuit Net</span>
                        </div>
                        <div className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-500"></div>
                    </div>
                    
                    <button className="flex items-center justify-center gap-1 w-full mt-2 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-white rounded border border-dashed border-slate-700 transition-colors">
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
                <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center">
                    <p className="text-[10px] text-slate-600 uppercase tracking-widest text-center">No entity selected<br/>Click an object to view its parametric properties.</p>
                </div>
            </div>
        </aside>
    );
};
