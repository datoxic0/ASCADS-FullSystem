import { useState, useRef } from 'react';
import { Plus, FolderOpen, Clock, ChevronRight, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import type { AnalogProject } from '@/lib/analog-types';

interface Props {
  type: 'analog' | 'plc' | 'digital' | 'robot';
  projects?: AnalogProject[];
  onNew: (name: string, type: 'analog' | 'plc' | 'digital' | 'robot') => void;
  onOpen: (id: string) => void;
  onImport?: (project: AnalogProject) => void;
}

const TYPE_LABELS = {
  analog: { 
    title: 'Analog Schematics', icon: '⚡', 
    bg: 'bg-violet-500/5', iconBg: 'from-violet-900/50 to-slate-900', iconBorder: 'border-violet-500/30', shadow: 'shadow-[0_0_30px_rgba(139,92,246,0.15)]',
    btnBg: 'bg-violet-600', btnHover: 'hover:bg-violet-500', btnShadow: 'shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]',
    inputBorder: 'border-violet-500/50', ringFocus: 'focus:ring-violet-500/30'
  },
  plc: { 
    title: 'Industrial PLC', icon: '🏭', 
    bg: 'bg-blue-500/5', iconBg: 'from-blue-900/50 to-slate-900', iconBorder: 'border-blue-500/30', shadow: 'shadow-[0_0_30px_rgba(59,130,246,0.15)]',
    btnBg: 'bg-blue-600', btnHover: 'hover:bg-blue-500', btnShadow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]',
    inputBorder: 'border-blue-500/50', ringFocus: 'focus:ring-blue-500/30'
  },
  digital: { 
    title: 'Digital Logic', icon: '🧮', 
    bg: 'bg-cyan-500/5', iconBg: 'from-cyan-900/50 to-slate-900', iconBorder: 'border-cyan-500/30', shadow: 'shadow-[0_0_30px_rgba(6,182,212,0.15)]',
    btnBg: 'bg-cyan-600', btnHover: 'hover:bg-cyan-500', btnShadow: 'shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]',
    inputBorder: 'border-cyan-500/50', ringFocus: 'focus:ring-cyan-500/30'
  },
  robot: { 
    title: 'Robot Workspace', icon: '🦾', 
    bg: 'bg-emerald-500/5', iconBg: 'from-emerald-900/50 to-slate-900', iconBorder: 'border-emerald-500/30', shadow: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]',
    btnBg: 'bg-emerald-600', btnHover: 'hover:bg-emerald-500', btnShadow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]',
    inputBorder: 'border-emerald-500/50', ringFocus: 'focus:ring-emerald-500/30'
  },
};

export default function ProjectLandingScreen({ type, projects = [], onNew, onOpen, onImport }: Props) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const info = TYPE_LABELS[type];

  const recentProjects = projects.filter(p => p.type === type).slice(0, 3);

  const fmt = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-8 h-full overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-10 text-center shadow-2xl relative overflow-hidden"
      >
        <div className={`absolute inset-0 pointer-events-none ${info.bg}`} />
        
        <div className={`w-20 h-20 mx-auto bg-gradient-to-br ${info.iconBg} border ${info.iconBorder} rounded-2xl flex items-center justify-center text-4xl mb-6 ${info.shadow}`}>
          {info.icon}
        </div>
        
        <h2 className="text-3xl font-black text-white tracking-tight mb-3">
          {info.title}
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-10 max-w-lg mx-auto">
          You have entered the {info.title} environment, but no project is currently active. 
          Create a new project or open an existing one to continue.
        </p>

        {!creating ? (
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setCreating(true)}
              className={`flex items-center justify-center gap-2 px-8 py-3.5 text-white rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${info.btnBg} ${info.btnHover} ${info.btnShadow}`}
            >
              <Plus size={18} /> New Project
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-bold uppercase tracking-widest transition-all"
            >
              <FolderOpen size={18} /> Upload / Import
            </button>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col gap-3 max-w-sm mx-auto mb-8"
          >
            <input
              autoFocus
              type="text"
              placeholder="Project Name..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newName.trim()) {
                  onNew(newName.trim(), type);
                }
                if (e.key === 'Escape') setCreating(false);
              }}
              className={`w-full bg-slate-950 border ${info.inputBorder} rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 ${info.ringFocus} text-center`}
            />
            <div className="flex gap-2">
              <button
                onClick={() => { if (newName.trim()) onNew(newName.trim(), type); }}
                className={`flex-1 py-2.5 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${info.btnBg} ${info.btnHover}`}
              >
                Create
              </button>
              <button
                onClick={() => setCreating(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {recentProjects.length > 0 && (
          <div className="border-t border-slate-800/50 pt-8 mt-4 text-left">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-1">Recent {info.title} Projects</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentProjects.map(p => (
                <div
                  key={p.id}
                  onClick={() => onOpen(p.id)}
                  className="group relative p-4 bg-slate-950/50 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-all cursor-pointer text-left"
                >
                  <p className="text-sm font-bold text-slate-200 mb-1 truncate pr-6">{p.name}</p>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {fmt(p.updatedAt)}
                  </p>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 group-hover:text-slate-400 transition-colors" />
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

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
                // Ensure the imported project matches the current section
                if (!project.type) project.type = 'analog';
                onImport({ ...project, type });
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
