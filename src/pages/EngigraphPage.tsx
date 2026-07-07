import { useState } from "react";
import { Engigraph2D } from "../components/engigraph/Engigraph2D";
import { SimulationProvider } from "../components/engigraph/context/SimulationContext";
import Engigraph3D from "../components/engigraph/Engigraph3D";
import DocumentationViewer from "../components/engigraph/DocumentationViewer";
import { Database, Link2, Share2, Box, Square, Book, Menu, X } from "lucide-react";
import { toast } from "sonner";

export default function EngigraphPage() {
  const [synced, setSynced] = useState(false);
  const [mode, setMode] = useState<'3D' | '2D'>('2D');
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      {/* Ecosystem Integration Toolbar (Hidden on Mobile) */}
      <div className="hidden lg:flex h-auto min-h-10 py-2 lg:py-0 bg-[#141618] border-b border-[#334155] items-center px-2 sm:px-4 justify-between shrink-0 z-50 flex-wrap lg:flex-nowrap gap-2 overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-blue-400">
            <Link2 size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Ecosystem Bridge</span>
          </div>
          
          <button 
            onClick={handleSyncEcosystem}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-medium transition-colors ${
              synced ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Database size={12} />
            {synced ? 'Parameters Synced!' : 'Sync Maths Parameters'}
          </button>

          <div className="flex items-center bg-black/20 p-1 rounded-lg border border-white/5 ml-2">
            <button
              onClick={() => setMode('3D')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] uppercase tracking-widest font-bold transition-colors ${mode === '3D' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Box size={12} /> 3D Code CAD
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
            <Book size={12} />
            Documentation
          </button>
          <button 
            onClick={() => {
              // Mock extracting 3D meshes/objects from the context.
              // In the full system, we'd grab the actual DrawingObjects or ThreeJS meshes.
              const mockObjects = {
                objects: [
                  { name: 'Assembly Table', type: 'table', x: 200, y: 150, width: 120, height: 80, rotation: 0 },
                  { name: 'Barrier Wall', type: 'wall', x: 100, y: 300, width: 20, height: 200, rotation: 90 },
                  { name: 'CNC Router Model', type: 'cnc', x: 400, y: 300, width: 100, height: 100, rotation: 0 },
                  { name: 'Conveyor Line', type: 'conveyor', x: 250, y: 500, width: 300, height: 60, rotation: 0 }
                ]
              };
              localStorage.setItem('ascads_bridge_engigraph_robot', JSON.stringify(mockObjects));
              
              const log = document.getElementById('terminal-log');
              if (log) {
                log.innerHTML += `<div class="term-line system" style="color: #3b82f6;">> ASCAD BRIDGE: Exported ${mockObjects.objects.length} CAD structures to Robotics Environment.</div>`;
                log.scrollTop = log.scrollHeight;
              }
              toast.success('Successfully exported EngiGraph CAD structures to the Robotics Simulator!');
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-white/5 text-slate-300 hover:bg-white/10 text-[11px] font-medium border border-transparent"
          >
            <Share2 size={12} />
            Export CAD to Robotics
          </button>
        </div>
      </div>

      {/* Floating Mobile Hamburger Button positioned inside UnifiedShell Header */}
      <div className="lg:hidden fixed top-[0.4rem] right-[2.5rem] z-[100]">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
        >
          {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
        
        {isMobileMenuOpen && (
          <div className="absolute right-0 top-10 w-56 bg-[#141618] border border-white/10 rounded-xl shadow-2xl p-2 flex flex-col gap-1 z-[100]">
            <div className="text-[10px] font-black uppercase text-indigo-500 tracking-widest px-4 py-2 border-b border-white/5 mb-1">
              EngiGraph Pro
            </div>
            <button
              onClick={() => { setMode('3D'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-lg text-[10px] font-black uppercase tracking-[0.25em] transition-all ${mode === '3D' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:bg-white/5'}`}
            >
              3D Code CAD
            </button>
            <button
              onClick={() => { setMode('2D'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-lg text-[10px] font-black uppercase tracking-[0.25em] transition-all ${mode === '2D' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:bg-white/5'}`}
            >
              2D Legacy
            </button>
            <div className="h-px bg-white/5 my-1" />
            <button 
              onClick={() => { handleSyncEcosystem(); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center gap-2 text-left px-4 py-3 rounded-lg text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400 hover:bg-white/5 transition-all"
            >
              <Database size={14} /> Sync Params
            </button>
            <button 
              onClick={() => { setIsDocsOpen(true); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center gap-2 text-left px-4 py-3 rounded-lg text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400 hover:bg-white/5 transition-all"
            >
              <Book size={14} /> Documentation
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 relative flex flex-col min-h-0">
        <div className="w-full h-full flex flex-col min-h-0" style={{ display: mode === '3D' ? 'flex' : 'none' }}>
          <Engigraph3D />
        </div>
        <div className="w-full h-full flex flex-col min-h-0" style={{ display: mode === '2D' ? 'flex' : 'none' }}>
          <SimulationProvider>
            <Engigraph2D />
          </SimulationProvider>
        </div>
      </div>

      <DocumentationViewer 
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />
    </div>
  );
}
