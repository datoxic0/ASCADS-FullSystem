import React, { useState } from 'react';
import { LadderState, LadderNode } from '@/lib/plc-types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, 
  Zap, 
  Layers, 
  Activity, 
  Database, 
  Binary, 
  Settings, 
  Terminal, 
  Sliders, 
  Info,
  Play,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Lock,
  Unlock,
  ChevronsRight,
  TrendingUp,
  XSquare,
  LayoutGrid,
  List
} from 'lucide-react';
import { clsx } from 'clsx';

interface BlockViewProps {
  state: LadderState;
  onNodeClick: (id: string) => void;
  onToggleAddress?: (address: string) => void;
  onForceIO?: (address: string, value?: boolean) => void;
}

export function BlockView({ state, onNodeClick, onToggleAddress, onForceIO }: BlockViewProps) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedRegAddr, setSelectedRegAddr] = useState<string | null>(null);
  const [trendRegAddr, setTrendRegAddr] = useState<string>('I:0/0');
  const [scale, setScale] = useState<number>(1.0);
  const [layoutMode, setLayoutMode] = useState<'list' | 'grid'>('list');
  const [autoFit, setAutoFit] = useState<boolean>(true); // Default to AutoFit for best out-of-the-box fit!

  // Auto-fit dynamic scaling factors based on output count
  const totalOutputsCount = state.nodes.filter(n => 
    n.type.startsWith('coil') || 
    n.type.startsWith('timer') || 
    n.type.startsWith('counter') || 
    n.type.startsWith('math') ||
    n.type.startsWith('compare') ||
    n.type === 'one-shot'
  ).length;

  const activeScale = autoFit 
    ? Math.max(0.55, Math.min(1.0, 1.85 / (totalOutputsCount || 1))) 
    : scale;

  const activeLayoutMode = autoFit 
    ? (totalOutputsCount > 2 ? 'grid' : 'list') 
    : layoutMode;

  // Group nodes by logical rung index (0-based) using a robust invariant center-based formula
  const getRungIndex = (n: LadderNode) => Math.round((n.y + n.height / 2 - 48) / 96);
  const rungCoordinates = Array.from(new Set(state.nodes.map(getRungIndex)));
  rungCoordinates.sort((a, b) => a - b);

  // Compile a simplified Boolean expression for display
  const compileBooleanExpression = (contacts: LadderNode[], output: LadderNode) => {
    if (contacts.length === 0) return `${output.address} := TRUE;`;
    const terms = contacts.map(c => {
      const name = c.tag || c.address;
      return c.type === 'contact-nc' ? `NOT(${name})` : name;
    });
    return `${output.tag || output.address} := ${terms.join(' AND ')};`;
  };

  // Compile entire PLC workspace logic to standard IEC 61131-3 Structured Text
  const generateFullStructuredText = () => {
    const code: string[] = [];
    code.push(`(*`);
    code.push(` * IEC 61131-3 Structured Text Program`);
    code.push(` * PLC System Target: VL-P7X CAD-SIMULATOR`);
    code.push(` * Generated Time: ${new Date().toISOString()}`);
    code.push(` *)`);
    code.push(`PROGRAM MainLogic`);
    code.push(`VAR`);

    const declaredVars = new Map<string, string>();
    state.nodes.forEach(n => {
      declaredVars.set(n.address, n.tag || '');
    });

    declaredVars.forEach((tag, addr) => {
      const tagComment = tag ? ` (* Tag: ${tag} *)` : '';
      const isAnalog = addr.includes('N7') || addr.includes('F8') || addr.includes('ACC') || addr.includes('PRE');
      const typeStr = isAnalog ? 'INT' : 'BOOL';
      const cleanVar = addr.replace(/[\/\:\.]/g, '_');
      code.push(`  ${cleanVar} : ${typeStr};${tagComment}`);
    });

    code.push(`END_VAR`);
    code.push(``);
    code.push(`  // --- WORKSPACE RUNGS SEQUENCE SCAN ---`);

    rungCoordinates.forEach((y, rungIdx) => {
      const rungNodes = state.nodes.filter(n => getRungIndex(n) === y).sort((a, b) => a.x - b.x);
      const contacts = rungNodes.filter(n => n.type.startsWith('contact'));
      const outputs = rungNodes.filter(n => 
        n.type.startsWith('coil') || 
        n.type.startsWith('timer') || 
        n.type.startsWith('counter') || 
        n.type.startsWith('math') ||
        n.type.startsWith('compare') ||
        n.type === 'one-shot'
      );

      outputs.forEach(output => {
        const expr = compileBooleanExpression(contacts, output);
        // Clean special characters for strict language specs
        const cleanExpr = expr.replace(/[A-Z0-9_\/:\.]+/gi, (m) => {
          if (m.includes('/') || m.includes(':') || m.includes('.')) {
            return m.replace(/[\/\:\.]/g, '_');
          }
          return m;
        });
        code.push(`  // Rung ELEV_Y_${Math.round(y)} (Logical Routine Step ${rungIdx + 1})`);
        code.push(`  ${cleanExpr}`);
      });
    });

    code.push(`END_PROGRAM`);
    return code.join('\n');
  };

  // Check if a register has any active force
  const forces = state.simulation.forces || {};
  const forcesEnabled = state.simulation.forcesEnabled;

  const handleToggleValue = (addr: string) => {
    if (onToggleAddress) {
      onToggleAddress(addr);
    }
  };

  const handleForceValue = (addr: string, val?: boolean) => {
    if (onForceIO) {
      onForceIO(addr, val);
    }
  };

  // Multi-terminal node calculation logic mapping
  const activeForcesCount = Object.keys(forces).length;

  return (
    <div className="flex-1 bg-[#05070a] text-zinc-300 overflow-hidden flex flex-col font-mono selection:bg-sky-500/30 select-none relative">
      
      {/* Top Engineering CAD Grid Header */}
      <div className="h-14 bg-[#0a0c12] border-b border-white/10 shrink-0 px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-sky-500/10 border border-sky-400/20 rounded-lg shadow-inner">
            <Cpu className="text-sky-400 size-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white tracking-widest uppercase">
                ENGINEERING FBD / BLOCK GRAPH SYSTEM
              </h2>
              <span className="text-[8px] bg-red-500/15 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-bold tracking-widest uppercase">
                IEC 61131-3 COMPLIANT
              </span>
            </div>
            <p className="text-[9px] text-zinc-500 tracking-wider">
              ONLINE LOGICAL REPRESENTATIONS • CONTINUITY SIGNAL SCANNING ACTIVE
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-[10px]">
          <div className="flex items-center gap-2 bg-[#0e111a] border border-white/5 py-1 px-3 rounded text-zinc-400">
            <Activity size={12} className={clsx("transition-colors", state.simulation.isRunning ? "text-emerald-400 animate-pulse" : "text-zinc-600")} />
            <span className="text-zinc-500 uppercase">SYS_CLK:</span>
            <span className={clsx("font-bold text-[9.5px]", state.simulation.isRunning ? "text-emerald-400" : "text-zinc-550")}>
              {state.simulation.isRunning ? "100ms INTERACTIVE" : "HALTED"}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-[#0e111a] border border-white/5 py-1 px-3 rounded text-zinc-400">
            <Database size={12} className="text-sky-400" />
            <span className="text-zinc-500 uppercase">MEM_REG:</span>
            <span className="text-sky-400 font-bold text-[9.5px]">0x{state.nodes.length.toString(16).toUpperCase().padStart(2, '0')} SEGMENTS</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Side: Dynamic Flowchart / Functional Sheets */}
        <div className="flex-1 overflow-auto p-10 relative custom-scrollbar bg-[#06080d]">
          
          {/* Engineering Technical CAD Background */}
          <div className="absolute inset-0 opacity-[0.035] pointer-events-none" 
               style={{ 
                 backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)', 
                 backgroundSize: '24px 24px, 120px 120px, 120px 120px' 
               }} />

          <div className="w-full max-w-7xl mx-auto space-y-8 relative z-10 font-mono">
            
            {/* Stamp block details & Density Controller Deck */}
            <div className="border border-white/5 bg-[#0a0d14]/75 p-4 sm:p-5 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs text-zinc-500 shadow-md">
              <div className="space-y-1 max-w-xl">
                <span className="text-[10px] text-sky-400 font-bold uppercase tracking-widest block font-sans text-left">DRAWING OFFICE SCHEMATIC & DENSITY CONTROLLER</span>
                <p className="text-[11px] leading-relaxed text-left text-zinc-450">
                  Function Block mappings compiled directly from active ladder rungs. Use settings below to fit the entire schematic in a single glance without scrolling.
                </p>
              </div>

              {/* View Controller Deck */}
              <div className="flex flex-wrap items-center gap-4 bg-black/40 border border-white/5 p-2 rounded-lg">
                <div className="flex flex-col gap-1 pr-3 border-r border-white/10 text-left">
                  <span className="text-[7.5px] font-bold text-zinc-550 uppercase tracking-widest">Scale Mode</span>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setAutoFit(true)}
                      className={clsx(
                        "px-2 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all",
                        autoFit 
                          ? "bg-emerald-500/15 text-emerald-450 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.1)]" 
                          : "border border-zinc-900 text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      Auto-Fit
                    </button>
                    <button 
                      onClick={() => setAutoFit(false)}
                      className={clsx(
                        "px-2 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all",
                        !autoFit 
                          ? "bg-sky-500/15 text-sky-450 border border-sky-500/30 shadow-[0_0_8px_rgba(14,165,233,0.1)]" 
                          : "border border-zinc-900 text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      Manual
                    </button>
                  </div>
                </div>

                {!autoFit && (
                  <div className="flex flex-col gap-1 pr-3 border-r border-white/10 text-left">
                    <span className="text-[7.5px] font-bold text-zinc-550 uppercase tracking-widest">Scale: {Math.round(scale * 100)}%</span>
                    <div className="flex items-center gap-1">
                      {[0.55, 0.7, 0.85, 1.0].map((s) => (
                        <button
                          key={s}
                          onClick={() => setScale(s)}
                          className={clsx(
                            "px-1.5 py-0.5 rounded text-[8px] font-mono font-bold transition-all border",
                            scale === s 
                              ? "bg-sky-500/10 text-sky-400 border-sky-500/20" 
                              : "border-transparent text-zinc-500 hover:text-zinc-350"
                          )}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!autoFit && (
                  <div className="flex flex-col gap-1 text-left">
                    <span className="text-[7.5px] font-bold text-zinc-550 uppercase tracking-widest font-mono">Grid Template</span>
                    <div className="flex items-center bg-[#070b12] rounded p-0.5 border border-white/5">
                      <button
                        onClick={() => setLayoutMode('list')}
                        className={clsx(
                          "p-1 rounded transition-all",
                          layoutMode === 'list' ? "bg-zinc-800 text-white" : "text-zinc-650 hover:text-zinc-450"
                        )}
                        title="List View Layout"
                      >
                        <List size={11} />
                      </button>
                      <button
                        onClick={() => setLayoutMode('grid')}
                        className={clsx(
                          "p-1 rounded transition-all",
                          layoutMode === 'grid' ? "bg-zinc-800 text-white" : "text-zinc-650 hover:text-zinc-450"
                        )}
                        title="Grid View Layout"
                      >
                        <LayoutGrid size={11} />
                      </button>
                    </div>
                  </div>
                )}

                {autoFit && (
                  <div className="flex flex-col gap-0.5 pl-1 pr-2 text-left">
                    <span className="text-[7.5px] text-emerald-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                      AUTO SCALE ACTIVE
                    </span>
                    <span className="text-[8.5px] font-mono text-zinc-450">
                      Scale Ratio: <span className="font-bold text-sky-400">{Math.round(activeScale * 100)}%</span> • {activeLayoutMode.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-right text-[10px] space-y-1 text-zinc-500 shrink-0 border-l border-white/5 pl-6 hidden lg:block">
                <div>SYSTEM CODE: <span className="text-white font-bold">VL-P7X</span></div>
                <div>ACTIVE OVERRIDES: <span className={clsx("font-bold", activeForcesCount > 0 ? "text-amber-400" : "text-zinc-650")}>{activeForcesCount} {forcesEnabled ? '(ACTIVE)' : '(DISABLED)'}</span></div>
              </div>
            </div>

            {/* Scalable Container Box to fit schematic on one screen */}
            <div 
              className={clsx(
                "relative z-10 transition-all duration-300 origin-top-left",
                activeLayoutMode === 'grid' 
                  ? "grid grid-cols-1 xl:grid-cols-2 gap-5" 
                  : "space-y-6"
              )}
              style={{ 
                transform: activeScale !== 1.0 ? `scale(${activeScale})` : undefined,
                width: activeScale !== 1.0 ? `${100 / activeScale}%` : '100%',
                transformOrigin: 'top left'
              }}
            >
              {rungCoordinates.map((y, rungIdx) => {
              const rungNodes = state.nodes
                .filter(n => getRungIndex(n) === y)
                .sort((a, b) => a.x - b.x);

              const contacts = rungNodes.filter(n => n.type.startsWith('contact'));
              
              const outputsFound = rungNodes.filter(n => 
                n.type.startsWith('coil') || 
                n.type.startsWith('timer') || 
                n.type.startsWith('counter') || 
                n.type.startsWith('math') ||
                n.type.startsWith('compare') ||
                n.type === 'one-shot'
              );

              // Render FBD for each output block on the rung
              return outputsFound.map((output, outIdx) => {
                const isEnergized = !!state.simulation.values[`__pout_${output.id}`];
                const inputPowerArriving = !!state.simulation.values[`__pin_${output.id}`];
                const isSelected = selectedBlockId === output.id;

                return (
                  <div 
                    key={`${y}-${output.id}`}
                    onClick={() => {
                      setSelectedBlockId(output.id);
                      setSelectedRegAddr(output.address);
                    }}
                    className={clsx(
                      "relative border rounded-xl overflow-hidden transition-all duration-200 group cursor-pointer",
                      isSelected 
                        ? "border-[#1e293b] bg-[#0c121e] ring-1 ring-sky-500/20 shadow-2xl" 
                        : isEnergized 
                          ? "border-emerald-500/25 bg-[#0a110f]/80 hover:border-emerald-500/40" 
                          : "border-white/5 bg-[#080a10]/95 hover:border-white/10"
                    )}
                  >
                    {/* Header bar */}
                    <div className="bg-[#0e121c] border-b border-white/5 px-4 py-2.5 flex items-center justify-between text-[9px]">
                      <span className="font-bold flex items-center gap-2 text-sky-400 uppercase tracking-widest">
                        <Layers size={12} className="text-sky-500" />
                        LOGIC_CELL_SHEET_{rungIdx.toString().padStart(3, '0')}_{output.address.replace(/[^\w]/g, '_')}
                      </span>
                      <div className="flex items-center gap-3 text-zinc-500">
                        <span className="font-sans bg-black/40 px-2 py-0.5 rounded text-zinc-450 border border-white/5">
                          ELEV_Y: {Math.round(y)} • IN_BUS: {contacts.length}
                        </span>
                        {forces[output.address] !== undefined && (
                          <span className="bg-amber-500 text-black px-2 py-0.5 rounded font-black text-[8px] animate-pulse">FORCED</span>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 sm:p-4 flex flex-row items-center justify-between gap-2.5 md:gap-5 overflow-x-hidden min-w-0 select-none">
                      
                      {/* INPUT BUS CARD */}
                      <div className="w-[130px] sm:w-[155px] shrink-0 space-y-2.5 bg-black/30 p-2 sm:p-3 border border-white/5 rounded-lg">
                        <div className="text-[7.5px] text-zinc-500 font-bold uppercase tracking-widest border-b border-white/5 pb-1 flex justify-between">
                          <span>Input Bus</span>
                          <span className="text-zinc-650">0x00</span>
                        </div>
                        
                        {contacts.map((input, idx) => {
                          const conducts = !!state.simulation.values[`__pout_${input.id}`];
                          const rawVal = !!state.simulation.values[input.address];
                          const hasForce = forces[input.address] !== undefined;

                          return (
                            <div 
                              key={idx} 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleValue(input.address);
                                setSelectedRegAddr(input.address);
                                setTrendRegAddr(input.address);
                              }}
                              className={clsx(
                                "flex items-center gap-2 justify-between p-1.5 rounded border transition-colors cursor-pointer",
                                conducts 
                                  ? "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-300" 
                                  : "bg-[#0b0e14] border-white/5 hover:bg-white/5"
                              )}
                              title="Click to toggle register state value"
                            >
                              <div className="flex flex-col min-w-0">
                                <span className="text-[9px] font-bold text-slate-300 truncate">
                                  {input.tag || input.address}
                                </span>
                                <span className={clsx("text-[7.5px] tracking-wide", hasForce ? "text-amber-400" : "text-zinc-500")}>
                                  {input.address} {hasForce && ' (F)'}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-1.5 shrink-0">
                                {input.type === 'contact-nc' && (
                                  <span className="text-[6.5px] font-black bg-purple-950 text-purple-300 border border-purple-800 px-0.5 rounded uppercase tracking-tighter" title="Normally Closed Contact">NC</span>
                                )}
                                <div className={clsx(
                                  "w-2 h-2 rounded-sm border transition-all duration-300 flex items-center justify-center",
                                  rawVal 
                                    ? "bg-emerald-400 border-emerald-300 shadow-[0_0_6px_rgba(16,185,129,0.5)]" 
                                    : "bg-zinc-800 border-zinc-750"
                                )} />
                              </div>
                            </div>
                          );
                        })}

                        {contacts.length === 0 && (
                          <div className="text-[8.5px] text-zinc-500 italic py-1.5 text-center">
                            Rail Conductor
                          </div>
                        )}
                      </div>

                      {/* INPUT CHANNELS WIRE SCHEMATIC */}
                      <div className="flex flex-col justify-around h-24 relative w-4 md:w-8 shrink-0">
                        <div className="absolute inset-y-0 left-0 right-0 h-[1.5px] bg-zinc-800" />
                        {contacts.map((contact, idx) => {
                          const isWireConducting = !!state.simulation.values[`__pout_${contact.id}`];
                          return (
                            <div key={idx} className="h-full flex flex-col justify-center relative">
                              <div className={clsx(
                                "h-[1.5px] transition-colors",
                                state.simulation.isRunning && isWireConducting
                                  ? "bg-emerald-500 drop-shadow-[0_0_5px_#10b981]" 
                                  : "bg-zinc-800"
                              )} />
                            </div>
                          );
                        })}
                      </div>

                      {/* THE INTERACTIVE FUNCTION GATE BLOCK */}
                      <div className="flex-1 flex justify-center">
                        <div className={clsx(
                          "relative p-3.5 bg-[#0b0e14] border rounded-lg min-w-[140px] sm:min-w-[160px] max-w-[180px] shadow-2xl transition-all",
                          isSelected 
                            ? "border-sky-500/50 bg-[#0f1420]" 
                            : inputPowerArriving 
                              ? "border-emerald-500/20" 
                              : "border-zinc-800"
                        )}>
                          
                          {/* Symbolic visual of output type */}
                          <div className="absolute top-1.5 right-2 font-mono text-[7px] text-zinc-500 tracking-widest uppercase bg-black/40 px-1 py-0.5 rounded border border-white/5">
                            {output.type.toUpperCase().split('-')[0]}
                          </div>

                          <div className="flex flex-col items-center gap-1.5 mb-2.5">
                            <div className={clsx(
                              "w-9 h-9 rounded-lg border flex flex-col items-center justify-center transition-colors",
                              isEnergized 
                                ? "bg-emerald-500/10 border-emerald-400 text-emerald-400" 
                                : "bg-sky-500/5 border-sky-450/20 text-sky-400"
                            )}>
                              {output.type.startsWith('timer') ? (
                                <span className="text-[9.5px] font-black tracking-tighter">TON_D</span>
                              ) : output.type.startsWith('counter') ? (
                                <span className="text-[9.5px] font-black tracking-tighter">CNTR</span>
                              ) : output.type.startsWith('compare') ? (
                                <span className="text-[10px] font-black">COMP</span>
                              ) : output.type.startsWith('math') ? (
                                <span className="text-xs font-bold font-mono">CALC</span>
                              ) : output.type === 'one-shot' ? (
                                <span className="text-[9.5px] font-black">ONS</span>
                              ) : (
                                <span className="font-extrabold text-[11px]">&amp;&amp;</span>
                              )}
                            </div>
                            <span className="text-[8.5px] font-mono font-bold tracking-widest text-[#94a3b8] uppercase">
                              {output.type.toUpperCase().replace('-', '_')}
                            </span>
                          </div>

                          {/* Dynamic I/O Registers display */}
                          <div className="space-y-1 text-[8.5px] text-[#526a8c] text-left pt-2 border-t border-white/5 font-mono">
                            <div className="flex justify-between">
                              <span className="text-zinc-500">TAG:</span>
                              <span className="text-zinc-300 font-bold max-w-[65px] truncate">{output.tag || 'COIL'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500">ADDR:</span>
                              <span className="text-sky-400 font-bold">{output.address}</span>
                            </div>
                            
                            {/* Dynamically bind values for specialized FBD timer/counter registers */}
                            {(output.type.startsWith('timer') || output.type.startsWith('counter')) && (
                              <div className="mt-1.5 pt-1 border-t border-dashed border-white/5 space-y-1 bg-black/20 p-1 rounded">
                                <div className="flex justify-between text-amber-500/90 font-bold">
                                  <span>PRE:</span>
                                  <span>{output.params?.preset || 0}{output.type.startsWith('timer') ? (output.params?.timeBase === 'ms' ? 'ms' : 's') : ''}</span>
                                </div>
                                <div className="flex justify-between text-cyan-400 font-bold">
                                  <span>ACC:</span>
                                  <span>
                                    {output.type.startsWith('timer') ? (output.params?.timeBase === 'ms' ? (state.simulation.values[`${output.address}_ACC`] || 0) : (Number(state.simulation.values[`${output.address}_ACC`] || 0) / 1000).toFixed(1)) : (state.simulation.values[`${output.address}_ACC`] || 0)}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Dynamically bind constants/registers for comparisons or math scaling */}
                            {(output.type.startsWith('compare') || output.type.startsWith('math')) && (
                              <div className="mt-1.5 pt-1 border-t border-dashed border-white/5 space-y-1 bg-black/20 p-1 rounded">
                                <div className="flex justify-between text-yellow-400/90">
                                  <span>SRC_A:</span>
                                  <span className="font-bold text-zinc-300">{output.params?.sourceA || '0'}</span>
                                </div>
                                <div className="flex justify-between text-yellow-400/90">
                                  <span>SRC_B:</span>
                                  <span className="font-bold text-zinc-300">{output.params?.sourceB || '0'}</span>
                                </div>
                                {output.type.startsWith('math') && (
                                  <div className="flex justify-between text-emerald-450/90">
                                    <span>DEST:</span>
                                    <span className="font-bold text-sky-400 truncate max-w-[45px]">{output.params?.dest || output.address}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Pin continuity halos */}
                          <div className={clsx(
                            "absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 rounded-full border bg-zinc-900 flex items-center justify-center transition-colors",
                            inputPowerArriving ? "border-emerald-500 bg-emerald-950" : "border-zinc-750"
                          )}>
                            <div className={clsx("w-0.5 h-0.5 rounded-full", inputPowerArriving ? "bg-emerald-400" : "bg-zinc-600")} />
                          </div>
                          
                          <div className={clsx(
                            "absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 rounded-full border bg-zinc-900 flex items-center justify-center transition-colors",
                            isEnergized ? "border-emerald-500 bg-emerald-950" : "border-zinc-750"
                          )}>
                            <div className={clsx("w-0.5 h-0.5 rounded-full", isEnergized ? "bg-emerald-450 animate-ping" : "bg-zinc-650")} />
                          </div>
                        </div>
                      </div>

                      {/* OUTPUT TERMINAL CHANNEL */}
                      <div className="block h-[1.5px] bg-[#1a1d26] relative w-4 md:w-8 shrink-0">
                        <div className={clsx(
                          "h-[1.5px] transition-colors",
                          isEnergized 
                            ? "bg-emerald-500 drop-shadow-[0_0_5px_#10b981]" 
                            : "bg-[#1a1d26]"
                        )} />
                      </div>

                      {/* OUTPUT REG CARD */}
                      <div className="w-[130px] sm:w-[155px] shrink-0">
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            onNodeClick(output.id);
                          }}
                          className={clsx(
                            "p-2.5 rounded-lg border transition-all cursor-pointer shadow-xl flex flex-col gap-0.5 text-left relative",
                            isEnergized 
                              ? "bg-emerald-500/5 border-emerald-500 text-white shadow-emerald-500/[0.015]" 
                              : "bg-[#0b0e14] border-white/5 hover:border-zinc-700 text-zinc-400"
                          )}
                        >
                          <div className="absolute top-1.5 right-2">
                            <Zap size={11} className={clsx(isEnergized ? "text-emerald-400 animate-pulse" : "text-zinc-600")} />
                          </div>
                          <span className="text-[7.5px] font-bold text-zinc-550 uppercase tracking-widest">OUT_COIL</span>
                          <span className="text-[9px] font-bold text-sky-400">{output.address}</span>
                          <div className="mt-0.5 font-bold text-[10.5px] text-zinc-200 truncate uppercase">
                            {output.tag || 'COIL_OUT'}
                          </div>
                          <div className={clsx(
                            "text-[7.5px] font-bold mt-1.5 pt-1 border-t border-white/5 uppercase select-none tracking-widest flex items-center gap-1",
                            isEnergized ? "text-emerald-400" : "text-zinc-550"
                          )}>
                            <span className={clsx("w-1 h-1 rounded-full", isEnergized ? "bg-emerald-400" : "bg-zinc-655")} />
                            {isEnergized ? "HIGH [1]" : "LOW [0]"}
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Statement list instruction compiler output */}
                    <div className="bg-[#090b11] border-t border-white/5 px-5 py-3 shrink-0 flex items-center justify-between text-[10px] text-zinc-500">
                      <div className="flex items-center gap-2">
                        <Terminal size={12} className="text-sky-500" />
                        <span className="text-[9.5px] uppercase font-bold text-zinc-400 tracking-wider">COMPILED ST:</span>
                        <code className="text-amber-500 font-bold bg-[#0d121c] py-0.5 px-3 rounded border border-white/5 text-[9.5px]">
                          {compileBooleanExpression(contacts, output)}
                        </code>
                      </div>
                      <div className="text-[8px] text-zinc-600 flex items-center gap-1.5">
                        <span>GUIDREF: {output.id}</span>
                      </div>
                    </div>

                  </div>
                );
              });
            })}
            </div>

            {/* COMPLETE GLOBAL COMPILED FBD SCHEMATIC SHEET */}
            {rungCoordinates.length > 0 && (
              <div className="border border-white/5 bg-[#080d14] rounded-xl overflow-hidden shadow-2xl">
                {/* Header block */}
                <div className="bg-[#0b0f16] border-b border-white/10 px-5 py-3 flex items-center justify-between text-[10px]">
                  <span className="font-extrabold flex items-center gap-2 text-emerald-400 uppercase tracking-widest">
                    <Zap size={13} className="text-emerald-400 animate-pulse" />
                    MASTER COMPILED FBD SCHEMATIC (Workspace-Wide Compilation)
                  </span>
                  <span className="font-mono text-zinc-500 text-[8.5px] bg-[#0c0f16] border border-white/5 px-2.5 py-1 rounded">
                    SYS_SCAN: COMPLETED • DOCK_LINKS: ACTIVE
                  </span>
                </div>

                <div className="p-4 sm:p-6 bg-[#040609]/95 flex flex-col md:flex-row gap-6 items-stretch">
                  <div className="flex-1 bg-black/60 border border-white/5 rounded-lg p-4 overflow-x-auto select-none custom-scrollbar min-h-[300px] flex items-center justify-center">
                    {/* SVG Canvas drawing */}
                    {(() => {
                      // Gather all compiled output blocks across all rungs
                      const allOutputs: LadderNode[] = [];
                      rungCoordinates.forEach(y => {
                        const rungNodes = state.nodes.filter(n => getRungIndex(n) === y).sort((a, b) => a.x - b.x);
                        const outputsFound = rungNodes.filter(n => 
                          n.type.startsWith('coil') || 
                          n.type.startsWith('timer') || 
                          n.type.startsWith('counter') || 
                          n.type.startsWith('math') ||
                          n.type.startsWith('compare') ||
                          n.type === 'one-shot'
                        );
                        allOutputs.push(...outputsFound);
                      });

                      if (allOutputs.length === 0) {
                        return <div className="text-zinc-500 text-[10px] italic">No active functional rungs to map</div>;
                      }

                      const canvasHeight = Math.max(260, allOutputs.length * 85 + 40);

                      return (
                        <svg className="w-full min-w-[580px]" height={canvasHeight} viewBox={`0 0 600 ${canvasHeight}`}>
                          {/* Left Rail (Power Bus) */}
                          <line x1={30} y1={20} x2={30} y2={canvasHeight - 20} stroke="#334155" strokeWidth={5} strokeLinecap="round" />
                          <text x={26} y={15} textAnchor="start" className="text-[7.5px] font-black fill-zinc-500 tracking-wider font-mono">IN_BUS</text>

                          {/* Right Rail (Return Bus) */}
                          <line x1={570} y1={20} x2={570} y2={canvasHeight - 20} stroke="#1e293b" strokeWidth={5} strokeLinecap="round" />
                          <text x={552} y={15} textAnchor="start" className="text-[7.5px] font-black fill-zinc-500 tracking-wider font-mono">OUT_BUS</text>

                          {/* Render wires & blocks */}
                          {allOutputs.map((out, idx) => {
                            const isEnergized = !!state.simulation.values[`__pout_${out.id}`];
                            const inputPowerArriving = !!state.simulation.values[`__pin_${out.id}`];
                            const y = 35 + idx * 85;

                            // Left input wires
                            const inputConducts = state.simulation.isRunning && inputPowerArriving;
                            
                            return (
                              <g key={`master-block-${out.id}`}>
                                {/* Connection wire from Left Rail to Block input */}
                                <path 
                                  d={`M 30 ${y + 25} L 180 ${y + 25}`} 
                                  stroke={inputConducts ? "rgba(16, 185, 129, 0.45)" : "rgba(255, 255, 255, 0.05)"}
                                  strokeWidth={inputConducts ? 4 : 2.5}
                                  fill="none" 
                                  strokeLinecap="round" 
                                />
                                <path 
                                  d={`M 30 ${y + 25} L 180 ${y + 25}`} 
                                  stroke={inputConducts ? "#10b981" : "#3f3f46"} 
                                  strokeWidth={1.5}
                                  fill="none" 
                                  className={clsx("transition-all duration-300", inputConducts && "energized-flow-line")}
                                  strokeLinecap="round" 
                                />

                                {/* Connection wire from Block output to Right Rail */}
                                <path 
                                  d={`M 320 ${y + 25} L 570 ${y + 25}`} 
                                  stroke={isEnergized ? "rgba(16, 185, 129, 0.45)" : "rgba(255, 255, 255, 0.05)"}
                                  strokeWidth={isEnergized ? 4 : 2.5}
                                  fill="none" 
                                  strokeLinecap="round"
                                />
                                <path 
                                  d={`M 320 ${y + 25} L 570 ${y + 25}`} 
                                  stroke={isEnergized ? "#10b981" : "#3f3f46"} 
                                  strokeWidth={1.5}
                                  fill="none" 
                                  className={clsx("transition-all duration-300", isEnergized && "energized-flow-line")}
                                  strokeLinecap="round"
                                />

                                {/* Functional Block */}
                                <rect 
                                  x={180} 
                                  y={y} 
                                  width={140} 
                                  height={50} 
                                  rx={4} 
                                  fill="#0a0d14" 
                                  stroke={isEnergized ? "#10b981" : "#1e293b"} 
                                  strokeWidth={1.5} 
                                  className={clsx("transition-all", isEnergized && "shadow-[0_0_15px_rgba(16,185,129,0.15)]")}
                                />

                                {/* Little schematic terminal LED circles on block edges */}
                                <circle cx={180} cy={y + 25} r={3} fill={inputConducts ? "#10b981" : "#27272a"} stroke={inputConducts ? "#34d399" : "#3f3f46"} strokeWidth={0.5} />
                                <circle cx={320} cy={y + 25} r={3} fill={isEnergized ? "#10b981" : "#27272a"} stroke={isEnergized ? "#34d399" : "#3f3f46"} strokeWidth={0.5} />

                                {/* Text annotations inside and on top of block */}
                                <text x={250} y={y + 22} textAnchor="middle" className="text-[10px] fill-slate-200 font-bold font-mono tracking-tight">{out.tag || out.address}</text>
                                <text x={250} y={y + 36} textAnchor="middle" className="text-[8px] fill-zinc-500 font-mono font-bold tracking-widest">{out.type.toUpperCase().replace('-', '_')}</text>

                                {/* Displaying dynamic metrics next to blocks (e.g. current ACC or state value) */}
                                {(out.type.startsWith('timer') || out.type.startsWith('counter')) && (
                                  <text x={335} y={y + 16} textAnchor="start" className="text-[8.5px] fill-cyan-400 font-mono font-bold">
                                    ACC: {state.simulation.values[`${out.address}_ACC`] || 0}
                                  </text>
                                )}

                                {/* Output details on right rail mapping */}
                                <g transform={`translate(460, ${y + 5})`}>
                                  <rect x={0} y={0} width={90} height={20} rx={3} fill="#0d111a" stroke={isEnergized ? "#10b981" : "rgba(255,255,255,0.04)"} strokeWidth={0.8} />
                                  <circle cx={12} cy={10} r={4} fill={isEnergized ? "#10b981" : "#18181b"} className={clsx(isEnergized && "animate-pulse")} />
                                  <text x={25} y={13} className={clsx("text-[8.5px] font-bold font-mono", isEnergized ? "fill-emerald-400" : "fill-zinc-550")}>{out.address}</text>
                                </g>
                              </g>
                            );
                          })}
                        </svg>
                      );
                    })()}
                  </div>

                  {/* Informational CAD stamp/legend */}
                  <div className="w-full md:w-[220px] bg-[#080c12] border border-white/5 rounded-lg p-4 flex flex-col justify-between select-none">
                    <div className="space-y-3 font-mono">
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest border-b border-white/10 pb-1.5 block">CAD BLOCK LEGEND</span>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-3.5 h-1.5 bg-emerald-500 rounded-sm" />
                          <span className="text-[9px] text-zinc-400 uppercase">ENERGIZED CHANNEL</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="w-3.5 h-1.5 bg-zinc-800 rounded-sm" />
                          <span className="text-[9px] text-zinc-500 uppercase">IDLE/STANDBY WIRE</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="w-3 h-3 rounded-full bg-emerald-500/25 border border-emerald-400" />
                          <span className="text-[9px] text-zinc-400 uppercase">TERMINAL LED ON</span>
                        </div>
                      </div>

                      <p className="text-[9.5px] leading-relaxed text-zinc-500 border-t border-white/10 pt-2.5">
                        This is a compiled visual topology of the entire PLC network logic. It maps real-time logical continuity across all instruction rungs and wire intersections in a unified diagram.
                      </p>
                    </div>

                    <div className="text-[8px] text-zinc-650 font-mono pt-4 md:pt-0 leading-normal border-t border-white/10 mt-4 md:mt-0">
                      DRAWING FILE: <span className="text-zinc-500">MASTER_FBD_INT.DWG</span><br/>
                      COMPACT VERSION: <span className="text-zinc-500">5.41a</span><br/>
                      OPERATIONAL ENVELOPE: <span className="text-sky-400 font-bold">OPTIMAL</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DYNAMIC STRUCTURED TEXT PLC EXPORTER PORTAL */}
            {rungCoordinates.length > 0 && (
              <div className="border border-white/5 bg-[#090c15] rounded-xl overflow-hidden shadow-2xl mt-8">
                {/* Header */}
                <div className="bg-[#0f131f] border-b border-white/5 px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-xs font-extrabold tracking-widest text-[#cbd5e1] uppercase select-none">
                      ST PROGRAM COMPILER (IEC 61131-3 STANDARD BROADCASTER)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const codeText = generateFullStructuredText();
                        navigator.clipboard.writeText(codeText);
                      }}
                      className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 rounded font-bold text-[9px] uppercase tracking-wide transition-colors"
                      title="Copy standard IEC Structured Text code block to clipboard"
                    >
                      Copy ST Code
                    </button>
                    <button
                      onClick={() => {
                        const codeText = generateFullStructuredText();
                        const blob = new Blob([codeText], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'MainLogic.st';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded font-bold text-[9px] uppercase tracking-wide transition-colors"
                      title="Download standard compiled .ST code file"
                    >
                      Export .ST File
                    </button>
                  </div>
                </div>

                {/* Body code box */}
                <div className="p-4 bg-black/60 relative">
                  <div className="absolute right-4 top-4 text-[7px] text-zinc-650 font-bold bg-[#0d121c] border border-white/5 px-1.5 py-0.5 rounded tracking-widest uppercase select-none">
                    SYNTAX: IEC_ST_LANG [OK]
                  </div>
                  <pre className="text-[10px] text-zinc-300 overflow-x-auto text-left max-h-[300px] overflow-y-auto custom-scrollbar font-mono leading-relaxed bg-[#05060b] p-4 rounded border border-white/5">
                    <code>
                      {generateFullStructuredText().split('\n').map((line, idx) => (
                        <div key={idx} className="flex gap-4">
                          <span className="text-zinc-600 select-none text-right w-6 shrink-0 border-r border-white/5 pr-1.5">
                            {(idx + 1).toString().padStart(2, '0')}
                          </span>
                          <span className={clsx(
                            line.trim().startsWith('//') || line.trim().startsWith('(*') || line.startsWith(' *') || line.trim().endsWith('*)')
                              ? "text-zinc-500 italic"
                              : line.trim().startsWith('PROGRAM') || line.trim().startsWith('VAR') || line.trim().endsWith('VAR') || line.trim().startsWith('END_')
                                ? "text-purple-400 font-bold"
                                : "text-amber-400"
                          )}>
                            {line}
                          </span>
                        </div>
                      ))}
                    </code>
                  </pre>
                  
                  {/* Status row info */}
                  <div className="mt-3 flex items-center justify-between text-[8px] text-zinc-550 border-t border-white/5 pt-2 font-mono select-none">
                    <span>COMPILER PIPELINE: AUTOMATIC HOT-RELOAD TRACING ON LADDER CHANGE</span>
                    <span className="text-sky-500 font-bold">ST_SIZE: {generateFullStructuredText().length} CHARACTERS</span>
                  </div>
                </div>
              </div>
            )}

            {rungCoordinates.length === 0 && (
              <div className="flex flex-col items-center justify-center py-40 border border-dashed border-white/10 rounded-xl bg-[#090b10]">
                <Layers size={45} className="text-zinc-800 mb-4" />
                <p className="text-xs font-bold text-zinc-500 tracking-widest">NO LOGICAL BOUND RUNG SEGMENTS DETECTED</p>
                <p className="text-[9px] text-zinc-650 mt-1 uppercase tracking-wider">Please construct logic steps in the routine view. Any coil, counter, timer, or math instruction will emit an FBD graph sheet here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Professional PLC diagnostic & Register Forcing interface (No toy modals) */}
        <div className="w-[360px] bg-[#090b11] border-l border-white/10 flex flex-col shrink-0 select-none overflow-y-auto custom-scrollbar">
          
          <div className="p-5 border-b border-white/10 bg-[#0c0f16]">
            <h3 className="text-xs font-black tracking-widest text-[#94a3b8] flex items-center gap-2.5">
              <Sliders size={13} className="text-sky-400" />
              PLC MEMORY MONITOR & FORCING
            </h3>
            <p className="text-[9px] text-zinc-500 mt-0.5 uppercase tracking-wider">Forcing, release, and live register trace</p>
          </div>

          <div className="flex-1 p-5 space-y-6">
            
            {/* INLINE FORCING PANEL CONTROLLER */}
            {selectedRegAddr && (
              <div className="bg-[#0f1422] border border-sky-500/20 p-4 rounded-xl space-y-3.5">
                <div className="flex justify-between items-center bg-black/20 p-2.5 rounded border border-white/5">
                  <div>
                    <span className="text-[8px] font-bold text-sky-400 block tracking-widest uppercase">Target Register</span>
                    <span className="text-[11px] font-black text-white">{selectedRegAddr}</span>
                  </div>
                  <div>
                    {forces[selectedRegAddr] !== undefined ? (
                      <span className="bg-amber-500 text-black font-black font-mono text-[8px] px-1.5 py-0.5 rounded tracking-wide uppercase">FORCED</span>
                    ) : (
                      <span className="bg-zinc-800 text-zinc-400 text-[8px] px-1.5 py-0.5 rounded tracking-wide uppercase">UNFORCED</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-[10px] text-zinc-450 leading-relaxed pl-1">
                  <div>Active state value: <span className="text-white font-bold">{state.simulation.values[selectedRegAddr] === true ? 'TRUE' : state.simulation.values[selectedRegAddr] === false ? 'FALSE' : (state.simulation.values[selectedRegAddr] ?? '0')}</span></div>
                </div>

                {/* FORWARD SIGNAL ACTIONS */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                  <button 
                    onClick={() => handleForceValue(selectedRegAddr, true)}
                    className="py-1.5 px-3 bg-amber-600/25 text-amber-300 border border-amber-500/30 rounded font-bold text-[9px] hover:bg-amber-600/35 transition-colors uppercase"
                    title="Force this PLC bit state to True (ON) in RAM register"
                  >
                    Force [1]
                  </button>
                  <button 
                    onClick={() => handleForceValue(selectedRegAddr, false)}
                    className="py-1.5 px-3 bg-blue-600/20 text-blue-300 border border-blue-500/20 rounded font-bold text-[9px] hover:bg-blue-600/30 transition-colors uppercase"
                    title="Force this PLC bit state to False (OFF) in RAM register"
                  >
                    Force [0]
                  </button>
                  <button 
                    onClick={() => handleForceValue(selectedRegAddr, undefined)}
                    disabled={forces[selectedRegAddr] === undefined}
                    className="py-1.5 px-3 col-span-2 bg-[#121620] border border-white/5 disabled:opacity-30 rounded font-bold text-[9px] hover:bg-zinc-800 transition-colors text-zinc-300 uppercase flex items-center justify-center gap-1.5"
                  >
                    <XSquare size={11} className="text-zinc-400" />
                    Release Force (Clear Override)
                  </button>
                </div>
              </div>
            )}

            {/* LIVE SIGNAL WAVEFORM HISTORIAL TRENDS */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-black tracking-widest text-zinc-450 flex items-center gap-2">
                  <TrendingUp size={11} className="text-emerald-400" />
                  REAL-TIME REGISTER OSCILLOSCOPE
                </h4>
                <select 
                  className="bg-black border border-white/10 text-[9px] p-0.5 rounded text-zinc-400 focus:outline-none"
                  value={trendRegAddr}
                  onChange={(e) => setTrendRegAddr(e.target.value)}
                >
                  {Object.keys(state.simulation.values)
                    .filter(k => !k.startsWith('__'))
                    .map(k => (
                      <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>

              {/* Sparks trend container */}
              <div className="p-3 bg-black border border-white/5 rounded-lg">
                <div className="h-16 flex items-end gap-[1px]">
                  {(() => {
                    const h = state.simulation.history?.[trendRegAddr] || Array(50).fill(0);
                    // Standardize height calculation
                    return h.slice(-40).map((val, idx) => (
                      <div 
                        key={idx} 
                        className={clsx(
                          "flex-1 transition-all rounded-[0.5px]",
                          val > 0 ? "bg-emerald-500" : "bg-zinc-800"
                        )}
                        style={{ height: val > 0 ? '100%' : '10%', opacity: 0.2 + (idx/40) * 0.8 }} 
                      />
                    ));
                  })()}
                </div>
                <div className="flex justify-between text-[7px] text-zinc-600 mt-2 font-mono">
                  <span>-40s TIME WINDOW</span>
                  <span className="text-sky-400 font-bold uppercase">ZOOM TRACE ON {trendRegAddr}</span>
                  <span>LIVE SCANNING SUITE</span>
                </div>
              </div>
            </div>

            {/* LOGOSOFT LIGHT INDICATORS BOARD */}
            <div className="space-y-3 p-4 bg-[#0d121f] border border-white/5 rounded-xl">
              <h4 className="text-[10px] font-black tracking-widest text-[#a3b3cc] flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  PILOT LAMPS & LIGHT INDICATORS (LogoSoft Style)
                </span>
                <span className="text-[7.5px] font-mono text-zinc-500">I_O TEST DECK</span>
              </h4>

              <div className="grid grid-cols-2 gap-4">
                {/* Inputs Board */}
                <div className="space-y-2 bg-[#06080e] p-2.5 rounded-lg border border-white/5">
                  <div className="text-[7.5px] text-zinc-500 font-bold uppercase tracking-wider border-b border-white/5 pb-1 flex justify-between items-center">
                    <span>Digital Inputs</span>
                    <span className="text-zinc-650 font-mono">I:0/x</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: 8 }).map((_, idx) => {
                      const addr = `I:0/${idx}`;
                      const val = !!state.simulation.values[addr];
                      const isForced = forces[addr] !== undefined;

                      return (
                        <div 
                          key={addr}
                          onClick={() => onForceIO?.(addr, isForced ? undefined : !val)}
                          className={clsx(
                            "flex flex-col items-center gap-1.5 p-1 rounded border cursor-pointer hover:bg-white/[0.03] transition-all",
                            val ? "border-emerald-500/30 bg-emerald-500/5 shadow-[rgba(16,185,129,0.08)_0_0_8px]" : "border-zinc-800/80 bg-black/40",
                            isForced && "ring-1 ring-amber-500"
                          )}
                          title={`Toggle / Force input ${addr}`}
                        >
                          {/* Beautiful glass bulb lens */}
                          <div className={clsx(
                            "w-5 h-5 rounded-full border flex items-center justify-center relative transition-shadow duration-300",
                            val 
                              ? "bg-gradient-to-tr from-emerald-600 via-emerald-400 to-emerald-200 border-emerald-350 shadow-[0_0_12px_rgba(16,185,129,0.7)]" 
                              : "bg-gradient-to-tr from-red-950 via-red-800 to-red-400 border-red-900"
                          )}>
                            {/* Inner bulb filament filament reflection highlight */}
                            <span className="absolute top-0.5 left-1 w-1.5 h-1 bg-white/40 rounded-full" />
                            <span className="text-[7px] font-black text-black select-none font-mono tracking-tighter">I{idx}</span>
                          </div>
                          <span className={clsx("text-[7px] font-mono font-bold", val ? "text-emerald-400" : "text-zinc-500")}>
                            {idx.toString().padStart(2, '0')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Outputs Board */}
                <div className="space-y-2 bg-[#06080e] p-2.5 rounded-lg border border-white/5">
                  <div className="text-[7.5px] text-zinc-500 font-bold uppercase tracking-wider border-b border-white/5 pb-1 flex justify-between items-center">
                    <span>Digital Outputs</span>
                    <span className="text-zinc-650 font-mono">O:0/x</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: 8 }).map((_, idx) => {
                      const addr = `O:0/${idx}`;
                      const val = !!state.simulation.values[addr];
                      const isForced = forces[addr] !== undefined;

                      return (
                        <div 
                          key={addr}
                          onClick={() => onForceIO?.(addr, isForced ? undefined : !val)}
                          className={clsx(
                            "flex flex-col items-center gap-1.5 p-1 rounded border cursor-pointer hover:bg-white/[0.03] transition-all",
                            val ? "border-emerald-500/30 bg-emerald-500/5 shadow-[rgba(16,185,129,0.08)_0_0_8px]" : "border-zinc-800/80 bg-black/40",
                            isForced && "ring-1 ring-amber-500"
                          )}
                          title={`Toggle / Force output ${addr}`}
                        >
                          {/* Beautiful output indicator lamps lens */}
                          <div className={clsx(
                            "w-5 h-5 rounded-full border flex items-center justify-center relative transition-shadow duration-300",
                            val 
                              ? "bg-gradient-to-tr from-blue-600 via-blue-400 to-cyan-300 border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.7)]" 
                              : "bg-gradient-to-tr from-[#1b1c24] via-zinc-800 to-zinc-550 border-zinc-700"
                          )}>
                            {/* Reflection glow */}
                            <span className="absolute top-0.5 left-1 w-1.5 h-1 bg-white/40 rounded-full" />
                            <span className={clsx("text-[7px] font-black select-none font-mono tracking-tighter", val ? "text-white" : "text-zinc-500")}>O{idx}</span>
                          </div>
                          <span className={clsx("text-[7px] font-mono font-bold", val ? "text-blue-400" : "text-zinc-500")}>
                            {idx.toString().padStart(2, '0')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* LIVE REGISTERS WATCH TABLE */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black tracking-widest text-zinc-450 flex items-center gap-2">
                <Database size={11} className="text-sky-400" />
                ACTIVE MEMORY MAP INDEX
              </h4>
              <div className="bg-black/40 border border-white/5 rounded-lg overflow-hidden divide-y divide-white/5 max-h-[220px] overflow-y-auto custom-scrollbar">
                {Object.entries(state.simulation.values)
                  .filter(([addr]) => !addr.startsWith('__') && !addr.endsWith('_ONS_LAST'))
                  .map(([addr, val]) => {
                    const isForced = forces[addr] !== undefined;
                    return (
                      <div 
                        key={addr} 
                        onClick={() => {
                          setSelectedRegAddr(addr);
                          setTrendRegAddr(addr);
                        }}
                        className={clsx(
                          "flex items-center justify-between p-2.5 transition-colors cursor-pointer hover:bg-white/5",
                          selectedRegAddr === addr && "bg-[#0c121c] border-l-2 border-sky-400"
                        )}
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-zinc-200 text-[10px] truncate">{addr}</span>
                          <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest">
                            {isForced ? 'FORCED REGISTER' : 'PLC REGISTER'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isForced && <span className="text-[7px] bg-amber-500 text-black px-1 rounded font-black">F</span>}
                          <span className={clsx(
                            "text-[8.5px] px-1.5 py-0.5 rounded font-black",
                            val === true ? "bg-emerald-500/15 text-emerald-400" :
                            val === false ? "bg-zinc-800 text-zinc-500" : "bg-cyan-500/15 text-cyan-400 border border-cyan-500/15"
                          )}>
                            {val === true ? '1 (TRUE)' : val === false ? '0 (FLSE)' : val}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                {Object.keys(state.simulation.values).length === 0 && (
                  <div className="p-6 text-center text-zinc-650 text-[10px] italic">No active system registers.</div>
                )}
              </div>
            </div>

          </div>

          <div className="p-4 border-t border-white/10 bg-[#0c0e15] text-[9px] text-[#42526e] flex items-center justify-between font-mono shrink-0">
            <span>VL_CONTROLLER_RAM v5.0</span>
            <span className="text-emerald-500 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              CPU ONLINE SCANS ACTIVE
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
