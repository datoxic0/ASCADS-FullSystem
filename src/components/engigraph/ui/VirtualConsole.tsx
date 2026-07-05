import React, { useState, useRef, useEffect } from 'react';
import { useEngigraphStore } from '../store/useEngigraphStore';

export const VirtualConsole: React.FC = () => {
    const { terminalHistory, pushTerminalLog, toggleTerminal, elements, updateElement } = useEngigraphStore();
    const [input, setInput] = useState('');
    const endRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [terminalHistory]);

    const handleCommand = (cmd: string) => {
        const trimmed = cmd.trim();
        if (!trimmed) return;

        pushTerminalLog(`> ${trimmed}`, 'user');
        
        const parts = trimmed.toLowerCase().split(' ');
        const action = parts[0];

        switch(action) {
            case 'help':
                pushTerminalLog('Available commands: help, set <id> <state>, list', 'system');
                break;
            case 'list':
                pushTerminalLog(`Found ${elements.length} elements in current workspace.`, 'system');
                elements.forEach(el => pushTerminalLog(`- ${el.id} (${el.type}/${el.partType || 'n/a'})`, 'data'));
                break;
            case 'set':
                if (parts.length >= 3) {
                    const id = parts[1];
                    const stateStr = parts[2];
                    const el = elements.find(e => e.id === id);
                    if (el) {
                        updateElement(id, { state: stateStr });
                        pushTerminalLog(`Updated ${id} state to '${stateStr}'`, 'system');
                    } else {
                        pushTerminalLog(`Element '${id}' not found.`, 'system');
                    }
                } else {
                    pushTerminalLog('Usage: set <id> <state> (e.g. set obj-123 closed)', 'system');
                }
                break;
            default:
                pushTerminalLog(`Unknown command: '${action}'. Type 'help' for available commands.`, 'system');
                break;
        }

        setInput('');
    };

    return (
        <div className="absolute bottom-10 left-4 w-[600px] h-[300px] bg-slate-900/90 border border-slate-700/50 rounded-lg shadow-2xl flex flex-col z-50 backdrop-blur-xl">
            <header className="flex items-center justify-between px-3 py-2 bg-slate-950/80 rounded-t-lg border-b border-slate-700/50 cursor-move">
                <span className="text-xs font-bold text-slate-300 tracking-widest uppercase">Virtual Console</span>
                <button onClick={toggleTerminal} className="text-slate-500 hover:text-white">&times;</button>
            </header>
            <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-1">
                {terminalHistory.map((log) => (
                    <div key={log.id} className={`${
                        log.type === 'user' ? 'text-white' : 
                        log.type === 'data' ? 'text-cyan-400' : 'text-emerald-400'
                    }`}>
                        {log.text}
                    </div>
                ))}
                <div ref={endRef} />
            </div>
            <footer className="p-2 border-t border-slate-700/50 bg-slate-950/80 rounded-b-lg flex gap-2">
                <input 
                    type="text" 
                    placeholder="Enter command (e.g. 'help')..." 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCommand(input);
                    }}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono transition-colors" 
                />
                <button 
                    onClick={() => handleCommand(input)}
                    className="bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 border border-cyan-700/50 text-xs px-4 rounded font-bold uppercase tracking-wider transition-colors"
                >
                    Send
                </button>
            </footer>
        </div>
    );
};
