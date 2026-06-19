import { useState } from 'react';
import { Activity, Database, Lock, FileText, Terminal, TrendingUp, X } from 'lucide-react';
import type { LadderState } from '@/lib/plc-types';

interface Props {
  state: LadderState;
  tab: 'watch' | 'cross' | 'forces' | 'trends' | 'logs';
  onTabChange: (t: 'watch' | 'cross' | 'forces' | 'trends' | 'logs') => void;
  onToggleAddress: (addr: string) => void;
  onForceIO: (addr: string, val?: boolean) => void;
  onJumpToNode: (id: string) => void;
}

export function ConsolePanel({ state, tab, onTabChange, onToggleAddress, onForceIO, onJumpToNode }: Props) {
  const [watchAdd, setWatchAdd] = useState('');
  const [watches, setWatches] = useState<string[]>([]);
  const forces = state.simulation.forces || {};
  const values = state.simulation.values;
  const logs = state.simulation.logs;

  const tabs = [
    { id: 'watch' as const, label: 'Watch Table', icon: Activity },
    { id: 'cross' as const, label: 'Cross-Ref', icon: Database },
    { id: 'forces' as const, label: 'Forces', icon: Lock },
    { id: 'trends' as const, label: 'Trends', icon: TrendingUp },
    { id: 'logs' as const, label: 'System Logs', icon: Terminal },
  ];

  const allAddresses = Array.from(new Set([
    ...state.nodes.map(n => n.address),
    ...Object.keys(values),
  ]));

  const addWatch = () => {
    if (watchAdd && !watches.includes(watchAdd)) {
      setWatches([...watches, watchAdd]);
      setWatchAdd('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0b0e] text-slate-300 font-mono text-[11px] select-none">
      {/* Tab bar */}
      <div className="h-8 flex items-center border-b border-white/5 bg-[#07080b] px-2 gap-0.5">
        {tabs.map(t => (
          <button key={t.id} onClick={() => onTabChange(t.id)}
            className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
              tab === t.id ? 'bg-[#14161d] text-sky-400 border-t-2 border-sky-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
            }`}>
            <t.icon size={10} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {/* Watch Table */}
        {tab === 'watch' && (
          <div className="h-full flex flex-col p-3">
            <div className="flex gap-2 mb-3">
              <input value={watchAdd} onChange={e => setWatchAdd(e.target.value)} onKeyDown={e => e.key === 'Enter' && addWatch()}
                className="flex-1 bg-[#111218] border border-zinc-800 rounded px-3 py-1 text-[10px] text-white outline-none focus:border-blue-500 font-mono"
                placeholder="Add address (e.g. I:0/1, O:0/1, T4:0/ACC)..." />
              <button onClick={addWatch} className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded text-[10px] font-bold text-blue-400 hover:bg-blue-600/30 transition-colors">Add</button>
            </div>
            <div className="flex-1 overflow-y-auto border border-white/5 rounded bg-[#0c0d12]">
              <table className="w-full text-left">
                <thead className="bg-[#07080b] text-zinc-500 text-[8px] font-black uppercase tracking-widest sticky top-0">
                  <tr><th className="px-3 py-2">Address</th><th className="px-3 py-2">Value</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/40">
                  {watches.map(addr => {
                    const val = values[addr];
                    const isForced = forces[addr] !== undefined;
                    const node = state.nodes.find(n => n.address === addr);
                    return (
                      <tr key={addr} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-3 py-2 text-[10px] font-bold text-sky-400">{addr}</td>
                        <td className="px-3 py-2">
                          <span className={`text-[10px] font-black ${val ? 'text-emerald-400' : 'text-zinc-500'}`}>{String(val)}</span>
                        </td>
                        <td className="px-3 py-2 text-[9px] text-zinc-500">{node?.type || 'DATA'}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            {isForced && <span className="px-1 py-0.5 bg-amber-500 text-black text-[7px] font-black rounded">FORCED</span>}
                            <button onClick={() => onToggleAddress(addr)} className="text-[8px] text-zinc-500 hover:text-white transition-colors">TOGGLE</button>
                            <button onClick={() => onForceIO(addr, isForced ? undefined : !val)} className="text-[8px] text-amber-500 hover:text-amber-400 transition-colors">FORCE</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {watches.length === 0 && (
                    <tr><td colSpan={4} className="px-3 py-8 text-center text-[10px] text-zinc-600">No watch entries. Add an address above to monitor.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Cross-Reference */}
        {tab === 'cross' && (
          <div className="h-full overflow-y-auto p-3">
            <div className="grid grid-cols-3 gap-3">
              {allAddresses.map(addr => {
                const nodes = state.nodes.filter(n => n.address === addr);
                const node = nodes[0];
                const val = values[addr];
                return (
                  <div key={addr} className="bg-[#0c0d12] border border-white/5 rounded p-3 hover:border-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-sky-400">{addr}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-black ${val ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>{String(val)}</span>
                    </div>
                    <div className="text-[9px] text-zinc-500 mb-1">{node?.tag || 'UNNAMED'}</div>
                    <div className="text-[8px] text-zinc-600">{nodes.length} reference{nodes.length !== 1 ? 's' : ''}</div>
                    <div className="mt-2 space-y-1">
                      {nodes.map(n => (
                        <button key={n.id} onClick={() => onJumpToNode(n.id)}
                          className="text-[8px] text-blue-400 hover:text-blue-300 hover:underline transition-colors">
                          {n.type} @ ({n.x}, {n.y})
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Forces */}
        {tab === 'forces' && (
          <div className="h-full overflow-y-auto p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Forces</span>
              <div className="flex items-center gap-2">
                <span className={`text-[8px] px-2 py-1 rounded font-black ${state.simulation.forcesEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {state.simulation.forcesEnabled ? 'FORCES ENABLED' : 'FORCES DISABLED'}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              {Object.entries(forces).map(([addr, val]) => (
                <div key={addr} className="flex items-center justify-between bg-[#11131c] border border-white/5 rounded p-2 px-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-sky-400">{addr}</span>
                    <span className="text-[9px] text-zinc-500">= {String(val)}</span>
                  </div>
                  <button onClick={() => onForceIO(addr, undefined)}
                    className="text-[8px] text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded transition-colors">REMOVE</button>
                </div>
              ))}
              {Object.keys(forces).length === 0 && (
                <div className="text-center py-8 text-[10px] text-zinc-600">No active forces. Right-click on I/O to force values.</div>
              )}
            </div>
          </div>
        )}

        {/* Trends */}
        {tab === 'trends' && (
          <div className="h-full overflow-y-auto p-3">
            <div className="text-center py-8 text-[10px] text-zinc-600">
              <TrendingUp size={24} className="mx-auto mb-2 text-zinc-700" />
              <p>Trend charts will be displayed here when simulation is running.</p>
              <p className="mt-1 text-[9px] text-zinc-700">Add addresses to watch table to track trends.</p>
            </div>
          </div>
        )}

        {/* Logs */}
        {tab === 'logs' && (
          <div className="h-full overflow-y-auto p-3 space-y-1">
            {logs.map(log => (
              <div key={log.id} className={`flex items-start gap-2 px-3 py-2 rounded text-[9px] font-mono ${
                log.type === 'error' ? 'bg-red-900/20 text-red-300 border border-red-500/10' :
                log.type === 'warning' ? 'bg-amber-900/20 text-amber-300 border border-amber-500/10' :
                'bg-[#0c0d12] text-zinc-400 border border-white/5'
              }`}>
                <span className="text-[8px] text-zinc-600 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span className={`text-[8px] font-bold uppercase shrink-0 ${log.type === 'error' ? 'text-red-400' : log.type === 'warning' ? 'text-amber-400' : 'text-zinc-500'}`}>
                  {log.type}
                </span>
                <span>{log.message}</span>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-center py-8 text-[10px] text-zinc-600">No system logs yet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
