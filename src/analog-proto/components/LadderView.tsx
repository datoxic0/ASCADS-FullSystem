import React, { useState, useEffect, useRef } from 'react';
import { CircuitDesign, Component, Connection } from '../types';
import { Stage, Layer, Rect, Text, Group, Line, Circle } from 'react-konva';
import { motion } from 'motion/react';
import { LadderEngine } from '../services/ladderEngine';
import { Zap, GitBranch, RefreshCcw, Download, Cpu, Play, Server } from 'lucide-react';

interface LadderViewProps {
  design: CircuitDesign;
  onUpdateDesign: (design: CircuitDesign) => void;
}

export default function LadderView({ design, onUpdateDesign }: LadderViewProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Interactive Simulation State
  const [simState, setSimState] = useState<Record<string, any>>({});
  const [isRunning, setIsRunning] = useState(true);
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const hasLadderComponents = design.components.some(c => c.type.startsWith('LADDER_'));

  // Ladder Logic Engine Loop
  useEffect(() => {
    if (!isRunning) return;
    
    const interval = setInterval(() => {
      setSimState(prev => {
        const nextState = { ...prev };
        
        // 1. Resolve Continuity (Power flow from Left Rail)
        const activeNodes = new Set<string>();
        const connectionsByFrom = new Map<string, Connection[]>();
        
        design.connections.forEach(c => {
           if (!connectionsByFrom.has(c.from)) connectionsByFrom.set(c.from, []);
           connectionsByFrom.get(c.from)!.push(c);
        });

        // Left rail starts at x <= 150 approximately.
        const leftNodes = design.components.filter(c => c.x <= 150);
        
        const dfs = (compId: string) => {
           if (activeNodes.has(compId)) return;
           const comp = design.components.find(c => c.id === compId);
           if (!comp) return;
           
           // Check if it passes power
           let passes = false;
           if (comp.type === 'LADDER_CONTACT_NO') passes = toggleStates[comp.id] || false;
           else if (comp.type === 'LADDER_CONTACT_NC') passes = !(toggleStates[comp.id] || false);
           else if (comp.type === 'LADDER_TIMER') passes = prev[comp.id]?.done || false;
           else passes = true; // coils, etc pass power to themselves
           
           if (passes) {
               activeNodes.add(compId);
               const outConns = connectionsByFrom.get(compId) || [];
               outConns.forEach(c => dfs(c.to));
           }
        };
        
        leftNodes.forEach(n => dfs(n.id));

        // 2. Process Coils and Timers
        design.components.forEach(comp => {
            const hasPower = activeNodes.has(comp.id);
            
            if (comp.type === 'LADDER_COIL') {
                nextState[comp.id] = { ...nextState[comp.id], active: hasPower };
            } 
            else if (comp.type === 'LADDER_TIMER') {
                let currentAcc = nextState[comp.id]?.acc || 0;
                const preset = Number(comp.properties.preset || 1000);
                const timeBase = comp.properties.timeBase === 's' ? 1000 : 1; // ms internally
                const target = preset * timeBase;
                
                if (hasPower) {
                    currentAcc += 100; // 100ms interval
                    if (currentAcc > target) currentAcc = target;
                } else {
                    currentAcc = 0; // reset
                }
                
                const done = currentAcc >= target;
                nextState[comp.id] = { active: hasPower, acc: currentAcc, done };
            }
        });

        return nextState;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [design, isRunning, toggleStates]);

  const handleTranslateToLadder = () => {
    const ladderDesign = LadderEngine.translateLogicToLadder(design);
    onUpdateDesign(ladderDesign);
  };

  const handleTranslateToLogic = () => {
    const logicDesign = LadderEngine.translateLadderToLogic(design);
    onUpdateDesign(logicDesign);
  };

  const bridgeToDigital = () => {
    localStorage.setItem('ascads_bridge_analog_digital', JSON.stringify(design));
    alert("Ladder Logic mapped and bridged to Digital Logic Lab!");
  };

  const bridgeToPLC = () => {
    localStorage.setItem('ascads_bridge_analog_plc', JSON.stringify(design));
    alert("Ladder Logic mapped and bridged to Industrial PLC Section!");
  };

  const handleNodeClick = (e: any, comp: Component) => {
    if (comp.type === 'LADDER_CONTACT_NO' || comp.type === 'LADDER_CONTACT_NC') {
       setToggleStates(prev => ({ ...prev, [comp.id]: !prev[comp.id] }));
    }
  };

  return (
    <div ref={containerRef} className="flex-1 bg-slate-950 flex flex-col relative overflow-hidden font-sans">
      {/* Header HUD */}
      <div className="absolute top-6 left-6 z-20 flex flex-col gap-1 pointer-events-none">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
          <span className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center text-sm shadow-[0_0_20px_rgba(217,119,6,0.4)]">
            <GitBranch size={20} />
          </span>
          Ladder logic Matrix
        </h2>
        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 w-fit">PLC-LDR CORE</span>
      </div>

      <div className="absolute top-6 right-6 z-20 flex gap-3">
        <button 
          onClick={bridgeToDigital}
          className="flex items-center gap-2 px-4 py-2 bg-purple-900 border border-purple-800 rounded-xl text-[10px] font-black text-purple-300 uppercase tracking-widest hover:bg-purple-800 hover:text-white transition-all shadow-2xl group"
        >
          Bridge to Digital
        </button>
        <button 
          onClick={bridgeToPLC}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-900 border border-indigo-800 rounded-xl text-[10px] font-black text-indigo-300 uppercase tracking-widest hover:bg-indigo-800 hover:text-white transition-all shadow-2xl group"
        >
          Bridge to PLC
        </button>
        <button 
          onClick={handleTranslateToLadder}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black text-slate-300 uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-all shadow-2xl group"
        >
          <RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
          Import Gates
        </button>
        <button 
          onClick={handleTranslateToLogic}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-amber-500 transition-all shadow-[0_10px_30px_rgba(217,119,6,0.3)] group"
        >
          <Cpu size={14} className="group-hover:scale-110 transition-transform" />
          Export to Logic
        </button>
      </div>

      {/* Main Ladder Area */}
      <div className="flex-1 flex items-center justify-center p-20 mt-10">
         <div className="bg-slate-900 w-full max-w-5xl h-full rounded-3xl border-2 border-slate-800 shadow-[0_50px_100px_rgba(0,0,0,0.6)] relative overflow-hidden">
             {/* Rungs Styling */}
             <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-10 top-0 bottom-0 w-1 bg-indigo-500/30" title="V+ Rail" />
                <div className="absolute right-10 top-0 bottom-0 w-1 bg-slate-700/50" title="Neutral Rail" />
                
                {hasLadderComponents && [...Array(10)].map((_, i) => (
                  <div key={i} className="absolute left-10 right-10 h-px bg-slate-800/50" style={{ top: `${(i + 1) * 100}px` }} />
                ))}
             </div>

             <Stage 
              width={dimensions.width || 800} 
              height={dimensions.height || 600}
              draggable
              onWheel={(e) => {
                e.evt.preventDefault();
                const scaleBy = 1.1;
                const stage = e.target.getStage();
                if (!stage) return;
                const oldScale = stage.scaleX();
                const pointer = stage.getPointerPosition();
                if (!pointer) return;
                const mousePointTo = {
                  x: (pointer.x - stage.x()) / oldScale,
                  y: (pointer.y - stage.y()) / oldScale,
                };
                const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
                stage.scale({ x: newScale, y: newScale });
                const newPos = {
                  x: pointer.x - mousePointTo.x * newScale,
                  y: pointer.y - mousePointTo.y * newScale,
                };
                stage.position(newPos);
              }}
            >
              <Layer>
                 {/* Draw connections */}
                 {hasLadderComponents && design.connections.map((conn) => {
                    const fromComp = design.components.find(c => c.id === conn.from);
                    const toComp = design.components.find(c => c.id === conn.to);
                    if (!fromComp || !toComp) return null;
                    
                    const startX = fromComp.x + 50;
                    const startY = fromComp.y + 20;
                    const endX = toComp.x - 50;
                    const endY = toComp.y + 20;

                    const isActive = simState[conn.from]?.active || toggleStates[conn.from] || false;
                    const strokeColor = isActive ? "#10b981" : "#475569";
                    
                    return (
                       <Line 
                          key={conn.id} 
                          points={[startX, startY, endX, endY]} 
                          stroke={strokeColor} 
                          strokeWidth={2} 
                       />
                    );
                 })}

                 {/* Draw components */}
                 {hasLadderComponents && design.components.map((comp) => {
                    const isToggled = toggleStates[comp.id];
                    const isActive = simState[comp.id]?.active;
                    const isDone = simState[comp.id]?.done;
                    
                    const wireColor = isActive ? "#10b981" : "#6366f1";
                    const contactColor = isToggled ? "#10b981" : "#94a3b8";

                    return (
                      <Group key={comp.id} x={comp.x} y={comp.y} onClick={(e) => handleNodeClick(e, comp)} onTap={(e) => handleNodeClick(e, comp)}>
                         {comp.type === 'LADDER_CONTACT_NO' && (
                           <Group>
                              <Line points={[-50, 20, -10, 20]} stroke={wireColor} strokeWidth={2} />
                              <Line points={[-10, 5, -10, 35]} stroke={contactColor} strokeWidth={3} />
                              <Line points={[10, 5, 10, 35]} stroke={contactColor} strokeWidth={3} />
                              <Line points={[10, 20, 50, 20]} stroke={wireColor} strokeWidth={2} />
                              {isToggled && <Circle x={0} y={20} radius={4} fill="#10b981" />}
                           </Group>
                         )}
                         {comp.type === 'LADDER_CONTACT_NC' && (
                           <Group>
                              <Line points={[-50, 20, -10, 20]} stroke={wireColor} strokeWidth={2} />
                              <Line points={[-10, 5, -10, 35]} stroke={contactColor} strokeWidth={3} />
                              <Line points={[10, 5, 10, 35]} stroke={contactColor} strokeWidth={3} />
                              <Line points={[10, 20, 50, 20]} stroke={wireColor} strokeWidth={2} />
                              {!isToggled && <Line points={[-12, 35, 12, 5]} stroke="#ef4444" strokeWidth={2} />}
                              {isToggled && <Circle x={0} y={20} radius={4} fill="#10b981" />}
                           </Group>
                         )}
                         {comp.type === 'LADDER_COIL' && (
                           <Group>
                              <Line points={[-50, 20, -15, 20]} stroke={wireColor} strokeWidth={2} />
                              <Circle x={0} y={20} radius={15} stroke={isActive ? "#10b981" : "#38bdf8"} strokeWidth={2} fill={isActive ? "rgba(16, 185, 129, 0.2)" : "transparent"} />
                              <Line points={[15, 20, 50, 20]} stroke={wireColor} strokeWidth={2} />
                           </Group>
                         )}
                         {comp.type === 'LADDER_TIMER' && (
                           <Group>
                              <Line points={[-50, 20, -25, 20]} stroke={wireColor} strokeWidth={2} />
                              <Rect x={-25} y={0} width={50} height={40} stroke={isDone ? "#10b981" : "#38bdf8"} strokeWidth={2} fill={isActive ? "rgba(56, 189, 248, 0.1)" : "#0f172a"} cornerRadius={4} />
                              <Text text="TON" x={-20} y={5} fill="#38bdf8" fontSize={10} fontStyle="bold" />
                              <Text text={`ACC:${comp.properties.timeBase === 's' ? ((simState[comp.id]?.acc || 0)/1000).toFixed(1) : (simState[comp.id]?.acc || 0)}`} x={-22} y={18} fill="#10b981" fontSize={8} />
                              <Text text={`PRE:${comp.properties.preset || 1000}${comp.properties.timeBase || 'ms'}`} x={-22} y={28} fill="#94a3b8" fontSize={8} />
                              <Line points={[25, 20, 50, 20]} stroke={isDone ? "#10b981" : "#475569"} strokeWidth={2} />
                           </Group>
                         )}
                         <Text 
                          text={comp.properties.tag as string || comp.label} 
                          y={-20} 
                          width={100} 
                          align="center" 
                          offsetX={50}
                          fill={isActive || isToggled ? "#10b981" : "#94a3b8"} 
                          fontSize={12} 
                          fontStyle="bold" 
                          fontFamily="monospace"
                         />
                      </Group>
                    );
                 })}
                 {!hasLadderComponents && design.components.length > 0 && (
                    <Group x={dimensions.width / 2 || 400} y={dimensions.height / 2 || 300}>
                       <Rect x={-250} y={-100} width={500} height={200} fill="#0f172a" stroke="#3b82f6" strokeWidth={2} cornerRadius={16} opacity={0.9} shadowColor="#000" shadowBlur={30} />
                       <Text text="FOREIGN LOGIC DETECTED" x={-250} y={-50} width={500} align="center" fill="#f87171" fontSize={24} fontStyle="bold" tracking={2} />
                       <Text text="This is an Analog or Digital schematic. It must be mathematically translated to Canonical SOP before it can be represented as Ladder Logic." x={-200} y={-10} width={400} align="center" fill="#94a3b8" fontSize={14} lineHeight={1.5} />
                       <Text text="Click 'IMPORT GATES' to perform the translation." x={-250} y={50} width={500} align="center" fill="#38bdf8" fontSize={14} fontStyle="italic" />
                    </Group>
                 )}
              </Layer>
            </Stage>
         </div>
      </div>

      {/* Footer Meta */}
      <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-between pointer-events-none">
         <div className="bg-slate-900/80 backdrop-blur-xl p-3 px-6 border border-slate-800 rounded-2xl flex items-center gap-6 pointer-events-auto">
            <div className="flex flex-col">
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active nodes</span>
               <span className="text-xs font-mono text-amber-500 font-bold">{design.components.length.toString().padStart(3, '0')}</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="flex flex-col">
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Engine status</span>
               <span className="text-xs font-mono text-emerald-500 font-bold">{isRunning ? 'SIMULATING' : 'READY'}</span>
            </div>
         </div>
      </div>
    </div>
  );
}
