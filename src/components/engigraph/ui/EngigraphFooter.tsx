import React, { useState } from 'react';
import { useEngigraphStore } from '../store/useEngigraphStore';

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
            case 'ROT':
            case 'OFFSET':
                console.warn(`Command ${baseCmd} requires coordinate selection logic. Module pending.`);
                break;
            case 'STD':
                const standard = parts[1] || 'SANS';
                console.info(`Switched to drafting standard: ${standard}`);
                break;
            case 'HELP':
                console.info('Available commands: L, C, R, Z E, GRID, SNAP, THEME, BOM, EXPORT, CLS, STD');
                break;
            case 'CLS':
            case 'CLEAR':
                if (window.confirm("Wipe workspace? This cannot be undone.")) {
                    store.clearWorkspace();
                }
                break;
            default:
                console.warn(`Unknown command: ${cmd}`);
                break;
        }

        setCommand('');
    };

    return (
        <footer className="h-8 bg-[#0e0e11] border-t border-slate-700 flex items-center px-4 text-[11px] shrink-0 z-50">
            <div className="flex-1 flex items-center gap-2">
                <span className="text-cyan-500 font-bold tracking-widest uppercase">Command:</span>
                <form onSubmit={handleCommandSubmit} className="flex-1">
                    <input
                        type="text"
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        placeholder="Type a command (e.g. L, CIRCLE, BOM, CLS)..."
                        className="w-full bg-transparent text-slate-200 outline-none placeholder-slate-600 font-mono uppercase"
                    />
                </form>
            </div>
            <div className="flex gap-4 text-slate-500 font-mono text-[10px]">
                <span className="bg-[#1f1f23] px-2 py-0.5 rounded border border-slate-800">
                    {`X: ${store.view.x.toFixed(1)} Y: ${store.view.y.toFixed(1)}`}
                </span>
                <span className="bg-[#1f1f23] px-2 py-0.5 rounded border border-slate-800">
                    {`ZOOM: ${(store.view.zoom * 100).toFixed(0)}%`}
                </span>
                <span className={`px-2 py-0.5 rounded border ${store.grid.snapToGrid ? 'bg-cyan-900/30 text-cyan-400 border-cyan-800' : 'bg-[#1f1f23] border-slate-800'}`}>
                    GRID
                </span>
                <span className={`px-2 py-0.5 rounded border ${store.grid.snapToObject ? 'bg-cyan-900/30 text-cyan-400 border-cyan-800' : 'bg-[#1f1f23] border-slate-800'}`}>
                    SNAP
                </span>
                <span className={`px-2 py-0.5 rounded border ${store.grid.orthoMode ? 'bg-cyan-900/30 text-cyan-400 border-cyan-800' : 'bg-[#1f1f23] border-slate-800'}`}>
                    ORTHO
                </span>
                <span className="bg-indigo-900/30 text-indigo-400 px-2 py-0.5 rounded border border-indigo-800">
                    SANS 10111
                </span>
            </div>
        </footer>
    );
};
