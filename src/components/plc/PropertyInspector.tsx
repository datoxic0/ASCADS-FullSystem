import React from 'react';
import { 
  Settings, 
  Trash2, 
  Tag, 
  MapPin, 
  Clock,
  ChevronDown,
  Activity,
  FileText,
  Info,
  Database,
  Cpu,
  Monitor,
  TrendingUp
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LadderNode, LadderState } from '@/lib/plc-types';
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  ResponsiveContainer,
  YAxis
} from 'recharts';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PropertyInspectorProps {
  selectedNode: LadderNode | null;
  values: Record<string, boolean | number>;
  history: Record<string, number[]>;
  onUpdate: (id: string, updates: Partial<LadderNode>) => void;
  onDelete: (id: string) => void;
  onForceIO: (address: string, value?: boolean) => void;
  onJumpToNode?: (id: string) => void;
  forces: Record<string, boolean | number>;
  nodes?: LadderNode[]; // Added for cross-reference
  isEmbedded?: boolean;
}

export function PropertyInspector({ selectedNode, values, history, onUpdate, onDelete, onForceIO, onJumpToNode, forces, nodes = [], isEmbedded }: PropertyInspectorProps) {
  if (!selectedNode) {
    if (isEmbedded) return null;
    return (
      <div className="h-full bg-zinc-950 flex flex-col items-center justify-center p-8 text-center text-zinc-600 select-none">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-2xl">
          <Settings size={24} className="opacity-20" />
        </div>
        <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-40">System Idle</p>
        <p className="text-[9px] mt-2 opacity-30">Select an element to inspect kernel parameters</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-zinc-950 flex flex-col text-[11px] select-none h-full",
      !isEmbedded ? "border-l border-zinc-800/50 z-20" : "w-full"
    )}>
      {!isEmbedded && (
        <div className="p-4 bg-black/40 font-black border-b border-zinc-800 flex justify-between items-center text-zinc-400 tracking-widest text-[10px] uppercase">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Property Inspector
          </div>
          <button 
            onClick={() => onDelete(selectedNode.id)}
            className="p-1.5 hover:bg-red-500/10 text-zinc-600 hover:text-red-500 rounded-lg transition-all"
            title="Remove Component"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      <div className={cn("flex-1 space-y-4 overflow-y-auto custom-scrollbar font-sans", !isEmbedded ? "p-4" : "")}>
        {/* Header Section */}
        <div className="pb-3 border-b border-zinc-800/50">
           <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                 <div className="px-1.5 py-0.5 bg-blue-600/20 border border-blue-500/50 rounded text-[8px] font-black text-blue-400 uppercase tracking-tighter">
                   {selectedNode.type.split('-')[0]}
                 </div>
                 <span className="text-zinc-600 font-mono text-[8px] tracking-widest">{selectedNode.id.slice(0, 8)}</span>
              </div>
              <div className="flex items-center gap-1">
                 <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-[7.5px] font-bold text-zinc-500 uppercase tracking-tighter">Synchronized</span>
              </div>
           </div>
           <h3 className="text-lg font-black text-white tracking-tight leading-none mb-1">
             {selectedNode.type.toUpperCase().replace('COIL-', '').replace('-', ' ')}
           </h3>
           <p className="text-[9px] text-zinc-500 font-medium">Standard IEC-61131 Logic Primitive</p>
        </div>

        <div className="space-y-4">
          {/* General Properties Section */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-1.5 mb-1.5">
               <Info size={9} className="text-blue-500" />
               <span className="text-[8.5px] font-black text-zinc-500 uppercase tracking-[0.2em]">Identification</span>
            </div>
            
            <div className="space-y-1">
              <label className="text-[7.5px] font-black text-zinc-600 uppercase tracking-widest pl-0.5">Symbolic Tag</label>
              <div className="relative group/tag">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-650 group-focus-within/tag:text-blue-500 transition-colors">
                  <Tag size={10} />
                </div>
                <input 
                  type="text"
                  value={selectedNode.tag}
                  onChange={(e) => onUpdate(selectedNode.id, { tag: e.target.value })}
                  className="w-full bg-[#111218] border border-zinc-800 rounded-md py-1.5 pl-8 pr-3 text-zinc-100 focus:border-blue-500 outline-none transition-all font-bold text-[10.5px]"
                  placeholder="PLC_SYMBOL_01"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[7.5px] font-black text-zinc-600 uppercase tracking-widest pl-0.5">Hardware Address</label>
              <div className="relative group/addr">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-650 group-focus-within/addr:text-blue-500 transition-colors">
                  <MapPin size={10} />
                </div>
                <input 
                  type="text"
                  value={selectedNode.address}
                  onChange={(e) => onUpdate(selectedNode.id, { address: e.target.value })}
                  className="w-full bg-black/40 border border-zinc-800 rounded-md py-1.5 pl-8 pr-3 text-sky-400 focus:border-blue-500 outline-none transition-all font-mono font-bold text-[10.5px]"
                />
              </div>
            </div>
          </section>

          {/* Logic Forcing Section */}
          <section className="space-y-3 p-3 bg-zinc-900/40 border border-zinc-800/50 rounded-lg">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                   <Activity size={9} className="text-amber-500" />
                   <span className="text-[8.5px] font-black text-zinc-500 uppercase tracking-[0.2em]">Live Interaction</span>
                </div>
                <span className={cn(
                  "text-[7px] font-black px-1.5 py-0.5 rounded uppercase",
                  forces[selectedNode.address] !== undefined ? "bg-amber-500 text-black shadow-[0_0_8px_rgba(245,158,11,0.4)]" : "bg-zinc-800 text-zinc-500"
                )}>
                  {forces[selectedNode.address] !== undefined ? "FORCED" : "UNLOCKED"}
                </span>
             </div>

             <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => onForceIO(selectedNode.address, forces[selectedNode.address] === undefined ? !values[selectedNode.address] : undefined)}
                  className={cn(
                    "flex flex-col items-center justify-center py-2.5 px-1 rounded-lg border transition-all gap-1 group/force",
                    forces[selectedNode.address] !== undefined 
                      ? "bg-amber-500 border-amber-400 text-black font-extrabold" 
                      : "bg-[#111218] border-zinc-800 text-zinc-500 hover:border-amber-500/50 hover:text-amber-500/50"
                  )}
                >
                  <Activity size={12} className={cn(forces[selectedNode.address] !== undefined && "animate-pulse")} />
                  <span className="text-[8px] font-black uppercase tracking-tight">Force Override</span>
                </button>

                <button 
                  className="flex flex-col items-center justify-center py-2.5 px-1 rounded-lg border border-zinc-805 bg-[#111218] text-zinc-500 hover:text-blue-500 hover:border-blue-500/50 transition-all gap-1"
                >
                  <Monitor size={12} />
                  <span className="text-[8px] font-black uppercase tracking-tight">Pulse Test</span>
                </button>
             </div>

             {/* Status Bits Display */}
             <div className="pt-2 border-t border-zinc-800 grid grid-cols-3 gap-1.5">
                {selectedNode.type.startsWith('timer') ? (
                  <>
                    <div className="flex flex-col items-center gap-0.5">
                      <div className={cn("w-full h-0.5 rounded-full", values[`${selectedNode.address}_EN`] ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-zinc-800")} />
                      <span className="text-[6.5px] font-black text-zinc-650">EN</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <div className={cn("w-full h-0.5 rounded-full", values[`${selectedNode.address}_TT`] ? "bg-blue-500 shadow-[0_0_8px_#3b82f6]" : "bg-zinc-800")} />
                      <span className="text-[6.5px] font-black text-zinc-650">TT</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <div className={cn("w-full h-0.5 rounded-full", values[`${selectedNode.address}_DN`] ? "bg-[#10b981] shadow-[0_0_8px_#10b981]" : "bg-zinc-800")} />
                      <span className="text-[6.5px] font-black text-zinc-650">DN</span>
                    </div>
                  </>
                ) : selectedNode.type.startsWith('counter') ? (
                  <>
                    <div className="flex flex-col items-center gap-0.5">
                      <div className={cn("w-full h-0.5 rounded-full", values[`${selectedNode.address}_CU`] ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-zinc-800")} />
                      <span className="text-[6.5px] font-black text-zinc-650">CU</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <div className={cn("w-full h-0.5 rounded-full", values[`${selectedNode.address}_CD`] ? "bg-blue-500 shadow-[0_0_8px_#3b82f6]" : "bg-zinc-800")} />
                      <span className="text-[6.5px] font-black text-zinc-650">CD</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <div className={cn("w-full h-0.5 rounded-full", values[`${selectedNode.address}_DN`] ? "bg-[#10b981] shadow-[0_0_8px_#10b981]" : "bg-zinc-800")} />
                      <span className="text-[6.5px] font-black text-zinc-650">DN</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col items-center gap-0.5">
                      <div className={cn("w-full h-0.5 rounded-full", values[selectedNode.address] ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-zinc-800")} />
                      <span className="text-[6.5px] font-black text-zinc-650">STATE</span>
                    </div>
                    <div className="flex flex-col col-span-2 items-center gap-0.5">
                      <div className={cn("w-full h-0.5 rounded-full", forces[selectedNode.address] !== undefined ? "bg-amber-500" : "bg-zinc-800")} />
                      <span className="text-[6.5px] font-black text-zinc-650 uppercase">Forced Status</span>
                    </div>
                  </>
                )}
             </div>
          </section>

          {/* Configuration Parameters */}
          {(selectedNode.type.startsWith('timer') || selectedNode.type.startsWith('counter')) && (
            <section className="space-y-2.5">
               <div className="flex items-center gap-1.5 mb-1">
                  <Cpu size={9} className="text-purple-500" />
                  <span className="text-[8.5px] font-black text-zinc-500 uppercase tracking-[0.2em]">Kernel Parameters</span>
               </div>
               <div className="p-3 bg-blue-500/5 border border-blue-500/15 rounded-lg space-y-2.5">
                  <div className="space-y-1">
                     <div className="flex justify-between items-center">
                        <label className="text-[7.5px] font-black text-blue-400/60 uppercase tracking-widest pl-0.5 flex gap-2 items-center">
                          {selectedNode.type.startsWith('timer') ? 'Preset Delay' : 'Target Terminal Count'}
                          {selectedNode.type.startsWith('timer') && (
                            <select 
                              value={selectedNode.params?.timeBase || 's'}
                              onChange={(e) => onUpdate(selectedNode.id, {
                                params: { ...selectedNode.params, timeBase: e.target.value as 'ms' | 's' }
                              })}
                              className="bg-black/40 border border-blue-500/30 text-blue-400 rounded px-1 outline-none font-mono text-[8px]"
                            >
                              <option value="s">Sec</option>
                              <option value="ms">ms</option>
                            </select>
                          )}
                        </label>
                        <Clock size={10} className="text-blue-500/30" />
                     </div>
                     <div className="relative">
                       <input 
                         type="number"
                         value={selectedNode.params?.preset || 0}
                         onChange={(e) => onUpdate(selectedNode.id, { 
                           params: { ...selectedNode.params, preset: parseInt(e.target.value) || 0 } 
                         })}
                         className="w-full bg-black/60 border border-blue-500/20 rounded-md p-1.5 text-white font-mono text-center text-sm font-bold focus:border-blue-500 outline-none transition-all shadow-inner"
                       />
                     </div>
                  </div>
               </div>
            </section>
          )}

          {/* Physical Device Linker for Coils */}
          {selectedNode.type.startsWith('coil') && (
            <section className="space-y-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Cpu size={9} className="text-pink-400" />
                <span className="text-[8.5px] font-black text-zinc-500 uppercase tracking-[0.2em]">Physical Device Linker</span>
              </div>
              <div className="p-3 bg-pink-500/5 border border-pink-500/15 rounded-lg space-y-2.5">
                <div className="space-y-1">
                  <label className="text-[7.5px] font-black text-pink-400/80 uppercase tracking-widest pl-0.5">
                    Simulated Output Device Mapped Profile
                  </label>
                  <select
                    value={selectedNode.deviceProfile?.deviceType || 'none'}
                    onChange={(e) => {
                      const deviceType = e.target.value as any;
                      onUpdate(selectedNode.id, {
                        deviceProfile: {
                          deviceType,
                          feedbackAddr1: selectedNode.deviceProfile?.feedbackAddr1 || '',
                          feedbackAddr2: selectedNode.deviceProfile?.feedbackAddr2 || '',
                          transitTimeMs: selectedNode.deviceProfile?.transitTimeMs || 1000,
                          currentPercent: selectedNode.deviceProfile?.currentPercent || 0
                        }
                      });
                    }}
                    className="w-full bg-[#111218] border border-zinc-800 rounded-md p-1.5 text-zinc-300 font-bold outline-none focus:border-pink-500 transition-all text-[10px]"
                  >
                    <option value="none">❌ No Linked Simulation</option>
                    <option value="motor">⚡ 3-Phase Electric Motor</option>
                    <option value="piston">⚙️ Pneumatic Actuator Cylinder</option>
                    <option value="valve">💧 Solenoid Gate Pipe Valve</option>
                    <option value="light">🚨 Tri-Color Safety Stack Light</option>
                    <option value="siren">🔊 Warning Horn & Rotating Siren</option>
                    <option value="heater">🔥 Calrod Thermoelectric Heater</option>
                  </select>
                </div>

                {selectedNode.deviceProfile && selectedNode.deviceProfile.deviceType !== 'none' && (
                  <div className="space-y-2.5 pt-2.5 border-t border-zinc-800 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="space-y-1">
                      <label className="text-[7.5px] font-black text-zinc-500 uppercase tracking-widest pl-0.5 block">
                        Feedback Register 1 {selectedNode.deviceProfile.deviceType === 'piston' ? '(Retracted Sensor Pin)' : selectedNode.deviceProfile.deviceType === 'valve' ? '(Closed Sensor Pin)' : '(Auxiliary Run Feed)'}
                      </label>
                      <input
                        type="text"
                        value={selectedNode.deviceProfile.feedbackAddr1 || ''}
                        onChange={(e) => onUpdate(selectedNode.id, {
                          deviceProfile: {
                            ...selectedNode.deviceProfile!,
                            feedbackAddr1: e.target.value
                          }
                        })}
                        placeholder="e.g., I:0/2"
                        className="w-full bg-black/40 border border-zinc-800 rounded-md p-1.5 text-sky-400 font-mono text-[10px] focus:border-pink-500 outline-none"
                      />
                    </div>

                    {(selectedNode.deviceProfile.deviceType === 'piston' || selectedNode.deviceProfile.deviceType === 'valve') && (
                      <div className="space-y-1">
                        <label className="text-[7.5px] font-black text-zinc-500 uppercase tracking-widest pl-0.5 block">
                          Feedback Register 2 {selectedNode.deviceProfile.deviceType === 'piston' ? '(Extended Sensor Pin)' : '(Open Sensor Pin)'}
                        </label>
                        <input
                          type="text"
                          value={selectedNode.deviceProfile.feedbackAddr2 || ''}
                          onChange={(e) => onUpdate(selectedNode.id, {
                            deviceProfile: {
                              ...selectedNode.deviceProfile!,
                              feedbackAddr2: e.target.value
                            }
                          })}
                          placeholder="e.g., I:0/3"
                          className="w-full bg-black/40 border border-zinc-800 rounded-md p-1.5 text-sky-400 font-mono text-[10px] focus:border-pink-500 outline-none"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[7.5px] font-black text-zinc-500 uppercase tracking-widest pl-0.5 block">
                        Response Debounce/Transit (ms)
                      </label>
                      <input
                        type="number"
                        value={selectedNode.deviceProfile.transitTimeMs || 1000}
                        onChange={(e) => onUpdate(selectedNode.id, {
                          deviceProfile: {
                            ...selectedNode.deviceProfile!,
                            transitTimeMs: Math.max(100, parseInt(e.target.value) || 100)
                          }
                        })}
                        className="w-full bg-black/40 border border-zinc-800 rounded-md p-1.5 text-white font-mono text-[10px] focus:border-pink-500 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {(selectedNode.type.startsWith('compare') || selectedNode.type.startsWith('math')) && (
            <section className="space-y-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                 <Database size={9} className="text-emerald-500" />
                 <span className="text-[8.5px] font-black text-zinc-500 uppercase tracking-[0.2em]">Math/Logical Context</span>
              </div>
              <div className="space-y-2.5 p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[7.5px] font-black text-zinc-650 uppercase tracking-widest pl-0.5">Source A</label>
                    <input 
                      type="text"
                      value={selectedNode.params?.sourceA || ''}
                      onChange={(e) => onUpdate(selectedNode.id, { 
                        params: { ...selectedNode.params, sourceA: isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value) } 
                      })}
                      className="w-full bg-black/40 border border-zinc-800 rounded-md p-1.5 text-zinc-200 font-mono focus:border-blue-500 outline-none text-center text-[10px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[7.5px] font-black text-zinc-650 uppercase tracking-widest pl-0.5">Source B</label>
                    <input 
                      type="text"
                      value={selectedNode.params?.sourceB || ''}
                      onChange={(e) => onUpdate(selectedNode.id, { 
                        params: { ...selectedNode.params, sourceB: isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value) } 
                      })}
                      className="w-full bg-black/40 border border-zinc-800 rounded-md p-1.5 text-zinc-200 font-mono focus:border-blue-500 outline-none text-center text-[10px]"
                    />
                  </div>
                </div>
                {selectedNode.type.startsWith('math') && (
                  <div className="pt-2 border-t border-zinc-800 space-y-1">
                    <label className="text-[7.5px] font-black text-blue-550 uppercase tracking-widest pl-0.5">Target Destination</label>
                    <input 
                      type="text"
                      value={selectedNode.params?.dest || ''}
                      onChange={(e) => onUpdate(selectedNode.id, { 
                        params: { ...selectedNode.params, dest: e.target.value } 
                      })}
                      className="w-full bg-blue-500/10 border border-blue-500/20 rounded-md p-1.5 text-blue-400 font-mono font-bold focus:border-blue-500 outline-none text-center text-[10px]"
                    />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* PID Controller Configuration */}
          {selectedNode.type === 'pid-controller' && (
            <section className="space-y-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                 <Activity size={9} className="text-pink-500" />
                 <span className="text-[8.5px] font-black text-zinc-500 uppercase tracking-[0.2em]">PID Tuning Variables</span>
              </div>
              <div className="space-y-2.5 p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[7.5px] font-black text-zinc-650 uppercase tracking-widest pl-0.5">SP (Setpoint)</label>
                    <input type="text" value={selectedNode.params?.sp || ''} onChange={(e) => onUpdate(selectedNode.id, { params: { ...selectedNode.params, sp: isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value) } })} className="w-full bg-black/40 border border-zinc-800 rounded-md p-1.5 text-zinc-200 font-mono focus:border-blue-500 outline-none text-center text-[10px]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[7.5px] font-black text-zinc-650 uppercase tracking-widest pl-0.5">PV (Process Var)</label>
                    <input type="text" value={selectedNode.params?.pv || ''} onChange={(e) => onUpdate(selectedNode.id, { params: { ...selectedNode.params, pv: isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value) } })} className="w-full bg-black/40 border border-zinc-800 rounded-md p-1.5 text-zinc-200 font-mono focus:border-blue-500 outline-none text-center text-[10px]" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800">
                  <div className="space-y-1">
                    <label className="text-[7.5px] font-black text-zinc-650 uppercase tracking-widest pl-0.5">Kp</label>
                    <input type="number" step="0.1" value={selectedNode.params?.kp || 0} onChange={(e) => onUpdate(selectedNode.id, { params: { ...selectedNode.params, kp: Number(e.target.value) } })} className="w-full bg-black/40 border border-zinc-800 rounded-md p-1.5 text-pink-400 font-mono focus:border-pink-500 outline-none text-center text-[10px]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[7.5px] font-black text-zinc-650 uppercase tracking-widest pl-0.5">Ki</label>
                    <input type="number" step="0.01" value={selectedNode.params?.ki || 0} onChange={(e) => onUpdate(selectedNode.id, { params: { ...selectedNode.params, ki: Number(e.target.value) } })} className="w-full bg-black/40 border border-zinc-800 rounded-md p-1.5 text-pink-400 font-mono focus:border-pink-500 outline-none text-center text-[10px]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[7.5px] font-black text-zinc-650 uppercase tracking-widest pl-0.5">Kd</label>
                    <input type="number" step="0.1" value={selectedNode.params?.kd || 0} onChange={(e) => onUpdate(selectedNode.id, { params: { ...selectedNode.params, kd: Number(e.target.value) } })} className="w-full bg-black/40 border border-zinc-800 rounded-md p-1.5 text-pink-400 font-mono focus:border-pink-500 outline-none text-center text-[10px]" />
                  </div>
                </div>
                <div className="pt-2 border-t border-zinc-800 space-y-1">
                  <label className="text-[7.5px] font-black text-emerald-550 uppercase tracking-widest pl-0.5">CV (Control Var Dest)</label>
                  <input type="text" value={selectedNode.params?.cv || ''} onChange={(e) => onUpdate(selectedNode.id, { params: { ...selectedNode.params, cv: e.target.value } })} className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-md p-1.5 text-emerald-400 font-mono font-bold focus:border-emerald-500 outline-none text-center text-[10px]" />
                </div>
              </div>
            </section>
          )}

          {/* Scale with Parameters (SCP) */}
          {selectedNode.type === 'scale-param' && (
            <section className="space-y-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                 <Settings size={9} className="text-blue-500" />
                 <span className="text-[8.5px] font-black text-zinc-500 uppercase tracking-[0.2em]">Linear Scaling Parameters</span>
              </div>
              <div className="space-y-2.5 p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                <div className="space-y-1">
                  <label className="text-[7.5px] font-black text-zinc-650 uppercase tracking-widest pl-0.5">Input (Source A)</label>
                  <input type="text" value={selectedNode.params?.sourceA || ''} onChange={(e) => onUpdate(selectedNode.id, { params: { ...selectedNode.params, sourceA: isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value) } })} className="w-full bg-black/40 border border-zinc-800 rounded-md p-1.5 text-zinc-200 font-mono focus:border-blue-500 outline-none text-center text-[10px]" />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
                  <div className="space-y-1">
                    <label className="text-[7.5px] font-black text-zinc-650 uppercase tracking-widest pl-0.5">Input Min</label>
                    <input type="text" value={selectedNode.params?.inMin || ''} onChange={(e) => onUpdate(selectedNode.id, { params: { ...selectedNode.params, inMin: isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value) } })} className="w-full bg-black/40 border border-zinc-800 rounded-md p-1.5 text-sky-400 font-mono focus:border-sky-500 outline-none text-center text-[10px]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[7.5px] font-black text-zinc-650 uppercase tracking-widest pl-0.5">Input Max</label>
                    <input type="text" value={selectedNode.params?.inMax || ''} onChange={(e) => onUpdate(selectedNode.id, { params: { ...selectedNode.params, inMax: isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value) } })} className="w-full bg-black/40 border border-zinc-800 rounded-md p-1.5 text-sky-400 font-mono focus:border-sky-500 outline-none text-center text-[10px]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[7.5px] font-black text-zinc-650 uppercase tracking-widest pl-0.5">Scaled Min</label>
                    <input type="text" value={selectedNode.params?.outMin || ''} onChange={(e) => onUpdate(selectedNode.id, { params: { ...selectedNode.params, outMin: isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value) } })} className="w-full bg-black/40 border border-zinc-800 rounded-md p-1.5 text-emerald-400 font-mono focus:border-emerald-500 outline-none text-center text-[10px]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[7.5px] font-black text-zinc-650 uppercase tracking-widest pl-0.5">Scaled Max</label>
                    <input type="text" value={selectedNode.params?.outMax || ''} onChange={(e) => onUpdate(selectedNode.id, { params: { ...selectedNode.params, outMax: isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value) } })} className="w-full bg-black/40 border border-zinc-800 rounded-md p-1.5 text-emerald-400 font-mono focus:border-emerald-500 outline-none text-center text-[10px]" />
                  </div>
                </div>
                <div className="pt-2 border-t border-zinc-800 space-y-1">
                  <label className="text-[7.5px] font-black text-emerald-550 uppercase tracking-widest pl-0.5">Destination Tag</label>
                  <input type="text" value={selectedNode.params?.dest || ''} onChange={(e) => onUpdate(selectedNode.id, { params: { ...selectedNode.params, dest: e.target.value } })} className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-md p-1.5 text-emerald-400 font-mono font-bold focus:border-emerald-500 outline-none text-center text-[10px]" />
                </div>
              </div>
            </section>
          )}

          {/* Limits & Alarms */}
          {(selectedNode.type === 'limit-test' || selectedNode.type === 'alarm-block') && (
            <section className="space-y-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                 <Settings size={9} className="text-rose-500" />
                 <span className="text-[8.5px] font-black text-zinc-500 uppercase tracking-[0.2em]">Threshold Configuration</span>
              </div>
              <div className="space-y-2.5 p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                <div className="space-y-1">
                  <label className="text-[7.5px] font-black text-zinc-650 uppercase tracking-widest pl-0.5">Test Variable</label>
                  <input type="text" value={selectedNode.params?.testVal || ''} onChange={(e) => onUpdate(selectedNode.id, { params: { ...selectedNode.params, testVal: isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value) } })} className="w-full bg-black/40 border border-zinc-800 rounded-md p-1.5 text-zinc-200 font-mono focus:border-blue-500 outline-none text-center text-[10px]" />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
                  {selectedNode.type === 'limit-test' && (
                    <div className="space-y-1">
                      <label className="text-[7.5px] font-black text-zinc-650 uppercase tracking-widest pl-0.5">Low Limit</label>
                      <input type="text" value={selectedNode.params?.lowLimit || ''} onChange={(e) => onUpdate(selectedNode.id, { params: { ...selectedNode.params, lowLimit: isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value) } })} className="w-full bg-black/40 border border-zinc-800 rounded-md p-1.5 text-sky-400 font-mono focus:border-sky-500 outline-none text-center text-[10px]" />
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[7.5px] font-black text-zinc-650 uppercase tracking-widest pl-0.5">High Limit</label>
                    <input type="text" value={selectedNode.params?.highLimit || ''} onChange={(e) => onUpdate(selectedNode.id, { params: { ...selectedNode.params, highLimit: isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value) } })} className="w-full bg-black/40 border border-zinc-800 rounded-md p-1.5 text-rose-400 font-mono focus:border-rose-500 outline-none text-center text-[10px]" />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Documentation Section */}
          <section className="space-y-2">
             <div className="flex items-center gap-1.5 mb-1">
                <FileText size={9} className="text-zinc-500" />
                <span className="text-[8.5px] font-black text-zinc-500 uppercase tracking-[0.2em]">Engineering Notes</span>
             </div>
             <textarea 
               value={selectedNode.description || ''}
               onChange={(e) => onUpdate(selectedNode.id, { description: e.target.value })}
               className="w-full bg-zinc-900/40 border border-zinc-800 rounded-lg p-2 text-[10px] text-zinc-400 focus:border-zinc-750 outline-none min-h-[60px] resize-none border-dashed transition-all"
               placeholder="Enter functional description or maintenance notes for this instruction..."
             />
          </section>

          {/* Cross References Section */}
          <section className="space-y-2 pb-4">
             <div className="flex items-center gap-1.5 mb-1">
                <Database size={9} className="text-zinc-500" />
                <span className="text-[8.5px] font-black text-zinc-500 uppercase tracking-[0.2em]">Cross Reference</span>
             </div>
             <div className="space-y-1">
                {nodes.filter(n => n.address === selectedNode.address && n.id !== selectedNode.id).map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => onJumpToNode?.(n.id)}
                    className="flex items-center justify-between p-1.5 bg-white/5 border border-zinc-800 rounded text-[8.5px] hover:border-blue-500 transition-all cursor-pointer group/xref"
                  >
                    <span className="text-blue-400 font-bold uppercase group-hover/xref:text-white">{n.type}</span>
                    <span className="text-zinc-650 group-hover/xref:text-zinc-400">Rung {Math.floor(n.y / 150)}</span>
                  </div>
                ))}
                {nodes.filter(n => n.address === selectedNode.address && n.id !== selectedNode.id).length === 0 && (
                  <div className="text-center py-2 bg-zinc-900/20 rounded text-zinc-650 italic text-[8px]">
                    No other occurrences of this address
                  </div>
                )}
             </div>
          </section>
        </div>

        {/* Real-time Data & Trends */}
        <div className="pt-4 mt-auto sticky bottom-0 bg-zinc-950 pb-2 space-y-3">
           <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                 <TrendingUp size={9} className="text-blue-500" />
                 <span className="text-[8.5px] font-black text-zinc-500 uppercase tracking-widest">Historical Bus Trend</span>
              </div>
              <span className="text-[7.5px] font-bold text-zinc-700 uppercase">Live Sampling: 50ms</span>
           </div>

           <div className="h-16 w-full bg-black/40 rounded-lg border border-zinc-800/50 overflow-hidden relative group/chart">
              <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent pointer-events-none" />
              <ResponsiveContainer width="100%" height="100%" minWidth={40} minHeight={40}>
                 <AreaChart data={(history[selectedNode.type.startsWith('timer') || selectedNode.type.startsWith('counter') ? `${selectedNode.address}_ACC` : (selectedNode.params?.dest || selectedNode.address)] || []).slice(-40).map((v, i) => ({ val: v, time: i }))}>
<defs>
                       <linearGradient id={`inspector_grad_${selectedNode.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                       </linearGradient>
                    </defs>
                    <YAxis domain={['auto', 'auto']} hide />
                    <Area 
                      type="monotone" 
                      dataKey="val" 
                      stroke="#3b82f6" 
                      strokeWidth={2} 
                      fill={`url(#inspector_grad_${selectedNode.id})`} fillOpacity={1} 
                      animationDuration={300}
                      isAnimationActive={false}
                    />
                 </AreaChart>
              </ResponsiveContainer>
              <div className="absolute top-1.5 right-3 flex items-center gap-1">
                 <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping" />
                 <span className="text-[6.5px] font-black text-blue-500/60 uppercase">Streaming: {selectedNode.type.startsWith('timer') || selectedNode.type.startsWith('counter') ? 'ACC' : 'VAL'}</span>
              </div>
           </div>

           <div className="relative group/monitor">
              <div className="absolute inset-0 bg-blue-500/10 blur-xl opacity-40 group-hover/monitor:opacity-85 transition-opacity" />
              <div className="relative bg-black border border-zinc-800/50 rounded-lg p-3 flex flex-col items-center justify-center shadow-[0_12px_36px_rgba(0,0,0,0.5)] overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="flex items-center gap-1.5 mb-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                   <span className="text-[8.5px] font-black text-zinc-500 uppercase tracking-[0.3em]">Runtime Value</span>
                </div>
                <div className="text-xl font-black text-blue-500 font-mono tracking-tighter drop-shadow-[0_0_12px_rgba(59,130,246,0.35)]">
                  {selectedNode.type.startsWith('timer') 
                    ? (selectedNode.params?.timeBase === 'ms' ? Number(values[`${selectedNode.address}_ACC`] || 0) : (Number(values[`${selectedNode.address}_ACC`] || 0) / 1000).toFixed(1)) 
                    : (values[`${selectedNode.address}_ACC`] !== undefined 
                        ? values[`${selectedNode.address}_ACC`] 
                        : (values[selectedNode.params?.dest || selectedNode.address] || 0))}
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
