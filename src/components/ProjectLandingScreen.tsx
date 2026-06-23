import { useState } from 'react';
import { Plus, FolderOpen, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  type: 'analog' | 'plc' | 'digital' | 'robot';
  onNew: (name: string, type: 'analog' | 'plc' | 'digital' | 'robot') => void;
  onOpen: () => void;
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

export default function ProjectLandingScreen({ type, onNew, onOpen }: Props) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const info = TYPE_LABELS[type];

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-8 h-full">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-10 text-center shadow-2xl relative overflow-hidden"
      >
        <div className={`absolute inset-0 pointer-events-none ${info.bg}`} />
        
        <div className={`w-20 h-20 mx-auto bg-gradient-to-br ${info.iconBg} border ${info.iconBorder} rounded-2xl flex items-center justify-center text-4xl mb-6 ${info.shadow}`}>
          {info.icon}
        </div>
        
        <h2 className="text-3xl font-black text-white tracking-tight mb-3">
          {info.title}
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-10">
          You have entered the {info.title} environment, but no project is currently active. 
          Create a new project or open an existing one to continue.
        </p>

        {!creating ? (
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <button
              onClick={() => setCreating(true)}
              className={`flex items-center justify-center gap-2 px-6 py-3 text-white rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${info.btnBg} ${info.btnHover} ${info.btnShadow}`}
            >
              <Plus size={16} /> New Project
            </button>
            <button
              onClick={onOpen}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-bold uppercase tracking-widest transition-all"
            >
              <FolderOpen size={16} /> Open Existing
            </button>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col gap-3 max-w-xs mx-auto"
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
      </motion.div>
    </div>
  );
}
