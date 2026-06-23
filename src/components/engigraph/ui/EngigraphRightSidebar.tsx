import React from 'react';
import { useEngigraphStore } from '../store/useEngigraphStore';
import { ChevronRight, FileCheck, ShieldCheck } from 'lucide-react';

export const EngigraphRightSidebar: React.FC = () => {
    const { rightSidebarOpen, toggleRightSidebar } = useEngigraphStore();

    if (!rightSidebarOpen) {
        return (
            <div className="w-10 bg-[#1e293b] border-l border-[#334155] flex flex-col items-center py-4 shrink-0">
                <button onClick={toggleRightSidebar} className="p-2 hover:bg-slate-700 rounded text-slate-400" title="Expand Standards">
                    <FileCheck size={18} />
                </button>
            </div>
        );
    }

    return (
        <aside className="w-64 bg-[#1e293b] border-l border-[#334155] flex flex-col shrink-0">
            <header className="flex items-center justify-between px-3 py-2 bg-[#0f172a] text-slate-300 border-b border-[#334155]">
                <span className="font-semibold text-xs tracking-wider uppercase">Standards & Validation</span>
                <button onClick={toggleRightSidebar} className="text-slate-500 hover:text-white" title="Collapse">
                    <ChevronRight size={16} />
                </button>
            </header>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Standard</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 p-1.5 focus:border-cyan-500 focus:outline-none">
                        <option value="SANS">SANS 10111 (South Africa)</option>
                        <option value="ISO">ISO 128 / 7200</option>
                        <option value="ANSI">ANSI Y14.5</option>
                        <option value="DIN">DIN / BSI</option>
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">Sheet Layout</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 p-1.5 focus:border-cyan-500 focus:outline-none">
                        <option value="none">No Template</option>
                        <option value="A4">A4 (210x297mm)</option>
                        <option value="A3">A3 (420x297mm)</option>
                        <option value="A2">A2 (594x420mm)</option>
                        <option value="A1">A1 (841x594mm)</option>
                        <option value="A0">A0 (1189x841mm)</option>
                    </select>
                    
                    <div className="flex flex-col gap-2 mt-3">
                        <input type="text" placeholder="Project Title" className="w-full bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 px-2 py-1.5" />
                        <input type="text" placeholder="Drawn By" className="w-full bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 px-2 py-1.5" />
                        <input type="text" placeholder="Date (DD/MM/YYYY)" className="w-full bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 px-2 py-1.5" />
                        <button className="w-full mt-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium py-1.5 rounded transition-colors">Apply Template</button>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700 flex flex-col gap-2">
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
