import React, { useState } from 'react';
import { 
  Square, 
  CircleDot, 
  Timer, 
  Hash, 
  ChevronRight,
  HandMetal,
  Database,
  FileCode,
  Folder,
  Cpu,
  Activity,
  Box,
  Settings,
  Minus,
  ChevronDown,
  Terminal,
  Grid,
  Radio,
  FileSpreadsheet,
  Compass
} from 'lucide-react';
import { clsx } from 'clsx';
import { NodeType } from '@/lib/plc-types';
import { playClick } from '@/lib/audio';

interface SidebarProps {
  onAddNode: (type: NodeType | 'wire') => void;
  placementType: NodeType | 'wire' | null;
  currentView: 'routine' | 'tags' | 'blocks' | 'mechatronics';
  onViewChange: (view: 'routine' | 'tags' | 'blocks' | 'mechatronics') => void;
}

const INSTRUCTION_CATEGORIES = [
  {
    id: 'fav',
    label: 'Favorites & Common',
    items: [
      { type: 'contact-no' as const, name: 'XIC', symbol: '--[ ]--', desc: 'Examine if Closed' },
      { type: 'contact-nc' as const, name: 'XIO', symbol: '--[/]--', desc: 'Examine if Open' },
      { type: 'coil' as const, name: 'OTE', symbol: '--( )--', desc: 'Output Energize' },
      { type: 'branch-start' as const, name: 'BST', symbol: '--+--', desc: 'Branch Connection' },
      { type: 'wire' as any, name: 'WIRE', symbol: 'WIRE', desc: 'Manual Wire Tool' },
      { type: 'timer-on' as const, name: 'TON', symbol: 'TON', desc: 'Timer-On Delay' },
    ]
  },
  {
    id: 'bit',
    label: 'Bit Logic Instructions',
    items: [
      { type: 'contact-no' as const, name: 'XIC', symbol: '--[ ]--', desc: 'Examine if Closed' },
      { type: 'contact-nc' as const, name: 'XIO', symbol: '--[/]--', desc: 'Examine if Open' },
      { type: 'coil' as const, name: 'OTE', symbol: '--( )--', desc: 'Output Energize' },
      { type: 'coil-latch' as const, name: 'OTL', symbol: '--(L)--', desc: 'Output Latch' },
      { type: 'coil-unlatch' as const, name: 'OTU', symbol: '--(U)--', desc: 'Output Unlatch' },
      { type: 'one-shot' as const, name: 'ONS', symbol: '[ONS]', desc: 'One Shot Pulse' },
      { type: 'branch-start' as const, name: 'BST', symbol: '--+--', desc: 'Branch Connection' },
      { type: 'wire-vertical' as any, name: 'V-LINE', symbol: 'V-LINE', desc: 'Vertical Shunt Link' },
      { type: 'wire-junction' as any, name: 'JUNC', symbol: 'JUNC', desc: 'Logic Junction Node' },
    ]
  },
  {
    id: 'timer',
    label: 'Timers & Counters',
    items: [
      { type: 'timer-on' as const, name: 'TON', symbol: 'TON', desc: 'Timer-On Delay' },
      { type: 'timer-off' as const, name: 'TOF', symbol: 'TOF', desc: 'Timer-Off Delay' },
      { type: 'retentive-timer' as const, name: 'RTO', symbol: 'RTO', desc: 'Retentive Timer-On' },
      { type: 'counter-up' as const, name: 'CTU', symbol: 'CTU', desc: 'Count Up Counter' },
      { type: 'counter-down' as const, name: 'CTD', symbol: 'CTD', desc: 'Count Down Counter' },
      { type: 'reset' as const, name: 'RES', symbol: 'RES', desc: 'Reset Timer/Counter' },
    ]
  },
  {
    id: 'compare',
    label: 'Data Comparisons',
    items: [
      { type: 'compare-eq' as const, name: 'EQU', symbol: 'EQU', desc: 'Equal To' },
      { type: 'compare-ne' as const, name: 'NEQ', symbol: 'NEQ', desc: 'Not Equal To' },
      { type: 'compare-lt' as const, name: 'LES', symbol: 'LES', desc: 'Less Than' },
      { type: 'compare-gt' as const, name: 'GRT', symbol: 'GRT', desc: 'Greater Than' },
    ]
  },
  {
    id: 'math',
    label: 'Math & Move Blocks',
    items: [
      { type: 'math-add' as const, name: 'ADD', symbol: 'ADD', desc: 'Add Values' },
      { type: 'math-sub' as const, name: 'SUB', symbol: 'SUB', desc: 'Subtract Values' },
      { type: 'math-mul' as const, name: 'MUL', symbol: 'MUL', desc: 'Multiply Values' },
      { type: 'math-div' as const, name: 'DIV', symbol: 'DIV', desc: 'Divide Values' },
      { type: 'math-mov' as const, name: 'MOV', symbol: 'MOV', desc: 'Move Data' },
    ]
  }
];

export function Sidebar({ onAddNode, placementType, currentView, onViewChange }: SidebarProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    project: true,
    tasks: true,
    mainTask: true,
    mainProg: true,
    io: true
  });

  const toggle = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="w-full h-full bg-[#0d0f14] flex flex-col z-20 text-[11px] select-none font-mono text-slate-300">
      
      {/* Sidebar Header resembling a proper industrial workspace */}
      <div className="h-11 px-4 flex items-center justify-between border-b border-white/10 bg-[#07090d]">
        <span className="text-[9px] font-black uppercase tracking-[0.16em] text-sky-400 font-mono">Controller Organizer</span>
        <div className="flex gap-1.5">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_#10b981]" />
           <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
           <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar space-y-3">
        {/* Project Tree */}
        <div className="px-2 space-y-0.5">
          <div 
            className="flex items-center gap-1.5 text-slate-200 font-bold px-2 py-1 hover:bg-white/5 cursor-pointer rounded transition-colors"
            onClick={() => toggle('project')}
          >
             {expanded.project ? <ChevronDown size={11} className="text-zinc-500" /> : <ChevronRight size={11} className="text-zinc-500" />}
             <div className="w-3.5 h-3.5 bg-sky-950/40 rounded flex items-center justify-center border border-sky-850/35">
                <Database size={9} className="text-sky-400" />
              </div>
             <span className="tracking-wide text-[10px]">L85 Controller CPU</span>
          </div>
          
          {expanded.project && (
            <div className="pl-3.5 space-y-0.5 border-l border-white/5 ml-3 my-0.5">
              
              <div 
                className={clsx(
                  "flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer transition-all text-[9.5px]",
                  currentView === 'tags' 
                    ? "bg-[#181d28] text-sky-400 font-bold border border-sky-500/15" 
                    : "text-slate-400 hover:bg-white/5"
                )}
                onClick={() => onViewChange('tags')}
              >
                 <FileSpreadsheet size={10} className={currentView === 'tags' ? "text-sky-400" : "text-zinc-550"} /> 
                 <span>Controller Tags</span>
              </div>
              
              <div className="flex items-center gap-1.5 text-zinc-650 px-2 py-0.5 hover:bg-white/5 cursor-pointer rounded pointer-events-none opacity-40 text-[9.5px]">
                 <Settings size={10} /> 
                 <span>Hardware Profile</span>
              </div>

              {/* Tasks Section */}
              <div 
                className="flex items-center gap-1.5 text-slate-350 font-bold px-2 py-1 hover:bg-white/5 cursor-pointer rounded transition-colors text-[9.5px]"
                onClick={() => toggle('tasks')}
              >
                 {expanded.tasks ? <ChevronDown size={10} className="text-zinc-500" /> : <ChevronRight size={10} className="text-zinc-500" />}
                 <div className="w-3.5 h-3.5 bg-zinc-850 rounded flex items-center justify-center border border-white/10">
                    <Cpu size={9} className="text-slate-400" />
                 </div>
                 <span>Tasks Tree</span>
              </div>

              {expanded.tasks && (
                <div className="pl-3 space-y-0.5 border-l border-white/5 ml-1.5 my-0.5">
                  <div 
                    className="flex items-center gap-1.5 text-slate-350 font-medium px-2 py-0.5 hover:bg-white/5 cursor-pointer rounded transition-colors-all text-[9.5px]"
                    onClick={() => toggle('mainTask')}
                  >
                     {expanded.mainTask ? <ChevronDown size={10} className="text-zinc-500" /> : <ChevronRight size={10} className="text-zinc-500" />}
                     <Activity size={10} className="text-emerald-400 animate-pulse" />
                     <span>MainTask [Cyclic]</span>
                  </div>

                  {expanded.mainTask && (
                    <div className="pl-3 space-y-0.5 border-l border-white/5 ml-1.5 my-0.5">
                      <div 
                        className="flex items-center gap-1.5 text-slate-350 font-medium px-2 py-0.5 hover:bg-white/5 cursor-pointer rounded transition-colors-all text-[9.5px]"
                        onClick={() => toggle('mainProg')}
                      >
                         {expanded.mainProg ? <ChevronDown size={10} className="text-zinc-500" /> : <ChevronRight size={10} className="text-zinc-500" />}
                         <Folder size={10} className="text-amber-500" />
                         <span>MainProgram</span>
                      </div>
                      
                      {expanded.mainProg && (
                        <div className="pl-3 space-y-0.5 border-l border-white/5 ml-1.5">
                           <div 
                            className={clsx(
                              "flex items-center gap-1.5 px-2 py-0.5 my-0.5 rounded cursor-pointer transition-all text-[9.5px]",
                              currentView === 'routine' ? "bg-[#181d28] text-sky-400 font-bold border border-sky-500/15" : "text-slate-400 hover:bg-white/5"
                            )}
                            onClick={() => onViewChange('routine')}
                           >
                              <FileCode size={11} className={currentView === 'routine' ? "text-sky-400" : "text-zinc-550"} />
                              <span>MainRoutine (LAD)</span>
                           </div>
                           <div 
                            className={clsx(
                              "flex items-center gap-1.5 px-2 py-0.5 my-0.5 rounded cursor-pointer transition-all text-[9.5px]",
                              currentView === 'blocks' ? "bg-[#181d28] text-sky-400 font-bold border border-sky-500/15" : "text-slate-400 hover:bg-white/5"
                            )}
                            onClick={() => onViewChange('blocks')}
                           >
                              <Box size={11} className={currentView === 'blocks' ? "text-sky-400" : "text-zinc-550"} />
                              <span>Functional (FBD)</span>
                           </div>
                           <div 
                            className={clsx(
                              "flex items-center gap-1.5 px-2 py-0.5 my-0.5 rounded cursor-pointer transition-all text-[9.5px]",
                              currentView === 'mechatronics' ? "bg-[#181d28] text-pink-400 font-bold border border-pink-500/15" : "text-slate-400 hover:bg-white/5"
                            )}
                            onClick={() => onViewChange('mechatronics')}
                           >
                              <Compass size={11} className={currentView === 'mechatronics' ? "text-pink-400" : "text-zinc-550"} />
                              <span>Mechatronics (PNEU-HYD)</span>
                           </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comprehensive Instruction Library */}
        <div className="border-t border-white/10 pt-3">
          <div className="text-[9px] font-black uppercase tracking-[0.16em] text-sky-400 px-4 mb-2.5 font-mono">
            Instruction Library
          </div>
          
          <div className="space-y-1.5 px-3">
            {INSTRUCTION_CATEGORIES.map(category => {
              const isExpanded = !!expanded[category.id];
              return (
                <div key={category.id} className="rounded-lg bg-[#0a0c10] border border-white/5 overflow-hidden">
                  <div 
                    onClick={() => toggle(category.id)}
                    className="flex items-center justify-between px-3 py-2 cursor-pointer bg-[#10121a] hover:bg-[#151824] transition-colors"
                  >
                    <span className="text-[9.5px] font-bold text-slate-350 tracking-wide">{category.label}</span>
                    {isExpanded ? <ChevronDown size={10} className="text-zinc-400" /> : <ChevronRight size={10} className="text-zinc-500" />}
                  </div>
                  
                  {isExpanded && (
                    <div className="p-1.5 bg-[#07080c] grid grid-cols-2 gap-1 font-mono">
                      {category.items.map(item => {
                        const isActive = placementType === item.type;
                        return (
                          <button
                            key={item.name + item.type}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddNode(item.type);
                              playClick();
                            }}
                            className={clsx(
                              "flex flex-col items-center justify-center py-2 px-1 rounded border text-center transition-all duration-155 relative group",
                              isActive 
                                ? "bg-sky-600/90 border-sky-400 text-white shadow-lg shadow-sky-600/30 font-bold" 
                                : "bg-[#111319] border-white/5 hover:border-white/15 hover:bg-[#161a23] hover:text-slate-200 text-slate-400"
                            )}
                            title={`${item.name}: ${item.desc}`}
                          >
                            <span className={clsx(
                              "text-[9px] font-bold tracking-wider font-mono",
                              isActive ? "text-white" : "text-sky-400/90 group-hover:text-sky-400"
                            )}>
                              {item.symbol}
                            </span>
                            <span className="text-[7.5px] text-zinc-500 font-mono mt-0.5 scale-90">
                              {item.name}
                            </span>
                            
                            {/* Hover description tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black text-[7.5px] text-slate-200 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap border border-white/10 font-sans shadow-xl">
                              {item.desc}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-3 mx-3 p-2 bg-sky-950/25 rounded-lg border border-sky-500/10 text-[8.5px] text-sky-400/80 leading-normal font-mono">
             Locate then click any tool above, then select a rung or connection node on the canvas to place or link.
          </div>
        </div>
      </div>
    </div>
  );
}
