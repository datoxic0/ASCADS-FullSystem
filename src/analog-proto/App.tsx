/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useEffect, useState } from 'react';
import { useCircuit } from './hooks/useCircuit';
import { useSimulation } from './hooks/useSimulation';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import SchematicCanvas, { SchematicCanvasRef } from './components/SchematicCanvas';
import BOMView from './components/BOMView';
import LayoutView from './components/LayoutView';
import LadderView from './components/LadderView';
import LogicView from './components/LogicView';
import ProjectsView from './components/ProjectsView';
import MatrixStatus from './components/MatrixStatus';
import { useProjects } from './hooks/useProjects';
import { SidebarTab } from './types';
import { audioEngine } from './services/audioEngine';
import { jsPDF } from 'jspdf';
import { Cpu, Share2, Save, Menu, X, ChevronDown, FileText, Activity, Shield, Box, Zap, Globe, Github, Facebook, MessageSquare, Twitter, GitBranch, Braces } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type View = 'PROJECTS' | 'DESIGN' | 'SIMULATION' | 'BOM' | 'LAYOUT' | 'LADDER' | 'LOGIC';

export default function App() {
  const [view, setView] = useState<View>('PROJECTS');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Untitled Matrix');
  const stageRef = useRef<any>(null);
  const canvasRef = useRef<SchematicCanvasRef>(null);

  const {
    projects,
    saveProject,
    deleteProject
  } = useProjects();

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
  } = useCircuit();

  const {
    isSimulating,
    toggleSimulation,
    errors,
    logs,
    activeComponentIds,
    activeConnectionIds,
    simulationStates
  } = useSimulation(design);

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

  useEffect(() => {
    if (!isSimulating) return;
    let animId: number;
    const animate = () => {
      setTick(t => t + 1);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isSimulating]);

  const handleExport = () => {
    if (stageRef.current) {
      const dataURL = stageRef.current.toDataURL();
      const link = document.createElement('a');
      link.download = `Matrix_${projectName}_Snapshot.png`;
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
      doc.text(projectName.toUpperCase(), 12, 182);
      
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

      doc.save(`${projectName.replace(/\s+/g, '_')}_DATA_CORE.pdf`);
    } catch (err) {
      console.error("PDF Export failed:", err);
    }
  };

  const handleSave = () => {
    const savedId = saveProject(design, projectName, currentProjectId || undefined);
    if (!currentProjectId) setCurrentProjectId(savedId);
  };

  const handleLoadProject = (project: any) => {
    setDesign(project.design);
    setCurrentProjectId(project.id);
    setProjectName(project.name);
    setView('DESIGN');
  };

  const handleNewProject = () => {
    setDesign({ components: [], connections: [] });
    setCurrentProjectId(null);
    setProjectName(`Matrix ${Date.now().toString().slice(-4)}`);
    setView('DESIGN');
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
    link.download = `${projectName}_BOM_CORE.csv`;
    link.click();
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [design, projectName, currentProjectId]);

  const handleCompileDesign = (newDesign: any) => {
    setDesign(newDesign);
    setView('DESIGN');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-300 font-sans selection:bg-indigo-500 selection:text-white overflow-hidden border-2 border-slate-900">
      {/* Cinematic Header */}
      <header className="h-16 border-b border-white/5 flex items-center px-8 justify-between bg-slate-900/40 backdrop-blur-3xl z-30 shadow-2xl relative">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-30" />
        
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-4 group">
            <div 
              onClick={() => setView('PROJECTS')}
              className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_25px_rgba(79,70,229,0.5)] cursor-pointer hover:scale-110 active:scale-95 transition-all"
            >
               <Cpu size={22} className="text-white" />
            </div>
            <div className="flex flex-col">
              <input 
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="bg-transparent border-none text-white font-black uppercase text-base tracking-tighter focus:ring-0 w-48 sm:w-64 hover:bg-white/5 rounded px-2 -ml-2 transition-all"
                spellCheck={false}
              />
              <div className="flex items-center gap-3">
                 <span className="text-[9px] text-indigo-400 font-black uppercase tracking-[.4em] leading-none">MATRIX SUITE v4.2 PRO</span>
                 <div className="h-2 w-px bg-slate-800" />
                 <span className="text-[9px] text-emerald-500 font-bold leading-none uppercase animate-pulse">Siyabonga Engine Active</span>
              </div>
            </div>
          </div>

          <nav className="hidden xl:flex items-center gap-2 overflow-x-auto max-w-2xl scrollbar-hide">
            {(['PROJECTS', 'DESIGN', 'SIMULATION', 'BOM', 'LAYOUT', 'LADDER', 'LOGIC'] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.25em] transition-all relative overflow-hidden group whitespace-nowrap ${
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
        </div>
        
        <div className="flex items-center gap-6 shrink-0">
          <div className="hidden lg:flex items-center gap-4 bg-slate-950/80 px-5 py-2 rounded-2xl border border-white/5 shadow-inner">
             <Shield size={14} className="text-indigo-400" />
             <div className="h-4 w-px bg-slate-800" />
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest shrink-0 max-w-[120px] truncate">Security: <span className="text-indigo-400 font-bold">ACTIVE</span></span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleSave}
              className="px-4 sm:px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_10px_30px_rgba(79,70,229,0.3)] flex items-center gap-3 active:scale-95 group shrink-0"
            >
              <Save size={16} className="group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline">Commit</span>
            </button>
            <button 
              onClick={handlePDFExport}
              className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700 active:scale-95 group shrink-0"
              title="Export Schematic PDF"
            >
              <FileText size={18} className="group-hover:-translate-y-0.5 transition-transform" />
            </button>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-800 to-indigo-900 border border-white/10 flex items-center justify-center text-[12px] font-black text-white shadow-2xl ring-4 ring-indigo-600/10 shrink-0">
               SP
            </div>
          </div>
        </div>
      </header>

      {/* Main UI Container */}
      <div className="flex flex-1 overflow-hidden relative min-h-0">
        <AnimatePresence mode="wait">
          {view === 'PROJECTS' ? (
             <motion.div
               key="projects-view"
               initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
               animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
               exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
               className="flex-1 overflow-auto scrollbar-hide"
             >
               <ProjectsView 
                 projects={projects}
                 onLoad={handleLoadProject}
                 onDelete={deleteProject}
                 onNew={handleNewProject}
               />
             </motion.div>
          ) : view === 'DESIGN' || view === 'SIMULATION' ? (
            <motion.div 
               key="design-view"
               initial={{ opacity: 0, x: -100 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 100 }}
               className="flex flex-1 overflow-hidden h-full min-h-0"
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
              />
              
              <main className="flex-1 flex flex-col relative group min-w-0">
                {view === 'SIMULATION' && (
                  <div className="absolute inset-x-0 top-0 z-10 pointer-events-none">
                     <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
                        <motion.div 
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="px-6 py-2 bg-indigo-600/20 border border-indigo-500/40 rounded-full backdrop-blur-xl flex items-center gap-4 shadow-2xl ring-1 ring-white/10"
                        >
                           <Zap size={14} className="text-emerald-400 animate-pulse" />
                           <span className="text-[10px] font-black text-white uppercase tracking-[.4em] whitespace-nowrap">Siyabonga Engine: High Fidelity Solver</span>
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
                     undo={undo}
                     redo={redo}
                     stageRef={stageRef}
                     isSimulating={isSimulating || view === 'SIMULATION'}
                     activeComponentIds={activeComponentIds}
                     activeConnectionIds={activeConnectionIds}
                     simulationStates={simulationStates}
                     tick={tick}
                   />
                </div>

                {/* Simulation Terminal Console */}
                <AnimatePresence>
                  {isSimulating && (
                    <motion.div 
                       initial={{ y: 200 }}
                       animate={{ y: 0 }}
                       exit={{ y: 200 }}
                       className="absolute bottom-8 left-8 right-8 h-48 bg-slate-900/90 border border-white/10 rounded-3xl overflow-hidden flex flex-col z-20 backdrop-blur-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5"
                    >
                      <div className="px-6 py-2 bg-slate-800/50 border-b border-white/5 flex justify-between items-center shrink-0">
                         <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest hidden sm:inline">Logic Terminal: SOLVER_0x7F</span>
                            <div className="h-3 w-px bg-slate-700 hidden sm:block" />
                            <button 
                              onClick={() => setIsFFTEnabled(!isFFTEnabled)}
                              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${
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
                        <div className="flex-1 p-4 font-mono text-[10px] text-indigo-400/80 overflow-y-auto space-y-1 bg-black/40 scrollbar-hide">
                           {logs.map((log, i) => (
                              <div key={i} className="flex gap-4">
                                 <span className="text-slate-700 shrink-0">[{i.toString().padStart(3, '0')}]</span>
                                 <span className={log.includes('[ERR]') ? 'text-rose-400' : log.includes('[WARN]') ? 'text-amber-400' : ''}>{log}</span>
                              </div>
                           ))}
                           <div className="animate-pulse text-indigo-500">_</div>
                        </div>
                        {design.components.some(c => c.type === 'OSCILLOSCOPE') && (
                          <div className="w-48 sm:w-96 border-l border-white/5 p-4 flex flex-col gap-4 bg-slate-900/50">
                             <div className="flex-1 border border-indigo-500/30 rounded-2xl bg-black overflow-hidden relative shadow-inner min-h-0">
                                <div className="absolute top-3 left-3 text-[8px] font-black text-indigo-400 uppercase tracking-widest z-10 opacity-50">Scope Trace</div>
                                <svg width="100%" height="100%" viewBox="0 0 400 100" preserveAspectRatio="none">
                                   <motion.path
                                     d={`M ${Array.from({ length: 41 }).map((_, i) => `${i * 10} ${50 + Math.sin((i * 10 + tick * 5) * 0.05) * 35}`).join(' L ')}`}
                                     fill="none"
                                     stroke="#10b981"
                                     strokeWidth="2"
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

              <Sidebar 
                onAddComponent={(type) => {
                  const x = stageRef.current ? (-stageRef.current.x() + stageRef.current.width() / 2) / stageRef.current.scaleX() : 100;
                  const y = stageRef.current ? (-stageRef.current.y() + stageRef.current.height() / 2) / stageRef.current.scaleY() : 100;
                  addComponent(type, x, y);
                  setActiveTab('PROPERTIES');
                }}
                selectedComponentId={selectedId}
                design={design}
                onUpdateProperties={updateComponent}
                isSimulating={isSimulating || view === 'SIMULATION'}
                onToggleSimulation={toggleSimulation}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            </motion.div>
          ) : view === 'BOM' ? (
            <motion.div
              key="bom-view"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex-1 overflow-auto scrollbar-hide"
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
              className="flex-1 overflow-auto scrollbar-hide"
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
              className="flex-1 overflow-auto scrollbar-hide"
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
               className="flex-1 overflow-auto scrollbar-hide"
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
      <footer className="bg-slate-950 border-t border-white/5 py-1.5 px-8 flex justify-between items-center relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
         <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] relative z-10 flex items-center gap-8">
           <span>ARCHITECT: SIYABONGA B PHAKATHI © 2026</span>
           <span className="text-slate-800">•</span>
           <span>VOICE & EYE OF BHAMBATHA INC.</span>
         </p>
         <div className="flex items-center gap-6 relative z-10">
            <a href="https://www.github.com/datoxic0" target="_blank" className="text-slate-600 hover:text-white transition-colors"><Github size={12} /></a>
            <a href="https://x.com/Siya_B_Phakathi" target="_blank" className="text-slate-600 hover:text-white transition-colors"><Twitter size={12} /></a>
            <a href="https://www.facebook.com/C.Datoxic.P" target="_blank" className="text-slate-600 hover:text-white transition-colors"><Facebook size={12} /></a>
            <a href="https://discord.com/channels/datoxic0" target="_blank" className="text-slate-600 hover:text-white transition-colors"><MessageSquare size={12} /></a>
            <div className="px-3 py-1 bg-indigo-600/10 border border-indigo-500/20 rounded-full flex items-center gap-2">
               <Globe size={10} className="text-indigo-400" />
               <span className="text-[8px] font-black text-indigo-400 tracking-tighter uppercase">Global Node Active</span>
            </div>
         </div>
      </footer>
    </div>
  );
}
