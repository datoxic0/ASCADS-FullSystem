import React from 'react';
import { motion } from 'motion/react';
import { Shield, Zap, Activity, Cpu, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface MatrixStatusProps {
  isSimulating: boolean;
  errorCount: number;
  componentCount: number;
  netCount: number;
}

export default function MatrixStatus({ isSimulating, errorCount, componentCount, netCount }: MatrixStatusProps) {
  return (
    <div className="flex items-center gap-6 px-6 py-2 bg-slate-900 border-t border-slate-800 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-20">
      <div className="flex items-center gap-4 border-r border-slate-800 pr-6">
        <div className={`w-3 h-3 rounded-full ${isSimulating ? 'bg-emerald-500 shadow-[0_0_12px_#10b981] animate-pulse' : 'bg-slate-700'}`} />
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none mb-1">Matrix Status</span>
          <span className="text-[10px] font-mono font-bold text-white uppercase">{isSimulating ? 'Node Active' : 'Matrix Stable'}</span>
        </div>
      </div>

      <div className="flex items-center gap-8 flex-1">
        <div className="flex items-center gap-3">
          <Cpu size={14} className="text-indigo-400" />
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Nodes</span>
            <span className="text-[10px] font-mono font-bold text-slate-300">{componentCount.toString().padStart(3, '0')}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Activity size={14} className="text-sky-400" />
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Nets</span>
            <span className="text-[10px] font-mono font-bold text-slate-300">{netCount.toString().padStart(3, '0')}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {errorCount > 0 ? (
            <AlertTriangle size={14} className="text-amber-500 animate-pulse" />
          ) : (
            <CheckCircle2 size={14} className="text-emerald-500" />
          )}
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">DRC</span>
            <span className={`text-[10px] font-mono font-bold ${errorCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {errorCount > 0 ? `${errorCount} VIOLATIONS` : 'PASSED'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-slate-950/50 px-4 py-1.5 rounded-full border border-slate-800">
        <Shield size={12} className="text-indigo-400" />
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Voice & Eye encrypted link active</span>
      </div>
    </div>
  );
}
