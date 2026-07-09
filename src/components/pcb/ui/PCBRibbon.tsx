import React, { useEffect } from 'react';
import { usePCBStore } from '../store/usePCBStore';
import { MousePointer2, GitCommit, Search, PlusSquare, Trash2, Crosshair, Map, Download, Zap, Archive, Cpu, Box, LayoutGrid } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { FootprintLibrary } from '../lib/FootprintLibrary';
import { useEngigraphStore } from '../../engigraph/store/useEngigraphStore';
import { PCBAutorouter } from '../solvers/PCBAutorouter';
import { loadProjects, getActiveProjectId } from '../../../lib/analog-storage';
import { PCBGerberCompiler } from '../services/PCBGerberCompiler';

export const PCBRibbon: React.FC = () => {
    const { activeTool, setTool, addFootprint, removeSelected, selectedIds, clearBoard, viewMode, setViewMode } = usePCBStore();

    useEffect(() => {
        const raw = localStorage.getItem('ascads_bridge_analog_pcb');
        if (raw) {
            try {
                const design = JSON.parse(raw);
                if (design && design.components) {
                    clearBoard();
                    
                    const components = design.components;
                    const connections = design.connections || [];
            
                    const pcbNets = connections.map((conn: any) => ({
                        id: conn.id,
                        name: `Net-${conn.id.substring(0, 4)}`,
                        nodes: [
                            { footprintId: conn.from, padId: String(conn.fromPin || '1') },
                            { footprintId: conn.to, padId: String(conn.toPin || '2') }
                        ]
                    }));
            
                    usePCBStore.getState().setNets(pcbNets);
            
                    let xOff = 10;
                    let yOff = 40;
                    components.forEach((c: any) => {
                        let fpId = 'DIP-8';
                        if (c.type === 'RESISTOR') fpId = '0805';
                        if (c.type === 'CAPACITOR') fpId = '1206';
                        if (c.type === 'SWITCH' || c.type === 'BATTERY') fpId = 'PinHeader-1x2';
            
                        usePCBStore.getState().addFootprint({
                            id: c.id,
                            footprintId: fpId,
                            x: xOff,
                            y: yOff,
                            rotation: c.rotation || 0,
                            layer: 'top',
                            refDes: `${(c.type || 'U').substring(0, 1).toUpperCase()}${c.id.substring(0, 4)}`
                        });
            
                        xOff += 15;
                        if (xOff > 120) {
                            xOff = 10;
                            yOff += 15;
                        }
                    });
                }
            } catch (err) {
                console.error("Failed to parse cross-lab bridging payload for PCB Lab", err);
            }
            // Clear payload after ingestion
            localStorage.removeItem('ascads_bridge_analog_pcb');
        }
    }, [clearBoard]);

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

    // Engigraph import removed as Engigraph uses elements, not nets directly

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

    const handleExportGerber = () => {
        const state = usePCBStore.getState();
        const gtl = PCBGerberCompiler.compileGTL(state);
        const gto = PCBGerberCompiler.compileGTO(state);
        const drl = PCBGerberCompiler.compileDRL(state);
        const payload = JSON.stringify({ gtl, gto, drl }, null, 2);
        
        const blob = new Blob([payload], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ASCAD_Gerber_${Date.now()}.json`;
        link.click();
    };

    const handleExportGCode = () => {
        const state = usePCBStore.getState();
        const gcode = PCBGerberCompiler.generateGCode(state);
        const blob = new Blob([gcode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ASCAD_IsolationRouting_${Date.now()}.gcode`;
        link.click();
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

                {/* Add Footprints Select */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Library:</span>
                    <select 
                        onChange={(e) => {
                            if (e.target.value) {
                                handleAddFootprint(e.target.value);
                                e.target.value = '';
                            }
                        }}
                        className="text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-1 outline-none focus:border-teal-500"
                    >
                        <option value="">+ Add Component</option>
                        {Object.keys(FootprintLibrary).map(fpId => (
                            <option key={fpId} value={fpId}>{FootprintLibrary[fpId].name}</option>
                        ))}
                    </select>
                </div>

                <div className="w-px h-6 bg-slate-700 mx-2" />

                {/* View Mode Toggle */}
                <div className="flex bg-[#12141a] p-0.5 rounded-lg border border-white/5">
                    <button
                        onClick={() => setViewMode(viewMode === '2d' ? '3d' : '2d')}
                        className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold rounded transition-all active:scale-95 ${
                            viewMode === '3d' 
                                ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-md shadow-indigo-500/20' 
                                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                        }`}
                        title={viewMode === '3d' ? "Switch to 2D Routing" : "Switch to 3D Viewer"}
                    >
                        {viewMode === '3d' ? <LayoutGrid size={14} /> : <Box size={14} />}
                        <span className="tracking-wider uppercase">{viewMode === '3d' ? '2D Editor' : '3D View'}</span>
                    </button>
                </div>

                <div className="flex-1" />

                {/* System Actions */}
                <div className="flex items-center gap-1.5 pr-4 border-r border-slate-700">
                    {/* Removed Engigraph Netlist Import */}
                    <button 
                        onClick={handleImportAnalogNetlist}
                        className="p-1.5 rounded-lg flex items-center justify-center transition-all bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/30 hover:scale-105"
                        title="Import from Active Analog Project"
                        aria-label="Import from Analog Project"
                    >
                        <Download size={16} />
                    </button>
                    <div className="w-px h-4 bg-slate-700 mx-1" />
                    <button 
                        onClick={handleAutoroute}
                        className="p-1.5 rounded-lg flex items-center justify-center transition-all bg-orange-500/10 text-orange-400 hover:bg-orange-500/30 hover:scale-105"
                        title="Autoroute Board (Manhattan Distance)"
                        aria-label="Autoroute Board"
                    >
                        <Zap size={16} />
                    </button>
                    <div className="w-px h-4 bg-slate-700 mx-1" />
                    <button 
                        onClick={handleExportGerber}
                        className="p-1.5 rounded-lg flex items-center justify-center transition-all bg-purple-500/10 text-purple-400 hover:bg-purple-500/30 hover:scale-105"
                        title="Export RS-274X Gerber Files (.json payload)"
                        aria-label="Export Gerber"
                    >
                        <Archive size={16} />
                    </button>
                    <button 
                        onClick={handleExportGCode}
                        className="p-1.5 rounded-lg flex items-center justify-center transition-all bg-pink-500/10 text-pink-400 hover:bg-pink-500/30 hover:scale-105"
                        title="Export G-Code for CNC Isolation Routing"
                        aria-label="Export G-Code"
                    >
                        <Cpu size={16} />
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
