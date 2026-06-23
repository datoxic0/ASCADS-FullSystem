import React, { useEffect } from 'react';
import { EngigraphRibbon } from './ui/EngigraphRibbon';
import { EngigraphSidebar } from './ui/EngigraphSidebar';
import { EngigraphRightSidebar } from './ui/EngigraphRightSidebar';
import { EngigraphCanvas } from './canvas/EngigraphCanvas';
import { useEngigraphStore } from './store/useEngigraphStore';
import { Zap } from 'lucide-react';

export const Engigraph2D: React.FC = () => {
    const { isTerminalOpen, isScopeOpen, toggleTerminal, toggleScope } = useEngigraphStore();

    return (
        <div className="flex flex-col w-full h-full bg-[#0a0b0c] text-slate-200 overflow-hidden font-sans">
            <EngigraphRibbon />
            
            <main className="flex-1 flex overflow-hidden relative">
                <EngigraphSidebar />
                
                <div className="flex-1 relative flex flex-col">
                    {/* Top Overlay tools (like snapping/zoom readouts) could go here */}
                    
                    <EngigraphCanvas />
                    
                    {/* Floating Panels */}
                    {isTerminalOpen && (
                        <div className="absolute bottom-10 left-4 w-[600px] h-[250px] bg-slate-900/95 border border-slate-700 rounded-lg shadow-2xl flex flex-col z-50 backdrop-blur-md">
                            <header className="flex items-center justify-between px-3 py-2 bg-slate-950 rounded-t-lg border-b border-slate-800">
                                <span className="text-xs font-bold text-slate-300">Virtual Serial Monitor</span>
                                <button onClick={toggleTerminal} className="text-slate-500 hover:text-white">&times;</button>
                            </header>
                            <div className="flex-1 overflow-y-auto p-2 font-mono text-[11px] text-green-400">
                                <div>&gt; EngiGraph Virtual Console Initialized...</div>
                            </div>
                            <footer className="p-2 border-t border-slate-800 bg-slate-950 rounded-b-lg flex gap-2">
                                <input type="text" placeholder="Send command..." className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-cyan-500" />
                                <button className="bg-slate-800 hover:bg-slate-700 text-xs px-3 rounded">Send</button>
                            </footer>
                        </div>
                    )}

                    {isScopeOpen && (
                        <div className="absolute top-4 right-4 w-[400px] h-[300px] bg-slate-900/95 border border-slate-700 rounded-lg shadow-2xl flex flex-col z-50 backdrop-blur-md">
                            <header className="flex items-center justify-between px-3 py-2 bg-slate-950 rounded-t-lg border-b border-slate-800">
                                <span className="text-xs font-bold text-slate-300">Oscilloscope</span>
                                <button onClick={toggleScope} className="text-slate-500 hover:text-white">&times;</button>
                            </header>
                            <div className="flex-1 bg-black p-2 flex items-center justify-center">
                                {/* Future canvas for waveforms */}
                                <span className="text-slate-700 font-mono text-xs">Waiting for probe data...</span>
                            </div>
                        </div>
                    )}
                </div>

                <EngigraphRightSidebar />
            </main>

            {/* Bottom Status Bar */}
            <footer className="h-8 bg-[#0f172a] border-t border-[#334155] flex items-center justify-between px-4 text-[10px] shrink-0 font-medium tracking-wide">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500">ENG:</span>
                        <input type="text" placeholder="Type command..." className="bg-transparent border-none outline-none text-cyan-400 w-48 placeholder:text-slate-700" />
                    </div>
                    <div className="text-slate-400 border-l border-slate-700 pl-4">READY</div>
                    <div className="flex items-center gap-1 text-emerald-400 border-l border-slate-700 pl-4">
                        <Zap size={12} /> Online
                    </div>
                </div>
                <div className="flex items-center gap-4 text-slate-400">
                    <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" defaultChecked className="accent-cyan-500" /> Grid</label>
                    <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" defaultChecked className="accent-cyan-500" /> Obj Snap</label>
                    <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="accent-cyan-500" /> Ortho</label>
                    <span className="border-l border-slate-700 pl-4">Units: mm</span>
                </div>
            </footer>
        </div>
    );
};
