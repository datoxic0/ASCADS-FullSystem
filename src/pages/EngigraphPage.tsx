import { useState } from "react";
import EngigraphNative from "../components/engigraph/EngigraphNative";
import Engigraph3D from "../components/engigraph/Engigraph3D";
import DocumentationViewer from "../components/engigraph/DocumentationViewer";
import { Database, Link2, Share2, Box, Square, Book } from "lucide-react";

export default function EngigraphPage() {
  const [synced, setSynced] = useState(false);
  const [mode, setMode] = useState<'3D' | '2D'>('2D');
  const [isDocsOpen, setIsDocsOpen] = useState(false);

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
      alert("No Global Parameters found in the Maths System.");
    }
  };

  return (
    <div className="w-full h-full bg-[#0a0b0c] overflow-hidden flex flex-col relative">
      {/* Ecosystem Integration Toolbar */}
      <div className="h-10 bg-[#141618] border-b border-[#334155] flex items-center px-4 justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
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
          <button className="flex items-center gap-1.5 px-3 py-1 rounded bg-white/5 text-slate-300 hover:bg-white/10 text-[11px] font-medium border border-transparent">
            <Share2 size={12} />
            Export CAD to Robotics
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        <div style={{ display: mode === '3D' ? 'block' : 'none', height: '100%' }}>
          <Engigraph3D />
        </div>
        <div style={{ display: mode === '2D' ? 'block' : 'none', height: '100%' }}>
          <EngigraphNative />
        </div>
      </div>

      <DocumentationViewer 
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />
    </div>
  );
}
