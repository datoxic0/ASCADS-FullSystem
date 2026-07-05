import React from 'react';
import { useEngigraphStore } from '../store/useEngigraphStore';
import { Activity, X, Zap } from 'lucide-react';

export const OscilloscopePanel: React.FC = () => {
    const { probedWireId, probeHistory, setProbedWire } = useEngigraphStore();

    if (!probedWireId) return null;

    // We have up to 50 samples in probeHistory.
    // The panel will draw a simple SVG path for the line graph.
    const maxSamples = 50;
    const width = 300;
    const height = 100;
    
    // Create polyline points
    const points = probeHistory.map((sample, idx) => {
        // Map index to X (0 to width)
        const x = (idx / (maxSamples - 1)) * width || 0;
        
        // Map value to Y. We assume max voltage is 6V (giving headroom above 5V)
        // Y goes from top (0) to bottom (height)
        // Value 0V -> height, Value 5V -> height * (1/6)
        const clampedVal = Math.max(-1, Math.min(6, sample.val)); // allow slight negative for noise
        const y = height - ((clampedVal + 1) / 7) * height; // +1 to shift scale up slightly
        
        return `${x},${y}`;
    }).join(' ');

    const currentVal = probeHistory.length > 0 ? probeHistory[probeHistory.length - 1].val.toFixed(2) : '0.00';

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1e1e1e] border border-slate-700 shadow-2xl rounded-lg p-4 w-[350px]">
            <div className="flex justify-between items-center mb-3 border-b border-slate-700 pb-2">
                <div className="flex items-center gap-2">
                    <Activity className="text-cyan-400" size={16} />
                    <span className="text-slate-200 text-xs font-bold tracking-widest uppercase">Digital Oscilloscope</span>
                </div>
                <button onClick={() => setProbedWire(null)} className="text-slate-400 hover:text-white transition-colors">
                    <X size={16} />
                </button>
            </div>
            
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-1">
                <span>Wire: {probedWireId.slice(-6)}</span>
                <span className="text-cyan-400 flex items-center gap-1"><Zap size={10} /> {currentVal}V</span>
            </div>

            <div className="relative w-full h-[100px] bg-[#09090b] border border-slate-800 rounded overflow-hidden">
                {/* Grid lines */}
                <div className="absolute inset-0 opacity-20 pointer-events-none" 
                     style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                </div>
                
                {/* 5V Reference Line */}
                <div className="absolute top-[14%] w-full border-t border-dashed border-slate-600 opacity-50"></div>
                {/* 0V Reference Line */}
                <div className="absolute bottom-[14%] w-full border-t border-dashed border-slate-600 opacity-50"></div>

                <svg width="100%" height="100%" preserveAspectRatio="none" className="relative z-10">
                    <polyline
                        points={points}
                        fill="none"
                        stroke="#00f2ff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
        </div>
    );
};
