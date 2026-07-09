import React from 'react';
import { usePCBStore, PCBLayer } from '../store/usePCBStore';
import { Layers, Eye, EyeOff } from 'lucide-react';

export const PCBLayerManager: React.FC = () => {
    const { activeLayer, setActiveLayer, visibleLayers, toggleLayerVisible } = usePCBStore();

    const layerDefs: { id: PCBLayer, name: string, color: string }[] = [
        { id: 'top_copper', name: 'F.Cu (Top Copper)', color: '#ef4444' },
        { id: 'bottom_copper', name: 'B.Cu (Bottom Copper)', color: '#2563eb' },
        { id: 'top_silk', name: 'F.Silkscreen', color: '#f8fafc' },
        { id: 'bottom_silk', name: 'B.Silkscreen', color: '#0ea5e9' },
        { id: 'board_outline', name: 'Edge.Cuts', color: '#fbbf24' },
        { id: 'drills', name: 'Drill/Holes', color: '#94a3b8' },
    ];

    return (
        <div className="absolute top-20 right-4 w-64 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg shadow-2xl p-4 z-50">
            <div className="flex items-center gap-2 text-slate-300 mb-4 border-b border-slate-800 pb-2">
                <Layers size={16} className="text-teal-400" />
                <span className="text-xs font-bold uppercase tracking-widest">Layer Manager</span>
            </div>

            <div className="flex flex-col gap-2">
                {layerDefs.map(layer => (
                    <div 
                        key={layer.id}
                        className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition-colors border ${activeLayer === layer.id ? 'bg-slate-800 border-slate-600' : 'border-transparent hover:bg-slate-800/50'}`}
                        onClick={() => setActiveLayer(layer.id)}
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm shadow-sm" style={{ backgroundColor: layer.color }} />
                            <span className={`text-[11px] ${activeLayer === layer.id ? 'text-white font-bold' : 'text-slate-400'}`}>
                                {layer.name}
                            </span>
                        </div>
                        <button 
                            className="p-1 text-slate-500 hover:text-white transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleLayerVisible(layer.id);
                            }}
                        >
                            {visibleLayers[layer.id] ? <Eye size={12} /> : <EyeOff size={12} className="opacity-50" />}
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
                <span className="text-[10px] text-slate-500 leading-tight block">
                    Select a layer to make it active for routing. Use the eye icon to toggle visibility.
                </span>
            </div>
        </div>
    );
};
