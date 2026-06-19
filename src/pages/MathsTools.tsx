import React, { useState, useMemo, useEffect, useRef } from 'react';
// @ts-ignore
import Plotly from 'plotly.js-dist-min';
// @ts-ignore
import createPlotlyComponent from 'react-plotly.js/factory';
const Plot = createPlotlyComponent(Plotly);
import { MathWorkspace, MathBlockResult } from '../lib/mathEngine';
import { DSPEngine } from '../lib/dspEngine';
import { ControlEngine } from '../lib/controlEngine';
import { 
  Settings2, Activity, Box, ChevronRight, AlertCircle, Maximize2,
  Info, FunctionSquare, CircleDot, LineChart, Plus, Trash2, Share,
  ArrowRight, Wind, Hash, Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import KatexSpan from '../components/KatexSpan';
import { cn } from '../lib/utils';

type Mode = '2D' | 'Parametric' | 'Polar' | '3D' | 'VectorField' | 'Matrix' | 'Telemetry' | 'Control';

const MODES: { id: Mode; icon: any; label: string }[] = [
  { id: '2D', icon: FunctionSquare, label: 'Cartesian 2D' },
  { id: 'Parametric', icon: Activity, label: 'Parametric' },
  { id: 'Polar', icon: CircleDot, label: 'Polar' },
  { id: '3D', icon: Box, label: 'Surface 3D' },
  { id: 'VectorField', icon: Wind, label: 'Vector Field 2D' },
  { id: 'Matrix', icon: Hash, label: 'Linear Algebra' },
  { id: 'Telemetry', icon: LineChart, label: 'DSP / Telemetry' },
  { id: 'Control', icon: Sliders, label: 'Control Systems' },
];

export interface MathBlock {
  id: string;
  expr: string;
  color: string;
  visible: boolean;
}

const DEFAULT_BLOCKS: MathBlock[] = [
  { id: '1', expr: 'a = 1.5', color: '#8b5cf6', visible: true },
  { id: '2', expr: 'f(x) = sin(a * x)', color: '#3b82f6', visible: true },
  { id: '3', expr: 'g(x) = cos(x) * e^(-0.2*x)', color: '#10b981', visible: true },
];

export default function App() {
  const [blocks, setBlocks] = useState<MathBlock[]>(() => {
    try {
      const s = localStorage.getItem('ascads_math_blocks');
      return s ? JSON.parse(s) : DEFAULT_BLOCKS;
    } catch {
      return DEFAULT_BLOCKS;
    }
  });

  const [mode, setMode] = useState<Mode>('2D');
  const [globalParams, setGlobalParams] = useState<Record<string, number>>({});
  
  const [telemetryTrace, setTelemetryTrace] = useState<{name: string, data: {x: number, y: number}[]}[]>([]);
  const [fftEnabled, setFftEnabled] = useState(false);
  const [sampleRate, setSampleRate] = useState(100);
  const [regressionEnabled, setRegressionEnabled] = useState(false);

  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [range, setRange] = useState({ min: -10, max: 10, steps: 300 });

  const analysisVariable = useMemo(() => {
    if (mode === 'Polar' || mode === 'Parametric') return 't';
    return 'x';
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('ascads_math_blocks', JSON.stringify(blocks));
  }, [blocks]);

  useEffect(() => {
    if (mode === 'Telemetry') {
      try {
        const raw = localStorage.getItem('ascads_telemetry_trace');
        if (raw) setTelemetryTrace(JSON.parse(raw));
      } catch {}
    }
  }, [mode]);

  useEffect(() => {
    // Show placeholder data for Matrix mode if blocks are empty/not matrices
    if (mode === 'Matrix' && !blocks.some(b => b.expr.includes('['))) {
      setBlocks([
        { id: 'm1', expr: 'A = [1, 2; 3, 4]', color: '#f59e0b', visible: true },
        { id: 'm2', expr: 'B = [0, 1; -1, 0]', color: '#3b82f6', visible: true },
        { id: 'm3', expr: 'det(A)', color: '#10b981', visible: true },
        { id: 'm4', expr: 'A * B', color: '#ec4899', visible: true },
      ]);
    }
    if (mode === 'Control' && !blocks.some(b => b.expr.includes('s'))) {
      setBlocks([
        { id: 'c1', expr: '100 / (s^2 + 10*s + 100)', color: '#3b82f6', visible: true },
        { id: 'c2', expr: '10 / (s + 5)', color: '#10b981', visible: true },
      ]);
    }
  }, [mode]);

  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<Record<string, any[]> | null>(null);
  const [selectedX, setSelectedX] = useState<string>('');
  const [selectedY, setSelectedY] = useState<string>('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      if (lines.length < 2) return;

      // Basic robust CSV split that ignores commas inside quotes
      const splitCsv = (str: string) => {
         const match = str.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
         if (!match) return str.split(',');
         return match.map(s => s.replace(/(^"|"$)/g, '').trim());
      };

      const headers = splitCsv(lines[0]);
      const columns: Record<string, any[]> = {};
      headers.forEach(h => columns[h] = []);

      for (let i = 1; i < lines.length; i++) {
        const values = splitCsv(lines[i]);
        headers.forEach((h, idx) => {
          const val = values[idx];
          // Try parse as number, if NaN, try Date, else keep as string
          if (val === undefined || val === '') {
             columns[h].push(null);
          } else {
             const num = Number(val);
             if (!isNaN(num)) columns[h].push(num);
             else {
               const date = Date.parse(val);
               if (!isNaN(date)) columns[h].push(date);
               else columns[h].push(val);
             }
          }
        });
      }

      setCsvColumns(headers);
      setCsvData(columns);
      
      // Auto-select numeric columns
      const numericCols = headers.filter(h => columns[h].some(v => typeof v === 'number'));
      if (numericCols.length > 0) {
         setSelectedY(numericCols[0]);
         // Try to find a time/index column
         const timeCol = headers.find(h => h.toLowerCase().includes('time') || h.toLowerCase().includes('date') || h.toLowerCase().includes('stamp'));
         if (timeCol) setSelectedX(timeCol);
         else if (numericCols.length > 1) setSelectedX(numericCols[1]);
         else setSelectedX('_index_'); // Fallback to index
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    if (csvData && selectedY) {
       let yVals = csvData[selectedY];
       let xVals = selectedX === '_index_' || !selectedX ? yVals.map((_, i) => i) : csvData[selectedX];

       // Filter out nulls/strings for plotting
       const plotData = [];
       for (let i = 0; i < yVals.length; i++) {
         const y = Number(yVals[i]);
         const x = Number(xVals[i]);
         if (!isNaN(y) && !isNaN(x)) {
           plotData.push({x, y});
         }
       }

       if (plotData.length > 0) {
         const newTrace = [{ name: selectedY, data: plotData }];
         setTelemetryTrace(newTrace);
         localStorage.setItem('ascads_telemetry_trace', JSON.stringify(newTrace));
       } else {
         setTelemetryTrace([]);
       }
    }
  }, [csvData, selectedX, selectedY]);

  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  const handleQuickInsert = (text: string) => {
    let targetId = activeBlockId;
    if (!targetId && blocks.length > 0) {
       targetId = blocks[blocks.length - 1].id;
    }
    if (!targetId) return;
    
    setBlocks(blocks.map(b => {
      if (b.id === targetId) {
        return { ...b, expr: b.expr + text };
      }
      return b;
    }));
  };

  const MATH_GROUPS = [
    {
      name: 'Core',
      symbols: [
        { label: 'π', insert: 'pi' },
        { label: 'e', insert: 'e' },
        { label: 'i', insert: 'i' },
        { label: '√', insert: 'sqrt(' },
        { label: 'xⁿ', insert: '^' },
        { label: '|x|', insert: 'abs(' },
      ]
    },
    {
      name: 'Trig',
      symbols: [
        { label: 'sin', insert: 'sin(' },
        { label: 'cos', insert: 'cos(' },
        { label: 'tan', insert: 'tan(' },
        { label: 'asin', insert: 'asin(' },
        { label: 'sinh', insert: 'sinh(' },
      ]
    },
    {
      name: 'Matrix',
      symbols: [
        { label: '[ ]', insert: '[]' },
        { label: 'row ;', insert: ';' },
        { label: 'det', insert: 'det(' },
        { label: 'inv', insert: 'inv(' },
        { label: 'A×B', insert: 'cross(' },
        { label: 'A·B', insert: 'dot(' },
      ]
    },
    {
      name: 'Calc',
      symbols: [
        { label: 'd/dx', insert: 'derivative(' },
        { label: 'log', insert: 'log(' },
        { label: 'ln', insert: 'log(' },
        { label: 'exp', insert: 'exp(' },
      ]
    }
  ];

  // Core Evaluation
  const { blocksData, workspace } = useMemo(() => {
    const ws = new MathWorkspace(globalParams);
    const data = blocks.map(b => {
      if (!b.visible) return { block: b, result: null };
      return { block: b, result: ws.evaluateBlock(b.expr, analysisVariable) };
    });
    return { blocksData: data, workspace: ws };
  }, [blocks, globalParams, analysisVariable]);

  // Plot Data Generation
//... (keeping plot generation intact)

  const plotData = useMemo(() => {
    const { min, max, steps } = range;
    const stepSize = (max - min) / steps;
    const allTraces: any[] = [];

    switch (mode) {
      case '2D': {
        const xRange = Array.from({ length: steps }, (_, i) => min + i * stepSize);
        blocksData.forEach(({ block, result }) => {
          if (!result || result.error || !block.visible) return;
          
          let plotExpr = block.expr;
          if (plotExpr.includes('=')) {
            const parts = plotExpr.split('=');
            if (!parts[0].includes('(')) return; // Skip simple assignments like a=5
            plotExpr = parts[0].trim();
          }

          const { x, y } = workspace.evaluate2D(plotExpr, xRange);
          if (y.some(v => !isNaN(v))) {
            allTraces.push({
              x, y,
              type: 'scatter', mode: 'lines',
              line: { color: block.color, width: 2 },
              name: plotExpr
            });
          }
        });
        break;
      }
      case 'Parametric': {
        const tRange = Array.from({ length: steps * 2 }, (_, i) => min + i * ((max - min) / (steps * 2)));
        blocksData.forEach(({ block, result }) => {
          if (!result || result.error || !block.visible) return;
          if (!block.expr.includes(',')) return;

          const { x, y } = workspace.evaluateParametric(block.expr, tRange);
          if (x.length > 0 && y.length > 0) {
            allTraces.push({
              x, y,
              type: 'scatter', mode: 'lines',
              line: { color: block.color, width: 2 },
              name: block.expr
            });
          }
        });
        break;
      }
      case 'Polar': {
        const tRange = Array.from({ length: steps }, (_, i) => 0 + i * (2 * Math.PI / steps));
        blocksData.forEach(({ block, result }) => {
          if (!result || result.error || !block.visible) return;
          
          let plotExpr = block.expr;
          if (plotExpr.includes('=')) {
            const parts = plotExpr.split('=');
            if (!parts[0].includes('(')) return;
            plotExpr = parts[0].trim();
          }

          const { r, t } = workspace.evaluatePolar(plotExpr, tRange);
          if (r.some(v => !isNaN(v))) {
            allTraces.push({
              r, theta: t,
              type: 'scatterpolar', mode: 'lines',
              line: { color: block.color, width: 2 },
              name: plotExpr
            });
          }
        });
        break;
      }
      case '3D': {
        const ticks = 40;
        const xRange = Array.from({ length: ticks }, (_, i) => min + i * ((max - min) / ticks));
        const yRange = Array.from({ length: ticks }, (_, i) => min + i * ((max - min) / ticks));
        
        blocksData.forEach(({ block, result }) => {
          if (!result || result.error || !block.visible) return;
          
          let plotExpr = block.expr;
          if (plotExpr.includes('=')) {
            const parts = plotExpr.split('=');
            if (!parts[0].includes('(')) return;
            plotExpr = parts[0].trim();
          }

          const { z, x, y } = workspace.evaluate3D(plotExpr, xRange, yRange);
          if (z.some(row => row.some(v => !isNaN(v)))) {
            allTraces.push({
              z, x, y,
              type: 'surface',
              colorscale: 'Viridis',
              showscale: false,
              name: plotExpr,
              opacity: 0.9
            });
          }
        });
        break;
      }
      case 'VectorField': {
        const ticks = 20;
        const xRange = Array.from({ length: ticks }, (_, i) => min + i * ((max - min) / ticks));
        const yRange = Array.from({ length: ticks }, (_, i) => min + i * ((max - min) / ticks));
        
        blocksData.forEach(({ block, result }) => {
          if (!result || result.error || !block.visible) return;
          if (!block.expr.includes(',') || block.expr.includes('=')) return;

          const { x, y, u, v } = workspace.evaluateVectorField(block.expr, xRange, yRange);
          if (u.length > 0 && v.length > 0) {
            const qx: (number|null)[] = [];
            const qy: (number|null)[] = [];
            
            const maxMag = Math.max(...u.map((_u, i) => Math.sqrt(_u*_u + v[i]*v[i])));
            const scale = ((max - min) / ticks) * 0.8 / (maxMag || 1);

            for (let i = 0; i < x.length; i++) {
              if (isNaN(u[i]) || isNaN(v[i])) continue;
              const startX = x[i];
              const startY = y[i];
              const endX = startX + u[i] * scale;
              const endY = startY + v[i] * scale;

              const angle = Math.atan2(v[i], u[i]);
              const headLen = ((max - min) / ticks) * 0.3;

              qx.push(startX, endX, endX - headLen * Math.cos(angle - Math.PI/6), null, endX, endX - headLen * Math.cos(angle + Math.PI/6), null);
              qy.push(startY, endY, endY - headLen * Math.sin(angle - Math.PI/6), null, endY, endY - headLen * Math.sin(angle + Math.PI/6), null);
            }

            allTraces.push({
              x: qx, y: qy,
              type: 'scatter', mode: 'lines',
              line: { color: block.color, width: 1.5 },
              name: block.expr,
              hoverinfo: 'none'
            });
          }
        });
        break;
      }
      case 'Telemetry': {
        if (!telemetryTrace || telemetryTrace.length === 0) return [];
        if (fftEnabled) {
          return telemetryTrace.map((trace) => {
            const yData = trace.data.map(p => p.y);
            const { frequencies, magnitudes } = DSPEngine.magnitudeSpectrum(yData, sampleRate);
            return {
              x: frequencies,
              y: magnitudes,
              type: 'scatter',
              mode: 'lines',
              name: `FFT: ${trace.name}`,
              fill: 'tozeroy',
              line: { color: '#8b5cf6' }
            };
          });
        } else {
          return telemetryTrace.flatMap((trace) => {
            const tr: any[] = [{
              x: trace.data.map(p => p.x),
              y: trace.data.map(p => p.y),
              type: 'scatter',
              mode: 'markers',
              name: trace.name,
              marker: { color: '#10b981', size: 4 }
            }];
            if (regressionEnabled) {
              const xData = trace.data.map(p => p.x);
              const yData = trace.data.map(p => p.y);
              const { m, b, r2 } = DSPEngine.linearRegression(xData, yData);
              const minX = Math.min(...xData);
              const maxX = Math.max(...xData);
              tr.push({
                x: [minX, maxX],
                y: [m * minX + b, m * maxX + b],
                type: 'scatter',
                mode: 'lines',
                line: { color: '#f43f5e', width: 2 },
                name: `Fit (R²=${r2.toFixed(3)})`
              });
            }
            return tr;
          });
        }
      }
      case 'Control': {
        blocksData.forEach(({ block }) => {
          if (!block.visible || !block.expr.includes('s')) return;
          let plotExpr = block.expr;
          if (plotExpr.includes('=')) plotExpr = plotExpr.split('=')[1].trim();

          const { w, mag, phase, error } = ControlEngine.evaluateBode(plotExpr);
          if (!error && w.length > 0) {
            allTraces.push({
              x: w, y: mag,
              type: 'scatter', mode: 'lines',
              line: { color: block.color, width: 2 },
              name: `|${plotExpr}| dB`,
              yaxis: 'y'
            });
            allTraces.push({
              x: w, y: phase,
              type: 'scatter', mode: 'lines',
              line: { color: block.color, width: 2, dash: 'dot' },
              name: `∠${plotExpr}°`,
              yaxis: 'y2'
            });
          }
        });
        break;
      }
    }
    return allTraces;
  }, [blocksData, mode, range, telemetryTrace, workspace, fftEnabled, sampleRate, regressionEnabled]);


  const layout = useMemo(() => {
    const base = {
      autosize: true,
      margin: { l: 40, r: 40, t: 40, b: 40 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: '#94a3b8', family: 'Inter' },
      xaxis: { gridcolor: '#2d333b', zerolinecolor: '#4b5563', range: (mode === '2D' || mode === 'VectorField') ? [range.min, range.max] : undefined },
      yaxis: { gridcolor: '#2d333b', zerolinecolor: '#4b5563', range: mode === 'VectorField' ? [range.min, range.max] : undefined },
      showlegend: false,
    };

    if (mode === 'Polar') {
      return {
        ...base,
        polar: {
          bgcolor: 'rgba(0,0,0,0)',
          radialaxis: { gridcolor: '#2d333b', showline: false, ticklen: 0 },
          angularaxis: { gridcolor: '#2d333b', thetaunit: 'radians', direction: 'counterclockwise' }
        }
      };
    }

    if (mode === '3D') {
      return {
        ...base,
        scene: {
          xaxis: { gridcolor: '#2d333b', backgroundcolor: 'rgba(0,0,0,0)' },
          yaxis: { gridcolor: '#2d333b', backgroundcolor: 'rgba(0,0,0,0)' },
          zaxis: { gridcolor: '#2d333b', backgroundcolor: 'rgba(0,0,0,0)' },
        }
      };
    }

    if (mode === 'Telemetry' && fftEnabled) {
       return {
         ...base,
         xaxis: { ...base.xaxis, title: 'Frequency (Hz)' },
         yaxis: { ...base.yaxis, title: 'Magnitude' }
       };
    }

    if (mode === 'Control') {
       return {
         ...base,
         xaxis: { ...base.xaxis, title: 'Frequency (rad/s)', type: 'log' },
         yaxis: { ...base.yaxis, title: 'Magnitude (dB)' },
         yaxis2: { 
           title: 'Phase (deg)', 
           overlaying: 'y', 
           side: 'right', 
           showgrid: false,
           zeroline: false,
           font: { color: '#94a3b8', family: 'Inter' }
         },
         showlegend: true,
         legend: { orientation: 'h', y: -0.2 }
       };
    }

    if (mode === 'Matrix') {
      // Hide axes for pure matrix computation mode unless plotting happens
      return { ...base, xaxis: { visible: false }, yaxis: { visible: false } };
    }

    return base;
  }, [mode, range, fftEnabled]);

  const addBlock = () => {
    const newBlock: MathBlock = {
      id: Math.random().toString(36).substr(2, 9),
      expr: '',
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      visible: true
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<MathBlock>) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  return (
    <div className="flex h-full w-full font-sans text-slate-300 bg-brand-bg select-none overflow-hidden">
      {/* Sidebar Controls (Notebook Style) */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 380 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="relative h-full bg-[#13151a] border-r border-brand-border z-20 flex-shrink-0 flex flex-col overflow-hidden shadow-2xl"
      >
        <div className="p-4 flex-1 flex flex-col gap-5 w-[380px] overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500 border border-indigo-500/20">
                <Settings2 size={20} />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-tight leading-none uppercase italic">Workspace</h1>
                <span className="text-[9px] font-mono opacity-50 tracking-[0.2em] uppercase">Engineered Computation</span>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 hover:bg-white/5 rounded-lg"
            >
              <ChevronRight size={16} className="rotate-180" />
            </button>
          </div>

          <section className="space-y-3">
            <div className="grid grid-cols-4 gap-1.5">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border transition-all",
                    mode === m.id 
                      ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-400" 
                      : "bg-black/20 border-brand-border opacity-50 hover:opacity-100 text-slate-400"
                  )}
                  title={m.label}
                >
                  <m.icon size={16} />
                  <span className="text-[8px] uppercase tracking-widest truncate w-full text-center">{m.id.replace('VectorField','Vector')}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Notebook Equation Blocks */}
          <section className="space-y-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-1">
              <label className="text-[10px] font-mono uppercase tracking-widest opacity-60 flex items-center gap-1.5">
                <FunctionSquare size={12} /> Computation Blocks
              </label>
              <button 
                onClick={addBlock}
                className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded flex items-center gap-1 text-[9px] uppercase tracking-widest"
              >
                <Plus size={10}/> Add Block
              </button>
            </div>

            {/* Quick Insert Ribbon */}
            <div className="space-y-1.5 pt-1 border-b border-brand-border/30 pb-3">
              {MATH_GROUPS.map(g => (
                <div key={g.name} className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                  <span className="text-[8px] font-mono uppercase text-slate-500 w-10 shrink-0">{g.name}</span>
                  {g.symbols.map(s => (
                    <button
                      key={s.label}
                      onClick={() => handleQuickInsert(s.insert)}
                      className="px-1.5 py-0.5 bg-black/30 hover:bg-indigo-500/20 hover:text-indigo-300 border border-white/5 rounded text-[10px] font-mono whitespace-nowrap transition-colors"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {blocks.map((block, idx) => {
                const bData = blocksData.find(d => d.block.id === block.id);
                const res = bData?.result;

                return (
                  <div key={block.id} className="group flex items-start gap-2 bg-black/30 rounded-xl p-2 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex flex-col items-center gap-2 pt-1">
                      <div className="text-[9px] font-mono text-slate-500">{idx + 1}</div>
                      <button 
                        onClick={() => updateBlock(block.id, { visible: !block.visible })}
                        className="w-4 h-4 rounded-full border-2 transition-transform active:scale-90"
                        style={{ 
                          borderColor: block.color, 
                          backgroundColor: block.visible ? block.color : 'transparent',
                          opacity: block.visible ? 1 : 0.3
                        }}
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="relative">
                        <input
                          value={block.expr}
                          onChange={(e) => updateBlock(block.id, { expr: e.target.value })}
                          onFocus={() => setActiveBlockId(block.id)}
                          className="w-full bg-transparent border-none text-white font-mono text-sm focus:outline-none focus:ring-0 placeholder:opacity-30"
                          placeholder="Expression or Assignment"
                        />
                      </div>
                      
                      {res && block.visible && (
                        <div className="text-[10px] bg-black/40 rounded px-2 py-1.5 border border-white/5 overflow-x-auto scrollbar-hide text-emerald-400 font-mono">
                           {res.error && !(mode === 'Control' && block.expr.includes('s')) ? (
                             <span className="text-red-400 flex items-center gap-1"><AlertCircle size={10}/> {res.error}</span>
                           ) : (
                             <div className="flex flex-col gap-1">
                               {res.latex && <KatexSpan tex={res.latex} />}
                               {res.value !== undefined && typeof res.value !== 'function' && (
                                 <div className="text-blue-300 mt-1 flex items-center gap-2 flex-wrap">
                                   <span className="opacity-50">=</span> {res.valueTex ? <KatexSpan tex={res.valueTex} /> : String(res.valueStr || res.value)}
                                 </div>
                               )}
                               {res.analysis?.derivativeTex && (
                                 <div className="flex items-center gap-2 pt-1 border-t border-white/5 mt-1 text-[9px] text-slate-400">
                                   <span className="opacity-50">d/dx =</span> <KatexSpan tex={res.analysis.derivativeTex} />
                                 </div>
                               )}
                             </div>
                           )}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => deleteBlock(block.id)}
                      className="p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          </section>

          {mode === 'Telemetry' && (
            <section className="space-y-3 pt-3 border-t border-brand-border/50">
              <label className="text-[10px] font-mono uppercase tracking-widest opacity-60 flex items-center gap-1.5 text-blue-400">
                <LineChart size={12}/> DSP Settings
              </label>
              <div className="bg-black/20 p-2 rounded-lg border border-white/5 space-y-3">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Data Import (CSV)</span>
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="block w-full text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-semibold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30" />
                </div>

                {csvColumns.length > 0 && (
                  <div className="space-y-2 border-t border-white/5 pt-2">
                    <div className="flex flex-col gap-1">
                       <span className="text-[9px] font-mono text-slate-500">X-Axis (Domain)</span>
                       <select value={selectedX} onChange={e => setSelectedX(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-1.5 py-1 text-[10px] font-mono text-white focus:outline-none">
                         <option value="_index_">Row Index</option>
                         {csvColumns.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-[9px] font-mono text-slate-500">Y-Axis (Signal)</span>
                       <select value={selectedY} onChange={e => setSelectedY(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-1.5 py-1 text-[10px] font-mono text-white focus:outline-none">
                         {csvColumns.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                    </div>
                  </div>
                )}
                
                <div className="border-t border-white/5 pt-2 flex items-center justify-between">
                  <label className="text-[10px] font-mono flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={fftEnabled} onChange={e => setFftEnabled(e.target.checked)} className="accent-blue-500" />
                    Compute FFT Spectrum
                  </label>
                  {fftEnabled && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono text-slate-500">Fs (Hz)</span>
                      <input type="number" value={sampleRate} onChange={e => setSampleRate(Number(e.target.value))} className="w-16 bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-mono focus:outline-none" />
                    </div>
                  )}
                </div>
                <div className="border-t border-white/5 pt-2 flex items-center justify-between">
                  <label className="text-[10px] font-mono flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={regressionEnabled} onChange={e => setRegressionEnabled(e.target.checked)} className="accent-rose-500" />
                    Linear Regression Fit
                  </label>
                </div>
              </div>
            </section>
          )}

          {mode !== 'Telemetry' && mode !== 'Matrix' && mode !== 'Control' && (
            <section className="space-y-3 pt-3 border-t border-brand-border/50">
              <label className="text-[10px] font-mono uppercase tracking-widest opacity-60 flex items-center gap-1.5">
                Domain Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-black/20 rounded p-1.5 border border-white/5">
                  <span className="text-[9px] opacity-40 uppercase ml-1 block mb-1">Min</span>
                  <input 
                    type="number" value={range.min}
                    onChange={e => setRange(r => ({ ...r, min: parseFloat(e.target.value) }))}
                    className="w-full bg-transparent border-none text-[11px] font-mono focus:outline-none"
                  />
                </div>
                <div className="bg-black/20 rounded p-1.5 border border-white/5">
                  <span className="text-[9px] opacity-40 uppercase ml-1 block mb-1">Max</span>
                  <input 
                    type="number" value={range.max}
                    onChange={e => setRange(r => ({ ...r, max: parseFloat(e.target.value) }))}
                    className="w-full bg-transparent border-none text-[11px] font-mono focus:outline-none"
                  />
                </div>
              </div>
            </section>
          )}

        </div>
      </motion.aside>

      {/* Main Plot Area */}
      <main className="flex-1 relative flex flex-col min-w-0 bg-[#0d0e12]">
        {!isSidebarOpen && (
          <motion.button
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="absolute left-4 top-4 z-40 p-2.5 bg-brand-card border border-brand-border rounded-lg shadow-xl text-slate-400 hover:text-white transition-all"
            onClick={() => setSidebarOpen(true)}
          >
            <Settings2 size={18} />
          </motion.button>
        )}

        {mode === 'Matrix' && (
           <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10 pointer-events-none">
             <div className="text-center space-y-4 max-w-lg bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-2xl">
               <Hash size={48} className="mx-auto text-indigo-500 opacity-50" />
               <h2 className="text-2xl font-bold text-white tracking-tight">Linear Algebra Environment</h2>
               <p className="text-slate-400 text-sm leading-relaxed">
                 The computation blocks on the left fully support Matrices and Vectors. <br/>
                 Try assigning a matrix: <code className="bg-black/50 px-1.5 py-0.5 rounded text-indigo-300">A = [1, 2; 3, 4]</code><br/>
                 Then perform operations like <code className="bg-black/50 px-1.5 py-0.5 rounded text-indigo-300">inv(A)</code>, <code className="bg-black/50 px-1.5 py-0.5 rounded text-indigo-300">det(A)</code>, or <code className="bg-black/50 px-1.5 py-0.5 rounded text-indigo-300">A * [5; 6]</code>.
               </p>
             </div>
           </div>
        )}

        {mode === 'Telemetry' && telemetryTrace.length === 0 && !csvData && (
           <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10 pointer-events-none">
             <div className="text-center space-y-4 max-w-lg bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-2xl">
               <LineChart size={48} className="mx-auto text-emerald-500 opacity-50" />
               <h2 className="text-2xl font-bold text-white tracking-tight">DSP & Telemetry</h2>
               <p className="text-slate-400 text-sm leading-relaxed">
                 Use the DSP Settings in the sidebar to upload a CSV file.<br/>
                 Expected format: <code className="bg-black/50 px-1.5 py-0.5 rounded text-emerald-300">time, value</code> on each line.<br/>
                 Once loaded, you can instantly apply Fast Fourier Transforms (FFT) to analyze frequency domains!
               </p>
             </div>
           </div>
        )}

        {mode === 'Telemetry' && telemetryTrace.length === 0 && csvData && (
           <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10 pointer-events-none">
             <div className="text-center space-y-4 max-w-lg bg-red-900/20 backdrop-blur-md p-8 rounded-2xl border border-red-500/20 shadow-2xl">
               <AlertCircle size={48} className="mx-auto text-red-500 opacity-80" />
               <h2 className="text-2xl font-bold text-white tracking-tight">No Numeric Data Found</h2>
               <p className="text-red-200/70 text-sm leading-relaxed">
                 The selected Y-Axis (<strong className="text-white">{selectedY}</strong>) against X-Axis (<strong className="text-white">{selectedX}</strong>) does not contain valid numbers.<br/><br/>
                 You cannot plot text strings on a graph or run FFT on them. Please select a column that contains numerical values!
               </p>
             </div>
           </div>
        )}

        <div className="flex-1 w-full h-full relative overflow-hidden" style={{ opacity: (mode === 'Matrix' || (mode === 'Telemetry' && telemetryTrace.length === 0)) ? 0.1 : 1 }}>
          <AnimatePresence mode="wait">
             <motion.div
                key={`${mode}-${isSidebarOpen}-${fftEnabled}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full"
             >
                <Plot
                  data={plotData as any}
                  layout={layout as any}
                  useResizeHandler
                  className="w-full h-full"
                  config={{ 
                    responsive: true, 
                    displayModeBar: true,
                    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
                    displaylogo: false
                  }}
                />
             </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 pointer-events-none border border-brand-accent/5" />
        </div>
      </main>
    </div>
  );
}
