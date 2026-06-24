import React, { useState, useEffect, useRef } from 'react';
import { CircuitDesign, Component, Connection } from '../types';
import { Stage, Layer, Rect, Text, Group, Line } from 'react-konva';
import { COMPONENT_DEFINITIONS } from '../constants';
import { renderFootprint } from './PCBFootprints';
import { GerberCompiler } from '../services/GerberCompiler';
import { UniversalGCodeEngine } from '../../lib/UniversalGCodeEngine';
import { motion, AnimatePresence } from 'motion/react';
import { Box, Layers, Zap, Info, Download, Maximize, RotateCcw, BoxSelect, Cpu } from 'lucide-react';

interface LayoutViewProps {
  design: CircuitDesign;
  onUpdateComponent: (id: string, updates: Partial<Component>) => void;
}

type LayerType = 'TOP' | 'BOTTOM' | 'SILKSCREEN' | 'DRILL';

export default function LayoutView({ design, onUpdateComponent }: LayoutViewProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [activeLayer, setActiveLayer] = useState<LayerType>('TOP');
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('2D');
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);

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

  const getCompPos = (comp: Component, idx: number) => {
    return {
      x: comp.layoutX ?? (100 + (idx % 4) * 150),
      y: comp.layoutY ?? (100 + Math.floor(idx / 4) * 120)
    };
  };

  const handleAutoroute = () => {
    design.components.forEach((comp, idx) => {
      onUpdateComponent(comp.id, {
        layoutX: 100 + (idx % 6) * 130,
        layoutY: 100 + Math.floor(idx / 6) * 100
      });
    });
  };

  const handleGenerateGerber = () => {
    const gtl = GerberCompiler.compileGTL(design);
    const gto = GerberCompiler.compileGTO(design);
    const drl = GerberCompiler.compileDRL(design);

    // Trigger multiple downloads since we don't have jszip installed
    const download = (filename: string, content: string) => {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    download(`Siyabonga_${Date.now()}.GTL`, gtl);
    setTimeout(() => download(`Siyabonga_${Date.now()}.GTO`, gto), 300);
    setTimeout(() => download(`Siyabonga_${Date.now()}.DRL`, drl), 600);
  };

  const handleGenerateGCode = () => {
    const gcode = UniversalGCodeEngine.generateIsolationRouting(design);
    const blob = new Blob([gcode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Siyabonga_Isolation_${Date.now()}.nc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const [hoveredComp, setHoveredComp] = useState<string | null>(null);

  return (
    <div ref={containerRef} className="flex-1 bg-slate-950 flex flex-col relative overflow-hidden font-sans">
      {/* HUD Header */}
      <div className="absolute top-6 left-6 z-20 flex items-start gap-8 pointer-events-none">
        <div className="flex flex-col">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <span className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-sm shadow-[0_0_20px_rgba(79,70,229,0.4)]">
              <Layers size={20} />
            </span>
            Matrix Layout Engine
          </h2>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-400/10 px-2 py-0.5 rounded border border-indigo-400/20">EDR-IV PRO</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active: {activeLayer}</span>
          </div>
        </div>
      </div>

      {/* View Switcher HUD */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-1.5 rounded-xl shadow-2xl">
        <button 
          onClick={() => setViewMode('2D')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
            viewMode === '2D' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-500 hover:text-slate-200'
          }`}
        >
          <BoxSelect size={14} />
          Planar view
        </button>
        <button 
          onClick={() => setViewMode('3D')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
            viewMode === '3D' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-500 hover:text-slate-200'
          }`}
        >
          <Box size={14} />
          Matrix Node
        </button>
      </div>

      {/* Layer Sidebar HUD */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 p-1.5 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl">
        {(['TOP', 'BOTTOM', 'SILKSCREEN', 'DRILL'] as LayerType[]).map(l => (
          <button
            key={l}
            onClick={() => setActiveLayer(l)}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all group relative ${
              activeLayer === l ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-800'
            }`}
          >
            <span className="text-[10px] font-black">{l[0]}</span>
            <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[8px] font-black uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl">
              {l} LAYER
            </div>
          </button>
        ))}
      </div>

      {/* Main Canvas Area */}
      <div className={`flex-1 flex items-center justify-center transition-all duration-700 ${
        viewMode === '3D' ? '[perspective:2000px]' : ''
      }`}>
        <motion.div 
           animate={{ 
             rotateX: viewMode === '3D' ? 45 : 0,
             rotateZ: viewMode === '3D' ? -25 : 0,
             y: viewMode === '3D' ? 20 : 0,
             scale: viewMode === '3D' ? 0.8 : 1
           }}
           transition={{ type: 'spring', stiffness: 100, damping: 20 }}
           className={`relative bg-slate-900 border-[12px] border-slate-800 rounded-3xl overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.6)] ${
             viewMode === '3D' ? 'ring-1 ring-white/10 ring-inset' : ''
           }`}
           style={{ width: dimensions.width ? Math.min(dimensions.width - 200, 1000) : 800, height: dimensions.height ? Math.min(dimensions.height - 150, 600) : 500 }}
        >
          {/* Depth Effect for 3D */}
          {viewMode === '3D' && (
            <>
               <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
               <div className="absolute -bottom-12 -right-12 w-full h-[20px] bg-slate-950/80 blur-2xl transform rotate-x-90" />
            </>
          )}

          <Stage 
            width={dimensions.width ? Math.min(dimensions.width - 200, 1000) : 800} 
            height={dimensions.height ? Math.min(dimensions.height - 150, 600) : 500}
            ref={stageRef}
          >
            <Layer>
              {/* PCB Dielectric */}
              <Rect 
                width={2000} 
                height={2000} 
                fill="#064e3b" 
                shadowBlur={viewMode === '3D' ? 20 : 0}
                shadowOpacity={0.4}
              />
              
              {/* Professional Grid */}
              {[...Array(100)].map((_, i) => (
                <React.Fragment key={i}>
                  <Rect x={i * 20} y={0} width={1} height={2000} fill="rgba(255, 255, 255, 0.03)" />
                  <Rect x={0} y={i * 20} width={2000} height={1} fill="rgba(255, 255, 255, 0.03)" />
                  {i % 5 === 0 && (
                    <>
                      <Rect x={i * 20} y={0} width={1} height={2000} fill="rgba(255, 255, 255, 0.08)" />
                      <Rect x={0} y={i * 20} width={2000} height={1} fill="rgba(255, 255, 255, 0.08)" />
                    </>
                  )}
                </React.Fragment>
              ))}

              {/* Advanced Orthogonal Routing Traces */}
              {design.connections.map((conn, idx) => {
                const fromIdx = design.components.findIndex(c => c.id === conn.from);
                const toIdx = design.components.findIndex(c => c.id === conn.to);
                if (fromIdx === -1 || toIdx === -1) return null;

                const fromPos = getCompPos(design.components[fromIdx], fromIdx);
                const toPos = getCompPos(design.components[toIdx], toIdx);

                // Use center of component as a rough pin origin for traces
                const x1 = fromPos.x + 20;
                const y1 = fromPos.y + 20;
                const x2 = toPos.x + 20;
                const y2 = toPos.y + 20;
                
                const midX = x1 + (x2 - x1) / 2;

                // Orthogonal routing with chamfers
                const points = [
                  x1, y1,
                  midX, y1,
                  midX, y2,
                  x2, y2
                ];
                
                return (
                  <Group key={`trace-${idx}`}>
                    {/* Shadow for 3D look */}
                    {viewMode === '3D' && (
                      <Line
                        points={points}
                        stroke="rgba(0,0,0,0.5)"
                        strokeWidth={4}
                        lineJoin="round"
                        lineCap="round"
                        tension={0}
                        cornerRadius={15}
                        offsetX={-3}
                        offsetY={3}
                        blurRadius={3}
                      />
                    )}
                    {/* Copper Trace */}
                    <Line
                      points={points}
                      stroke={activeLayer === 'TOP' ? '#fbbf24' : '#38bdf8'}
                      strokeWidth={3}
                      opacity={0.85}
                      lineJoin="round"
                      lineCap="round"
                      tension={0}
                      cornerRadius={15}
                    />
                    {/* Active Signal Core (Optional glow) */}
                    <Line
                      points={points}
                      stroke="#ffffff"
                      strokeWidth={0.5}
                      opacity={0.3}
                      lineJoin="round"
                      lineCap="round"
                      tension={0}
                      cornerRadius={15}
                    />
                  </Group>
                );
              })}

              {/* Component Footprints */}
              {design.components.map((comp, idx) => {
                const pos = getCompPos(comp, idx);
                const isHovered = hoveredComp === comp.id;
                
                return (
                  <Group 
                    key={comp.id} 
                    x={pos.x} 
                    y={pos.y}
                    draggable
                    onMouseEnter={() => setHoveredComp(comp.id)}
                    onMouseLeave={() => setHoveredComp(null)}
                    onDragMove={(e) => {
                      const grid = 10;
                      const x = Math.round(e.target.x() / grid) * grid;
                      const y = Math.round(e.target.y() / grid) * grid;
                      e.target.setAttrs({ x, y });
                    }}
                    onDragEnd={(e) => {
                      onUpdateComponent(comp.id, {
                        layoutX: e.target.x(),
                        layoutY: e.target.y()
                      });
                    }}
                  >
                    {renderFootprint({
                      type: comp.type,
                      label: comp.label,
                      isHovered,
                      viewMode
                    })}
                  </Group>
                );
              })}
            </Layer>
          </Stage>
        </motion.div>
      </div>

      {/* Footer Controls HUD */}
      <div className="absolute bottom-6 left-6 right-6 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-6 bg-slate-900/80 backdrop-blur-xl p-2 px-4 border border-slate-700/50 rounded-2xl shadow-2xl pointer-events-auto">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Status</span>
            <span className="text-[10px] font-mono text-emerald-500 flex items-center gap-2 uppercase">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Design nominal
            </span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Matrix node</span>
            <span className="text-[10px] font-mono text-slate-300">VOICE_EYE_0xAF</span>
          </div>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          <button 
             onClick={handleAutoroute}
             className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] font-black uppercase tracking-[.2em] rounded-xl border border-slate-700/50 transition-all shadow-xl flex items-center gap-2 group"
          >
            <RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
            Sync topology
          </button>
          <button 
            onClick={handleGenerateGCode}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-black uppercase tracking-[.2em] rounded-xl transition-all shadow-[0_10px_30px_rgba(217,119,6,0.4)] flex items-center gap-2 group active:scale-95"
            title="Export G-Code for CNC Milling"
          >
            <Cpu size={14} className="group-hover:scale-110 transition-transform" />
            Export G-Code
          </button>
          <button 
            onClick={handleGenerateGerber}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[.2em] rounded-xl transition-all shadow-[0_10px_30px_rgba(79,70,229,0.4)] flex items-center gap-2 group active:scale-95"
            title="Export RS-274X Gerber Files"
          >
            <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
            Commit to Gerber
          </button>
        </div>
      </div>
    </div>
  );
}
