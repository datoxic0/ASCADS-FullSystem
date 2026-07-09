import { useState } from "react";
import { Engigraph2D } from "../components/engigraph/Engigraph2D";
import { SimulationProvider } from "../components/engigraph/context/SimulationContext";
import Engigraph3D from "../components/engigraph/Engigraph3D";
import Engigraph3DSketch from "../components/engigraph/Engigraph3DSketch";
import DocumentationViewer from "../components/engigraph/DocumentationViewer";
import { Database, Link2, Share2, Box, Square, Book, Menu, X, Layers } from "lucide-react";
import { toast } from "sonner";

type ViewMode = '3D' | 'sketch' | '2D';

export default function EngigraphPage() {
  const [synced, setSynced]           = useState(false);
  const [mode, setMode]               = useState<ViewMode>('2D');
  const [isDocsOpen, setIsDocsOpen]   = useState(false);
  const [isMobileMenuOpen, setMobileMenu] = useState(false);

  const handleSyncEcosystem = () => {
    const params = localStorage.getItem('ascads_global_params');
    if (params) {
      const event = new CustomEvent('ascad-ecosystem-sync', { detail: JSON.parse(params) });
      window.dispatchEvent(event);
      setSynced(true);
      setTimeout(() => setSynced(false), 2000);
      const log = document.getElementById('terminal-log');
      if (log) {
        log.innerHTML += `<div class="term-line system" style="color: #10b981;">> ASCAD ECOSYSTEM: Synced ${Object.keys(JSON.parse(params)).length} Global Parameters.</div>`;
        log.scrollTop = log.scrollHeight;
      }
    } else {
      toast.error("No Global Parameters found in the Maths System.");
    }
  };

  return (
    <div className="w-full h-full bg-[#0a0b0c] overflow-hidden flex flex-col relative">
      {/* ── Toolbar ── */}
      <div className="hidden lg:flex h-auto min-h-10 py-2 lg:py-0 bg-[#141618] border-b border-[#334155] items-center px-2 sm:px-4 justify-between shrink-0 z-50 flex-wrap lg:flex-nowrap gap-2 overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-blue-400">
            <Link2 size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Ecosystem Bridge</span>
          </div>

          <button
            onClick={handleSyncEcosystem}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-medium transition-colors ${synced ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
          >
            <Database size={12} />
            {synced ? 'Parameters Synced!' : 'Sync Maths Parameters'}
          </button>

          {/* Mode switcher */}
          <div className="flex items-center bg-black/20 p-1 rounded-lg border border-white/5 ml-2">
            <button
              onClick={() => setMode('3D')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] uppercase tracking-widest font-bold transition-colors ${mode === '3D' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Box size={12} /> 3D Code CAD
            </button>
            <button
              onClick={() => setMode('sketch')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] uppercase tracking-widest font-bold transition-colors ${mode === 'sketch' ? 'bg-violet-500/20 text-violet-300' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Layers size={12} /> 3D Sketch
            </button>
            <button
              onClick={() => setMode('2D')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] uppercase tracking-widest font-bold transition-colors ${mode === '2D' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Square size={12} /> 2D Legacy
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDocsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-[11px] font-medium transition-colors border border-indigo-500/20"
          >
            <Book size={12} />Documentation
          </button>
          <button
            onClick={() => {
              const mockObjects = {
                objects: [
                  { name: 'Assembly Table',  type: 'table',    x: 200, y: 150, width: 120, height: 80, rotation: 0 },
                  { name: 'Barrier Wall',    type: 'wall',     x: 100, y: 300, width: 20,  height: 200, rotation: 90 },
                  { name: 'CNC Router',      type: 'cnc',      x: 400, y: 300, width: 100, height: 100, rotation: 0 },
                  { name: 'Conveyor Line',   type: 'conveyor', x: 250, y: 500, width: 300, height: 60,  rotation: 0 },
                ],
              };
              localStorage.setItem('ascads_bridge_engigraph_robot', JSON.stringify(mockObjects));
              const log = document.getElementById('terminal-log');
              if (log) {
                log.innerHTML += `<div class="term-line system" style="color: #3b82f6;">> ASCAD BRIDGE: Exported ${mockObjects.objects.length} CAD structures to Robotics Environment.</div>`;
                log.scrollTop = log.scrollHeight;
              }
              toast.success('Exported EngiGraph CAD structures to Robotics Simulator!');
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-white/5 text-slate-300 hover:bg-white/10 text-[11px] font-medium border border-transparent"
          >
            <Share2 size={12} />Export CAD to Robotics
          </button>
        </div>
      </div>

      {/* ── Mobile hamburger ── */}
      <div className="lg:hidden fixed top-[0.4rem] right-[2.5rem] z-[100]">
        <button
          onClick={() => setMobileMenu(!isMobileMenuOpen)}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
        >
          {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
        </button>

        {isMobileMenuOpen && (
          <div className="absolute right-0 top-10 w-56 bg-[#141618] border border-white/10 rounded-xl shadow-2xl p-2 flex flex-col gap-1 z-[100]">
            <div className="text-[10px] font-black uppercase text-indigo-500 tracking-widest px-4 py-2 border-b border-white/5 mb-1">
              EngiGraph Pro
            </div>
            {([
              { m: '3D'     as ViewMode, label: '3D Code CAD', cls: 'text-indigo-400', activeCls: 'bg-indigo-500/20 text-indigo-400' },
              { m: 'sketch' as ViewMode, label: '3D Sketch',   cls: 'text-violet-400', activeCls: 'bg-violet-500/20 text-violet-300' },
              { m: '2D'     as ViewMode, label: '2D Legacy',   cls: 'text-blue-400',   activeCls: 'bg-blue-500/20 text-blue-400'    },
            ] as const).map(({ m, label, cls, activeCls }) => (
              <button
                key={m}
                onClick={() => { setMode(m); setMobileMenu(false); }}
                className={`w-full text-left px-4 py-3 rounded-lg text-[10px] font-black uppercase tracking-[0.25em] transition-all ${mode === m ? activeCls : `text-slate-400 hover:bg-white/5`}`}
              >
                {label}
              </button>
            ))}
            <div className="h-px bg-white/5 my-1" />
            <button
              onClick={() => { handleSyncEcosystem(); setMobileMenu(false); }}
              className="w-full flex items-center gap-2 text-left px-4 py-3 rounded-lg text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400 hover:bg-white/5 transition-all"
            >
              <Database size={14} /> Sync Params
            </button>
            <button
              onClick={() => { setIsDocsOpen(true); setMobileMenu(false); }}
              className="w-full flex items-center gap-2 text-left px-4 py-3 rounded-lg text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400 hover:bg-white/5 transition-all"
            >
              <Book size={14} /> Documentation
            </button>
          </div>
        )}
      </div>

      {/* ── Content area ── */}
      <div className="flex-1 relative flex flex-col min-h-0 overflow-hidden">
        {/* 3D Code CAD */}
        <div className="w-full h-full flex flex-col min-h-0" style={{ display: mode === '3D' ? 'flex' : 'none' }}>
          <Engigraph3D />
        </div>

        {/* 3D Sketch Studio */}
        <div className="w-full h-full flex flex-col min-h-0" style={{ display: mode === 'sketch' ? 'flex' : 'none' }}>
          {mode === 'sketch' && <Engigraph3DSketch />}
        </div>

        {/* 2D Legacy */}
        <div className="w-full h-full flex flex-col min-h-0" style={{ display: mode === '2D' ? 'flex' : 'none' }}>
          <SimulationProvider>
            <Engigraph2D />
          </SimulationProvider>
        </div>
      </div>

      <DocumentationViewer isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
    </div>
  );
}
