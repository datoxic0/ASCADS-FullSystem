import React from 'react';
import { usePCBStore } from '../store/usePCBStore';
import { MousePointer2, GitCommit, Search, PlusSquare, Trash2, Crosshair, Map, Download, Zap } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { FootprintLibrary } from '../lib/FootprintLibrary';
import { useEngigraphStore } from '../../engigraph/store/useEngigraphStore';
import { PCBAutorouter } from '../solvers/PCBAutorouter';
import { loadProjects, getActiveProjectId } from '../../../lib/analog-storage';

export const PCBRibbon: React.FC = () => {
    const { activeTool, setTool, addFootprint, removeSelected, selectedIds, clearBoard } = usePCBStore();

    const handleAddFootprint = (fpId: string) => {
        addFootprint({
            id: uuidv4(),
            footprintId: fpId,
            x: 50, // Middle of default board
            y: 40,
            rotation: 0,
            layer: 'top',
            refDes: `U?`
        });
        setTool('select');
    };

    const handleImportNetlist = () => {
        const engiNets = useEngigraphStore.getState().nets;
        if (engiNets.length === 0) {
            alert("No nets found in Engigraph project!");
            return;
        }

        // Convert Engigraph nets to PCB nets
        const pcbNets = engiNets.map(n => ({
            id: n.id,
            name: n.name,
            nodes: n.nodes.map(node => {
                // Here we map Engigraph node IDs (like node-123) to Footprint references.
                // For simplicity in this system, we assume footprintId == componentId and padId == portId
                return { footprintId: node.componentId, padId: node.portId };
            })
        }));

        usePCBStore.getState().setNets(pcbNets);
        
        // Let's also auto-place footprints for all components in the engigraph!
        const components = useEngigraphStore.getState().components;
        let xOff = 10;
        let yOff = 10;
        components.forEach(c => {
            // Pick a default footprint based on type
            let fpId = 'DIP-8';
            if (c.type === 'resistor') fpId = '0805';
            if (c.type === 'capacitor') fpId = '1206';
            if (c.type === 'switch') fpId = 'PinHeader-1x2';

            usePCBStore.getState().addFootprint({
                id: c.id,
                footprintId: fpId,
                x: xOff,
                y: yOff,
                rotation: 0,
                layer: 'top',
                refDes: `${c.type.substring(0, 1).toUpperCase()}${c.id.substring(0, 4)}`
            });

            xOff += 15;
            if (xOff > 80) {
                xOff = 10;
                yOff += 15;
            }
        });

        alert(`Imported ${pcbNets.length} nets and ${components.length} footprints from Engigraph!`);
    };

    const handleAutoroute = () => {
        const state = usePCBStore.getState();
        const newTracks = PCBAutorouter.routeBoard(state);
        newTracks.forEach(t => state.addTrack(t));
        alert(`Autorouter finished: Generated ${newTracks.length} segments.`);
    };

    const handleImportAnalogNetlist = () => {
        const activeId = getActiveProjectId();
        if (!activeId) {
            alert("No active Analog Project found!");
            return;
        }
        const projects = loadProjects();
        const activeProject = projects.find(p => p.id === activeId);
        if (!activeProject || !activeProject.data) {
            alert("Active Analog Project has no data!");
            return;
        }

        const design = activeProject.data.design;
        if (!design || !design.components) {
            alert("No circuit design found in active project!");
            return;
        }

        const components = design.components;
        const connections = design.connections || [];

        // Convert Analog connections to PCB Nets (treating each connection as a 2-point net for simplicity)
        const pcbNets = connections.map((conn: any) => ({
            id: conn.id,
            name: `Net-${conn.id.substring(0, 4)}`,
            nodes: [
                { footprintId: conn.from, padId: String(conn.fromPin || '1') },
                { footprintId: conn.to, padId: String(conn.toPin || '2') }
            ]
        }));

        usePCBStore.getState().setNets(pcbNets);

        // Auto-place footprints
        let xOff = 10;
        let yOff = 40;
        components.forEach((c: any) => {
            let fpId = 'DIP-8'; // default
            if (c.type === 'RESISTOR') fpId = '0805';
            if (c.type === 'CAPACITOR') fpId = '1206';
            if (c.type === 'SWITCH') fpId = 'PinHeader-1x2';
            if (c.type === 'BATTERY') fpId = 'PinHeader-1x2';

            usePCBStore.getState().addFootprint({
                id: c.id,
                footprintId: fpId,
                x: xOff,
                y: yOff,
                rotation: c.rotation || 0,
                layer: 'top',
                refDes: `${c.type.substring(0, 1).toUpperCase()}${c.id.substring(0, 4)}`
            });

            xOff += 15;
            if (xOff > 120) {
                xOff = 10;
                yOff += 15;
            }
        });

        alert(`Imported ${pcbNets.length} nets and ${components.length} footprints from Analog Project: ${activeProject.name}!`);
    };

    return (
        <div className="absolute top-0 left-0 right-0 h-14 bg-slate-900 border-b border-slate-800 flex items-center px-4 z-50">
            <div className="flex items-center gap-4 text-white">
                {/* Logo Area */}
                <div className="flex items-center gap-2 pr-6 border-r border-slate-700">
                    <Map className="text-teal-400 w-5 h-5" />
                    <span className="font-bold tracking-widest text-sm">PCB LAB</span>
                </div>

                {/* Core Tools */}
                <div className="flex bg-slate-800 rounded-md p-1 gap-1">
                    <button 
                        onClick={() => setTool('select')}
                        className={`p-1.5 rounded flex items-center justify-center transition-colors ${activeTool === 'select' ? 'bg-teal-500 text-black' : 'hover:bg-slate-700 text-slate-300'}`}
                        title="Select Tool"
                    >
                        <MousePointer2 size={16} />
                    </button>
                    <button 
                        onClick={() => setTool('track')}
                        className={`p-1.5 rounded flex items-center justify-center transition-colors ${activeTool === 'track' ? 'bg-teal-500 text-black' : 'hover:bg-slate-700 text-slate-300'}`}
                        title="Route Track (Copper)"
                    >
                        <GitCommit size={16} />
                    </button>
                    <button 
                        onClick={() => setTool('via')}
                        className={`p-1.5 rounded flex items-center justify-center transition-colors ${activeTool === 'via' ? 'bg-teal-500 text-black' : 'hover:bg-slate-700 text-slate-300'}`}
                        title="Place Via"
                    >
                        <Crosshair size={16} />
                    </button>
                </div>

                <div className="w-px h-6 bg-slate-700 mx-2" />

                {/* Add Footprints */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Add Part:</span>
                    {Object.keys(FootprintLibrary).map(fpId => (
                        <button 
                            key={fpId}
                            onClick={() => handleAddFootprint(fpId)}
                            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded border border-slate-700 transition-colors"
                        >
                            {fpId}
                        </button>
                    ))}
                </div>

                <div className="flex-1" />

                {/* System Actions */}
                <div className="flex items-center gap-2 pr-4 border-r border-slate-700">
                    <button 
                        onClick={handleImportNetlist}
                        className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 px-3 py-1.5 rounded transition-colors"
                        title="Import from Engigraph"
                    >
                        <Download size={14} />
                        Engigraph
                    </button>
                    <button 
                        onClick={handleImportAnalogNetlist}
                        className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-3 py-1.5 rounded transition-colors"
                        title="Import from Active Analog Project"
                    >
                        <Download size={14} />
                        Analog Project
                    </button>
                    <button 
                        onClick={handleAutoroute}
                        className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 px-3 py-1.5 rounded transition-colors"
                    >
                        <Zap size={14} />
                        Autoroute Board
                    </button>
                </div>

                {/* Selection Actions */}
                <div className="flex items-center gap-2 pl-2">
                    {selectedIds.length > 0 && (
                        <button 
                            onClick={removeSelected}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded text-xs font-bold transition-colors"
                        >
                            <Trash2 size={14} />
                            DELETE SELECTED
                        </button>
                    )}
                    <button 
                        onClick={() => {
                            if (window.confirm('Are you sure you want to clear the entire board?')) {
                                clearBoard();
                            }
                        }}
                        className="text-xs text-slate-500 hover:text-white px-3 py-1.5 transition-colors"
                    >
                        Clear Board
                    </button>
                </div>
            </div>
        </div>
    );
};
