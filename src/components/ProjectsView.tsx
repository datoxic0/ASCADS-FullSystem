import { useState, useRef } from 'react';
import { Cpu, Plus, Trash2, FolderOpen, Clock, ChevronRight, Download } from 'lucide-react';
import type { AnalogProject } from '@/lib/analog-types';
import { EXAMPLES } from '@/lib/examples';
import { MOTOR_STARTER_TEMPLATE, TRAFFIC_SEQUENCER_TEMPLATE } from '@/lib/plc-templates';
import { LED_BLINKER_TEMPLATE, POWER_SUPPLY_TEMPLATE, ARDUINO_SHIELD_TEMPLATE, PICK_AND_PLACE_TEMPLATE } from '@/lib/analog-templates';

interface Props {
  projects: AnalogProject[];
  onNew: (name: string, type?: 'analog' | 'plc' | 'digital' | 'robot', data?: any) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onImport?: (project: AnalogProject) => void;
  onNavigate: (mode: 'analog' | 'digital' | 'plc' | 'robot' | 'compute' | 'maths' | 'engigraph' | 'docs') => void;
}

const TEMPLATES = [
  { name: 'LED Blinker', desc: 'NE555 astable oscillator driving an LED', icon: '💡', type: 'analog' as const, data: LED_BLINKER_TEMPLATE },
  { name: 'Power Supply', desc: '7805-based regulated 5V supply', icon: '⚡', type: 'analog' as const, data: POWER_SUPPLY_TEMPLATE },
  { name: 'Arduino Shield', desc: 'ATmega328P with sensors and outputs', icon: '🎛️', type: 'analog' as const, data: ARDUINO_SHIELD_TEMPLATE },
  { name: 'Motor Starter Logic', desc: 'Latching ladder logic with feedback', icon: '🏭', type: 'plc' as const, data: MOTOR_STARTER_TEMPLATE },
  { name: 'Traffic Sequencer', desc: 'Timer-based intersection control', icon: '🚦', type: 'plc' as const, data: TRAFFIC_SEQUENCER_TEMPLATE },
  { name: '4-bit ALU', desc: 'Digital arithmetic logic unit', icon: '🧮', type: 'digital' as const, data: EXAMPLES.find(e => e.name === "2-bit Ripple Adder")?.build() },
  { name: 'Pick & Place', desc: 'Robotic arm sorting sequence', icon: '🦾', type: 'robot' as const, data: PICK_AND_PLACE_TEMPLATE },
];

export default function ProjectsView({ projects, onNew, onOpen, onDelete, onImport, onNavigate }: Props) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fmt = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-auto">
      {/* Header */}
      <div className="px-8 pt-8 pb-4 border-b border-slate-800 shrink-0">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-100 uppercase tracking-tight">Projects</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {projects.length} analog project{projects.length !== 1 ? 's' : ''} · ASCADS v1.0
            </p>
          </div>
          {!creating ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                Import
              </button>
              <button
                onClick={() => { setCreating(true); setNewName(''); }}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)] hover:shadow-[0_0_30px_rgba(8,145,178,0.5)]"
              >
                <Plus className="w-3.5 h-3.5" />
                New Project
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                type="text"
                placeholder="Project name..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newName.trim()) { onNew(newName.trim()); setCreating(false); }
                  if (e.key === 'Escape') setCreating(false);
                }}
                className="bg-slate-900 border border-cyan-600 rounded-lg px-3 py-1.5 text-[10px] text-slate-200 focus:outline-none w-48"
              />
              <button
                onClick={() => { if (newName.trim()) { onNew(newName.trim()); setCreating(false); } }}
                className="px-3 py-1.5 bg-cyan-600 text-white rounded-lg text-[9px] font-bold"
              >
                Create
              </button>
              <button
                onClick={() => setCreating(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-[9px] font-bold"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 p-8 space-y-12">
        {/* App Drawer */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {[
              { id: 'analog', label: 'Analog Design', desc: 'Circuit Schematics', icon: '⚡', 
                border: 'hover:border-violet-500/50', bg: 'hover:bg-violet-500/10', shadow: 'group-hover:shadow-[0_0_30px_rgba(139,92,246,0.25)]', color: 'text-violet-400' },
              { id: 'digital', label: 'Digital Logic', desc: 'Logic Gates & ALUs', icon: '🧮', 
                border: 'hover:border-cyan-500/50', bg: 'hover:bg-cyan-500/10', shadow: 'group-hover:shadow-[0_0_30px_rgba(6,182,212,0.25)]', color: 'text-cyan-400' },
              { id: 'plc', label: 'Industrial PLC', desc: 'Ladder Logic', icon: '🏭', 
                border: 'hover:border-blue-500/50', bg: 'hover:bg-blue-500/10', shadow: 'group-hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]', color: 'text-blue-400' },
              { id: 'robot', label: 'Robotics', desc: 'Kinematics & CIM', icon: '🦾', 
                border: 'hover:border-emerald-500/50', bg: 'hover:bg-emerald-500/10', shadow: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.25)]', color: 'text-emerald-400' },
              { id: 'compute', label: 'Compute Tools', desc: 'Converters & IEEE', icon: '🔧', 
                border: 'hover:border-amber-500/50', bg: 'hover:bg-amber-500/10', shadow: 'group-hover:shadow-[0_0_30px_rgba(245,158,11,0.25)]', color: 'text-amber-400' },
              { id: 'maths', label: 'Maths System', desc: 'Symbolic Math', icon: '∑', 
                border: 'hover:border-rose-500/50', bg: 'hover:bg-rose-500/10', shadow: 'group-hover:shadow-[0_0_30px_rgba(244,63,94,0.25)]', color: 'text-rose-400' },
              { id: 'engigraph', label: 'EngiGraph Pro', desc: '3D Code CAD', icon: '📐', 
                border: 'hover:border-orange-500/50', bg: 'hover:bg-orange-500/10', shadow: 'group-hover:shadow-[0_0_30px_rgba(249,115,22,0.25)]', color: 'text-orange-400' },
              { id: 'docs', label: 'Documentation', desc: 'Manuals & Legal', icon: '📚', 
                border: 'hover:border-pink-500/50', bg: 'hover:bg-pink-500/10', shadow: 'group-hover:shadow-[0_0_30px_rgba(236,72,153,0.25)]', color: 'text-pink-400' },
            ].map(app => (
              <button
                key={app.id}
                onClick={() => onNavigate(app.id as any)}
                className={`flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-900/80 border border-slate-800 ${app.border} ${app.bg} transition-all group cursor-pointer relative overflow-hidden`}
              >
                <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center text-4xl mb-4 shadow-xl ${app.shadow} transition-all group-hover:scale-110 duration-300`}>
                  {app.icon}
                </div>
                <span className={`text-sm font-black uppercase tracking-widest ${app.color} mb-1 group-hover:brightness-125 transition-all text-center leading-tight`}>
                  {app.label}
                </span>
                <span className="text-[10px] text-slate-500 font-medium text-center">
                  {app.desc}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Existing Projects */}
        {projects.length > 0 && (
          <section>
            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-3">
              Recent Projects
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {projects.map(p => (
                <div
                  key={p.id}
                  className="group relative p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-cyan-800/60 hover:bg-slate-900 transition-all cursor-pointer"
                  onClick={() => onOpen(p.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-900/50 to-blue-900/50 border border-cyan-800/30 rounded-lg flex items-center justify-center">
                      <Cpu className="w-4 h-4 text-cyan-500" />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${p.name.replace(/\s+/g, '_')}_Project.ascad`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="p-1 hover:bg-blue-950/50 rounded text-slate-500 hover:text-blue-400"
                        title="Export Project"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); onDelete(p.id); }}
                        className="p-1 hover:bg-red-950/50 rounded text-slate-500 hover:text-red-400"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-slate-100 mb-0.5">{p.name}</p>
                  <div className="flex items-center gap-3 text-[8px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {fmt(p.updatedAt)}
                    </span>
                    <span>{p.sheets.length} sheet{p.sheets.length !== 1 ? 's' : ''}</span>
                    <span>{p.history.length} commit{p.history.length !== 1 ? 's' : ''}</span>
                  </div>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 group-hover:text-cyan-500 transition-colors" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center">
              <FolderOpen className="w-8 h-8 text-slate-700" />
            </div>
            <p className="text-slate-400 font-bold">No projects yet</p>
            <p className="text-slate-600 text-xs">Create a new project to start designing.</p>
          </div>
        )}

        {/* Templates */}
        <section>
          <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-3">
            Start from Template
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {TEMPLATES.map(t => (
              <button
                key={t.name}
                onClick={() => onNew(t.name, t.type, t.data)}
                className="text-left p-4 bg-slate-900/30 border border-slate-800/60 rounded-xl hover:border-cyan-800/50 hover:bg-slate-900/60 transition-all group"
              >
                <span className="text-2xl block mb-2">{t.icon}</span>
                <p className="text-[11px] font-bold text-slate-300 mb-1 group-hover:text-slate-100">{t.name}</p>
                <p className="text-[8px] text-slate-600 leading-snug">{t.desc}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        accept=".ascad,.json,application/json"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const project = JSON.parse(reader.result as string) as AnalogProject;
              if (project && project.id && onImport) {
                onImport(project);
              }
            } catch (err) {
              console.error("Failed to parse project file");
            }
          };
          reader.readAsText(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
