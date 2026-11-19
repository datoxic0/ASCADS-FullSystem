import React from 'react';
import { usePCBStore, PCBLayer } from '../store/usePCBStore';
import { Layers, Eye, EyeOff, Settings2, Info } from 'lucide-react';

export const PCBSidebar: React.FC = () => {
    const { activeLayer, setActiveLayer, visibleLayers, toggleLayerVisible, selectedIds, footprints, tracks, vias, sidebarOpen, toggleSidebar } = usePCBStore();

    const layerDefs: { id: PCBLayer, name: string, color: string }[] = [
        { id: 'top_copper', name: 'F.Cu (Top Copper)', color: '#ef4444' },
        { id: 'bottom_copper', name: 'B.Cu (Bottom Copper)', color: '#2563eb' },
        { id: 'top_silk', name: 'F.Silkscreen', color: '#f8fafc' },
        { id: 'bottom_silk', name: 'B.Silkscreen', color: '#0ea5e9' },
        { id: 'board_outline', name: 'Edge.Cuts', color: '#fbbf24' },
        { id: 'drills', name: 'Drill/Holes', color: '#94a3b8' },
    ];

    const getSelectedObjectInfo = () => {
        if (selectedIds.length === 0) return null;
        if (selectedIds.length > 1) return { type: 'Multiple', count: selectedIds.length };

        const id = selectedIds[0];
        const fp = footprints.find(f => f.id === id);
        if (fp) return { type: 'Footprint', ...fp as any };
        
        const tr = tracks.find(t => t.id === id);
        if (tr) return { type: 'Track', ...tr as any };
        
        const vi = vias.find(v => v.id === id);
        if (vi) return { type: 'Via', ...vi as any };

        return null;
    };

    const selectedInfo = getSelectedObjectInfo();

    if (!sidebarOpen) {
        return (
            <div className="absolute top-14 bottom-6 right-0 w-10 bg-slate-900 border-l border-slate-800 flex flex-col items-center py-4 z-40">
                <button onClick={toggleSidebar} className="p-2 hover:bg-slate-800 rounded text-slate-400" title="Expand Sidebar">
                    <Layers size={18} />
                </button>
            </div>
        );
    }

    return (
        <div className="absolute top-14 bottom-6 right-0 w-72 bg-slate-900 border-l border-slate-800 shadow-2xl z-40 flex flex-col">
            
            {/* Layer Manager */}
            <div className="flex-1 overflow-y-auto p-4 border-b border-slate-800">
                <div className="flex items-center justify-between text-slate-300 mb-4 pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                        <Layers size={16} className="text-teal-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Layer Stack</span>
                    </div>
                    <button onClick={toggleSidebar} className="p-1 text-slate-500 hover:text-white transition-colors" title="Collapse Sidebar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                </div>
                <div className="flex flex-col gap-1.5">
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
            </div>

            {/* Object Inspector */}
            <div className="h-2/5 p-4 bg-slate-800/20 overflow-y-auto">
                <div className="flex items-center gap-2 text-slate-300 mb-4 pb-2 border-b border-slate-800">
                    <Settings2 size={16} className="text-indigo-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Properties</span>
                </div>

                {!selectedInfo ? (
                    <div className="flex flex-col items-center justify-center text-slate-600 h-24 gap-2">
                        <Info size={24} className="opacity-50" />
                        <span className="text-[10px] uppercase tracking-wider text-center">No Object Selected</span>
                    </div>
                ) : selectedInfo.type === 'Multiple' ? (
                    <div className="text-[11px] text-slate-400 p-2">
                        {selectedInfo.count} objects selected.
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 text-[11px] text-slate-300">
                        <div className="flex justify-between border-b border-slate-800/50 pb-1">
                            <span className="text-slate-500 uppercase font-mono">Type</span>
                            <span className="font-bold text-teal-400">{selectedInfo.type}</span>
                        </div>
                        {selectedInfo.type === 'Footprint' && (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">RefDes</span>
                                    <span className="font-mono">{selectedInfo.refDes}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Footprint</span>
                                    <span className="font-mono text-amber-400">{selectedInfo.footprintId}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Layer</span>
                                    <span className="font-mono capitalize">{selectedInfo.layer}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">X / Y</span>
                                    <span className="font-mono">{selectedInfo.x.toFixed(2)} / {selectedInfo.y.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Rotation</span>
                                    <span className="font-mono">{selectedInfo.rotation}°</span>
                                </div>
                            </>
                        )}
                        {selectedInfo.type === 'Track' && (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Layer</span>
                                    <span className="font-mono capitalize">{selectedInfo.layer}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Width</span>
                                    <span className="font-mono">{selectedInfo.width} mm</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Length</span>
                                    <span className="font-mono">{((selectedInfo.points.length / 2) - 1)} segs</span>
                                </div>
                            </>
                        )}
                        {selectedInfo.type === 'Via' && (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Drill</span>
                                    <span className="font-mono">{selectedInfo.drill} mm</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Diameter</span>
                                    <span className="font-mono">{selectedInfo.diameter} mm</span>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
};
