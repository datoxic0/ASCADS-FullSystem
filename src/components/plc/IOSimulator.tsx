import React from 'react';
import { Power, Activity, Cpu } from 'lucide-react';
import { LadderState } from '@/lib/plc-types';
import { cn } from '@/lib/utils';

interface IOSimulatorProps {
  state: LadderState;
  onToggleIO: (address: string) => void;
  onForceIO: (address: string, value?: boolean) => void;
}

export function IOSimulator({ state, onToggleIO, onForceIO }: IOSimulatorProps) {
  // Extract inputs (e.g., tags starting with I: or just collect all B3/Inputs)
  const inputs = state.nodes.filter(n => n.type.startsWith('contact'));
  const outputs = state.nodes.filter(n => n.type === 'coil');
  const deviceCoils = state.nodes.filter(n => n.type.startsWith('coil') && n.deviceProfile && n.deviceProfile.deviceType !== 'none');

  const renderForceBadge = (addr: string) => {
    const isForced = state.simulation.forces && state.simulation.forces[addr] !== undefined;
    if (!isForced) return null;
    return (
      <span className={cn(
        "absolute -top-1 -right-1 text-[6px] px-1 rounded-sm font-black",
        state.simulation.forcesEnabled ? "bg-amber-500 text-black" : "bg-zinc-500 text-white opacity-50"
      )}>
        F
      </span>
    );
  };

  return (
    <div className="w-full h-full overflow-hidden flex flex-col font-sans bg-[#0c0d12] text-slate-200">
      <div className="panel-header border-b border-white/5 bg-zinc-950/40">
        <div className="flex items-center gap-3">
          <Cpu size={14} className={cn("transition-colors", state.simulation.forcesEnabled && Object.keys(state.simulation.forces || {}).length > 0 ? "text-amber-500" : "text-zinc-500")} />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">I/O Chassis & Simulator</span>
        </div>
        <div className="flex gap-2 items-center">
          {state.simulation.forcesEnabled && Object.keys(state.simulation.forces || {}).length > 0 && (
             <span className="text-[8px] text-amber-500 font-bold animate-pulse mr-2">FORCES ACTIVE</span>
          )}
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        </div>
      </div>

      <div className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">
        {/* Local Inputs */}
        <section>
          <h3 className="text-[10px] text-zinc-500 font-bold mb-3 uppercase tracking-widest flex items-center gap-2">
            <Power size={12} className="text-blue-500" /> Local Input Module
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {[...Array(16)].map((_, i) => {
              const addr = `I:${i}`;
              const val = state.simulation.values[addr];
              const forcedValue = state.simulation.forces ? state.simulation.forces[addr] : undefined;
              
              return (
                <div key={i} className="relative bg-[#13141d] border border-white/5 rounded-lg p-2 flex flex-col items-center justify-between h-[72px] group transition-all hover:border-zinc-700 select-none">
                  {/* Channel header */}
                  <span className="text-[8px] font-black font-mono text-zinc-500 group-hover:text-zinc-400 leading-none">CH {i}</span>
                  
                  {/* Tactile Toggle Switch Knob Slot */}
                  <button
                    onClick={() => onToggleIO(addr)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (forcedValue !== undefined) onForceIO(addr, undefined);
                      else onForceIO(addr, !val);
                    }}
                    className="relative w-6 h-9 bg-zinc-950 rounded border border-zinc-800 flex items-center justify-center cursor-pointer overflow-hidden focus:outline-none focus:ring-1 focus:ring-amber-500"
                    title="Left-click: Toggle | Right-click: Force"
                  >
                    {/* Switch lever track slot */}
                    <div className="absolute inset-x-1 top-1.5 bottom-1.5 bg-gradient-to-b from-[#0e0f14] to-[#121319] rounded-sm" />
                    
                    {/* Switch metallic barrel lever */}
                    <div 
                      className={cn(
                        "absolute w-3.5 h-4.5 rounded bg-gradient-to-b from-zinc-300 to-zinc-500 shadow-md border-b-[2px] border-zinc-600 transition-all duration-200 transform",
                        val ? "-translate-y-2 scale-y-105" : "translate-y-2 scale-y-95",
                        forcedValue !== undefined && "from-amber-400 to-amber-600 border-amber-800"
                      )}
                    />
                  </button>

                  {/* Indicator Status Light */}
                  <div className="flex items-center gap-1 shrink-0 leading-none mt-1">
                    <div 
                      className={cn(
                        "w-1.5 h-1.5 rounded-full border border-black/40 transition-all duration-150 shadow-inner",
                        val 
                          ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.85)]" 
                          : "bg-zinc-800"
                      )} 
                    />
                    <span className={cn("text-[6px] font-mono leading-none", val ? "text-amber-400 font-extrabold" : "text-zinc-650")}>
                      {val ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  
                  {renderForceBadge(addr)}
                </div>
              );
            })}
          </div>
        </section>

        {/* Runtime Specific Inputs (Mapped from Workspace) */}
        {inputs.length > 0 && (
          <section>
            <h3 className="text-[10px] text-zinc-550 font-bold mb-3 uppercase tracking-widest">Workspace Inputs</h3>
            <div className="space-y-1.5">
              {inputs.map((node) => {
                const isForced = state.simulation.forces && state.simulation.forces[node.address] !== undefined;
                const active = !!state.simulation.values[node.address];
                return (
                  <div key={node.id} className="flex items-center justify-between bg-[#141620]/65 border border-white/5 hover:border-zinc-700 rounded-lg p-2 px-3 relative transition-all group/row">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-black tracking-tight text-white uppercase truncate">{node.tag || 'UNNAMED_TAG'}</span>
                      <span className="text-[8.5px] text-zinc-500 font-mono font-bold tracking-tight">{node.address}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* Interactive block logic force trigger */}
                      <button 
                        onClick={() => {
                          if (isForced) onForceIO(node.address, undefined);
                          else onForceIO(node.address, !active);
                        }}
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[7.5px] font-black border uppercase transition-all active:scale-95 tracking-wider",
                          isForced ? "bg-amber-500 border-amber-400 text-black font-bold" : "bg-zinc-950 border-white/5 text-zinc-550 hover:text-zinc-300"
                        )}
                        title="Force input address"
                      >
                        FORCE
                      </button>

                      {/* Tactile Sliding switch */}
                      <button
                        onClick={() => onToggleIO(node.address)}
                        className={cn(
                          "w-10 h-5.5 rounded-full p-0.5 transition-all duration-200 border relative focus:outline-none flex items-center shadow-inner",
                          active
                            ? "bg-emerald-500/20 border-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.25)]"
                            : "bg-zinc-950 border-zinc-800"
                        )}
                      >
                        {/* Status led slider handle */}
                        <div 
                          className={cn(
                            "w-4.5 h-4.5 rounded-full transition-all duration-200 transform shadow-md",
                            active
                              ? "translate-x-4.5 bg-emerald-400"
                              : "translate-x-0 bg-zinc-600"
                          )}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Outputs Status */}
        {outputs.length > 0 && (
          <section>
            <h3 className="text-[10px] text-zinc-550 font-bold mb-3 uppercase tracking-widest">Outputs</h3>
            <div className="space-y-1.5">
              {outputs.map((node) => {
                const isForced = state.simulation.forces && state.simulation.forces[node.address] !== undefined;
                const active = !!state.simulation.values[node.address];
                return (
                  <div key={node.id} className="flex items-center p-2.5 px-3 bg-[#11131c]/50 border border-white/5 hover:border-zinc-800 rounded-lg justify-between transition-all">
                    <div className="flex items-center gap-2.5 min-w-0 max-w-[70%]">
                       <div className={cn(
                        "w-2.5 h-2.5 rounded-full border border-black/50 transition-all duration-300 shrink-0",
                        active ? "bg-emerald-400 shadow-[0_0_10px_#10b981] ring-2 ring-emerald-500/20 animate-pulse" : "bg-zinc-800"
                      )} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-black text-white truncate uppercase tracking-tight">{node.tag || 'COIL'}</span>
                        <span className="text-[8px] text-zinc-500 font-mono tracking-tighter">{node.address}</span>
                      </div>
                    </div>
                    
                    <button 
                        onClick={() => {
                          if (isForced) onForceIO(node.address, undefined);
                          else onForceIO(node.address, !active);
                        }}
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[7.5px] font-black border transition-all active:scale-95 uppercase tracking-wider",
                          isForced ? "bg-amber-500 border-amber-400 text-black font-bold" : "bg-zinc-950 border-white/5 text-zinc-550 hover:text-zinc-300"
                        )}
                    >
                      FORCE
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Virtual Plant Simulator Module */}
        <section className="pt-4 border-t border-white/5">
          <h3 className="text-[10px] text-zinc-500 font-bold mb-3 uppercase tracking-widest flex items-center gap-2">
            <Activity size={12} className="text-pink-500" /> Virtual Plant Simulator
          </h3>
          
          {deviceCoils.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-white/5 text-center text-zinc-500 text-[10px] leading-relaxed bg-black/20">
              <p className="font-bold mb-1 text-slate-400">No active physical device links</p>
              Select any Output Coil in the ladder editor and set its <b>Physical Device Linker</b> profile to simulate running motors, pistons, valves, sirens, or heating loops.
            </div>
          ) : (
            <div className="space-y-4">
              {deviceCoils.map((node) => {
                const profile = node.deviceProfile!;
                const pct = profile.currentPercent || 0;
                const active = !!state.simulation.values[node.address];
                
                return (
                  <div key={node.id} className="p-3 border border-white/5 bg-zinc-900/60 rounded-xl space-y-2.5 shadow-sm">
                    {/* Header */}
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-200 uppercase tracking-tight">{node.tag || 'OUTPUT_DEVICE'}</span>
                        <span className="text-[8px] text-zinc-500 font-mono tracking-tighter">{node.address} ➔ {profile.deviceType.toUpperCase()}</span>
                      </div>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-widest transition-all",
                        active ? "bg-emerald-500/20 text-emerald-400 shadow-sm font-bold border border-emerald-500/30" : "bg-zinc-950 text-zinc-650 border border-transparent"
                      )}>
                        {active ? "Active" : "Stop"}
                      </span>
                    </div>

                    {/* Graphic Box */}
                    <div className="h-28 bg-[#07080a] rounded-lg flex items-center justify-center overflow-hidden border border-white/[0.03] relative">
                      {/* Background grid */}
                      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px] opacity-15" />
                      
                      {profile.deviceType === 'motor' && (
                        <div className="flex flex-col items-center justify-center p-2 text-center text-white w-full h-full">
                          <svg className="w-16 h-16 text-zinc-300 mb-1" viewBox="0 0 100 100">
                            {/* Motor outer casing */}
                            <rect x="25" y="30" width="50" height="40" rx="4" fill="#1e293b" />
                            {/* Cooling fins */}
                            <line x1="33" y1="22" x2="33" y2="78" stroke="#0f172a" strokeWidth="2" />
                            <line x1="43" y1="22" x2="43" y2="78" stroke="#0f172a" strokeWidth="2" />
                            <line x1="53" y1="22" x2="53" y2="78" stroke="#0f172a" strokeWidth="2" />
                            <line x1="63" y1="22" x2="63" y2="78" stroke="#0f172a" strokeWidth="2" />
                            <rect x="30" y="25" width="40" height="50" rx="1" fill="#334155" />
                            {/* Mount bases */}
                            <rect x="26" y="70" width="10" height="6" fill="#0f172a" />
                            <rect x="64" y="70" width="10" height="6" fill="#0f172a" />
                            {/* Central motor shaft */}
                            <rect x="75" y="47" width="15" height="6" rx="1" fill="#64748b" />
                            {/* Rotating fan outline inside shroud */}
                            <circle cx="15" cy="50" r="14" fill="#0f172a" />
                            <g style={{ transform: `rotate(${pct * 14.4}deg)`, transformOrigin: '15px 50px', transition: 'transform 0.1s linear' }}>
                              <rect x="13" y="38" width="4" height="24" rx="1" fill="#0284c7" />
                              <rect x="3" y="48" width="24" height="4" rx="1" fill="#0284c7" />
                            </g>
                          </svg>
                          <div className="absolute top-2 right-3 text-[8.5px] text-zinc-500 font-mono text-right leading-relaxed">
                            <span className="text-sky-400 font-black">{Math.round(pct * 17.5)}</span> RPM<br/>
                            <span className="text-amber-400 font-bold">{(25 + pct * 0.45).toFixed(1)}</span> °C
                          </div>
                        </div>
                      )}

                      {profile.deviceType === 'piston' && (
                        <div className="flex items-center justify-center w-full h-full p-4 relative">
                          <svg className="w-56 h-12" viewBox="0 0 250 50">
                            {/* Cylinder block */}
                            <rect x="10" y="10" width="100" height="30" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                            <rect x="12" y="12" width="12" height="26" fill="#020617" />
                            
                            {/* Slide bars */}
                            <line x1="110" y1="18" x2="240" y2="18" stroke="#334155" strokeWidth="2" />
                            <line x1="110" y1="32" x2="240" y2="32" stroke="#334155" strokeWidth="2" />

                            {/* Piston shaft - extends to the right */}
                            <rect x="60" y="22" width={Math.round(20 + pct * 1.2)} height="6" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
                            {/* Hammer bracket head */}
                            <rect x={Math.round(75 + pct * 1.2)} y="15" width="10" height="20" rx="1" fill="#334155" stroke="#475569" />
                            
                            {/* Retracted limit sensor bulb (feedback register 1) */}
                            <circle cx="25" cy="8" r="4" fill={pct <= 2 ? "#10b981" : "#1f2937"} className="transition-all" />
                            {/* Extended limit sensor bulb (feedback register 2) */}
                            <circle cx="95" cy="8" r="4" fill={pct >= 98 ? "#10b981" : "#1f2937"} className="transition-all" />
                          </svg>
                          <div className="absolute top-2 right-3 text-[8.5px] text-zinc-500 font-mono text-right leading-relaxed">
                            Stroke: <span className="text-blue-400 font-black">{pct.toFixed(0)}%</span><br/>
                            LS_RET: {pct <= 1 ? <span className="text-emerald-400 font-bold">1</span> : '0'}<br/>
                            LS_EXT: {pct >= 99 ? <span className="text-emerald-400 font-bold">1</span> : '0'}
                          </div>
                        </div>
                      )}

                      {profile.deviceType === 'valve' && (
                        <div className="flex items-center justify-center w-full h-full p-4">
                          <svg className="w-48 h-16" viewBox="0 0 200 60">
                            {/* Blue pipeline */}
                            <rect x="5" y="20" width="190" height="20" fill="#1e3a8a" stroke="#2563eb" strokeWidth="1.5" />
                            {/* Active Flow fluid dots */}
                            <g opacity={pct > 5 ? 1 : 0.15} className="transition-opacity">
                              <circle cx="20" cy="30" r="2.5" fill="#60a5fa" />
                              <circle cx="65" cy="30" r="2.5" fill="#60a5fa" />
                              <circle cx="120" cy="30" r="2.5" fill="#60a5fa" />
                              <circle cx="165" cy="30" r="2.5" fill="#60a5fa" />
                            </g>
                            {/* Valve casing */}
                            <polygon points="85,10 115,10 110,48 90,48" fill="#334155" stroke="#475569" />
                            {/* Regulating gate screw (moves up when open) */}
                            <rect x="96" y={Math.round(15 - (pct * 0.15))} width="8" height="28" fill="#d97706" />
                            <circle cx="100" cy={Math.round(10 - (pct * 0.15))} r="8" fill="#0f172a" stroke="#d97706" />
                          </svg>
                          <div className="absolute top-2 right-3 text-[8.5px] text-zinc-500 font-mono text-right leading-relaxed">
                            Flow Port: <span className="text-sky-400 font-bold">{pct.toFixed(0)}% Open</span><br/>
                            Flow rate: <span className="text-blue-400 font-black">{(pct * 1.8).toFixed(1)} L/s</span>
                          </div>
                        </div>
                      )}

                      {profile.deviceType === 'light' && (
                        <div className="flex items-center justify-center w-full h-full p-4 relative">
                          <svg className="w-16 h-24" viewBox="0 0 60 100">
                            {/* Mounting Pole */}
                            <line x1="30" y1="75" x2="30" y2="100" stroke="#334155" strokeWidth="4" />
                            {/* Tower Frame */}
                            <rect x="18" y="10" width="24" height="65" rx="3" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5" />
                            
                            {/* Red top tier card */}
                            <rect x="20" y="14" width="20" height="16" rx="1.5" fill={active && (Math.floor(Date.now() / 300) % 2 === 0) ? "#ef4444" : "#450a0a"} className="transition-all" />
                            {/* Amber middle tier */}
                            <rect x="20" y="32" width="20" height="16" rx="1.5" fill={active ? "#f59e0b" : "#451a03"} className="transition-all" />
                            {/* Green bottom tier */}
                            <rect x="20" y="50" width="20" height="16" rx="1.5" fill={!active ? "#10b981" : "#022c22"} className="transition-all" />
                          </svg>
                          <div className="absolute top-2 right-3 text-[8.5px] text-zinc-500 font-mono text-right leading-relaxed">
                            <span className={cn("font-bold block", active ? "text-amber-500" : "text-green-400")}>
                              {active ? "🚨 RUNNING" : "🟢 STANDBY"}
                            </span>
                            Flash beacon: {active ? 'Enabled' : 'Disabled'}
                          </div>
                        </div>
                      )}

                      {profile.deviceType === 'siren' && (
                        <div className="flex items-center justify-center w-full h-full p-4 relative">
                          <svg className="w-16 h-16" viewBox="0 0 65 65">
                            {/* Speaker cone / Horn structure */}
                            <ellipse cx="32" cy="40" rx="18" ry="8" fill="#1e293b" />
                            {/* Beacon body base */}
                            <rect x="22" y="30" width="21" height="16" rx="2" fill="#334155" />
                            {/* Flasher dome */}
                            <path d="M 24 30 A 8 8 0 0 1 41 30" fill={active ? "#ef4444" : "#7f1d1d"} stroke="#ef4444" strokeWidth="0.5" />
                            
                            {/* Acoustic waves glowing */}
                            {active && (
                              <g stroke="#f59e0b" strokeWidth="2" fill="none">
                                <circle cx="32" cy="30" r="10" opacity="0.3" />
                                <circle cx="32" cy="30" r="20" opacity="0.2" />
                              </g>
                            )}
                          </svg>
                          <div className="absolute top-2 right-3 text-[8.5px] text-zinc-500 font-mono text-right leading-relaxed">
                            Output DB: <span className="text-amber-500 font-black">{active ? '112 dBA' : '0 dBA'}</span><br/>
                            Frequency: {active ? <span className="text-red-400">Pulsing</span> : 'OFF'}
                          </div>
                        </div>
                      )}

                      {profile.deviceType === 'heater' && (
                        <div className="flex items-center justify-center w-full h-full p-4">
                          <svg className="w-32 h-16" viewBox="0 0 120 60">
                            {/* Thermo coil elements */}
                            <path d="M 10 30 C 20 10, 30 50, 40 30 C 50 10, 60 50, 70 30 C 80 10, 90 50, 100 30" 
                                  stroke={active ? `rgb(${Math.round(80 + pct * 1.75)}, ${Math.round(40 + pct * 0.9)}, 60)` : "#4b5563"} 
                                  strokeWidth="6" 
                                  strokeLinecap="round"
                                  fill="none" 
                                  className="transition-colors" />
                          </svg>
                          <div className="absolute top-2 right-3 text-[8.5px] text-zinc-500 font-mono text-right leading-relaxed">
                            Heater TEMP:<br/>
                            <span className="text-orange-500 font-black text-[11px]">{(23.5 + pct * 3.26).toFixed(1)} °C</span><br/>
                            Safety STAT: {pct >= 80 ? <span className="text-red-500 font-bold">HIGH VENT</span> : 'NORMAL'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <div className="bg-zinc-950 p-3 border-t border-white/5 text-[9px] text-zinc-500 flex flex-col gap-1.5 shrink-0">
        <div className="flex justify-between items-center tabular-nums">
          <span className="font-bold tracking-tight text-slate-400">BUS: SYS_CONNECTED</span>
          <Activity size={12} className="text-blue-500" />
        </div>
        {Object.keys(state.simulation.forces || {}).length > 0 && (
          <div className="text-amber-500 font-bold flex items-center gap-1.5 bg-amber-500/10 rounded px-2 py-0.5 border border-amber-500/20">
             <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
             TOTAL_IO_FORCES: {Object.keys(state.simulation.forces || {}).length}
          </div>
        )}
      </div>
    </div>
  );
}
