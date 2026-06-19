import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Settings, 
  Compass, 
  Tv, 
  Layers, 
  HelpCircle, 
  Check, 
  Zap, 
  Activity, 
  Disc,
  Play,
  RotateCcw,
  Sliders,
  ChevronRight,
  Flame,
  Thermometer,
  Eye,
  Info,
  Link,
  Shuffle,
  RefreshCcw,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { LadderState, LadderNode } from '@/lib/plc-types';
import { clsx } from 'clsx';

interface MechatronicsViewProps {
  state: LadderState;
  onUpdateAddressValue?: (address: string, val: boolean | number) => void;
  onForceIO?: (address: string, val: boolean | number, force: boolean) => void;
}

export function MechatronicsView({ state, onUpdateAddressValue, onForceIO }: MechatronicsViewProps) {
  // Modes: 
  // 'compiler' -> Auto-generate mechatronic flow lines directly from the logical rungs!
  // 'presets' -> Heavy industrial standard physical stations (double-acting clamp and heavy ram)
  const [operatingMode, setOperatingMode] = useState<'compiler' | 'presets'>('compiler');

  // Hardcoded presets configs
  const presets = [
    {
      id: 'fixture',
      name: 'Double-Acting Pneumatic Clamp & Stamp',
      desc: 'Typical assembly line clamp utilizing a pneumatic solenoid with spring return and cylinder status sensors.',
      pneuExtendAddr: 'O:0/2',
      pneuRetractAddr: 'O:0/3',
      pneuSensRet: 'I:0/2',
      pneuSensExt: 'I:0/3',
      hydExtendAddr: 'O:0/4',
      hydRetractAddr: 'O:0/5',
      hydSensRet: 'I:0/4',
      hydSensExt: 'I:0/5',
    },
    {
      id: 'press',
      name: 'Heavy-Duty Hydraulic Press Stand',
      desc: 'High-pressure hydraulic system for metal forming with motor pump active status and dual-solenoid 3-position valve.',
      pneuExtendAddr: 'O:0/12',
      pneuRetractAddr: 'O:0/13',
      pneuSensRet: 'I:0/12',
      pneuSensExt: 'I:0/13',
      hydExtendAddr: 'O:0/6',
      hydRetractAddr: 'O:0/7',
      hydSensRet: 'I:0/6',
      hydSensExt: 'I:0/7',
    }
  ];

  const [activePreset, setActivePreset] = useState('fixture');
  const presetConfig = presets.find(p => p.id === activePreset) || presets[0];

  // Static general state values for high-fidelity stations
  const [pneumaticReservoirBar, setPneumaticReservoirBar] = useState(6.2); // bar
  const [hydraulicPumpPsi, setHydraulicPumpPsi] = useState(1250); // PSI
  const [compressorRunning, setCompressorRunning] = useState(true);
  const [hydroPumpRunning, setHydroPumpRunning] = useState(false);
  const [showFlowLines, setShowFlowLines] = useState(true);

  // Address overrides for custom high-fidelity profiles
  const [pneuExtendAddr, setPneuExtendAddr] = useState(presetConfig.pneuExtendAddr);
  const [pneuRetractAddr, setPneuRetractAddr] = useState(presetConfig.pneuRetractAddr);
  const [pneuSensRet, setPneuSensRet] = useState(presetConfig.pneuSensRet);
  const [pneuSensExt, setPneuSensExt] = useState(presetConfig.pneuSensExt);

  const [hydExtendAddr, setHydExtendAddr] = useState(presetConfig.hydExtendAddr);
  const [hydRetractAddr, setHydRetractAddr] = useState(presetConfig.hydRetractAddr);
  const [hydSensRet, setHydSensRet] = useState(presetConfig.hydSensRet);
  const [hydSensExt, setHydSensExt] = useState(presetConfig.hydSensExt);

  // Sync state if preset changes
  useEffect(() => {
    setPneuExtendAddr(presetConfig.pneuExtendAddr);
    setPneuRetractAddr(presetConfig.pneuRetractAddr);
    setPneuSensRet(presetConfig.pneuSensRet);
    setPneuSensExt(presetConfig.pneuSensExt);

    setHydExtendAddr(presetConfig.hydExtendAddr);
    setHydRetractAddr(presetConfig.hydRetractAddr);
    setHydSensRet(presetConfig.hydSensRet);
    setHydSensExt(presetConfig.hydSensExt);
  }, [activePreset]);

  // Read actual PLC Simulation states for preset models
  const isPneuExtendCoilActive = Boolean(state.simulation.values[pneuExtendAddr]);
  const isPneuRetractCoilActive = Boolean(state.simulation.values[pneuRetractAddr]);
  const isHydExtendCoilActive = Boolean(state.simulation.values[hydExtendAddr]);
  const isHydRetractCoilActive = Boolean(state.simulation.values[hydRetractAddr]);

  // Cylinder positions (A & B) for high fidelity presets (0 to 100%)
  const [cylinder1Pos, setCylinder1Pos] = useState(0); 
  const [cylinder2Pos, setCylinder2Pos] = useState(0); 

  // --- COMPILER MODE STATES ---
  // Store cylinder positions for compiled rungs. ID key is the rung index.
  const [compiledCylinderPositions, setCompiledCylinderPositions] = useState<Record<number, number>>({});
  // User fluid medium preference toggles per compiled rung ('pneumatic' or 'hydraulic')
  const [rungMediums, setRungMediums] = useState<Record<number, 'pneumatic' | 'hydraulic'>>({});

  // Dynamic helper to calculate standard 0-based logical rung indices matching general app boundaries
  const getRungIndex = (n: LadderNode) => Math.round((n.y + n.height / 2 - 48) / 96);

  const rungCoordinates = Array.from(new Set(state.nodes.map(getRungIndex)));
  rungCoordinates.sort((a, b) => a - b);

  // Simulation loop
  useEffect(() => {
    if (!state.simulation.isRunning) return;

    const interval = setInterval(() => {
      // 1. High Fidelity Station: Pneumatic cylinder mechanical movement
      setCylinder1Pos(prev => {
        let dest = prev;
        if (isPneuExtendCoilActive && !isPneuRetractCoilActive) {
          dest = Math.min(100, prev + 8);
        } else if (isPneuRetractCoilActive && !isPneuExtendCoilActive) {
          dest = Math.max(0, prev - 8);
        }
        return dest;
      });

      // 2. High Fidelity Station: Hydraulic Cylinder mechanical movement
      setCylinder2Pos(prev => {
        let dest = prev;
        if (isHydExtendCoilActive && !isHydRetractCoilActive) {
          dest = Math.min(100, prev + 4);
        } else if (isHydRetractCoilActive && !isHydExtendCoilActive) {
          dest = Math.max(0, prev - 4);
        }
        return dest;
      });

      // 3. AUTO-GENERATED COMPILER MODE: Dynamic mechanical piston stroke calculations
      rungCoordinates.forEach(rungIdx => {
        const rungNodes = state.nodes.filter(n => getRungIndex(n) === rungIdx).sort((a, b) => a.x - b.x);
        const outputs = rungNodes.filter(n => 
          n.type.startsWith('coil') || 
          n.type.startsWith('timer') || 
          n.type.startsWith('counter')
        );

        if (outputs.length > 0) {
          const activeOutput = outputs[0];
          const isCoilActive = Boolean(state.simulation.values[activeOutput.address]);
          const systemMedium = rungMediums[rungIdx] || 'pneumatic';
          
          setCompiledCylinderPositions(prev => {
            const currentVal = prev[rungIdx] ?? 0;
            // High speed fluid change for air; steadier stable motion for hydraulic
            const delta = systemMedium === 'pneumatic' ? 10 : 4;
            let nextVal = currentVal;

            if (isCoilActive) {
              nextVal = Math.min(100, currentVal + delta);
            } else {
              // Standard spring or logic retract return if output loses power
              nextVal = Math.max(0, currentVal - delta);
            }

            return { ...prev, [rungIdx]: nextVal };
          });
        }
      });

      // Air compressor pressure build
      if (compressorRunning) {
        setPneumaticReservoirBar(prev => {
          const loss = (isPneuExtendCoilActive || isPneuRetractCoilActive) ? 0.12 : 0.01;
          return Math.max(0, Math.min(10, prev + 0.1 - loss));
        });
      } else {
        setPneumaticReservoirBar(prev => Math.max(0, prev - 0.04));
      }

      // Hydraulic unit pressure build
      if (hydroPumpRunning) {
        setHydraulicPumpPsi(prev => {
          const target = (isHydExtendCoilActive || isHydRetractCoilActive) ? 1400 : 2000;
          return Math.round(prev + (target - prev) * 0.18 + (Math.random() * 10 - 5));
        });
      } else {
        setHydraulicPumpPsi(prev => Math.max(0, Math.round(prev * 0.88)));
      }

    }, 100);

    return () => clearInterval(interval);
  }, [
    state.simulation.isRunning, 
    isPneuExtendCoilActive, 
    isPneuRetractCoilActive, 
    isHydExtendCoilActive, 
    isHydRetractCoilActive,
    state.simulation.values,
    compressorRunning,
    hydroPumpRunning,
    rungCoordinates,
    rungMediums,
    state.nodes
  ]);

  // Decoupled back propagation effects to update IO states outside of state rendering/interval loop
  useEffect(() => {
    if (!state.simulation.isRunning || !onUpdateAddressValue) return;

    const atRetracted1 = cylinder1Pos <= 2;
    const atExtended1 = cylinder1Pos >= 98;
    if (Boolean(state.simulation.values[pneuSensRet]) !== atRetracted1) {
      onUpdateAddressValue(pneuSensRet, atRetracted1);
    }
    if (Boolean(state.simulation.values[pneuSensExt]) !== atExtended1) {
      onUpdateAddressValue(pneuSensExt, atExtended1);
    }
  }, [
    cylinder1Pos, 
    state.simulation.isRunning, 
    pneuSensRet, 
    pneuSensExt, 
    state.simulation.values, 
    onUpdateAddressValue
  ]);

  useEffect(() => {
    if (!state.simulation.isRunning || !onUpdateAddressValue) return;

    const atRetracted2 = cylinder2Pos <= 2;
    const atExtended2 = cylinder2Pos >= 98;
    if (Boolean(state.simulation.values[hydSensRet]) !== atRetracted2) {
      onUpdateAddressValue(hydSensRet, atRetracted2);
    }
    if (Boolean(state.simulation.values[hydSensExt]) !== atExtended2) {
      onUpdateAddressValue(hydSensExt, atExtended2);
    }
  }, [
    cylinder2Pos, 
    state.simulation.isRunning, 
    hydSensRet, 
    hydSensExt, 
    state.simulation.values, 
    onUpdateAddressValue
  ]);

  useEffect(() => {
    if (!state.simulation.isRunning || !onUpdateAddressValue) return;

    rungCoordinates.forEach(rungIdx => {
      const rungNodes = state.nodes.filter(n => getRungIndex(n) === rungIdx);
      const outputs = rungNodes.filter(n => 
        n.type.startsWith('coil') || 
        n.type.startsWith('timer') || 
        n.type.startsWith('counter')
      );

      if (outputs.length > 0) {
        const activeOutput = outputs[0];
        const currentPos = compiledCylinderPositions[rungIdx] ?? 0;

        const baseAddr = activeOutput.address.replace(/[^\d]/g, '');
        const sRet = `I:0/${(Number(baseAddr) * 2) % 16}`;
        const sExt = `I:0/${((Number(baseAddr) * 2) + 1) % 16}`;

        const isAtRetVal = currentPos <= 2;
        const isAtExtVal = currentPos >= 98;

        if (Boolean(state.simulation.values[sRet]) !== isAtRetVal) {
          onUpdateAddressValue(sRet, isAtRetVal);
        }
        if (Boolean(state.simulation.values[sExt]) !== isAtExtVal) {
          onUpdateAddressValue(sExt, isAtExtVal);
        }
      }
    });
  }, [
    compiledCylinderPositions, 
    rungCoordinates, 
    state.nodes, 
    state.simulation.isRunning, 
    state.simulation.values, 
    onUpdateAddressValue
  ]);

  const handleInjectAddress = (addr: string) => {
    if (onUpdateAddressValue) {
      onUpdateAddressValue(addr, false);
    }
  };

  const toggleRungMedium = (rungIdx: number) => {
    setRungMediums(prev => ({
      ...prev,
      [rungIdx]: (prev[rungIdx] || 'pneumatic') === 'pneumatic' ? 'hydraulic' : 'pneumatic'
    }));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#07080c] overflow-hidden text-slate-300 font-sans">
      
      {/* Header Panel */}
      <div className="bg-[#0b0c15] border-b border-white/5 p-4 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm select-none">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-lg">
            <Compass size={18} className="animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div className="text-left">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-100 font-mono flex items-center gap-2">
              Fluid Power & Mechatronics Lab
              <span className="text-[8px] font-black bg-pink-650 text-white px-1 py-0.2 rounded font-sans uppercase">MECH_LINE</span>
            </h2>
            <p className="text-[9px] text-zinc-500 font-bold select-none mt-0.5">
              Live Pneumatic & Hydraulic mechatronic simulators dynamically translated directly from electrical logic rungs
            </p>
          </div>
        </div>

        {/* Operating Mode Selector Tabs */}
        <div className="flex items-center bg-black/40 border border-white/10 p-0.5 rounded-lg">
          <button 
            onClick={() => setOperatingMode('compiler')}
            className={clsx(
              "px-3 py-1 text-[9.5px] font-extrabold uppercase rounded-md tracking-wider transition-all flex items-center gap-1.5",
              operatingMode === 'compiler' 
                ? "bg-pink-600/20 border border-pink-500/30 text-pink-400 font-black shadow-md" 
                : "text-zinc-500 hover:text-zinc-350"
            )}
          >
            <Shuffle size={12} /> Active LAD Logical Flow Compiler
          </button>
          
          <button 
            onClick={() => setOperatingMode('presets')}
            className={clsx(
              "px-3 py-1 text-[9.5px] font-extrabold uppercase rounded-md tracking-wider transition-all flex items-center gap-1.5",
              operatingMode === 'presets' 
                ? "bg-pink-600/20 border border-pink-500/30 text-pink-400 font-black shadow-md" 
                : "text-zinc-500 hover:text-zinc-350"
            )}
          >
            <SlidersHorizontal size={12} /> High-Fidelity Stations
          </button>
        </div>
      </div>

      {/* Main Work Surface */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Surface Block */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4 border-r border-[#1a1b24]">
          
          {/* Status readouts header always visible for engineering authenticity */}
          <div className="bg-[#0b0c13] border border-white/5 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-[9.5px] font-mono shrink-0 select-none">
            <div className="flex items-center gap-4">
              <span className="text-zinc-650 font-black">PRESSURE SYSTEMS BUS:</span>
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400">Pneu. Compressor:</span>
                <button 
                  onClick={() => setCompressorRunning(!compressorRunning)}
                  className={clsx(
                    "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase transition-all border",
                    compressorRunning ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-red-500/10 text-red-500 border-red-500/20"
                  )}
                >
                  {compressorRunning ? "ACTIVE" : "STANDBY"}
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400">Hyd. Pump Unit:</span>
                <button 
                  onClick={() => setHydroPumpRunning(!hydroPumpRunning)}
                  className={clsx(
                    "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase transition-all border",
                    hydroPumpRunning ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-red-500/10 text-red-500 border-red-500/20"
                  )}
                >
                  {hydroPumpRunning ? "ACTIVE" : "STANDBY"}
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-zinc-500">
              <Activity size={12} className={clsx(state.simulation.isRunning ? "text-emerald-500 animate-pulse" : "text-zinc-700")} />
              <span>PLC RUNTIME: {state.simulation.isRunning ? "CONNECTED & SOLVING" : "HALTED/STOPPED"}</span>
            </div>
          </div>

          {/* ==================== A: COMPILER OPERATING MODE ==================== */}
          {operatingMode === 'compiler' && (
            <div className="space-y-4">
              
              {rungCoordinates.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-white/5 text-center text-zinc-500 bg-black/10 select-none">
                  <Cpu size={32} className="mx-auto text-zinc-750 mb-3" />
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">No active logic rungs found in Workspace</p>
                  <p className="text-[9.5px] text-zinc-500 max-w-md mx-auto mt-1 leading-normal">
                    Please jump to the routine design workspace and construct contacts and coils on a rung. This compiler will instantly render and connect responsive mechatronic equivalents!
                  </p>
                </div>
              ) : (
                rungCoordinates.map((y, index) => {
                  const rungNodes = state.nodes.filter(n => getRungIndex(n) === y).sort((a, b) => a.x - b.x);
                  const contacts = rungNodes.filter(n => n.type.startsWith('contact'));
                  const outputs = rungNodes.filter(n => 
                    n.type.startsWith('coil') || 
                    n.type.startsWith('timer') || 
                    n.type.startsWith('counter')
                  );

                  const currentPos = compiledCylinderPositions[y] ?? 0;
                  const medium = rungMediums[y] || 'pneumatic';

                  return (
                    <div key={y} className="bg-[#090b0f] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 relative hover:border-pink-500/20 transition-all">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono bg-[#1c1d28] text-pink-400 font-bold px-1.5 py-0.5 rounded">
                            FLUID_RUNG_{index + 1}
                          </span>
                          <span className="text-[10px] font-bold text-slate-300">
                            Mechatronic Translation
                          </span>
                        </div>
                        
                        {/* Interactive toggle for fluid medium: Pneumatics (Air) vs Hydraulics (Oil) */}
                        <div className="flex items-center gap-2">
                          <span className="text-[8.5px] font-mono text-zinc-500">MEDIUM SELECT:</span>
                          <button 
                            onClick={() => toggleRungMedium(y)}
                            className={clsx(
                              "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all",
                              medium === 'pneumatic' 
                                ? "bg-sky-500/15 text-sky-400 border border-sky-500/30" 
                                : "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                            )}
                          >
                            {medium.toUpperCase()}
                          </button>
                        </div>
                      </div>

                      {/* Render of Rung Flow Diagram SVG */}
                      <div className="w-full h-[190px] bg-black/40 border border-white/5 rounded-xl flex items-center justify-center p-2 relative overflow-hidden">
                        <svg width="100%" height="100%" viewBox="0 0 600 160" preserveAspectRatio="xMidYMid meet" className="drop-shadow-md select-none">
                          
                          {/* 1. Dynamic Source according to chosen medium */}
                          <g transform="translate(45, 110)">
                            {medium === 'pneumatic' ? (
                              <g>
                                <circle cx="0" cy="0" r="12" fill="#07080c" stroke="#475569" strokeWidth="1.5" />
                                <polygon points="-4,4 4,4 0,-7" fill="#475569" />
                                <text x="-25" y="19" className="text-[7px] font-mono fill-zinc-500">COMP_AIR</text>
                              </g>
                            ) : (
                              <g>
                                <circle cx="0" cy="0" r="12" fill="#07080c" stroke="#475569" strokeWidth="1.5" />
                                <polygon points="0,-12 -6,-2 6,-2" fill="#475569" />
                                <text x="-25" y="19" className="text-[7px] font-mono fill-amber-500">HYD_PUMP</text>
                              </g>
                            )}
                          </g>

                          {/* Cascade supply pipeline passing through dynamic contacts */}
                          {/* Each contact is rendered as an in-line pilot control valve! */}
                          {contacts.length === 0 ? (
                            // Direct connection supply in absence of contacts
                            <path d="M 57 110 L 300 110 L 300 65" 
                              fill="none" 
                              stroke={state.simulation.isRunning ? (medium === 'pneumatic' ? "#38bdf8" : "#f59e0b") : "#475569"} 
                              strokeWidth="2.5" 
                            />
                          ) : (
                            // Draw path connecting each contact valve logically
                            contacts.map((contact, contactIdx) => {
                              const total = contacts.length;
                              const startX = 57;
                              const valveX = 90 + contactIdx * (170 / total);
                              const isActive = Boolean(state.simulation.values[contact.address]);

                              // Determine segment highlight state
                              const isPreSegmentActive = state.simulation.isRunning && (contactIdx === 0 || Boolean(state.simulation.values[contacts[contactIdx - 1]?.address]));
                              const isPostSegmentActive = state.simulation.isRunning && isPreSegmentActive && isActive;

                              return (
                                <g key={contact.id}>
                                  {/* Line entering this contact valve */}
                                  <line 
                                    x1={contactIdx === 0 ? startX : 90 + (contactIdx - 1) * (170 / total) + 20}
                                    y1="110"
                                    x2={valveX - 10}
                                    y2="110"
                                    stroke={isPreSegmentActive ? (medium === 'pneumatic' ? "#38bdf8" : "#f59e0b") : "#475569"}
                                    strokeWidth="2"
                                  />

                                  {/* Renders ISO Symbol for 3/2 Valve representation */}
                                  <g transform={`translate(${valveX}, 110)`}>
                                    <rect x="-10" y="-10" width="20" height="20" fill="#11131a" stroke={isActive ? "#fb7185" : "#334155"} strokeWidth="1.5" rx="1" />
                                    {isActive ? (
                                      // Active shifted straight fluid flow
                                      <path d="M -7 -10 Q 0 -5 7 -10" fill="none" stroke="#f43f5e" strokeWidth="1.5" />
                                    ) : (
                                      // Closed block
                                      <line x1="-5" y1="0" x2="5" y2="0" stroke="#475569" strokeWidth="1.5" />
                                    )}
                                    {/* Small lever/plunger roller mechanism */}
                                    <circle cx="0" cy="-14" r="2.5" fill="none" stroke="#cbd5e1" strokeWidth="1" />
                                    <line x1="0" y1="-10" x2="0" y2="-12" stroke="#cbd5e1" strokeWidth="1" />

                                    {/* Register Address label */}
                                    <text x="-16" y="-17" className="text-[6.5px] font-mono fill-zinc-450 font-black">{contact.address}</text>
                                    <text x="-16" y="22" className="text-[5.5px] font-sans fill-zinc-650 font-bold max-w-[30px]">{contact.tag || 'VALVE'}</text>
                                  </g>

                                  {/* If last contact, connect to directional control pilot */}
                                  {contactIdx === total - 1 && (
                                    <path 
                                      d={`M ${valveX + 10} 110 L 300 110 L 300 65`}
                                      fill="none" 
                                      stroke={isPostSegmentActive ? (medium === 'pneumatic' ? "#38bdf8" : "#f59e0b") : "#475569"}
                                      strokeWidth="2.5"
                                    />
                                  )}
                                </g>
                              );
                            })
                          )}

                          {/* 2. DIRECTIONAL CONTROL VALVE */}
                          {/* Represents 5/2-Way for air or 4/3-Way for high force oil systems */}
                          <g transform="translate(300, 60)">
                            {/* Outer boundary box */}
                            <rect x="-35" y="-15" width="70" height="26" fill="#111827" stroke="#334155" strokeWidth="1.5" rx="1.5" />
                            <line x1="-11" y1="-15" x2="-11" y2="11" stroke="#334155" strokeWidth="1" />
                            <line x1="12" y1="-15" x2="12" y2="11" stroke="#334155" strokeWidth="1" />

                            {/* Standard ISO pilot spring state symbol */}
                            <g opacity={outputs.length > 0 && Boolean(state.simulation.values[outputs[0]?.address]) ? 1.0 : 0.3} className="transition-opacity">
                              <path d="M 18 6 L 28 -10" fill="none" stroke={medium === 'pneumatic' ? "#38bdf8" : "#f59e0b"} strokeWidth="1.5" />
                              <polygon points="28,-10 23,-9 26,-5" fill={medium === 'pneumatic' ? "#38bdf8" : "#f59e0b"} />
                            </g>
                            <g opacity={outputs.length > 0 && !Boolean(state.simulation.values[outputs[0]?.address]) ? 1.0 : 0.3} className="transition-opacity">
                              <path d="M -23 6 L -23 -10 L -17 -10" fill="none" stroke="#64748b" strokeWidth="1.5" />
                            </g>

                            {/* Left Pilot Coil housing matching LAD translated output */}
                            <rect x="-48" y="-10" width="13" height="16" fill={outputs.length > 0 && Boolean(state.simulation.values[outputs[0]?.address]) ? "#ec4899" : "#1e293b"} stroke="#ec4899" strokeWidth="1" rx="1" />
                            <text x="-46" y="5" className="text-[6px] font-mono fill-white font-bold">SOL</text>

                            {/* Mechanical Spring return indicator */}
                            <path d="M 35 -6 L 40 -12 L 45 -6" fill="none" stroke="#475569" strokeWidth="1.2" />

                            {/* Main feedback title of output */}
                            <text x="-35" y="-19" className="text-[7.5px] font-mono fill-zinc-500 font-bold uppercase">
                              {outputs.length > 0 ? `${outputs[0].address} [A+]` : 'OUT_VALVE'}
                            </text>
                          </g>

                          {/* Dynamic feed ports going up from directional valve to Cylinder base chambers */}
                          {/* Back pipe chamber (controls extension stroke) */}
                          <path d="M 275 45 L 275 25 L 420 25 L 420 12" 
                            fill="none" 
                            stroke={state.simulation.isRunning && outputs.length > 0 && Boolean(state.simulation.values[outputs[0]?.address]) 
                              ? (medium === 'pneumatic' ? "#06b6d4" : "#f59e0b") 
                              : "#334155"
                            } 
                            strokeWidth="2" 
                          />

                          {/* Front pipe chamber (governs return mechanics) */}
                          <path d="M 320 45 L 320 33 L 495 33 L 495 12" 
                            fill="none" 
                            stroke={state.simulation.isRunning && outputs.length > 0 && !Boolean(state.simulation.values[outputs[0]?.address]) 
                              ? (medium === 'pneumatic' ? "#06b6d4" : "#f59e0b") 
                              : "#334155"
                            } 
                            strokeWidth="2" 
                          />

                          {/* 3. DYNAMIC ACTUATOR CYLINDER ASSEMBLY */}
                          <g transform="translate(400, -3)">
                            {/* Outer barrel cylinder casing */}
                            <rect x="10" y="5" width="100" height="22" fill="#0d0e14" stroke={medium === 'pneumatic' ? "#38bdf8" : "#f59e0b"} strokeWidth={medium === 'pneumatic' ? "1.5" : "2"} rx="1" />
                            
                            {/* Piston inside barrel */}
                            <rect 
                              x={10 + (currentPos * 0.85)} 
                              y="6" 
                              width="14" 
                              height="20" 
                              fill={medium === 'pneumatic' ? "#0284c7" : "#b45309"} 
                              stroke={medium === 'pneumatic' ? "#38bdf8" : "#f59e0b"} 
                              strokeWidth="1" 
                              className="transition-all duration-100"
                            />

                            {/* Extended stroke rod block */}
                            <rect 
                              x={24 + (currentPos * 0.85)} 
                              y="12" 
                              width="75" 
                              height="8" 
                              fill="#94a3b8" 
                              rx="0.5"
                              className="transition-all duration-100"
                            />

                            {/* Heavy hammer stamp block */}
                            <rect 
                              x={99 + (currentPos * 0.85)} 
                              y="3" 
                              width="12" 
                              height="26" 
                              fill="#4b5563" 
                              rx="1.5"
                              className="transition-all duration-100"
                            />

                            {/* Dual Proximity Sensors mapping feedback registers */}
                            {/* Back limit roller */}
                            <g transform="translate(15, -4)">
                              <rect x="-3" y="-11" width="16" height="10" fill={currentPos <= 5 ? "#10b981" : "#1e293b"} stroke="#334155" rx="1" />
                              <text x="0.5" y="-4" className="text-[5.5px] font-mono fill-white font-bold uppercase">RET</text>
                            </g>

                            {/* Front limit roller */}
                            <g transform="translate(95, -4)">
                              <rect x="-3" y="-11" width="16" height="10" fill={currentPos >= 95 ? "#10b981" : "#1e293b"} stroke="#334155" rx="1" />
                              <text x="0.5" y="-4" className="text-[5.5px] font-mono fill-white font-bold uppercase">EXT</text>
                            </g>
                          </g>

                        </svg>

                        {/* Top overlays: piston displacement details */}
                        <div className="absolute top-2 right-4 text-[9px] bg-black/60 border border-white/5 rounded px-2 py-0.5 font-mono text-zinc-400">
                          CYLINDER_STROKE: <span className="text-pink-400 font-extrabold">{currentPos}%</span>
                        </div>

                        {outputs.length > 0 && (
                          <div className="absolute bottom-2 left-4 text-[8px] font-mono text-zinc-550">
                            TRANSLATED OUTPUT ACTUATOR: <span className="text-sky-400 font-bold">{outputs[0].address} ({outputs[0].tag || 'COIL'})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

            </div>
          )}

          {/* ==================== B: CLASSIC HIGH-FIDELITY PRESETS ==================== */}
          {operatingMode === 'presets' && (
            <div className="space-y-4">
              
              {/* Section 1: 5/2-Way Double-Acting Pneumatic Cylinder Circuit */}
              <div className="bg-[#090b0f] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 relative">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-sky-500 rounded-full" />
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-200">
                      A. Double-Acting Pneumatic Piston (Air System)
                    </h3>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-500">
                    PNEU_SUPPLY: <span className="text-sky-400 font-bold">{pneumaticReservoirBar.toFixed(2)} Bar</span>
                  </span>
                </div>

                {/* Pneumatic circuit SVG */}
                <div className="w-full h-[180px] bg-black/40 border border-white/5 rounded-xl flex items-center justify-center p-2 relative overflow-hidden">
                  <svg width="100%" height="100%" viewBox="0 0 600 160" preserveAspectRatio="xMidYMid meet" className="drop-shadow-md select-none">
                    
                    {/* COMPRESSOR SOURCE & REGULATOR */}
                    <g transform="translate(60, 110)">
                      <circle cx="0" cy="0" r="14" fill="#0b0c13" stroke="#475569" strokeWidth="1.5" />
                      <polygon points="-5,5 5,5 0,-8" fill="#475569" />
                      <text x="-37" y="4" className="text-[7.5px] font-mono fill-zinc-500 font-bold">SOURCE</text>
                      <line x1="0" y1="14" x2="0" y2="24" stroke="#475569" strokeWidth="1.5" />
                      
                      <path d="M 25 -10 L 45 -10 L 45 10 L 25 10 Z" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
                      <line x1="35" y1="-10" x2="35" y2="10" stroke="#475569" strokeWidth="1" strokeDasharray="2,2" />
                      <ellipse cx="35" cy="0" rx="3" ry="3" fill="none" stroke="#64748b" strokeWidth="1" />
                      <text x="21" y="-15" className="text-[6.5px] font-mono fill-sky-400 font-bold">FRL FILTER</text>
                      
                      <line x1="14" y1="0" x2="25" y2="0" stroke={compressorRunning ? "#f97316" : "#475569"} strokeWidth="2" />
                    </g>

                    <path d="M 105 110 L 300 110 L 300 65" 
                      fill="none" 
                      stroke={compressorRunning ? "#f97316" : "#475569"} 
                      strokeWidth="2.5" 
                    />

                    {/* 5/2-WAY DIRECTIONAL Valve */}
                    <g transform="translate(300, 60)">
                      <rect x="-35" y="-15" width="70" height="26" fill="#111827" stroke="#334155" strokeWidth="1.5" rx="1.5" />
                      <line x1="-11" y1="-15" x2="-11" y2="11" stroke="#334155" strokeWidth="1" />
                      <line x1="12" y1="-15" x2="12" y2="11" stroke="#334155" strokeWidth="1" />

                      <g opacity={isPneuExtendCoilActive ? 0.3 : 1.0} className="transition-opacity">
                        <path d="M -23 6 L -23 -10 L -17 -10" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                        <polygon points="-17,-10 -21,-13 -21,-7" fill="#38bdf8" />
                        <path d="M -19 6 L -13 6 L -13 -10" fill="none" stroke="#64748b" strokeWidth="1.5" />
                      </g>

                      <g opacity={isPneuExtendCoilActive ? 1.0 : 0.3} className="transition-opacity">
                        <path d="M 18 6 L 28 -10" fill="none" stroke={isPneuExtendCoilActive ? "#f97316" : "#38bdf8"} strokeWidth="1.5" />
                        <polygon points="28,-10 23,-9 26,-5" fill={isPneuExtendCoilActive ? "#f97316" : "#38bdf8"} />
                      </g>

                      <rect x="-50" y="-10" width="15" height="16" fill={isPneuExtendCoilActive ? "#ec4899" : "#1e293b"} stroke="#ec4899" strokeWidth="1" rx="1" />
                      <line x1="-48" y1="-2" x2="-35" y2="-2" stroke="#ec4899" strokeWidth="1" />
                      <text x="-47" y="6" className="text-[7px] font-mono fill-white font-bold">SOL_A</text>
                      <path d="M 35 -6 L 40 -12 L 45 -6 L 50 -12" fill="none" stroke="#475569" strokeWidth="1.5" />
                    </g>

                    <path d="M 275 45 L 275 25 L 420 25 L 420 12" 
                      fill="none" 
                      stroke={isPneuExtendCoilActive ? "#f97316" : "#0284c7"} 
                      strokeWidth="2.5" 
                    />
                    
                    <path d="M 320 45 L 320 33 L 495 33 L 495 12" 
                      fill="none" 
                      stroke={!isPneuExtendCoilActive ? "#f97316" : "#0284c7"} 
                      strokeWidth="2.5" 
                    />

                    {/* CYLINDER ASSEMBLY */}
                    <g transform="translate(400, -3)">
                      <rect x="10" y="5" width="100" height="22" fill="#0b0c13" stroke="#475569" strokeWidth="2" rx="1" />
                      <rect x={10 + (cylinder1Pos * 0.85)} y="6" width="15" height="20" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" className="transition-all" />
                      <rect x={25 + (cylinder1Pos * 0.85)} y="12" width="75" height="8" rx="1" fill="#94a3b8" stroke="#64748b" strokeWidth="1" className="transition-all" />
                      <rect x={100 + (cylinder1Pos * 0.85)} y="4" width="12" height="24" rx="1" fill="#475569" className="transition-all" />

                      {/* Proximity Limit Switches */}
                      <g transform="translate(15, -4)">
                        <rect x="-4" y="-12" width="18" height="11" fill={cylinder1Pos <= 4 ? "#10b981" : "#1e293b"} stroke="#334155" rx="1.5" />
                        <text x="-1" y="-4" className="text-[6.5px] font-mono fill-white font-bold">1-LS</text>
                      </g>
                      <g transform="translate(95, -4)">
                        <rect x="-4" y="-12" width="18" height="11" fill={cylinder1Pos >= 96 ? "#10b981" : "#1e293b"} stroke="#334155" rx="1.5" />
                        <text x="-1" y="-4" className="text-[6.5px] font-mono fill-white font-bold">2-LS</text>
                      </g>
                    </g>
                  </svg>

                  <div className="absolute top-2 right-4 text-[9px] bg-black/60 border border-white/5 rounded px-2 py-0.5 font-mono text-zinc-400">
                    Piston level: <strong className="text-pink-450">{cylinder1Pos}%</strong>
                  </div>
                </div>
              </div>

              {/* Section 2: 4/3-Way Hydraulic Control Press Loop */}
              <div className="bg-[#090b0f] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 relative">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-200">
                      B. High-Power Proportional Hydraulic Press (Oil System)
                    </h3>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-500">
                    OIL_PRESSURE: <span className="text-amber-500 font-bold">{hydraulicPumpPsi} PSI</span>
                  </span>
                </div>

                {/* Hydraulic circuit SVG */}
                <div className="w-full h-[180px] bg-black/40 border border-white/5 rounded-xl flex items-center justify-center p-2 relative overflow-hidden">
                  <svg width="100%" height="100%" viewBox="0 0 600 160" preserveAspectRatio="xMidYMid meet" className="drop-shadow-md select-none">
                    
                    {/* OIL RESERVOIR */}
                    <g transform="translate(60, 110)">
                      <path d="M -15 15 L -15 3 L 15 3 L 15 15" fill="none" stroke="#475569" strokeWidth="1.5" />
                      <line x1="-15" y1="10" x2="15" y2="10" stroke="#0284c7" strokeWidth="1" opacity="0.4" />
                      <circle cx="0" cy="-6" r="14" fill="#0b0c13" stroke="#475569" strokeWidth="1.5" />
                      <polygon points="0,-15 -8,-5 8,-5" fill="#475569" />
                      <text x="-40" y="16" className="text-[7.5px] font-mono fill-zinc-500 font-bold">OIL TANK</text>

                      <ellipse cx="35" cy="-6" rx="8" ry="12" fill="none" stroke="#475569" strokeWidth="1.5" />
                      <line x1="35" y1="6" x2="35" y2="18" stroke="#475569" strokeWidth="1" />
                    </g>

                    <path d="M 105 104 L 300 104 L 300 65" 
                      fill="none" 
                      stroke={hydroPumpRunning ? "#ef4444" : "#475569"} 
                      strokeWidth="2.5" 
                    />

                    {/* 4/3-WAY HIGH-FORCE INTERLOCK VALVE */}
                    <g transform="translate(300, 60)">
                      <rect x="-42" y="-15" width="84" height="26" fill="#111827" stroke="#334155" strokeWidth="1.5" rx="1.5" />
                      <line x1="-14" y1="-15" x2="-14" y2="11" stroke="#334155" strokeWidth="1.0" />
                      <line x1="14" y1="-15" x2="14" y2="11" stroke="#334155" strokeWidth="1.0" />

                      <g opacity={isHydExtendCoilActive && !isHydRetractCoilActive ? 1.0 : 0.3} className="transition-opacity">
                        <path d="M -35 6 L -21 -10" fill="none" stroke={isHydExtendCoilActive ? "#ef4444" : "#38bdf8"} strokeWidth="1.5" />
                        <polygon points="-21,-10 -26,-9 -24,-5" fill={isHydExtendCoilActive ? "#ef4444" : "#38bdf8"} />
                      </g>

                      <g opacity={!isHydExtendCoilActive && !isHydRetractCoilActive ? 1.0 : 0.2} className="transition-opacity">
                        <line x1="-6" y1="6" x2="-6" y2="0" stroke="#f43f5e" strokeWidth="1.5" />
                        <line x1="-9" y1="0" x2="-3" y2="0" stroke="#f43f5e" strokeWidth="1.5" />
                      </g>

                      <rect x="-56" y="-10" width="14" height="16" fill={isHydExtendCoilActive ? "#f59e0b" : "#1e293b"} stroke="#f59e0b" strokeWidth="1" rx="1" />
                      <text x="-54" y="6" className="text-[7px] font-mono fill-white font-bold">SOL_B1</text>
                      <rect x="42" y="-10" width="14" height="16" fill={isHydRetractCoilActive ? "#f59e0b" : "#1e293b"} stroke="#f59e0b" strokeWidth="1" rx="1" />
                      <text x="44" y="6" className="text-[7px] font-mono fill-white font-bold">SOL_B2</text>
                    </g>

                    <path d="M 275 45 L 275 25 L 420 25 L 420 12" 
                      fill="none" 
                      stroke={isHydExtendCoilActive ? "#ef4444" : "#3b82f6"} 
                      strokeWidth="2.5" 
                    />

                    <path d="M 320 45 L 320 33 L 495 33 L 495 12" 
                      fill="none" 
                      stroke={isHydRetractCoilActive ? "#ef4444" : "#3b82f6"} 
                      strokeWidth="2.5" 
                    />

                    {/* HYDRAULIC ACTUATOR CYLINDER */}
                    <g transform="translate(400, -3)">
                      <rect x="10" y="4" width="100" height="24" fill="#18181b" stroke="#f59e0b" strokeWidth="2.5" rx="1.5" />
                      <rect x={10 + (cylinder2Pos * 0.85)} y="6" width="15" height="20" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" className="transition-all" />
                      <rect x={25 + (cylinder2Pos * 0.85)} y="11" width="75" height="10" rx="1" fill="#e4e4e7" stroke="#a1a1aa" strokeWidth="1" className="transition-all" />
                      <rect x={100 + (cylinder2Pos * 0.85)} y="2" width="16" height="28" rx="2" fill="#3f3f46" className="transition-all" />

                      {/* Sensors */}
                      <g transform="translate(15, -4)">
                        <rect x="-4" y="-12" width="18" height="11" fill={cylinder2Pos <= 4 ? "#10b981" : "#1e293b"} stroke="#334155" rx="1.5" />
                        <text x="-1" y="-4" className="text-[6.5px] font-mono fill-white font-bold">3-LS</text>
                      </g>
                      <g transform="translate(95, -4)">
                        <rect x="-4" y="-12" width="18" height="11" fill={cylinder2Pos >= 96 ? "#10b981" : "#1e293b"} stroke="#334155" rx="1.5" />
                        <text x="-1" y="-4" className="text-[6.5px] font-mono fill-white font-bold">4-LS</text>
                      </g>
                    </g>
                  </svg>

                  <div className="absolute top-2 right-4 text-[9px] bg-black/60 border border-white/5 rounded px-2 py-0.5 font-mono text-zinc-400">
                    Ram level: <strong className="text-orange-400">{cylinder2Pos}%</strong>
                  </div>
                </div>
              </div>

            </div>
          )}
          
        </div>

        {/* Right Side: Mapping Settings and Sync Log */}
        <div className="w-full lg:w-[350px] bg-[#090a0f] p-4 flex flex-col gap-4 font-sans border-t lg:border-t-0 border-white/5 shrink-0 overflow-y-auto custom-scrollbar select-none">
          
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h3 className="text-[10px] font-bold text-slate-200 tracking-wider uppercase flex items-center gap-1.5">
              <Sliders size={13} className="text-pink-400" /> Physical Link Configurator
            </h3>
            <span className="text-[8px] font-mono text-zinc-550 bg-[#12131b] px-1.5 py-0.5 rounded border border-white/5">
              PLC_HIL_BUS
            </span>
          </div>

          <div className="space-y-4">
            
            {/* If Compiler Mode: display nice compilation indicators */}
            {operatingMode === 'compiler' ? (
              <div className="space-y-4">
                <div className="bg-[#11131a] border border-white/5 p-3 rounded-xl">
                  <span className="text-[9.5px] font-bold text-slate-350 tracking-wide uppercase block mb-1">
                    LAD Compiler Status
                  </span>
                  <p className="text-[8.5px] text-zinc-500 leading-relaxed">
                    Compiling your active rungs down to logical fluid power conduits. The compiler monitors these active logic tags:
                  </p>
                  
                  <div className="mt-2.5 space-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                    {rungCoordinates.map((rungIdx, index) => {
                      const rungNodes = state.nodes.filter(n => getRungIndex(n) === rungIdx);
                      const outputNode = rungNodes.find(n => n.type.startsWith('coil') || n.type.startsWith('timer'));
                      const active = outputNode ? Boolean(state.simulation.values[outputNode.address]) : false;

                      return (
                        <div key={rungIdx} className="flex items-center justify-between text-[8px] font-mono bg-black/40 p-1.5 rounded border border-white/5">
                          <span className="text-zinc-400">Rung {index + 1} Pin Out:</span>
                          <span className={clsx(
                            "px-1 py-0.2 rounded text-[7.5px] font-bold uppercase",
                            active ? "bg-emerald-500/10 text-emerald-450 border border-emerald-500/20" : "bg-zinc-800 text-zinc-500"
                          )}>
                            {outputNode ? `${outputNode.address} (${active ? 'ON':'OFF'})` : 'NO_COIL'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 bg-pink-950/20 border border-pink-500/10 rounded-xl leading-relaxed text-[8.5px] text-pink-400/80">
                  <div className="font-bold flex items-center gap-1 uppercase mb-1">
                    <Info size={11} /> Dynamic Closed-Loop Feedbacks:
                  </div>
                  Piston retraction automatically triggers your examine-input (XIC/XIO) contacts containing addresses ending in even numbers, while full extension triggers the corresponding odd input registers. Modify those contacts in your workspace to trigger automated feedback loops!
                </div>
              </div>
            ) : (
              // If High Fidelity Station Manual Controls matching our original layouts
              <div className="space-y-4">
                <div className="bg-[#0b0c13] border border-white/5 p-3 rounded-xl flex flex-col gap-3">
                  <span className="text-[9.5px] font-bold text-slate-350 tracking-wide uppercase">Cylinder A (Pneumatics) Address Link</span>
                  
                  <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                    <div>
                      <label className="text-zinc-500 block mb-0.5">Solenoid Extend [A+]</label>
                      <input 
                        type="text" 
                        value={pneuExtendAddr} 
                        onChange={(e) => {
                          setPneuExtendAddr(e.target.value);
                          handleInjectAddress(e.target.value);
                        }}
                        className="w-full bg-[#07080c] border border-white/5 px-2 py-1.5 rounded focus:outline-none focus:border-pink-500 text-sky-400 font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-500 block mb-0.5">Solenoid Retract [A-]</label>
                      <input 
                        type="text" 
                        value={pneuRetractAddr} 
                        onChange={(e) => {
                          setPneuRetractAddr(e.target.value);
                          handleInjectAddress(e.target.value);
                        }}
                        className="w-full bg-[#07080c] border border-white/5 px-2 py-1.5 rounded focus:outline-none focus:border-pink-500 text-sky-400 font-bold text-center"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                    <div>
                      <label className="text-zinc-500 block mb-0.5">Retracted [1-LS]</label>
                      <input 
                        type="text" 
                        value={pneuSensRet} 
                        onChange={(e) => setPneuSensRet(e.target.value)}
                        className="w-full bg-[#07080c] border border-white/5 px-2 py-1.5 rounded focus:outline-none text-center text-emerald-400 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-500 block mb-0.5">Extended [2-LS]</label>
                      <input 
                        type="text" 
                        value={pneuSensExt} 
                        onChange={(e) => setPneuSensExt(e.target.value)}
                        className="w-full bg-[#07080c] border border-white/5 px-2 py-1.5 rounded focus:outline-none text-center text-emerald-400 font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-[#0b0c13] border border-white/5 p-3 rounded-xl flex flex-col gap-3">
                  <span className="text-[9.5px] font-bold text-slate-330 tracking-wide uppercase">Cylinder B (Hydraulics) Address Link</span>
                  
                  <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                    <div>
                      <label className="text-zinc-500 block mb-0.5">Solenoid Extend [B1]</label>
                      <input 
                        type="text" 
                        value={hydExtendAddr} 
                        onChange={(e) => {
                          setHydExtendAddr(e.target.value);
                          handleInjectAddress(e.target.value);
                        }}
                        className="w-full bg-[#07080c] border border-white/5 px-2 py-1.5 rounded focus:outline-none text-center text-sky-400 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-500 block mb-0.5">Solenoid Retract [B2]</label>
                      <input 
                        type="text" 
                        value={hydRetractAddr} 
                        onChange={(e) => {
                          setHydRetractAddr(e.target.value);
                          handleInjectAddress(e.target.value);
                        }}
                        className="w-full bg-[#07080c] border border-white/5 px-2 py-1.5 rounded focus:outline-none text-center text-sky-400 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                    <div>
                      <label className="text-zinc-500 block mb-0.5">Retracted [3-LS]</label>
                      <input 
                        type="text" 
                        value={hydSensRet} 
                        onChange={(e) => setHydSensRet(e.target.value)}
                        className="w-full bg-[#07080c] border border-[#1e1f29] px-2 py-1.5 rounded text-center text-emerald-400 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-500 block mb-0.5">Extended [4-LS]</label>
                      <input 
                        type="text" 
                        value={hydSensExt} 
                        onChange={(e) => setHydSensExt(e.target.value)}
                        className="w-full bg-[#07080c] border border-[#1e1f29] px-2 py-1.5 rounded text-center text-emerald-400 font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-[#0b0c13] border border-white/5 p-3 rounded-xl flex flex-col gap-2">
                  <span className="text-[9.5px] font-bold text-slate-350 tracking-wide uppercase">Override Coils Directly</span>
                  <div className="flex flex-col gap-1.5 text-[9px] font-mono">
                    <button 
                      onClick={() => onForceIO && onForceIO(pneuExtendAddr, !isPneuExtendCoilActive, true)}
                      className={clsx("w-full py-1 rounded text-center border font-bold uppercase transition", isPneuExtendCoilActive ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" : "bg-zinc-800 text-zinc-500 border-transparent")}
                    >
                      Force Pneu Sol [A+]: {isPneuExtendCoilActive ? 'ON' : 'OFF'}
                    </button>
                    <button 
                      onClick={() => onForceIO && onForceIO(hydExtendAddr, !isHydExtendCoilActive, true)}
                      className={clsx("w-full py-1 rounded text-center border font-bold uppercase transition-all", isHydExtendCoilActive ? "bg-amber-500/10 text-amber-500 border-amber-500/30" : "bg-zinc-800 text-zinc-500 border-transparent")}
                    >
                      Force Hyd Sol [B1]: {isHydExtendCoilActive ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* General help info block */}
            <div className="p-3 bg-sky-950/20 border border-sky-500/10 rounded-xl leading-relaxed text-[8.5px] text-sky-400/80">
              <div className="font-black flex items-center gap-1 uppercase mb-1">
                <Info size={11} /> Fluid-Power Engineering Mode Guide:
              </div>
              The **LAD Active Logical Flow Compiler** transforms series contact sequences on your active workspace rungs into cascading 3/2 inline pilot valves dynamically powering 5/2-Way spool valves! Connect input address variables to active contact elements to construct real closed-loop PLC logic!
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
