import React, { useState } from 'react';
import { Database, Search, Filter, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { LadderState } from '@/lib/plc-types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TagManagerProps {
  state: LadderState;
  onUpdateTag: (address: string, newTag: string) => void;
  onDeleteTag: (address: string) => void;
}

export function TagManager({ state, onUpdateTag, onDeleteTag }: TagManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'INPUT' | 'OUTPUT' | 'TIMER' | 'COUNTER' | 'FORCED'>('ALL');
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Extract all unique addresses from the nodes
  const allTags = Array.from(new Set([
    ...state.nodes.map(n => n.address),
    ...Object.keys(state.simulation.forces || {})
  ])).map(addr => {
    const node = state.nodes.find(n => n.address === addr);
    const isForced = state.simulation.forces && state.simulation.forces[addr] !== undefined;
    
    return {
      address: addr,
      tag: node?.tag || (isForced ? 'FORCED_IO' : 'UNNAMED'),
      type: addr.startsWith('I:') ? 'INPUT' : 
            addr.startsWith('O:') ? 'OUTPUT' : 
            addr.startsWith('T4:') ? 'TIMER' : 
            addr.startsWith('C5:') ? 'COUNTER' : 
            addr.startsWith('B3:') ? 'BINARY' : 'DATA',
      value: state.simulation.values[addr],
      isForced
    };
  });

  const filteredTags = allTags.filter(t => {
    const matchesSearch = t.tag.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         t.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'ALL' || 
                         (filterType === 'FORCED' ? t.isForced : t.type === filterType);
    return matchesSearch && matchesFilter;
  });

  const startEditing = (address: string, currentTag: string) => {
    setEditingAddress(address);
    setEditValue(currentTag);
  };

  const saveEdit = () => {
    if (editingAddress) {
      onUpdateTag(editingAddress, editValue);
      setEditingAddress(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0b0e] overflow-hidden font-sans text-slate-300">
      {/* Search & Header panel (Dark glass) */}
      <div className="bg-[#0f111a]/90 border-b border-white/5 p-4 shrink-0 flex flex-col gap-3.5 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-lg">
              <Database size={16} />
            </div>
            <div className="text-left">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-100 font-mono">Controller Tag Database</h2>
              <p className="text-[9.5px] text-zinc-500 font-bold select-none mt-0.5">Manage all active register symbols and offline physical mappings</p>
            </div>
          </div>
          <div className="text-[9px] font-mono font-black text-cyan-400 bg-cyan-950/40 border border-cyan-800/30 px-2 py-0.5 rounded tracking-wide">
             MEM_DB_SYNCED
          </div>
        </div>

        <div className="flex gap-2">
          {/* Tag search bar */}
          <div className="relative flex-1">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search Tag Name or Register Address (e.g. START_LIMIT, I:0/1)..."
              className="w-full pl-8 pr-4 py-1.5 bg-[#08090d] border border-white/5 hover:border-white/10 rounded-lg text-xs text-white focus:ring-1 focus:ring-sky-500 outline-none transition-all placeholder-zinc-650 font-mono"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* Quick select filter tag type */}
          <select 
            className="px-3 bg-[#08090d] border border-white/5 rounded-lg text-xs font-bold text-zinc-400 hover:text-white outline-none font-mono cursor-pointer transition-colors"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
          >
            <option value="ALL">ALL REGISTERS</option>
            <option value="INPUT">INPUTS (I)</option>
            <option value="OUTPUT">OUTPUTS (O)</option>
            <option value="TIMER">TIMERS (T4)</option>
            <option value="COUNTER">COUNTERS (C5)</option>
            <option value="FORCED">FORCED ONLY</option>
          </select>
        </div>
      </div>

      {/* Main Tag Grid & Table Zone */}
      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        <div className="border border-white/5 bg-[#0c0d12]/45 rounded-xl overflow-hidden shadow-2xl">
          <table className="w-full border-collapse text-left">
            <thead className="bg-[#07080b] border-b border-white/5 text-zinc-500 text-[8.5px] font-mono font-extrabold uppercase tracking-widest sticky top-0 z-10 select-none">
              <tr>
                <th className="px-5 py-2.5">Class / Type</th>
                <th className="px-5 py-2.5">Symbolic Tag Name</th>
                <th className="px-5 py-2.5">Hardware Address</th>
                <th className="px-5 py-2.5">Live Value</th>
                <th className="px-5 py-2.5 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/40 text-[10px] font-mono">
              {filteredTags.map((tag) => (
                <tr key={tag.address} className="hover:bg-white/[0.01] transition-colors group">
                  {/* Category Type Pill */}
                  <td className="px-5 py-3 select-none">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border",
                      tag.type === 'INPUT' ? "bg-amber-500/10 text-amber-400 border-amber-500/15" :
                      tag.type === 'OUTPUT' ? "bg-blue-500/10 text-blue-400 border-blue-500/15" :
                      tag.type === 'TIMER' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/15" :
                      tag.type === 'COUNTER' ? "bg-purple-500/10 text-purple-400 border-purple-500/15" :
                      "bg-zinc-800/30 text-zinc-400 border-zinc-700/20"
                    )}>
                      {tag.type}
                    </span>
                  </td>

                  {/* Tag Name Label or Input Editor */}
                  <td className="px-5 py-3">
                    {editingAddress === tag.address ? (
                      <div className="flex items-center gap-1.5 max-w-xs">
                         <input 
                           autoFocus
                           className="px-2 py-0.5 bg-black border border-sky-500 text-sky-400 rounded text-[10px] w-full outline-none font-bold placeholder-zinc-700"
                           value={editValue}
                           onChange={(e) => setEditValue(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                         />
                         <button onClick={saveEdit} className="text-emerald-400 hover:bg-emerald-500/10 p-1 rounded transition-colors" title="Save Symbol"><Check size={11} /></button>
                         <button onClick={() => setEditingAddress(null)} className="text-red-400 hover:bg-red-500/10 p-1 rounded transition-colors" title="Cancel"><X size={11} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-[10.5px] font-bold text-slate-100 tracking-wide font-sans">{tag.tag}</span>
                        {tag.isForced && (
                          <span className={cn(
                            "px-1 rounded text-[7px] font-extrabold uppercase",
                            state.simulation.forcesEnabled ? "bg-amber-500 text-black font-black" : "bg-zinc-700 text-zinc-400"
                          )}>
                            FORCED
                          </span>
                        )}
                        <button onClick={() => startEditing(tag.address, tag.tag)} className="opacity-0 group-hover:opacity-100 text-zinc-550 hover:text-sky-450 p-1 rounded transition-all" title="Rename Tag Designation"><Edit2 size={10} /></button>
                      </div>
                    )}
                  </td>

                  {/* Physics Address */}
                  <td className="px-5 py-3 select-all">
                    <span className="text-[9.5px] text-[#2271df] bg-[#0c121f] border border-white/5 px-1.5 py-0.5 rounded font-bold">
                      {tag.address}
                    </span>
                  </td>

                  {/* Value Column */}
                  <td className="px-5 py-3 select-none">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full select-none",
                        tag.value ? "bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-pulse" : "bg-zinc-800"
                      )} />
                      <span className={cn(
                        "font-extrabold text-[9px] tabular-nums",
                        tag.value ? "text-slate-100" : "text-zinc-500"
                      )}>
                         {typeof tag.value === 'boolean' ? (tag.value ? 'REAL_1' : 'REAL_0') : tag.value?.toString() || '0'}
                      </span>
                    </div>
                  </td>

                  {/* Actions Column */}
                  <td className="px-5 py-3 text-right">
                    <button 
                      onClick={() => onDeleteTag(tag.address)}
                      className="p-1 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                      title="Clear database registration"
                    >
                      <Trash2 size={11} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTags.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center select-none text-zinc-600 italic">
                     <div className="flex flex-col items-center gap-1.5 tracking-tight">
                        <Database size={24} className="opacity-40 animate-pulse text-zinc-650" />
                        <p className="text-[10px] font-bold text-zinc-500">Search Yielded No Matching Address</p>
                        <p className="text-[9px] text-zinc-600">Double check filter constraints or tag name characters.</p>
                     </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Telemetry bottom bar */}
      <div className="bg-[#08090d] text-zinc-600 p-2 text-[8.5px] font-mono flex justify-between tracking-tighter select-none shrink-0 border-t border-white/5 opacity-85">
         <span>PLC MEMORY ALLOCATION: <span className="text-zinc-500 font-bold">{(allTags.length * 4).toFixed(2)} KB</span> / 64.00 KB</span>
         <span className="text-sky-500 font-bold">REGISTRY_CAPACITY: MAXIMUM_INTEGRITY</span>
      </div>
    </div>
  );
}
