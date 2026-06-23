import React from 'react';
import { useEngigraphStore } from '../store/useEngigraphStore';
import { Layers, Info, ChevronDown, ChevronLeft, Plus } from 'lucide-react';

export const EngigraphSidebar: React.FC = () => {
    const { leftSidebarOpen, toggleLeftSidebar } = useEngigraphStore();

    if (!leftSidebarOpen) {
        return (
            <div className="w-10 bg-[#1e293b] border-r border-[#334155] flex flex-col items-center py-4 shrink-0">
                <button onClick={toggleLeftSidebar} className="p-2 hover:bg-slate-700 rounded text-slate-400" title="Expand Sidebar">
                    <Layers size={18} />
                </button>
            </div>
        );
    }

    return (
        <aside className="w-64 bg-[#1e293b] border-r border-[#334155] flex flex-col shrink-0">
            {/* Layers Panel */}
            <div className="flex flex-col flex-1 border-b border-[#334155]">
                <header className="flex items-center justify-between px-3 py-2 bg-[#0f172a] text-slate-300 border-b border-[#334155] cursor-pointer">
                    <div className="flex items-center gap-2">
                        <ChevronDown size={14} />
                        <span className="font-semibold text-xs tracking-wider uppercase">Layers</span>
                    </div>
                    <button onClick={toggleLeftSidebar} className="text-slate-500 hover:text-white" title="Collapse Sidebar">
                        <ChevronLeft size={16} />
                    </button>
                </header>
                <div className="flex-1 overflow-y-auto p-2">
                    {/* Placeholder for Layers List */}
                    <div className="flex items-center justify-between p-2 mb-1 bg-slate-800 rounded border border-slate-700 text-sm text-slate-300">
                        <span>Layer 0 (Defpoints)</span>
                        <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                    </div>
                    <div className="flex items-center justify-between p-2 mb-1 hover:bg-slate-800 rounded border border-transparent text-sm text-slate-400">
                        <span>Mechanical</span>
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    </div>
                    
                    <button className="flex items-center justify-center gap-1 w-full mt-2 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-white rounded border border-dashed border-slate-600 transition-colors">
                        <Plus size={14} /> New Layer
                    </button>
                </div>
            </div>

            {/* Properties Panel */}
            <div className="flex flex-col h-1/2">
                <header className="flex items-center px-3 py-2 bg-[#0f172a] text-slate-300 border-b border-[#334155]">
                    <div className="flex items-center gap-2">
                        <Info size={14} />
                        <span className="font-semibold text-xs tracking-wider uppercase">Properties</span>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
                    <p className="text-xs text-slate-500 italic">No entity selected</p>
                </div>
            </div>
        </aside>
    );
};
