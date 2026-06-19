import React, { useState, useEffect, useRef } from 'react';
import { CircuitDesign, Component, Connection } from '../types';
import { Stage, Layer, Rect, Text, Group, Line, Circle } from 'react-konva';
import { motion } from 'motion/react';
import { LadderEngine } from '../services/ladderEngine';
import { Zap, GitBranch, RefreshCcw, Download, Cpu, Play } from 'lucide-react';

interface LadderViewProps {
  design: CircuitDesign;
  onUpdateDesign: (design: CircuitDesign) => void;
}

export default function LadderView({ design, onUpdateDesign }: LadderViewProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleTranslateToLadder = () => {
    const ladderDesign = LadderEngine.translateLogicToLadder(design);
    onUpdateDesign(ladderDesign);
  };

  const handleTranslateToLogic = () => {
    const logicDesign = LadderEngine.translateLadderToLogic(design);
    onUpdateDesign(logicDesign);
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
          onClick={handleTranslateToLadder}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black text-slate-300 uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-all shadow-2xl group"
        >
          <RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
          Import Logic Gates
        </button>
        <button 
          onClick={handleTranslateToLogic}
          className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-amber-500 transition-all shadow-[0_10px_30px_rgba(217,119,6,0.3)] group"
        >
          <Cpu size={14} className="group-hover:scale-110 transition-transform" />
          Export to Logic
        </button>
      </div>

      {/* Main Ladder Area */}
      <div className="flex-1 flex items-center justify-center p-20">
         <div className="bg-slate-900 w-full max-w-5xl h-full rounded-3xl border-2 border-slate-800 shadow-[0_50px_100px_rgba(0,0,0,0.6)] relative overflow-hidden">
            {/* Rungs Styling */}
            <div className="absolute inset-0 pointer-events-none">
               <div className="absolute left-10 top-0 bottom-0 w-1 bg-indigo-500/30" title="V+ Rail" />
               <div className="absolute right-10 top-0 bottom-0 w-1 bg-slate-700/50" title="Neutral Rail" />
               
               {[...Array(10)].map((_, i) => (
                 <div key={i} className="absolute left-10 right-10 h-px bg-slate-800/50" style={{ top: `${(i + 1) * 100}px` }} />
               ))}
            </div>

            <Stage width={dimensions.width || 800} height={dimensions.height || 600}>
              <Layer>
                 {design.components.map((comp) => (
                    <Group key={comp.id} x={comp.x} y={comp.y}>
                       {comp.type === 'LADDER_CONTACT_NO' && (
                         <Group>
                            <Line points={[-50, 20, -10, 20]} stroke="#6366f1" strokeWidth={2} />
                            <Line points={[-10, 5, -10, 35]} stroke="#94a3b8" strokeWidth={3} />
                            <Line points={[10, 5, 10, 35]} stroke="#94a3b8" strokeWidth={3} />
                            <Line points={[10, 20, 50, 20]} stroke="#6366f1" strokeWidth={2} />
                         </Group>
                       )}
                       {comp.type === 'LADDER_CONTACT_NC' && (
                         <Group>
                            <Line points={[-50, 20, -10, 20]} stroke="#6366f1" strokeWidth={2} />
                            <Line points={[-10, 5, -10, 35]} stroke="#94a3b8" strokeWidth={3} />
                            <Line points={[10, 5, 10, 35]} stroke="#94a3b8" strokeWidth={3} />
                            <Line points={[10, 20, 50, 20]} stroke="#6366f1" strokeWidth={2} />
                            <Line points={[-12, 35, 12, 5]} stroke="#ef4444" strokeWidth={2} />
                         </Group>
                       )}
                       {comp.type === 'LADDER_COIL' && (
                         <Group>
                            <Line points={[-50, 20, -15, 20]} stroke="#6366f1" strokeWidth={2} />
                            <Circle x={0} y={20} radius={15} stroke="#38bdf8" strokeWidth={2} />
                            <Line points={[15, 20, 50, 20]} stroke="#6366f1" strokeWidth={2} />
                         </Group>
                       )}
                       <Text 
                        text={comp.properties.tag as string || comp.label} 
                        y={-20} 
                        width={100} 
                        align="center" 
                        offsetX={50}
                        fill="#94a3b8" 
                        fontSize={10} 
                        fontStyle="bold" 
                        fontFamily="monospace"
                       />
                    </Group>
                 ))}
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
               <span className="text-xs font-mono text-emerald-500 font-bold">READY</span>
            </div>
         </div>
      </div>
    </div>
  );
}
