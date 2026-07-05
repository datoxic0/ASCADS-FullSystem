import React, { useMemo } from 'react';
import { useEngigraphStore } from '../store/useEngigraphStore';

export const Oscilloscope: React.FC = () => {
    const { toggleScope, probeData, selectedIds, elements } = useEngigraphStore();

    const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;
    const history = selectedId ? (probeData[selectedId] || []) : [];
    const el = selectedId ? elements.find(e => e.id === selectedId) : null;

    // SVG parameters
    const width = 380;
    const height = 240;
    const maxVal = 5.0; // Assume 5V max logic level roughly
    const padding = 20;
    
    const pathData = useMemo(() => {
        if (history.length === 0) return '';
        
        const stepX = (width - padding * 2) / 100; // max 100 points
        
        let d = '';
        history.forEach((val, i) => {
            const x = padding + i * stepX;
            // Map 0 -> height - padding, maxVal -> padding
            const y = (height - padding) - (Math.min(val, maxVal) / maxVal) * (height - padding * 2);
            if (i === 0) d += `M ${x} ${y} `;
            else d += `L ${x} ${y} `;
        });
        return d;
    }, [history]);

    return (
        <div className="absolute top-4 right-4 w-[400px] h-[300px] bg-slate-900/90 border border-slate-700/50 rounded-lg shadow-2xl flex flex-col z-50 backdrop-blur-xl">
            <header className="flex items-center justify-between px-3 py-2 bg-slate-950/80 rounded-t-lg border-b border-slate-700/50 cursor-move">
                <span className="text-xs font-bold text-slate-300 tracking-widest uppercase">
                    Oscilloscope {el ? ` - PROBE: ${el.partType || 'Component'}` : ''}
                </span>
                <button onClick={toggleScope} className="text-slate-500 hover:text-white">&times;</button>
            </header>
            <div className="flex-1 bg-[#050914] p-2 flex flex-col items-center justify-center relative overflow-hidden rounded-b-lg">
                {!selectedId ? (
                    <span className="text-slate-600 font-mono text-xs uppercase tracking-widest animate-pulse">Select a component to probe...</span>
                ) : history.length === 0 ? (
                    <span className="text-slate-600 font-mono text-xs uppercase tracking-widest">Waiting for probe data...</span>
                ) : (
                    <>
                        {/* Grid */}
                        <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none opacity-20">
                            <pattern id="grid" width="38" height="24" patternUnits="userSpaceOnUse">
                                <path d="M 38 0 L 0 0 0 24" fill="none" stroke="#00f2ff" strokeWidth="0.5" />
                            </pattern>
                            <rect width="100%" height="100%" fill="url(#grid)" />
                            
                            {/* Center Line */}
                            <line x1="0" y1="120" x2="400" y2="120" stroke="#00f2ff" strokeWidth="1" strokeDasharray="4,4" />
                        </svg>

                        {/* Trace */}
                        <svg width={width} height={height} className="relative z-10">
                            <path d={pathData} fill="none" stroke="#00f2ff" strokeWidth="2" 
                                style={{ filter: 'drop-shadow(0 0 5px #00f2ff)' }} 
                            />
                        </svg>
                        
                        {/* Real-time Data overlay */}
                        <div className="absolute top-2 left-3 flex flex-col text-[10px] font-mono text-cyan-400">
                            <span>VMAX: 5.0V</span>
                            <span>CURR: {history.length > 0 ? history[history.length-1].toFixed(2) : '0.00'}V</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
