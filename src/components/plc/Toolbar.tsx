import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Download, 
  Trash2,
  Share2,
  Activity,
  Cpu,
  Tv,
  Zap,
  Filter,
  Search,
  Sliders,
  Settings,
  Upload,
  PanelLeft,
  PanelRight
} from 'lucide-react';
import { clsx } from 'clsx';

interface ToolbarProps {
  isRunning: boolean;
  forcesEnabled: boolean;
  hasActiveForces: boolean;
  onToggleSim: () => void;
  onReset: () => void;
  onClear: () => void;
  onSave: () => void;
  onSearch: (term: string) => void;
  onToggleSidebar?: () => void;
  onToggleInspector?: () => void;
  onImportBridge?: () => void;
  onExportBridge?: () => void;
  onImport?: () => void;
}

export function Toolbar({ 
  isRunning, 
  forcesEnabled, 
  hasActiveForces, 
  onToggleSim, 
  onReset, 
  onClear, 
  onSave, 
  onSearch,
  onToggleSidebar,
  onToggleInspector,
  onImportBridge,
  onExportBridge,
  onImport,
}: ToolbarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  return (
    <div className="flex bg-[#0a0b0f] border-b border-white/10 z-30 select-none shadow-md shrink-0 items-center justify-between px-6 py-2.5">
      
      {/* Left Side: Keyswitch Mode Selector & Luminous LEDs */}
      <div className="flex items-center gap-4">
        
        {/* PLC Logo Block */}
        <div className="flex items-center justify-center w-8 h-8 bg-slate-800/80 border border-slate-700 rounded shadow-inner" aria-label="LOGIX_5380 PLC" title="LOGIX_5380 PLC">
          <Cpu size={18} className="text-zinc-400" />
        </div>
        
        {/* Real Controller LED Status array */}
        <div className="flex items-center gap-3 bg-[#13161c] px-3 py-1.5 rounded-lg border border-white/5">
            <div className="flex flex-col items-center">
              <span className="text-[6.5px] font-bold text-slate-500 font-mono scale-90 mb-0.5">PWR</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[6.5px] font-bold text-slate-500 font-mono scale-90 mb-0.5">RUN</span>
              <div className={clsx(
                "w-1.5 h-1.5 rounded-full transition-all duration-300",
                isRunning ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-slate-800"
              )} />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[6.5px] font-bold text-slate-500 font-mono scale-90 mb-0.5">FORCE</span>
              <div className={clsx(
                "w-1.5 h-1.5 rounded-full transition-all duration-300",
                hasActiveForces && forcesEnabled ? "bg-amber-500 shadow-[0_0_8px_#f59e0b] animate-pulse" : "bg-slate-800"
              )} />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[6.5px] font-bold text-slate-500 font-mono scale-90 mb-0.5">I/O</span>
              <div className={clsx(
                "w-1.5 h-1.5 rounded-full transition-all duration-200",
                isRunning ? "bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-pulse" : "bg-slate-800"
              )} />
            </div>
          </div>

        {/* Interactive Mode Switching selector */}
        <div className="flex bg-[#12141a] p-0.5 rounded-lg border border-white/5">
          <button
            onClick={onToggleSim}
            className={clsx(
              "flex items-center gap-1 px-3 py-0.5 text-[9px] font-black rounded-md transition-all active:scale-95",
              isRunning 
                ? "bg-emerald-600/90 hover:bg-emerald-600 text-white shadow-md shadow-emerald-600/20" 
                : "bg-amber-600/90 hover:bg-amber-600 text-white shadow-md shadow-amber-600/20"
            )}
            title={isRunning ? "Switch PLC processor mode to Program (offline)" : "Switch PLC processor mode to Run (online)"}
          >
            {isRunning ? <Zap size={10} className="animate-bounce" /> : <Play size={10} />}
            <span className="font-mono tracking-wider hidden sm:inline-block">{isRunning ? 'REM RUN' : 'PROG MODE'}</span>
          </button>
        </div>
      </div>

      {/* Middle Header Section: System Info Label */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-[#13161c] border border-white/5 rounded-lg text-[8.5px] text-zinc-400">
        <Activity size={10} className={clsx("text-sky-450 opacity-80", isRunning && "animate-pulse")} />
        <span className="font-mono font-bold tracking-wider text-slate-400">
          ENGINE STATUS: {isRunning ? "CYCLIC SCAN ACTIVE (12.4ms)" : "IDLE/HALTED"}
        </span>
        {hasActiveForces && (
          <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[7px] font-black">
            <Sliders size={8} /> FORCE_MAP_ACTIVE
          </div>
        )}
      </div>

      {/* Right Section: Core Workbench Commands */}
      <div className="flex items-center gap-1.5">
        
        <div className="relative flex items-center">
          <Search size={10} className="absolute left-2 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Find controller tag..."
            className="bg-[#13161c] text-white border border-white/5 rounded-lg px-2 py-1 pl-6 text-[9px] font-mono w-36 h-7 focus:bg-[#181b24] focus:border-sky-500/50 outline-none transition-all placeholder:text-zinc-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch(searchTerm)}
          />
        </div>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <button 
          onClick={onToggleSidebar} 
          className="p-1 px-[7px] h-7 w-7 flex items-center justify-center hover:bg-white/5 text-slate-300 hover:text-slate-100 border border-[#21252e] hover:border-slate-500/30 rounded-lg transition-all active:scale-90" 
          title="Toggle Left Sidebar"
        >
          <PanelLeft size={12} />
        </button>

        <button 
          onClick={onToggleInspector} 
          className="p-1 px-[7px] h-7 w-7 flex items-center justify-center hover:bg-white/5 text-slate-300 hover:text-slate-100 border border-[#21252e] hover:border-slate-500/30 rounded-lg transition-all active:scale-90" 
          title="Toggle Right Inspector"
        >
          <PanelRight size={12} />
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Action triggers */}
        <button 
          onClick={onImportBridge} 
          className="p-1 px-[7px] h-7 w-7 flex items-center justify-center hover:bg-white/5 text-slate-300 hover:text-indigo-400 border border-[#21252e] hover:border-indigo-500/30 rounded-lg transition-all active:scale-90" 
          title="Import Logic from Bridge (Analog/Digital)"
        >
          <Share2 size={12} />
        </button>

        <button 
          onClick={onExportBridge} 
          className="p-1 px-[7px] h-7 w-7 flex items-center justify-center hover:bg-white/5 text-slate-300 hover:text-cyan-400 border border-[#21252e] hover:border-cyan-500/30 rounded-lg transition-all active:scale-90" 
          title="Export Logic to Bridge (Digital Lab)"
        >
          <Cpu size={12} />
        </button>

        <button 
          onClick={onImport} 
          className="p-1 px-[7px] h-7 w-7 flex items-center justify-center hover:bg-white/5 text-slate-300 hover:text-emerald-400 border border-[#21252e] hover:border-emerald-500/30 rounded-lg transition-all active:scale-90" 
          title="Import Logic File (.vlp)"
        >
          <Upload size={12} />
        </button>

        <button 
          onClick={onSave} 
          className="p-1 px-[7px] h-7 w-7 flex items-center justify-center hover:bg-white/5 text-slate-300 hover:text-white border border-[#21252e] hover:border-white/10 rounded-lg transition-all active:scale-90" 
          title="Export Logic File (.vlp)"
        >
          <Download size={12} />
        </button>
        
        <button 
          onClick={onReset} 
          disabled={!isRunning} 
          className="p-1 px-[7px] h-7 w-7 flex items-center justify-center hover:bg-white/5 text-slate-300 hover:text-[#0087ff] border border-[#21252e] hover:border-[#0087ff]/20 rounded-lg transition-all active:scale-90 disabled:opacity-20 disabled:cursor-not-allowed" 
          title="Reset PLC Registers"
        >
          <RotateCcw size={12} />
        </button>

        <button
          onClick={onClear}
          className="p-1 px-[7px] h-7 w-7 flex items-center justify-center hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 border border-[#21252e] hover:border-rose-500/20 rounded-lg transition-all active:scale-90"
          title="Clear CPU Workspace memory"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
