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
  ArrowRight, Wind, Hash, Sliders, X, HelpCircle, BookOpen,
  Bot, Zap, Droplets, Infinity as InfinityIcon,
  Rocket, Atom, Grid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import KatexSpan from '../components/KatexSpan';
import { cn } from '../lib/utils';

type Mode = '2D' | 'Parametric' | 'Polar' | '3D' | 'VectorField' | 'Matrix' | 'Telemetry' | 'Control' | 'Kinematics' | 'Power' | 'FluidPower' | 'Chaos' | 'Astrodynamics' | 'Quantum' | 'PDE';

const MODES: { id: Mode; icon: any; label: string }[] = [
  { id: '2D', icon: FunctionSquare, label: 'Cartesian 2D' },
  { id: 'Parametric', icon: Activity, label: 'Parametric' },
  { id: 'Polar', icon: CircleDot, label: 'Polar' },
  { id: '3D', icon: Box, label: 'Surface 3D' },
  { id: 'VectorField', icon: Wind, label: 'Vector Field 2D' },
  { id: 'Matrix', icon: Hash, label: 'Linear Algebra' },
  { id: 'Telemetry', icon: LineChart, label: 'DSP / Telemetry' },
  { id: 'Control', icon: Sliders, label: 'Control Systems' },
  { id: 'Kinematics', icon: Bot, label: 'Robotics Kinematics' },
  { id: 'Power', icon: Zap, label: 'Energy / Power' },
  { id: 'FluidPower', icon: Droplets, label: 'Fluid Power' },
  { id: 'Chaos', icon: InfinityIcon, label: 'Chaos & Attractors' },
  { id: 'Astrodynamics', icon: Rocket, label: 'Astrodynamics' },
  { id: 'Quantum', icon: Atom, label: 'Quantum Simulator' },
  { id: 'PDE', icon: Grid, label: 'PDE / Heat Solver' },
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
  const [isHelpOpen, setHelpOpen] = useState(false);
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
    if (mode === 'Chaos' && !blocks.some(b => b.expr.includes('sigma'))) {
      setBlocks([
        { id: 'ch1', expr: 'sigma = 10', color: '#f59e0b', visible: true },
        { id: 'ch2', expr: 'rho = 28', color: '#3b82f6', visible: true },
        { id: 'ch3', expr: 'beta = 8/3', color: '#10b981', visible: true },
        { id: 'ch4', expr: 'dx = sigma * (y - x)', color: '#ec4899', visible: true },
        { id: 'ch5', expr: 'dy = x * (rho - z) - y', color: '#8b5cf6', visible: true },
        { id: 'ch6', expr: 'dz = x * y - beta * z', color: '#ef4444', visible: true },
      ]);
    }
    if (mode === 'Astrodynamics' && !blocks.some(b => b.expr.includes('G ='))) {
      setBlocks([
        { id: 'a1', expr: 'G = 1', color: '#8b5cf6', visible: true },
        { id: 'a2', expr: 'M = 1000', color: '#f59e0b', visible: true },
        { id: 'a3', expr: 'm1 = 1', color: '#3b82f6', visible: true },
        { id: 'a4', expr: 'x1 = 100; y1 = 0', color: '#10b981', visible: true },
        { id: 'a5', expr: 'vx1 = 0; vy1 = 3.16', color: '#ec4899', visible: true },
      ]);
    }
    if (mode === 'Quantum' && !blocks.some(b => b.expr.includes('H ='))) {
      setBlocks([
        { id: 'q1', expr: 'q0 = [1, 0]', color: '#3b82f6', visible: true },
        { id: 'q2', expr: 'H = [[1/sqrt(2), 1/sqrt(2)], [1/sqrt(2), -1/sqrt(2)]]', color: '#8b5cf6', visible: true },
        { id: 'q3', expr: 'X = [[0, 1], [1, 0]]', color: '#f59e0b', visible: true },
        { id: 'q4', expr: 'state = H * q0', color: '#10b981', visible: true },
      ]);
    }
    if (mode === 'PDE' && !blocks.some(b => b.expr.includes('alpha ='))) {
      setBlocks([
        { id: 'p1', expr: 'alpha = 0.5', color: '#f59e0b', visible: true },
        { id: 'p2', expr: 'steps = 100', color: '#8b5cf6', visible: true },
        { id: 'p3', expr: 'size = 30', color: '#3b82f6', visible: true },
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
            const lhs = parts[0].trim();
            if (lhs === 'y') {
              plotExpr = parts[1].trim();
            } else if (lhs.includes('(')) {
              plotExpr = parts[0].trim();
            } else {
              return; // Skip simple assignments like a=5
            }
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
          let plotExpr = block.expr;
          if (plotExpr.includes('=')) {
            plotExpr = plotExpr.split('=')[1].trim();
          }
          if (!plotExpr.includes(',')) return;

          const { x, y } = workspace.evaluateParametric(plotExpr, tRange);
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
            const lhs = parts[0].trim();
            if (lhs === 'r') {
              plotExpr = parts[1].trim();
            } else if (lhs.includes('(')) {
              plotExpr = parts[0].trim();
            } else {
              return;
            }
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
            const lhs = parts[0].trim();
            if (lhs === 'z') {
              plotExpr = parts[1].trim();
            } else if (lhs.includes('(')) {
              plotExpr = parts[0].trim();
            } else {
              return;
            }
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
          let plotExpr = block.expr;
          if (plotExpr.includes('=')) {
            plotExpr = plotExpr.split('=')[1].trim();
          }
          if (!plotExpr.includes(',')) return;

          const { x, y, u, v } = workspace.evaluateVectorField(plotExpr, xRange, yRange);
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
      case 'Chaos': {
        let dxExpr = '';
        let dyExpr = '';
        let dzExpr = '';
        let color = '#ec4899';
        
        blocksData.forEach(({ block }) => {
          if (!block.visible) return;
          const expr = block.expr.trim();
          if (expr.startsWith('dx =') || expr.startsWith('dx=')) dxExpr = expr.split('=')[1];
          if (expr.startsWith('dy =') || expr.startsWith('dy=')) dyExpr = expr.split('=')[1];
          if (expr.startsWith('dz =') || expr.startsWith('dz=')) { dzExpr = expr.split('=')[1]; color = block.color; }
        });

        if (dxExpr && dyExpr && dzExpr) {
          const { x, y, z } = workspace.evaluateChaos(dxExpr, dyExpr, dzExpr, 10000, 0.01, [1.0, 1.0, 1.0]);
          if (x.length > 0) {
            allTraces.push({
              x, y, z,
              type: 'scatter3d',
              mode: 'lines',
              line: { color: z, colorscale: 'Plasma', width: 2 },
              name: 'Attractor Trajectory'
            });
          }
        }
        break;
      }
      case 'Astrodynamics': {
        const G = workspace.scope.G || 1;
        const M = workspace.scope.M || 1000;
        const x1 = workspace.scope.x1 || 100;
        const y1 = workspace.scope.y1 || 0;
        const vx1 = workspace.scope.vx1 || 0;
        const vy1 = workspace.scope.vy1 || 3.16;

        const { x, y } = workspace.evaluateAstrodynamics(G, M, x1, y1, vx1, vy1, 2000, 0.1);
        if (x.length > 0) {
          allTraces.push({
            x: [0], y: [0],
            type: 'scatter', mode: 'markers',
            marker: { color: '#f59e0b', size: 20 },
            name: 'Central Body (M)'
          });
          allTraces.push({
            x, y,
            type: 'scatter', mode: 'lines',
            line: { color: '#3b82f6', width: 2 },
            name: 'Orbital Path'
          });
          allTraces.push({
            x: [x[x.length - 1]], y: [y[y.length - 1]],
            type: 'scatter', mode: 'markers',
            marker: { color: '#ef4444', size: 10 },
            name: 'Satellite'
          });
        }
        break;
      }
      case 'Quantum': {
        const stateResult = blocksData.find(b => b.block.expr.startsWith('state =') || b.block.expr.startsWith('state='));
        if (stateResult && stateResult.result && stateResult.result.value) {
          const stateVec = stateResult.result.value;
          // check if it's an array
          let arr = stateVec._data || stateVec;
          if (Array.isArray(arr)) {
             // flattening in case of column vector
             arr = arr.flat();
             const probs = arr.map((c: any) => {
               if (c && typeof c.abs === 'function') return c.abs() * c.abs(); // Complex number
               return Number(c) * Number(c); // Real number
             });
             const labels = probs.map((_: any, i: number) => {
               const numBits = Math.log2(probs.length);
               return `|${i.toString(2).padStart(Math.max(1, numBits), '0')}⟩`;
             });
             allTraces.push({
               x: labels,
               y: probs,
               type: 'bar',
               marker: { color: '#8b5cf6' },
               name: 'Probability Amplitude'
             });
          }
        }
        break;
      }
      case 'PDE': {
        const alpha = workspace.scope.alpha || 0.5;
        const steps = workspace.scope.steps || 100;
        const size = workspace.scope.size || 30;
        
        const { z } = workspace.evaluatePDE(alpha, size, steps);
        if (z.length > 0) {
          allTraces.push({
            z,
            type: 'heatmap',
            colorscale: 'Inferno',
            name: 'Heat Diffusion'
          });
        }
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

    if (mode === '3D' || mode === 'Chaos') {
      return {
        ...base,
        scene: {
          xaxis: { gridcolor: '#2d333b', backgroundcolor: 'rgba(0,0,0,0)' },
          yaxis: { gridcolor: '#2d333b', backgroundcolor: 'rgba(0,0,0,0)' },
          zaxis: { gridcolor: '#2d333b', backgroundcolor: 'rgba(0,0,0,0)' },
        }
      };
    }

    if (mode === 'Astrodynamics') {
      return {
        ...base,
        xaxis: { ...base.xaxis, title: 'Distance X', scaleanchor: 'y', scaleratio: 1 },
        yaxis: { ...base.yaxis, title: 'Distance Y' },
      };
    }

    if (mode === 'Quantum') {
      return {
        ...base,
        xaxis: { gridcolor: '#2d333b', zerolinecolor: '#4b5563', title: 'Basis State' },
        yaxis: { gridcolor: '#2d333b', zerolinecolor: '#4b5563', title: 'Probability P(x)', range: [0, 1] },
      };
    }

    if (mode === 'PDE') {
      return {
        ...base,
        xaxis: { visible: false },
        yaxis: { visible: false },
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
        className="relative h-full bg-[#0b0c13]/90 backdrop-blur-3xl border-r border-white/10 z-20 flex-shrink-0 flex flex-col overflow-hidden shadow-[10px_0_30px_rgba(0,0,0,0.5)]"
      >
        <div className="p-4 flex-1 flex flex-col gap-6 w-[380px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl text-indigo-400 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <Settings2 size={20} />
              </div>
              <div>
                <h1 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 tracking-tight leading-none uppercase">Scientific Engine</h1>
                <span className="text-[9px] font-mono opacity-50 tracking-[0.2em] uppercase text-indigo-200">Beyond CAS</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setHelpOpen(true)}
                className="p-1.5 text-indigo-300 hover:bg-indigo-500/20 hover:text-indigo-200 rounded-lg transition-colors border border-transparent hover:border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.1)]"
                title="Documentation & Tutorial"
              >
                <HelpCircle size={16} />
              </button>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1.5 hover:bg-white/5 rounded-lg"
              >
                <ChevronRight size={16} className="rotate-180" />
              </button>
            </div>
          </div>

          <section className="space-y-3">
            <div className="grid grid-cols-4 gap-1.5">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all duration-300",
                    mode === m.id 
                      ? "bg-gradient-to-b from-indigo-500/20 to-indigo-600/10 border-indigo-500/50 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]" 
                      : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20 text-slate-400"
                  )}
                  title={m.label}
                >
                  <m.icon size={16} />
                  <span className="text-[8px] font-bold uppercase tracking-widest truncate w-full text-center">{m.id.replace('VectorField','Vector')}</span>
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

            <div className="space-y-3 flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
              {blocks.map((block, idx) => {
                const bData = blocksData.find(d => d.block.id === block.id);
                const res = bData?.result;
                const isActive = activeBlockId === block.id;

                return (
                  <div key={block.id} className={cn(
                    "group flex items-start gap-3 rounded-2xl p-3 border transition-all duration-300",
                    isActive 
                      ? "bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.15)]" 
                      : "bg-[#0b0c13]/50 border-white/10 hover:border-white/20"
                  )}>
                    <div className="flex flex-col items-center gap-3 pt-1">
                      <div className="text-[10px] font-black text-slate-600 bg-white/5 w-5 h-5 rounded flex items-center justify-center">{idx + 1}</div>
                      <button 
                        onClick={() => updateBlock(block.id, { visible: !block.visible })}
                        className="w-4 h-4 rounded-full border-2 transition-all duration-300 active:scale-90 hover:scale-110"
                        style={{ 
                          borderColor: block.color, 
                          backgroundColor: block.visible ? block.color : 'transparent',
                          opacity: block.visible ? 1 : 0.3,
                          boxShadow: block.visible ? `0 0 10px ${block.color}80` : 'none'
                        }}
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="relative flex items-center">
                        <input
                          value={block.expr}
                          onChange={(e) => updateBlock(block.id, { expr: e.target.value })}
                          onFocus={() => setActiveBlockId(block.id)}
                          onBlur={() => setActiveBlockId(null)}
                          className="w-full bg-transparent border-none text-white font-mono text-[15px] focus:outline-none focus:ring-0 placeholder:opacity-30 tracking-wide"
                          placeholder="Enter mathematical expression..."
                        />
                      </div>
                      
                      {res && block.visible && (
                        <div className="text-[11px] bg-[#000000]/40 rounded-xl px-3 py-2 border border-white/5 overflow-x-auto scrollbar-hide text-emerald-300 font-mono shadow-inner">
                           {res.error && !(mode === 'Control' && block.expr.includes('s')) ? (
                             <span className="text-rose-400 flex items-center gap-1.5"><AlertCircle size={12}/> {res.error}</span>
                           ) : (
                             <div className="flex flex-col gap-1.5">
                               {res.latex && <div className="text-slate-100 text-sm"><KatexSpan tex={res.latex} /></div>}
                               {res.value !== undefined && typeof res.value !== 'function' && (
                                 <div className="text-indigo-300 mt-1 flex items-center gap-2 flex-wrap text-sm">
                                   <span className="opacity-50">=</span> {res.valueTex ? <KatexSpan tex={res.valueTex} /> : String(res.valueStr || res.value)}
                                 </div>
                               )}
                               {res.analysis?.derivativeTex && (
                                 <div className="flex items-center gap-2 pt-2 border-t border-white/10 mt-2 text-[10px] text-slate-400">
                                   <span className="opacity-50">d/dx =</span> <span className="text-indigo-200"><KatexSpan tex={res.analysis.derivativeTex} /></span>
                                 </div>
                               )}
                             </div>
                           )}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => deleteBlock(block.id)}
                      className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
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

          {mode !== 'Telemetry' && mode !== 'Matrix' && mode !== 'Control' && mode !== 'Kinematics' && mode !== 'Power' && mode !== 'FluidPower' && (
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
               <Hash size={48} className="mx-auto text-indigo-500 opacity-50 mb-6" />
               <h2 className="text-2xl font-black text-white tracking-widest uppercase mb-2">Linear Algebra Engine</h2>
               <p className="text-slate-400 text-sm">Define matrices in the left pane using standard bracket notation: <code className="text-emerald-400 bg-black/30 px-2 py-0.5 rounded">A = [1, 2; 3, 4]</code>.</p>
               <div className="flex gap-4 justify-center mt-6">
                 <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-xs font-mono text-slate-300">det(A)</div>
                 <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-xs font-mono text-slate-300">inv(A)</div>
                 <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-xs font-mono text-slate-300">A * B</div>
               </div>
             </div>
           </div>
        )}

        {mode === 'Kinematics' && (
           <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10 pointer-events-none">
             <div className="text-center space-y-4 max-w-lg bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-[0_0_50px_rgba(59,130,246,0.15)]">
               <Bot size={48} className="mx-auto text-blue-500 opacity-50 mb-6" />
               <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 tracking-widest uppercase mb-2">Robotics Kinematics</h2>
               <p className="text-slate-400 text-sm">Use the built-in kinematics functions to calculate transformations and joint angles.</p>
               <div className="grid grid-cols-1 gap-2 mt-6">
                 <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-lg text-xs font-mono text-left">
                   <span className="text-slate-500 block mb-1">DH Transform Matrix:</span>
                   <code className="text-emerald-400">dh(theta, d, a, alpha)</code>
                 </div>
                 <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-lg text-xs font-mono text-left">
                   <span className="text-slate-500 block mb-1">Forward Kinematics Chain:</span>
                   <code className="text-emerald-400">fk(matrix1, matrix2)</code>
                 </div>
                 <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-lg text-xs font-mono text-left">
                   <span className="text-slate-500 block mb-1">2D Inverse Kinematics [th1, th2]:</span>
                   <code className="text-emerald-400">ik2(x, y, L1, L2)</code>
                 </div>
               </div>
             </div>
           </div>
        )}

        {mode === 'Power' && (
           <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10 pointer-events-none">
             <div className="text-center space-y-4 max-w-lg bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-[0_0_50px_rgba(245,158,11,0.15)]">
               <Zap size={48} className="mx-auto text-amber-500 opacity-50 mb-6" />
               <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 tracking-widest uppercase mb-2">Energy & Power Dynamics</h2>
               <p className="text-slate-400 text-sm">Calculate electrical and mechanical power factors instantly.</p>
               <div className="grid grid-cols-2 gap-2 mt-6">
                 <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-lg text-xs font-mono text-left">
                   <span className="text-slate-500 block mb-1">Electrical AC (Watts):</span>
                   <code className="text-emerald-400">elec_power(v, i, pf)</code>
                 </div>
                 <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-lg text-xs font-mono text-left">
                   <span className="text-slate-500 block mb-1">3-Phase AC (Watts):</span>
                   <code className="text-emerald-400">elec_3phase(v, i, pf)</code>
                 </div>
                 <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-lg text-xs font-mono text-left">
                   <span className="text-slate-500 block mb-1">Mechanical Shaft (Watts):</span>
                   <code className="text-emerald-400">mech_power(torque, rpm)</code>
                 </div>
                 <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-lg text-xs font-mono text-left">
                   <span className="text-slate-500 block mb-1">Kinetic Energy (J):</span>
                   <code className="text-emerald-400">kinetic_e(m, v)</code>
                 </div>
               </div>
             </div>
           </div>
        )}

        {mode === 'FluidPower' && (
           <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10 pointer-events-none">
             <div className="text-center space-y-4 max-w-lg bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-[0_0_50px_rgba(16,185,129,0.15)]">
               <Droplets size={48} className="mx-auto text-emerald-500 opacity-50 mb-6" />
               <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 tracking-widest uppercase mb-2">Fluid Power & Pneumatics</h2>
               <p className="text-slate-400 text-sm">Calculate forces, velocities, and power for hydraulic/pneumatic systems.</p>
               <div className="grid grid-cols-1 gap-2 mt-6">
                 <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-lg text-xs font-mono text-left">
                   <span className="text-slate-500 block mb-1">Fluid Power (kW):</span>
                   <code className="text-emerald-400">fluid_power(bar, L_min)</code>
                 </div>
                 <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-lg text-xs font-mono text-left">
                   <span className="text-slate-500 block mb-1">Cylinder Force (Newtons):</span>
                   <code className="text-emerald-400">cylinder_force(bar, diameter_mm)</code>
                 </div>
                 <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-lg text-xs font-mono text-left">
                   <span className="text-slate-500 block mb-1">Flow Velocity (m/s):</span>
                   <code className="text-emerald-400">flow_vel(L_min, diameter_mm)</code>
                 </div>
               </div>
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

      {/* ── Documentation / Tutorial Modal ── */}
      <AnimatePresence>
        {isHelpOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setHelpOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0b0c13]/95 backdrop-blur-3xl border border-indigo-500/30 rounded-2xl shadow-[0_0_50px_rgba(99,102,241,0.15)] w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-indigo-950/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 border border-indigo-500/30">
                    <BookOpen size={20} />
                  </div>
                  <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 uppercase tracking-widest">
                    Scientific Engine Documentation
                  </h2>
                </div>
                <button 
                  onClick={() => setHelpOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 space-y-8 text-slate-300">
                
                {/* Introduction */}
                <div>
                  <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-widest text-indigo-300 border-b border-white/10 pb-2">Core Mechanics</h3>
                  <p className="text-sm leading-relaxed mb-4">
                    The ASCADS Scientific Engine evaluates mathematical blocks sequentially. It parses variables symbolically (e.g. `3x^2`), calculates analytical derivatives, and renders outputs in LaTeX.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-slate-400">
                    <li>Use <code className="bg-black/40 text-emerald-300 px-1.5 py-0.5 rounded border border-white/5 font-mono text-[11px]">a = 5</code> to define global variables available to all lower blocks.</li>
                    <li>Toggle the visibility eye-icon to show/hide specific plots on the graph.</li>
                  </ul>
                </div>

                {/* Modes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* 2D / Cartesian */}
                  <div className="bg-black/30 rounded-xl p-4 border border-white/5 hover:border-indigo-500/30 transition-colors">
                    <h4 className="flex items-center gap-2 text-indigo-300 font-bold mb-3"><FunctionSquare size={16}/> Cartesian 2D</h4>
                    <p className="text-xs text-slate-400 mb-3">Plot standard functions, perform symbolic algebra, and compute derivatives.</p>
                    <div className="bg-black/50 p-3 rounded-lg border border-white/5 space-y-2 font-mono text-xs">
                      <div><span className="text-slate-500 opacity-50 block mb-1">Standard Plot</span><span className="text-emerald-300">f(x) = sin(x) * e^(-0.2*x)</span></div>
                      <div><span className="text-slate-500 opacity-50 block mb-1">Algebraic Analysis</span><span className="text-emerald-300">3x^2 + 5x - 2</span></div>
                    </div>
                  </div>

                  {/* Parametric */}
                  <div className="bg-black/30 rounded-xl p-4 border border-white/5 hover:border-indigo-500/30 transition-colors">
                    <h4 className="flex items-center gap-2 text-indigo-300 font-bold mb-3"><Activity size={16}/> Parametric</h4>
                    <p className="text-xs text-slate-400 mb-3">Plot curves dependent on a shared time variable `t`. Returns `x(t), y(t)`.</p>
                    <div className="bg-black/50 p-3 rounded-lg border border-white/5 space-y-2 font-mono text-xs">
                      <div><span className="text-slate-500 opacity-50 block mb-1">Circle</span><span className="text-emerald-300">cos(t), sin(t)</span></div>
                      <div><span className="text-slate-500 opacity-50 block mb-1">Lissajous Curve</span><span className="text-emerald-300">sin(3*t), sin(4*t)</span></div>
                    </div>
                  </div>

                  {/* Polar */}
                  <div className="bg-black/30 rounded-xl p-4 border border-white/5 hover:border-indigo-500/30 transition-colors">
                    <h4 className="flex items-center gap-2 text-indigo-300 font-bold mb-3"><CircleDot size={16}/> Polar</h4>
                    <p className="text-xs text-slate-400 mb-3">Evaluate equations for radius `r` based on angle `t` (theta).</p>
                    <div className="bg-black/50 p-3 rounded-lg border border-white/5 space-y-2 font-mono text-xs">
                      <div><span className="text-slate-500 opacity-50 block mb-1">Archimedean Spiral</span><span className="text-emerald-300">r = 0.5 * t</span></div>
                      <div><span className="text-slate-500 opacity-50 block mb-1">Rose Curve</span><span className="text-emerald-300">r = sin(4 * t)</span></div>
                    </div>
                  </div>

                  {/* 3D Surface */}
                  <div className="bg-black/30 rounded-xl p-4 border border-white/5 hover:border-indigo-500/30 transition-colors">
                    <h4 className="flex items-center gap-2 text-indigo-300 font-bold mb-3"><Box size={16}/> Surface 3D</h4>
                    <p className="text-xs text-slate-400 mb-3">Map height `z` against spatial coordinates `x` and `y`.</p>
                    <div className="bg-black/50 p-3 rounded-lg border border-white/5 space-y-2 font-mono text-xs">
                      <div><span className="text-slate-500 opacity-50 block mb-1">Ripple</span><span className="text-emerald-300">z = sin(sqrt(x^2 + y^2))</span></div>
                      <div><span className="text-slate-500 opacity-50 block mb-1">Saddle</span><span className="text-emerald-300">z = x^2 - y^2</span></div>
                    </div>
                  </div>

                  {/* Vector Field */}
                  <div className="bg-black/30 rounded-xl p-4 border border-white/5 hover:border-indigo-500/30 transition-colors">
                    <h4 className="flex items-center gap-2 text-indigo-300 font-bold mb-3"><Wind size={16}/> Vector Field 2D</h4>
                    <p className="text-xs text-slate-400 mb-3">Plot vector magnitudes. Provide `u, v` (x and y velocities).</p>
                    <div className="bg-black/50 p-3 rounded-lg border border-white/5 space-y-2 font-mono text-xs">
                      <div><span className="text-slate-500 opacity-50 block mb-1">Rotational Field</span><span className="text-emerald-300">-y, x</span></div>
                      <div><span className="text-slate-500 opacity-50 block mb-1">Gradient Field</span><span className="text-emerald-300">2*x, 2*y</span></div>
                    </div>
                  </div>

                  {/* Matrix */}
                  <div className="bg-black/30 rounded-xl p-4 border border-white/5 hover:border-indigo-500/30 transition-colors">
                    <h4 className="flex items-center gap-2 text-indigo-300 font-bold mb-3"><Hash size={16}/> Linear Algebra</h4>
                    <p className="text-xs text-slate-400 mb-3">Use standard array brackets `[row1; row2]` for operations.</p>
                    <div className="bg-black/50 p-3 rounded-lg border border-white/5 space-y-2 font-mono text-xs">
                      <div><span className="text-slate-500 opacity-50 block mb-1">Definition</span><span className="text-emerald-300">A = [1, 2; 3, 4]</span></div>
                      <div><span className="text-slate-500 opacity-50 block mb-1">Operations</span><span className="text-emerald-300">det(A)  |  inv(A)  |  A * B</span></div>
                    </div>
                  </div>

                  {/* Telemetry */}
                  <div className="bg-black/30 rounded-xl p-4 border border-white/5 hover:border-indigo-500/30 transition-colors">
                    <h4 className="flex items-center gap-2 text-indigo-300 font-bold mb-3"><LineChart size={16}/> DSP & Telemetry</h4>
                    <p className="text-xs text-slate-400 mb-3">Upload CSV files to analyze real-world datasets.</p>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
                      <li>Auto-detects axes based on CSV columns.</li>
                      <li>Compute <strong>FFT Spectrums</strong> to find frequency domain signatures.</li>
                      <li>Generate <strong>Linear Regression</strong> overlays (R² values).</li>
                    </ul>
                  </div>

                  {/* Control Systems */}
                  <div className="bg-black/30 rounded-xl p-4 border border-white/5 hover:border-indigo-500/30 transition-colors">
                    <h4 className="flex items-center gap-2 text-indigo-300 font-bold mb-3"><Sliders size={16}/> Control Systems</h4>
                    <p className="text-xs text-slate-400 mb-3">Plot Bode Diagrams (Magnitude & Phase) for Transfer Functions using `s`.</p>
                    <div className="bg-black/50 p-3 rounded-lg border border-white/5 space-y-2 font-mono text-xs">
                      <div><span className="text-slate-500 opacity-50 block mb-1">Low Pass</span><span className="text-emerald-300">10 / (s + 5)</span></div>
                      <div><span className="text-slate-500 opacity-50 block mb-1">Second Order</span><span className="text-emerald-300">100 / (s^2 + 10*s + 100)</span></div>
                    </div>
                  </div>

                  {/* Kinematics */}
                  <div className="bg-black/30 rounded-xl p-4 border border-white/5 hover:border-blue-500/30 transition-colors">
                    <h4 className="flex items-center gap-2 text-blue-300 font-bold mb-3"><Bot size={16}/> Robotics Kinematics</h4>
                    <p className="text-xs text-slate-400 mb-3">Use built-in functions for calculating DH transformations and Inverse Kinematics.</p>
                    <div className="bg-black/50 p-3 rounded-lg border border-white/5 space-y-2 font-mono text-xs">
                      <div><span className="text-slate-500 opacity-50 block mb-1">DH Matrix</span><span className="text-emerald-300">dh(theta, d, a, alpha)</span></div>
                      <div><span className="text-slate-500 opacity-50 block mb-1">2D IK [th1, th2]</span><span className="text-emerald-300">ik2(x, y, L1, L2)</span></div>
                    </div>
                  </div>

                  {/* Power Dynamics */}
                  <div className="bg-black/30 rounded-xl p-4 border border-white/5 hover:border-amber-500/30 transition-colors">
                    <h4 className="flex items-center gap-2 text-amber-300 font-bold mb-3"><Zap size={16}/> Power Dynamics</h4>
                    <p className="text-xs text-slate-400 mb-3">Calculate electrical, mechanical, and kinetic energy properties.</p>
                    <div className="bg-black/50 p-3 rounded-lg border border-white/5 space-y-2 font-mono text-xs">
                      <div><span className="text-slate-500 opacity-50 block mb-1">3-Phase Power</span><span className="text-emerald-300">elec_3phase(v, i, pf)</span></div>
                      <div><span className="text-slate-500 opacity-50 block mb-1">Mech Power (W)</span><span className="text-emerald-300">mech_power(torque, rpm)</span></div>
                    </div>
                  </div>

                  {/* Fluid Power */}
                  <div className="bg-black/30 rounded-xl p-4 border border-white/5 hover:border-emerald-500/30 transition-colors">
                    <h4 className="flex items-center gap-2 text-emerald-300 font-bold mb-3"><Droplets size={16}/> Fluid Power</h4>
                    <p className="text-xs text-slate-400 mb-3">Calculate pneumatic/hydraulic forces, power, and velocities.</p>
                    <div className="bg-black/50 p-3 rounded-lg border border-white/5 space-y-2 font-mono text-xs">
                      <div><span className="text-slate-500 opacity-50 block mb-1">Fluid Power (kW)</span><span className="text-emerald-300">fluid_power(bar, L_min)</span></div>
                      <div><span className="text-slate-500 opacity-50 block mb-1">Force (N)</span><span className="text-emerald-300">cylinder_force(bar, d_mm)</span></div>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
