import { useRef, useEffect, useState } from 'react';
import { useCircuit } from '../analog-proto/hooks/useCircuit';
import { useSimulation } from '../analog-proto/hooks/useSimulation';
import Toolbar from '../analog-proto/components/Toolbar';
import Sidebar from '../analog-proto/components/Sidebar';
import SchematicCanvas, { SchematicCanvasRef } from '../analog-proto/components/SchematicCanvas';
import BOMView from '../analog-proto/components/BOMView';
import LayoutView from '../analog-proto/components/LayoutView';
import LadderView from '../analog-proto/components/LadderView';
import LogicView from '../analog-proto/components/LogicView';
import MatrixStatus from '../analog-proto/components/MatrixStatus';
import { SidebarTab } from '../analog-proto/types';
import { audioEngine } from '../analog-proto/services/audioEngine';
import { jsPDF } from 'jspdf';
import { Cpu, Share2, Save, Menu, X, ChevronDown, FileText, Activity, Shield, Box, Zap, Globe, Github, Facebook, MessageSquare, Twitter, GitBranch, Braces, ChevronLeft, Play, StopCircle, PanelRight, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { AnalogProject } from '@/lib/analog-types';
import type { Circuit } from '@/lib/types';
import { useHardwareBus } from '@/lib/hardware-bus';
import { EcosystemTranslator } from '@/lib/EcosystemTranslator';

type View = 'DESIGN' | 'SIMULATION' | 'BOM' | 'LAYOUT' | 'LADDER' | 'LOGIC';

interface Props {
  project: AnalogProject;
  onProjectChange: (p: AnalogProject) => void;
  onBack: () => void;
  onBridgeToDigital?: (circuit: Circuit) => void;
  onNavigate?: (mode: string) => void;
}

export default function AnalogEditor({ project, onProjectChange, onBack, onBridgeToDigital, onNavigate }: Props) {
  const [view, setView] = useState<View>('DESIGN');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const stageRef = useRef<any>(null);
  const canvasRef = useRef<SchematicCanvasRef>(null);

  const activeSheet = project.sheets.find(s => s.id === project.activeSheetId) ?? project.sheets[0];
  const initialDesign = activeSheet.design;

  const {
    design,
    setDesign,
    addComponent,
    updateComponent,
    removeComponent,
    addConnection,
    removeConnection,
    clearDesign,
    undo,
    redo,
    canUndo,
    canRedo,
    routeDesign
  } = useCircuit(initialDesign);

  // Sync design changes up to project
  useEffect(() => {
    const newSheet = { ...activeSheet, design };
    const newProject = {
      ...project,
      sheets: project.sheets.map(s => s.id === activeSheet.id ? newSheet : s)
    };
    onProjectChange(newProject);
  }, [design]);

  const {
    isSimulating,
    toggleSimulation,
    errors,
    logs,
    activeComponentIds,
    activeConnectionIds,
    simulationStates
  } = useSimulation(design);

  const hardwareBus = useHardwareBus();

  // Bridge out to PLC hardware bus
  useEffect(() => {
    if (!isSimulating) return;
    
    // Convert active analog states to hardware-bus analog inputs
    const out: Record<string, number> = {};
    for (const [id, state] of Object.entries(simulationStates || {})) {
       out[id] = (state as any).voltage ?? 0;
    }
    hardwareBus.setAnalogOutputs(out);
  }, [simulationStates, isSimulating]);

  // Sync Audio with Simulation
  useEffect(() => {
    if (!isSimulating) {
      audioEngine.stopAll();
      return;
    }

    design.components.forEach(comp => {
      if (comp.type === 'BUZZER' || comp.type === 'SPEAKER') {
        const isActive = activeComponentIds.has(comp.id);
        if (isActive) {
          audioEngine.playBuzzer(comp.id, comp.type === 'BUZZER' ? 2000 : 440);
        } else {
          audioEngine.stopBuzzer(comp.id);
        }
      }
    });

    return () => audioEngine.stopAll();
  }, [isSimulating, activeComponentIds, design.components]);

  const [tool, setTool] = useState<'SELECT' | 'WIRE' | 'DELETE'>('SELECT');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SidebarTab>('LIBRARY');
  const [isFFTEnabled, setIsFFTEnabled] = useState(false);
  const [tick, setTick] = useState(0);

  const scopeHistory = useRef<{ch1: number[], ch2: number[]}>({ ch1: Array(100).fill(0), ch2: Array(100).fill(0) });
  const simStatesRef = useRef(simulationStates);
  
  useEffect(() => {
    simStatesRef.current = simulationStates;
  }, [simulationStates]);

  useEffect(() => {
    if (!isSimulating) return;
    let animId: number;
    let lastTime = performance.now();
    
    const animate = (time: number) => {
      // Run updates roughly 60fps
      if (time - lastTime >= 16) {
        lastTime = time;
        setTick(t => t + 1);
        
        // Update scope history
        const scope = design.components.find(c => c.type === 'OSCILLOSCOPE');
        if (scope) {
          const state = simStatesRef.current?.[scope.id];
          // Simple noise to make it look alive when 0
          const noise1 = (Math.random() - 0.5) * 0.2;
          const noise2 = (Math.random() - 0.5) * 0.2;
          const v1 = (state?.trace1 ?? 0) + noise1;
          const v2 = (state?.trace2 ?? 0) + noise2;
          scopeHistory.current.ch1.push(v1);
          scopeHistory.current.ch1.shift();
          scopeHistory.current.ch2.push(v2);
          scopeHistory.current.ch2.shift();
        }
      }
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isSimulating, design.components]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Spacebar toggles simulation globally
      if (e.code === 'Space') {
        const target = e.target as HTMLElement | null;
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable) return;
        e.preventDefault();
        toggleSimulation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSimulation]);

  // Automatically switch to the Engine (SOLVER) tab when simulation starts
  useEffect(() => {
    if (isSimulating) {
      setActiveTab('SOLVER');
    }
  }, [isSimulating]);

  const handleExport = () => {
    if (stageRef.current) {
      const dataURL = stageRef.current.toDataURL();
      const link = document.createElement('a');
      link.download = `Matrix_${project.name}_Snapshot.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePDFExport = () => {
    try {
      if (!stageRef.current) return;
      
      const stage = stageRef.current;
      const imgData = stage.toDataURL({ 
        pixelRatio: 2.0,
        mimeType: 'image/jpeg',
        quality: 1.0
      });
      
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      doc.setFillColor(2, 6, 23); // Slate 950
      doc.rect(0, 0, 297, 210, 'F');
      
      doc.setDrawColor(99, 102, 241); // Indigo 500
      doc.setLineWidth(0.5);
      doc.rect(5, 5, 287, 200, 'S');

      doc.addImage(imgData, 'JPEG', 10, 10, 277, 150);

      doc.setDrawColor(30, 41, 59);
      doc.line(5, 165, 292, 165);
      doc.line(180, 165, 180, 205);

      doc.setTextColor(248, 250, 252);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text(project.name.toUpperCase(), 12, 182);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`ARCHITECT: SIYABONGA B PHAKATHI`, 12, 190);
      doc.text(`CORP: VOICE & EYE OF BHAMBATHA INC.`, 12, 194);
      doc.text(`TIMESTAMP: ${new Date().toISOString()}`, 12, 198);

      doc.setFont('courier', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(99, 102, 241);
      doc.text(`MATRIX_STATUS: ${errors.length === 0 ? 'NOMINAL' : 'CONFLICT_DETECTED'}`, 185, 175);
      doc.text(`NET_COUNT: ${design.connections.length.toString().padStart(4, '0')}`, 185, 180);
      doc.text(`NODE_COUNT: ${design.components.length.toString().padStart(4, '0')}`, 185, 185);
      doc.text(`VERSION: MATRIX-ENGINE-V4.2.0`, 185, 195);
      doc.text(`SECURITY: ENCRYPTED-VOICE-EYE-IO`, 185, 200);

      doc.save(`${project.name.replace(/\s+/g, '_')}_DATA_CORE.pdf`);
    } catch (err) {
      console.error("PDF Export failed:", err);
    }
  };

  const handleDownloadBOMCsv = () => {
    const headers = ['Designator', 'Type', 'Properties', 'Value'];
    const rows = design.components.map(comp => {
      let value = comp.value || '-';
      if (!comp.value) {
        const props = comp.properties;
        if (props.resistance) value = `${props.resistance}${props.unit || 'Ω'}`;
        else if (props.capacitance) value = `${props.capacitance}${props.unit || 'F'}`;
        else if (props.inductance) value = `${props.inductance}${props.unit || 'H'}`;
        else if (props.voltage) value = `${props.voltage}${props.unit || 'V'}`;
        else if (props.model) value = props.model as string;
      }
      
      return [
        comp.label,
        comp.type,
        Object.entries(comp.properties).map(([k, v]) => `${k}:${v}`).join(';'),
        value
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name}_BOM_CORE.csv`;
    link.click();
  };

  const handleCompileDesign = (newDesign: any) => {
    setDesign(newDesign);
    setView('DESIGN');
  };

  return (
    <div className="flex flex-col flex-1 w-full h-full bg-slate-950 text-slate-300 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Cinematic Header */}
      <header className="h-16 border-b border-white/5 flex items-center px-4 sm:px-8 justify-between bg-slate-900/40 backdrop-blur-3xl z-30 shadow-2xl relative shrink-0">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-30" />
        
        <div className="flex items-center gap-4 sm:gap-12 w-full overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 group shrink-0">
            <button 
              onClick={onBack}
              className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={16} className="text-slate-400" />
            </button>
            <div className="flex items-center justify-center w-8 h-8 bg-indigo-500/20 border border-indigo-500/30 rounded shadow-inner" aria-label={`Analog Lab: ${project.name}`} title={`Analog Lab: ${project.name}`}>
              <Activity size={18} className="text-indigo-400" />
            </div>
          </div>

          <nav className="flex items-center gap-2 overflow-x-auto scrollbar-hide shrink-0 min-w-0">
            {(['DESIGN', 'SIMULATION', 'BOM', 'LAYOUT', 'LADDER', 'LOGIC'] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest sm:tracking-[0.25em] transition-all relative overflow-hidden group whitespace-nowrap ${
                  view === v ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {view === v && (
                   <motion.div 
                    layoutId="nav-glow" 
                    className="absolute inset-0 bg-indigo-600/10 border border-indigo-500/30 rounded-lg shadow-inner" 
                   />
                )}
                <span className="relative z-10">{v}</span>
              </button>
            ))}
          </nav>

          <div className="hidden xl:flex items-center gap-4 bg-slate-950/80 px-5 py-2 rounded-2xl border border-white/5 shadow-inner shrink-0 ml-auto">
             <Shield size={14} className="text-indigo-400" />
             <div className="h-4 w-px bg-slate-800" />
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Security: <span className="text-indigo-400 font-bold">ACTIVE</span></span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
             <button
                onClick={toggleSimulation}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95 border ${
                  isSimulating 
                    ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-600/30 shadow-emerald-500/20' 
                    : 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40 hover:bg-indigo-600/30 shadow-indigo-500/20'
                }`}
                title={isSimulating ? "Stop Simulation (Space)" : "Run Simulation (Space)"}
              >
                {isSimulating ? <StopCircle size={16} /> : <Play size={16} />}
                <span className="hidden sm:inline">{isSimulating ? 'Stop' : 'Run'}</span>
              </button>

            <button 
              onClick={() => {
                const circuit = EcosystemTranslator.analogToDigital(design);
                if (onBridgeToDigital) onBridgeToDigital(circuit);
                if (onNavigate) onNavigate('digital');
              }}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 rounded-xl transition-all border border-cyan-500/30 active:scale-95 group"
              title="Send to Digital Logic Lab"
            >
              <Cpu size={16} className="group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={() => {
                 const plcProject = EcosystemTranslator.toPLCLadder(design);
                 localStorage.setItem('ascads_bridge_analog_plc', JSON.stringify(plcProject));
                 if (onNavigate) onNavigate('plc');
              }}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-fuchsia-600/20 hover:bg-fuchsia-600/40 text-fuchsia-400 rounded-xl transition-all border border-fuchsia-500/30 active:scale-95 group"
              title="Send to Industrial PLC"
            >
              <Share2 size={16} className="group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={() => {
                 // Trigger PCB Lab bridging
                 localStorage.setItem('ascads_bridge_analog_pcb', JSON.stringify(design));
                 if (onNavigate) onNavigate('pcb');
              }}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-teal-600/20 hover:bg-teal-600/40 text-teal-400 rounded-xl transition-all border border-teal-500/30 active:scale-95 group"
              title="Send to PCB Lab"
            >
              <Map size={16} className="group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={handlePDFExport}
              className="hidden sm:flex w-8 h-8 sm:w-10 sm:h-10 items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700 active:scale-95 group"
              title="Export Schematic PDF"
            >
              <FileText size={16} className="group-hover:-translate-y-0.5 transition-transform" />
            </button>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`hidden sm:flex w-8 h-8 sm:w-10 sm:h-10 items-center justify-center rounded-xl transition-all border active:scale-95 group ${isSidebarOpen ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40 hover:bg-indigo-600/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'}`}
              title="Toggle Properties Panel"
            >
              <PanelRight size={16} className="group-hover:scale-110 transition-transform" />
            </button>
            
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="hidden w-8 h-8 items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700 active:scale-95"
            >
              {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 right-0 bg-slate-900 border-b border-slate-800 shadow-2xl z-40 p-2 flex flex-col gap-1 max-h-[50vh] overflow-y-auto">
          {(['DESIGN', 'SIMULATION', 'BOM', 'LAYOUT', 'LADDER', 'LOGIC'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => { setView(v); setIsMobileMenuOpen(false); }}
              className={`px-4 py-2 text-xs font-black uppercase tracking-widest transition-all rounded-md text-left ${
                view === v ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {v}
            </button>
          ))}
          <button
             onClick={() => { setIsSidebarOpen(!isSidebarOpen); setIsMobileMenuOpen(false); }}
             className="px-4 py-2 text-xs font-black uppercase tracking-widest transition-all rounded-md text-left text-slate-400 hover:text-slate-200 hover:bg-slate-800 flex items-center justify-between xl:hidden"
          >
             Toggle Component Sidebar
             <Box size={14} />
          </button>
          
          <div className="w-full h-px bg-slate-800 my-1" />
          
          <button
             onClick={toggleSimulation}
             className="px-4 py-2 text-xs font-black uppercase tracking-widest transition-all rounded-md text-left flex items-center justify-between text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/30"
          >
             {isSimulating ? 'Stop Simulation' : 'Run Simulation'}
             {isSimulating ? <StopCircle size={14} /> : <Play size={14} />}
          </button>
          <button
             onClick={() => {
                const circuit = EcosystemTranslator.analogToDigital(design);
                if (onBridgeToDigital) onBridgeToDigital(circuit);
                setIsMobileMenuOpen(false);
             }}
             className="px-4 py-2 text-xs font-black uppercase tracking-widest transition-all rounded-md text-left flex items-center justify-between text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/30"
          >
             Send to Digital
             <Cpu size={14} />
          </button>
          <button
             onClick={() => {
                 const plcProject = EcosystemTranslator.toPLCLadder(design);
                 localStorage.setItem('ascads_bridge_analog_plc', JSON.stringify(plcProject));
                 setIsMobileMenuOpen(false);
             }}
             className="px-4 py-2 text-xs font-black uppercase tracking-widest transition-all rounded-md text-left flex items-center justify-between text-fuchsia-400 hover:text-fuchsia-300 hover:bg-fuchsia-900/30"
          >
             Send to PLC
             <Share2 size={14} />
          </button>
          <button
             onClick={() => { handlePDFExport(); setIsMobileMenuOpen(false); }}
             className="px-4 py-2 text-xs font-black uppercase tracking-widest transition-all rounded-md text-left flex items-center justify-between text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
             Export PDF
             <FileText size={14} />
          </button>
        </div>
      )}

      {/* Main UI Container */}
      <div className="flex flex-row flex-1 overflow-hidden relative min-h-0 bg-slate-950">
        <AnimatePresence mode="wait">
          {view === 'DESIGN' || view === 'SIMULATION' ? (
            <motion.div 
               key="design-view"
               initial={{ opacity: 0, x: -100 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 100 }}
               className="flex flex-row flex-1 overflow-hidden h-full min-h-0 w-full"
            >
              <Toolbar 
                tool={tool} 
                setTool={setTool} 
                onClear={clearDesign}
                onExport={handleExport}
                onUndo={undo}
                onRedo={redo}
                onRoute={routeDesign}
                canUndo={canUndo}
                canRedo={canRedo}
                onZoomIn={() => canvasRef.current?.zoomIn()}
                onZoomOut={() => canvasRef.current?.zoomOut()}
                onZoomFit={() => canvasRef.current?.zoomFit()}
                onToggleProperties={() => setIsSidebarOpen(!isSidebarOpen)}
              />
              
              <main className="flex-1 flex flex-col relative group min-w-0">
                {view === 'SIMULATION' && (
                  <div className="absolute inset-x-0 top-0 z-10 pointer-events-none">
                     <div className="absolute top-4 sm:top-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
                        <motion.div 
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="px-4 sm:px-6 py-2 bg-indigo-600/20 border border-indigo-500/40 rounded-full backdrop-blur-xl flex items-center gap-4 shadow-2xl ring-1 ring-white/10"
                        >
                           <Zap size={14} className="text-emerald-400 animate-pulse" />
                           <span className="text-[8px] sm:text-[10px] font-black text-white uppercase tracking-[.4em] whitespace-nowrap">Siyabonga Engine: High Fidelity Solver</span>
                           <Activity size={14} className="text-indigo-400" />
                        </motion.div>
                     </div>
                  </div>
                )}

                <div className="flex-1 relative min-h-0 h-full flex flex-col">
                   <SchematicCanvas 
                     ref={canvasRef}
                     design={design}
                     selectedTool={tool}
                     selectedComponentId={selectedId}
                     onSelectComponent={setSelectedId}
                     onUpdateComponent={updateComponent}
                     onRemoveComponent={removeComponent}
                     onAddConnection={addConnection}
                     onRemoveConnection={removeConnection}
                     onOpenProperties={() => setIsSidebarOpen(true)}
                     undo={undo}
                     redo={redo}
                     stageRef={stageRef}
                     isSimulating={isSimulating || view === 'SIMULATION'}
                     activeComponentIds={activeComponentIds}
                     activeConnectionIds={activeConnectionIds}
                     simulationStates={simulationStates}
                     tick={tick}
                     scopeHistory={scopeHistory}
                   />
                </div>

                {/* Simulation Terminal Console */}
                <AnimatePresence>
                  {isSimulating && (
                    <motion.div 
                       initial={{ y: 200 }}
                       animate={{ y: 0 }}
                       exit={{ y: 200 }}
                       className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-8 h-40 sm:h-48 bg-slate-900/90 border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col z-20 backdrop-blur-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5"
                    >
                      <div className="px-4 py-2 bg-slate-800/50 border-b border-white/5 flex justify-between items-center shrink-0">
                         <div className="flex items-center gap-4">
                            <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest hidden sm:inline">Logic Terminal: SOLVER_0x7F</span>
                            <div className="h-3 w-px bg-slate-700 hidden sm:block" />
                            <button 
                              onClick={() => setIsFFTEnabled(!isFFTEnabled)}
                              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-[8px] sm:text-[9px] font-black uppercase transition-all ${
                                isFFTEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                               <Activity size={10} />
                               {isFFTEnabled ? 'SPECTRAL_FFT' : 'SIGNAL_WAVE'}
                            </button>
                         </div>
                         <div className="flex gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/20" />
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20" />
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20" />
                         </div>
                      </div>
                      <div className="flex-1 flex overflow-hidden min-h-0">
                        <div className="flex-1 p-4 font-mono text-[9px] sm:text-[10px] text-indigo-400/80 overflow-y-auto space-y-1 bg-black/40 scrollbar-hide">
                           {logs.map((log, i) => (
                              <div key={i} className="flex gap-2 sm:gap-4">
                                 <span className="text-slate-700 shrink-0">[{i.toString().padStart(3, '0')}]</span>
                                 <span className={log.includes('[ERR]') ? 'text-rose-400' : log.includes('[WARN]') ? 'text-amber-400' : ''}>{log}</span>
                              </div>
                           ))}
                           <div className="animate-pulse text-indigo-500">_</div>
                        </div>
                        {design.components.some(c => c.type === 'OSCILLOSCOPE') && (
                          <div className="w-32 sm:w-96 border-l border-white/5 p-2 sm:p-4 flex flex-col gap-4 bg-slate-900/50 hidden md:flex">
                             <div className="flex-1 border border-indigo-500/30 rounded-2xl bg-black overflow-hidden relative shadow-inner min-h-0">
                                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 text-[7px] sm:text-[8px] font-black text-indigo-400 uppercase tracking-widest z-10 opacity-50">Scope Trace CH1 & CH2</div>
                                <svg width="100%" height="100%" viewBox="0 0 400 100" preserveAspectRatio="none">
                                   <motion.path
                                     d={`M ${scopeHistory.current.ch1.map((v, i) => `${i * 4} ${80 - v * 10}`).join(' L ')}`}
                                     fill="none"
                                     stroke="#4ade80"
                                     strokeWidth="2"
                                   />
                                   <motion.path
                                     d={`M ${scopeHistory.current.ch2.map((v, i) => `${i * 4} ${80 - v * 10}`).join(' L ')}`}
                                     fill="none"
                                     stroke="#38bdf8"
                                     strokeWidth="2"
                                     opacity="0.8"
                                   />
                                </svg>
                             </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </main>

              {/* Sidebar toggle wrapper for mobile */}
              <div className={`absolute right-0 xl:relative z-40 h-full transition-transform ${isSidebarOpen ? 'translate-x-0 shadow-[-20px_0_30px_rgba(0,0,0,0.5)]' : 'translate-x-full xl:translate-x-0'} flex-shrink-0`}>
                <Sidebar 
                  onAddComponent={(type) => {
                    const x = stageRef.current ? (-stageRef.current.x() + stageRef.current.width() / 2) / stageRef.current.scaleX() : 100;
                    const y = stageRef.current ? (-stageRef.current.y() + stageRef.current.height() / 2) / stageRef.current.scaleY() : 100;
                    addComponent(type, x, y);
                    if(window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                  selectedComponentId={selectedId}
                  design={design}
                  onUpdateProperties={updateComponent}
                  isSimulating={isSimulating || view === 'SIMULATION'}
                  onToggleSimulation={toggleSimulation}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  scopeHistory={scopeHistory}
                />
              </div>
            </motion.div>
          ) : view === 'BOM' ? (
            <motion.div
              key="bom-view"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex-1 overflow-auto scrollbar-hide p-4"
            >
              <BOMView 
                design={design} 
                onDownloadCSV={handleDownloadBOMCsv}
              />
            </motion.div>
          ) : view === 'LAYOUT' ? (
            <motion.div
              key="layout-view"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -100 }}
              className="flex-1 overflow-auto scrollbar-hide p-4"
            >
              <LayoutView 
                design={design} 
                onUpdateComponent={updateComponent}
              />
            </motion.div>
          ) : view === 'LADDER' ? (
            <motion.div
              key="ladder-view"
              initial={{ opacity: 0, rotateY: 90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: -90 }}
              className="flex-1 overflow-auto scrollbar-hide p-4"
            >
              <LadderView 
                design={design} 
                onUpdateDesign={setDesign}
              />
            </motion.div>
          ) : (
             <motion.div
               key="logic-view"
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 1.2 }}
               className="flex-1 overflow-hidden p-4 flex flex-col"
             >
               <LogicView 
                 design={design} 
                 onUpdateDesign={handleCompileDesign}
               />
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Global Status HUD */}
      <MatrixStatus 
        isSimulating={isSimulating}
        errorCount={errors.length}
        componentCount={design.components.length}
        netCount={design.connections.length}
      />
      
      {/* Footer Credits */}
      <footer className="hidden lg:flex bg-slate-950 border-t border-white/5 py-1.5 px-4 sm:px-8 flex-col sm:flex-row justify-between items-center relative overflow-hidden shrink-0">
         <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
         <p className="text-[7px] sm:text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] relative z-10 flex items-center gap-4 sm:gap-8 mb-2 sm:mb-0">
           <span>ARCHITECT: SIYABONGA B PHAKATHI © 2026</span>
           <span className="text-slate-800 hidden sm:inline">•</span>
           <span className="hidden sm:inline">VOICE & EYE OF BHAMBATHA INC.</span>
         </p>
         <div className="flex items-center gap-4 sm:gap-6 relative z-10">
            <a href="#" className="text-slate-600 hover:text-white transition-colors"><Github size={12} /></a>
            <a href="#" className="text-slate-600 hover:text-white transition-colors"><Twitter size={12} /></a>
            <div className="px-2 py-0.5 sm:px-3 sm:py-1 bg-indigo-600/10 border border-indigo-500/20 rounded-full flex items-center gap-2">
               <Globe size={10} className="text-indigo-400" />
               <span className="text-[7px] sm:text-[8px] font-black text-indigo-400 tracking-tighter uppercase">Global Node Active</span>
            </div>
         </div>
      </footer>
    </div>
  );
}
