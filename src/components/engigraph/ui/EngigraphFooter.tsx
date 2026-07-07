import React, { useState } from 'react';
import { useEngigraphStore } from '../store/useEngigraphStore';
import { Zap } from 'lucide-react';

export const EngigraphFooter: React.FC = () => {
    const [command, setCommand] = useState('');
    const store = useEngigraphStore();

    const handleCommandSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cmd = command.trim().toUpperCase();
        const parts = cmd.split(' ');
        const baseCmd = parts[0];

        switch (baseCmd) {
            case 'L':
            case 'LINE':
                store.setActiveTool('line');
                break;
            case 'C':
            case 'CIRCLE':
                store.setActiveTool('circle');
                break;
            case 'R':
            case 'RECT':
                store.setActiveTool('rect');
                break;
            case 'Z':
                if (parts[1] === 'E') {
                    store.setView({ x: 0, y: 0, zoom: 1 });
                } else if (!isNaN(Number(parts[1]))) {
                    store.setView({ zoom: Number(parts[1]) / 100 });
                }
                break;
            case 'GRID':
                if (parts[1] === 'ON') store.setGrid({ snapToGrid: true });
                else if (parts[1] === 'OFF') store.setGrid({ snapToGrid: false });
                else if (!isNaN(Number(parts[1]))) store.setGrid({ gridSize: Number(parts[1]) });
                else store.toggleSnap('snapToGrid');
                break;
            case 'SNAP':
                if (parts[1] === 'ON') store.setGrid({ snapToObject: true });
                else if (parts[1] === 'OFF') store.setGrid({ snapToObject: false });
                else store.toggleSnap('snapToObject');
                break;
            case 'THEME':
                store.toggleTheme();
                break;
            case 'BOM':
                store.generateBOM();
                break;
            case 'EXPORT':
                store.exportProject('json');
                break;
            case 'MV':
            case 'OFFSET':
                if (parts.length >= 3) {
                    const dx = parseFloat(parts[1]);
                    const dy = parseFloat(parts[2]);
                    if (!isNaN(dx) && !isNaN(dy)) {
                        store.selectedIds.forEach(id => {
                            const el = store.elements.find(e => e.id === id);
                            if (el && typeof el.x === 'number' && typeof el.y === 'number') {
                                store.updateElement(id, { x: el.x + dx, y: el.y + dy });
                            }
                        });
                        store.pushTerminalLog(`Moved ${store.selectedIds.length} items by [${dx}, ${dy}]`, 'system');
                    }
                } else {
                    store.pushTerminalLog("Usage: MV <dx> <dy> (e.g. MV 10 -20)", 'system');
                }
                break;
            case 'ROT':
                if (parts.length >= 2) {
                    const deg = parseFloat(parts[1]);
                    if (!isNaN(deg)) {
                        store.selectedIds.forEach(id => {
                            const el = store.elements.find(e => e.id === id);
                            if (el && el.type === 'component') {
                                const newAngle = ((el.currentAngle || 0) + deg) % 360;
                                store.updateElement(id, { currentAngle: newAngle });
                            }
                        });
                        store.pushTerminalLog(`Rotated ${store.selectedIds.length} items by ${deg}°`, 'system');
                    }
                } else {
                    store.pushTerminalLog("Usage: ROT <degrees> (e.g. ROT 90)", 'system');
                }
                break;
            case 'CLS':
            case 'CLEAR':
                if (window.confirm("Wipe workspace? This cannot be undone.")) {
                    store.clearWorkspace();
                    store.pushTerminalLog('Workspace cleared.', 'system');
                }
                break;
            default:
                store.pushTerminalLog(`Unknown command: ${cmd}`, 'system');
                break;
        }

        setCommand('');
    };

    return (
        <footer className="flex h-12 bg-[#1b1d20] border-t border-[#334155] items-center px-4 text-xs shrink-0 z-50 justify-between">
            <div className="flex items-center gap-4 flex-1">
                {/* Command Line Input */}
                <form onSubmit={handleCommandSubmit} className="flex-1 max-w-[400px]">
                    <div className="relative flex items-center w-full bg-[#111] border border-[#333] rounded-md px-3 py-1.5 shadow-inner">
                        <span className="text-[#00ffcc] font-bold mr-2 whitespace-nowrap">ENG:</span>
                        <input
                            type="text"
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            placeholder="Type command (e.g. LINE, CIRCLE)..."
                            className="w-full bg-transparent text-[#00ff00] outline-none placeholder-[#00ff00]/50 font-mono text-xs"
                            style={{ textShadow: '0 0 2px rgba(0, 255, 0, 0.4)' }}
                        />
                    </div>
                </form>

                {/* Toggles (Checkboxes) */}
                <div className="flex items-center gap-4 text-slate-300 ml-2 font-sans text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
                        <input
                            type="checkbox"
                            checked={store.grid.snapToGrid}
                            onChange={() => store.toggleSnap('snapToGrid')}
                            className="w-3.5 h-3.5 accent-blue-500 cursor-pointer"
                        />
                        <span>Grid</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
                        <input
                            type="checkbox"
                            checked={store.grid.snapToObject}
                            onChange={() => store.toggleSnap('snapToObject')}
                            className="w-3.5 h-3.5 accent-blue-500 cursor-pointer"
                        />
                        <span>Obj</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
                        <input
                            type="checkbox"
                            checked={store.grid.orthoMode}
                            onChange={() => store.toggleSnap('orthoMode')}
                            className="w-3.5 h-3.5 accent-blue-500 cursor-pointer"
                        />
                        <span>Ortho</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
                        <input
                            type="checkbox"
                            defaultChecked={true}
                            className="w-3.5 h-3.5 accent-blue-500 cursor-pointer"
                        />
                        <span>AngleUnits: mm</span>
                    </label>
                </div>
            </div>

            {/* Right Side Status Information */}
            <div className="flex items-center gap-6 text-slate-400 font-sans text-xs shrink-0">
                <span>Shortcut: Color [6] applied to selection.</span>

                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1c2e21] border border-[#2e4c36] rounded text-[#4ade80] shadow-inner font-semibold">
                    <Zap size={14} className="text-[#4ade80]" />
                    Online
                </div>
            </div>
        </footer>
    );
};

