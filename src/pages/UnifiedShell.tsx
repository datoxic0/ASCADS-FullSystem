import { useState, useEffect, useRef } from 'react';
import { Cpu, ChevronRight, Sun, Moon, Activity, Sparkles } from 'lucide-react';
import Editor from '@/pages/Editor';
import AnalogEditor from '@/pages/AnalogEditor';
import ProjectsView from '@/components/ProjectsView';
import ComputeTools from '@/pages/ComputeTools';
import PLCPage from '@/pages/PLCPage';
import RobotPage from '@/components/robot/RobotPage';
import MathsTools from '@/pages/MathsTools';
import EngigraphPage from '@/pages/EngigraphPage';
import DocsPage from '@/pages/DocsPage';
import AIAssistant from '@/components/AIAssistant';
import type { Circuit } from '@/lib/types';
import {
  loadProjects,
  saveProjects,
  createProject,
  upsertProject,
  deleteProject,
  setActiveProject,
} from '@/lib/analog-storage';
import type { AnalogProject } from '@/lib/analog-types';

type TopMode = 'projects' | 'analog' | 'digital' | 'compute' | 'plc' | 'robot' | 'maths' | 'engigraph' | 'docs';

const BRIDGE_KEYS = [
  { key: 'ascads_bridge_analog_plc',   label: 'A→P', color: '#a78bfa', title: 'Analog→PLC' },
  { key: 'ascads_bridge_plc_digital',  label: 'P→D', color: '#38bdf8', title: 'PLC→Digital' },
  { key: 'ascads_bridge_robot_plc',    label: 'R→P', color: '#34d399', title: 'Robot→PLC' },
  { key: 'ascads_bridge_digital_plc',  label: 'D→P', color: '#f59e0b', title: 'Digital→PLC' },
  { key: 'ascads_bridge_engigraph_analog', label: 'E→A', color: '#fb923c', title: 'Engigraph→Analog' },
  { key: 'ascads_bridge_engigraph_plc',    label: 'E→P', color: '#f87171', title: 'Engigraph→PLC' },
];

function useBridgeStatus() {
  const [status, setStatus] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const check = () => {
      const s: Record<string, boolean> = {};
      BRIDGE_KEYS.forEach(b => { s[b.key] = !!localStorage.getItem(b.key); });
      setStatus(s);
    };
    check();
    const iv = setInterval(check, 2500);
    return () => clearInterval(iv);
  }, []);
  return status;
}

export default function UnifiedShell() {
  const [mode, setMode] = useState<TopMode>('projects');
  const [projects, setProjects] = useState<AnalogProject[]>(() => loadProjects());
  const [activeProject, setActiveProjectState] = useState<AnalogProject | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const bridgeCircuitRef = useRef<Circuit | null>(null);
  const bridgeStatus = useBridgeStatus();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  const handleNewProject = (name: string) => {
    const p = createProject(name);
    const updated = upsertProject(projects, p);
    setProjects(updated);
    setActiveProjectState(p);
    setMode('analog');
    setActiveProject(p.id);
  };

  const handleOpenProject = (id: string) => {
    const p = projects.find(pr => pr.id === id);
    if (!p) return;
    setActiveProjectState(p);
    setMode('analog');
    setActiveProject(id);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => deleteProject(prev, id));
    if (activeProject?.id === id) {
      setActiveProjectState(null);
      setMode('projects');
    }
  };

  const handleProjectChange = (p: AnalogProject) => {
    setActiveProjectState(p);
    setProjects(prev => upsertProject(prev, p));
  };

  const modeLabel =
    mode === 'projects' ? 'Projects'
    : mode === 'plc'      ? 'Industrial PLC'
    : mode === 'robot'    ? 'Robot Workspace'
    : mode === 'analog'   ? `Schematic · ${activeProject?.name ?? 'Untitled'}`
    : mode === 'compute'  ? 'Compute Tools'
    : mode === 'maths'    ? 'Maths System'
    : mode === 'engigraph'? 'EngiGraph Pro'
    : mode === 'docs'     ? 'System Documentation'
    : 'Digital Logic Lab';

  const TAB_COLORS: Record<TopMode, string> = {
    projects: 'text-slate-400',
    plc:      'text-blue-400',
    robot:    'text-emerald-400',
    analog:   'text-violet-400',
    digital:  'text-cyan-400',
    compute:  'text-amber-400',
    maths:    'text-rose-400',
    engigraph:'text-orange-400',
    docs:     'text-pink-500',
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-300 overflow-hidden">
      {/* ── Global Header ── */}
      <header className="h-11 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-4 shrink-0 z-30 shadow-[0_2px_20px_rgba(0,0,0,0.5)]">
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => setMode('projects')}
        >
          <div className="w-7 h-7 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_14px_rgba(34,211,238,0.3)] group-hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[11px] font-black text-slate-100 uppercase tracking-tight">ASCADS</span>
            <span className="text-[7px] text-slate-600 uppercase tracking-[0.25em]">Advanced EDA Suite</span>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600">
          <span
            className="hover:text-slate-300 cursor-pointer transition-colors"
            onClick={() => setMode('projects')}
          >
            Home
          </span>
          {mode !== 'projects' && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span className={TAB_COLORS[mode]}>{modeLabel}</span>
            </>
          )}
        </div>

        {/* Center mode switcher */}
        <nav className="mx-auto flex items-center bg-slate-800/60 border border-slate-700/60 rounded-lg overflow-x-auto overflow-y-hidden whitespace-nowrap [&::-webkit-scrollbar]:hidden shrink min-w-0 mx-2">
          {([
            { id: 'projects', label: 'Projects',       dot: '' },
            { id: 'plc',      label: 'Industrial PLC', dot: '#3b82f6' },
            { id: 'robot',    label: 'Robotics',       dot: '#10b981' },
            { id: 'analog',   label: 'Analog',         dot: '#8b5cf6' },
            { id: 'digital',  label: 'Digital Logic',  dot: '#06b6d4' },
            { id: 'compute',  label: 'Compute Tools',  dot: '#f59e0b' },
            { id: 'maths',    label: 'Maths System',   dot: '#fb7185' },
            { id: 'engigraph',label: 'EngiGraph Pro',  dot: '#fb923c' },
            { id: 'docs',     label: 'System Docs',    dot: '#ec4899' },
          ] as { id: TopMode; label: string; dot: string }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'analog' && !activeProject) { setMode('projects'); return; }
                setMode(tab.id);
              }}
              className={`px-3.5 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                mode === tab.id
                  ? 'bg-slate-700/50 text-white'
                  : 'text-slate-600 hover:text-slate-300 hover:bg-slate-700/30'
              }`}
            >
              {tab.dot && (
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: tab.dot, boxShadow: mode === tab.id ? `0 0 6px ${tab.dot}` : 'none' }} />
              )}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Bridge bus status */}
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-slate-800/60 border border-slate-700/50 rounded-full">
            <Activity className="w-2.5 h-2.5 text-slate-600" />
            {BRIDGE_KEYS.map(b => (
              <div key={b.key} title={`${b.title}: ${bridgeStatus[b.key] ? 'data ready' : 'empty'}`}
                className="flex items-center gap-0.5">
                <div className="w-1.5 h-1.5 rounded-full transition-all duration-500"
                  style={{ background: bridgeStatus[b.key] ? b.color : '#1e293b', boxShadow: bridgeStatus[b.key] ? `0 0 4px ${b.color}` : 'none' }} />
                <span className="text-[7px] font-black uppercase" style={{ color: bridgeStatus[b.key] ? b.color : '#334155' }}>{b.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1 px-2 py-1 bg-slate-800/60 border border-slate-700/50 rounded-full text-[8px] text-slate-600">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-black uppercase tracking-widest hidden sm:block">Ready</span>
          </div>

          <button
            onClick={() => setIsAIOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1.5 bg-indigo-950/50 border border-indigo-800/50 rounded-lg text-[9px] font-black text-indigo-400 hover:bg-indigo-900/40 hover:text-indigo-300 transition-colors shadow-[0_0_10px_rgba(99,102,241,0.2)]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Ask AI</span>
          </button>

          <button
            onClick={() => setIsDark(d => !d)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-600/50 flex items-center justify-center text-[9px] font-black text-slate-200 shadow-sm">
            SP
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="flex-1 min-h-0 flex flex-col overflow-visible">
        {mode === 'projects' && (
          <ProjectsView
            projects={projects}
            onNew={handleNewProject}
            onOpen={handleOpenProject}
            onDelete={handleDeleteProject}
          />
        )}

        {mode === 'analog' && activeProject && (
          <AnalogEditor
            project={activeProject}
            onProjectChange={handleProjectChange}
            onBack={() => setMode('projects')}
            onBridgeToDigital={(c) => {
              bridgeCircuitRef.current = c;
              setMode('digital');
            }}
          />
        )}

        {mode === 'digital' && (
          <div className="h-full">
            <Editor initialCircuit={bridgeCircuitRef.current ?? undefined} />
          </div>
        )}

        {mode === 'compute' && (
          <div className="h-full">
            <ComputeTools />
          </div>
        )}

        <div className={`h-full ${mode === 'plc' ? 'block' : 'hidden'}`}>
          <PLCPage />
        </div>

        <div className={`h-full ${mode === 'robot' ? 'block' : 'hidden'}`}>
          <RobotPage />
        </div>

        {mode === 'maths' && (
          <div className="h-full">
            <MathsTools />
          </div>
        )}

        {mode === 'engigraph' && (
          <div className="h-full">
            <EngigraphPage />
          </div>
        )}

        {mode === 'docs' && (
          <div className="h-full">
            <DocsPage />
          </div>
        )}
      </div>

      {/* ── Footer Status Bar ── */}
      <footer className="py-1 min-h-[24px] bg-slate-900 border-t border-slate-800 flex items-center px-4 justify-between text-[8px] font-mono text-slate-600 shrink-0 flex-wrap gap-y-1">
        <div className="flex items-center gap-4">
          <span className="text-slate-700 font-black uppercase tracking-wider">ASCADS v2.0</span>
          <span className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full" style={{ background: TAB_COLORS[mode].replace('text-', '') === mode ? '#06b6d4' : '#06b6d4', backgroundColor: '#06b6d4' }} />
            {mode === 'digital' ? 'Digital Logic Lab'
              : mode === 'plc'     ? 'VoltLogicPRO — IEC 61131-3 Ladder Logic'
              : mode === 'robot'   ? 'Robot-Workspace-IDE — CIM + IK Solver'
              : mode === 'analog'  ? `Analog Schematic · ${activeProject?.name ?? ''}`
              : mode === 'compute' ? 'Compute Tools — Base · Binary · Logic · IEEE 754 · ASCII'
              : mode === 'maths'   ? 'Beyond CAS — Scientific Engine'
              : mode === 'engigraph'? 'EngiGraph Pro — Visual Engineering'
              : mode === 'docs'    ? 'ASCADS Knowledge Base & Legal Docs'
              : 'Project Browser'}
          </span>
          {mode === 'analog' && activeProject && (
            <span className="text-slate-700">
              {activeProject.sheets.length} sheet{activeProject.sheets.length !== 1 ? 's' : ''} · {activeProject.history.length} commit{activeProject.history.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Bridge bus — compact */}
          <div className="flex items-center gap-2">
            {BRIDGE_KEYS.map(b => bridgeStatus[b.key] && (
              <span key={b.key} className="flex items-center gap-0.5 text-[7px] font-bold uppercase"
                style={{ color: b.color }}>
                <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: b.color }} />
                {b.title}
              </span>
            ))}
          </div>
          
          {/* Developer Attribution & Links */}
          <div className="text-slate-500 flex items-center gap-1 leading-none text-[7px] sm:text-[8px]">
            <span>Developed by Siyabonga B Phakathi of The Voice & Eye of Bhambatha Inc. ·</span>
            <a href="https://www.bhambathablog.wordpress.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">Blog</a> |
            <a href="https://www.facebook.com/C.Datoxic.P" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">Facebook</a> |
            <a href="https://www.websim.com/@whisperinggalaxyd" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">WebSim</a> |
            <a href="https://www.github.com/datoxic0" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">GitHub</a> |
            <a href="https://discord.com/channels/datoxic0" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">Discord</a> |
            <a href="https://x.com/Siya_B_Phakathi" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">X</a>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 bg-cyan-950/50 border border-cyan-900/40 rounded-full">
            <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse" />
            <span className="text-cyan-700 font-black uppercase tracking-widest">Bhambatha-Core</span>
          </div>
        </div>
      </footer>

      <AIAssistant
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        systemContext={{ mode, activeProject: activeProject?.name }}
      />
    </div>
  );
}
