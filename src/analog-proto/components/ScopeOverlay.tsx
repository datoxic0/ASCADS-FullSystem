import React, { useEffect, useRef } from 'react';
import { CircuitDesign } from '../types';
import { Activity, X } from 'lucide-react';

interface ScopeOverlayProps {
  design: CircuitDesign;
  scopeHistory: React.MutableRefObject<{ ch1: number[]; ch2: number[] }>;
}

export default function ScopeOverlay({ design, scopeHistory }: ScopeOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const scopes = design.components.filter(c => c.type === 'OSCILLOSCOPE');
  
  useEffect(() => {
    if (scopes.length === 0) return;
    
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.1)';
      ctx.lineWidth = 1;
      for(let i=0; i<canvas.width; i+=20) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      }
      for(let i=0; i<canvas.height; i+=20) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
      }

      // Center line
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
      ctx.beginPath(); ctx.moveTo(0, canvas.height/2); ctx.lineTo(canvas.width, canvas.height/2); ctx.stroke();

      const { ch1, ch2 } = scopeHistory.current;
      
      const drawChannel = (data: number[], color: string, offset: number) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        
        const step = canvas.width / data.length;
        const scaleY = 20; // 20 pixels per Volt
        
        for (let i = 0; i < data.length; i++) {
          const x = i * step;
          const y = (canvas.height / 2) + offset - (data[i] * scaleY);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };

      drawChannel(ch1, '#fbbf24', -10); // CH1 Yellow, slight offset up
      drawChannel(ch2, '#38bdf8', 10);  // CH2 Blue, slight offset down

      animId = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => cancelAnimationFrame(animId);
  }, [scopes.length, scopeHistory]);

  if (scopes.length === 0) return null;

  return (
    <div className="relative w-full h-48 bg-slate-950/80 border border-indigo-500/30 rounded-2xl shadow-inner flex flex-col overflow-hidden mt-6">
      <div className="px-3 py-2 bg-indigo-950/40 border-b border-indigo-500/20 flex items-center justify-between">
         <div className="flex items-center gap-2">
           <Activity size={14} className="text-indigo-400" />
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Oscilloscope Trace</span>
         </div>
         <div className="flex gap-2 text-[9px] font-bold">
           <span className="text-amber-400">CH1</span>
           <span className="text-sky-400">CH2</span>
         </div>
      </div>
      <div className="flex-1 relative p-2 bg-black/60">
        <canvas 
          ref={canvasRef} 
          width={300} 
          height={140} 
          className="w-full h-full rounded-xl"
        />
      </div>
    </div>
  );
}
