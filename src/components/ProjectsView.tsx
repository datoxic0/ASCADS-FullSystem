import { useState } from 'react';
import { Cpu, Plus, Trash2, FolderOpen, Clock, ChevronRight } from 'lucide-react';
import type { AnalogProject } from '@/lib/analog-types';

interface Props {
  projects: AnalogProject[];
  onNew: (name: string) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

const TEMPLATES = [
  { name: 'LED Blinker', desc: 'NE555 astable oscillator driving an LED', icon: '💡' },
  { name: 'Power Supply', desc: '7805-based regulated 5V supply', icon: '⚡' },
  { name: 'Arduino Shield', desc: 'ATmega328P with sensors and outputs', icon: '🎛️' },
  { name: 'ESP32 IoT Node', desc: 'Wireless sensor node with power management', icon: '📡' },
];

export default function ProjectsView({ projects, onNew, onOpen, onDelete }: Props) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

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
            <button
              onClick={() => { setCreating(true); setNewName(''); }}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)] hover:shadow-[0_0_30px_rgba(8,145,178,0.5)]"
            >
              <Plus className="w-3.5 h-3.5" />
              New Project
            </button>
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

      <div className="flex-1 p-8 space-y-8">
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
                    <button
                      onClick={e => { e.stopPropagation(); onDelete(p.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-950/50 rounded transition-all text-slate-600 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
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
                onClick={() => onNew(t.name)}
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
    </div>
  );
}
