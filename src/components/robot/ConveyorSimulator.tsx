import { useRef, useEffect, useCallback } from 'react';
import type { RobotSimulationState, CIMWorkpiece } from '@/lib/robot-types';

interface Props {
  simState: RobotSimulationState;
  onUpdateSim: (updater: (prev: RobotSimulationState) => RobotSimulationState) => void;
  onAddLog: (msg: string) => void;
}

const COLOR_HEX: Record<string, string> = {
  red: '#ef4444', green: '#10b981', blue: '#3b82f6',
  yellow: '#f59e0b', white: '#e2e8f0', orange: '#f97316',
};
const BIN_Y: Record<string, number> = {
  red: 40, green: 90, blue: 140, yellow: 190, white: 240, orange: 290,
};
const COLORS = ['red', 'green', 'blue', 'yellow', 'white'];

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function ConveyorSimulator({ simState, onUpdateSim, onAddLog }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const beltOffsetRef = useRef<number>(0);
  const simRef = useRef(simState);
  simRef.current = simState;

  const SPAWN_INTERVAL = 2200; // ms between spawns

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = (ts: number) => {
      frameRef.current = requestAnimationFrame(draw);
      const dt = ts - lastTimeRef.current;
      if (dt < 14) return;
      lastTimeRef.current = ts;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }
      ctx.save();
      ctx.scale(dpr, dpr);
      const W = rect.width;
      const H = rect.height;

      const sim = simRef.current;
      const speed = sim.conveyorSpeed * sim.speed;
      const running = sim.isRunning;

      // Belt layout
      const BELT_Y = H / 2 - 30;
      const BELT_H = 50;
      const BELT_X0 = 80;
      const BELT_X1 = W - 160;
      const BELT_W = BELT_X1 - BELT_X0;
      const SENSOR_X = BELT_X1 - 80;
      const SORTER_X = BELT_X1 - 40;
      const BIN_X = BELT_X1 + 20;
      const BIN_W = 100;
      const BIN_H = 36;

      // Animate belt offset
      if (running) {
        beltOffsetRef.current = (beltOffsetRef.current + speed * dt * 0.04) % 30;
        spawnTimerRef.current += dt;

        // Spawn workpieces
        if (spawnTimerRef.current >= SPAWN_INTERVAL / speed) {
          spawnTimerRef.current = 0;
          const color = COLORS[Math.floor(Math.random() * COLORS.length)];
          const id = Math.random().toString(36).substring(2, 9);
          onUpdateSim(prev => ({
            ...prev,
            workpieces: [
              ...prev.workpieces,
              { id, x: BELT_X0 - 20, y: BELT_Y, color, type: 'raw', timestamp: Date.now() },
            ],
          }));
          onAddLog(`[Vision] New workpiece spawned: ${color.toUpperCase()}`);
        }

        // Move workpieces & detect / sort
        onUpdateSim(prev => {
          let processed = prev.totalProcessed;
          let rejected = prev.totalRejected;
          const updated: CIMWorkpiece[] = [];
          const newLogs: string[] = [];

          for (const wp of prev.workpieces) {
            if (wp.type !== 'raw') {
              updated.push(wp);
              continue;
            }
            const nx = wp.x + speed * dt * 0.06;

            // Vision sensor detection
            if (wp.x < SENSOR_X && nx >= SENSOR_X && prev.visionActive) {
              newLogs.push(`[Vision] Detected ${wp.color.toUpperCase()} at sensor`);
            }

            // Sorter gate — direct to bin
            if (nx >= SORTER_X) {
              processed++;
              newLogs.push(`[Sorter] ${wp.color.toUpperCase()} → Bin ${wp.color.toUpperCase()}`);
              updated.push({ ...wp, type: 'sorted' });
            } else {
              updated.push({ ...wp, x: nx });
            }
          }

          newLogs.forEach(msg => onAddLog(msg));

          return {
            ...prev,
            workpieces: updated.filter(wp => wp.type !== 'sorted' || true), // keep sorted for display
            totalProcessed: processed,
            totalRejected: rejected,
          };
        });
      }

      // ── BG ──
      ctx.fillStyle = '#06080d';
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.02)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // ── Left drive roller ──
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(BELT_X0, BELT_Y + BELT_H / 2, BELT_H / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // ── Right drive roller ──
      ctx.beginPath();
      ctx.arc(BELT_X1, BELT_Y + BELT_H / 2, BELT_H / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // ── Belt body ──
      ctx.fillStyle = '#1a1f2e';
      ctx.strokeStyle = '#2d3748';
      ctx.lineWidth = 2;
      ctx.fillRect(BELT_X0, BELT_Y, BELT_W, BELT_H);
      ctx.strokeRect(BELT_X0, BELT_Y, BELT_W, BELT_H);

      // Belt stripes (animated)
      ctx.save();
      ctx.rect(BELT_X0, BELT_Y, BELT_W, BELT_H);
      ctx.clip();
      const stripeColor = running ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.04)';
      ctx.strokeStyle = stripeColor;
      ctx.lineWidth = 1.5;
      for (let x = BELT_X0 - 30 + beltOffsetRef.current; x < BELT_X1 + 30; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, BELT_Y);
        ctx.lineTo(x - 10, BELT_Y + BELT_H);
        ctx.stroke();
      }
      ctx.restore();

      // Belt top surface edge
      ctx.strokeStyle = running ? 'rgba(52,211,153,0.3)' : 'rgba(100,116,139,0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(BELT_X0, BELT_Y);
      ctx.lineTo(BELT_X1, BELT_Y);
      ctx.stroke();

      // ── VISION SENSOR ──
      const sensorH = 60;
      ctx.fillStyle = sim.visionActive && running ? 'rgba(56,189,248,0.06)' : 'rgba(56,189,248,0.02)';
      drawRoundRect(ctx, SENSOR_X - 24, BELT_Y - sensorH - 4, 48, sensorH, 4);
      ctx.fill();
      ctx.strokeStyle = sim.visionActive ? '#38bdf8' : '#334155';
      ctx.lineWidth = 1;
      drawRoundRect(ctx, SENSOR_X - 24, BELT_Y - sensorH - 4, 48, sensorH, 4);
      ctx.stroke();
      ctx.fillStyle = sim.visionActive ? '#38bdf8' : '#475569';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('VISION', SENSOR_X, BELT_Y - sensorH + 12);
      ctx.fillText('SENSOR', SENSOR_X, BELT_Y - sensorH + 22);
      // Sensor LED
      ctx.fillStyle = sim.visionActive && running ? '#22d3ee' : '#1e293b';
      ctx.beginPath();
      ctx.arc(SENSOR_X, BELT_Y - sensorH + 36, 5, 0, Math.PI * 2);
      ctx.fill();
      // Beam
      if (sim.visionActive && running) {
        const grad = ctx.createLinearGradient(SENSOR_X, BELT_Y - 4, SENSOR_X, BELT_Y + BELT_H);
        grad.addColorStop(0, 'rgba(56,189,248,0.4)');
        grad.addColorStop(1, 'rgba(56,189,248,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(SENSOR_X - 3, BELT_Y - 4, 6, BELT_H);
      }

      // ── SORTER GATE ──
      ctx.strokeStyle = running ? '#f59e0b' : '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(SORTER_X, BELT_Y - 20);
      ctx.lineTo(SORTER_X, BELT_Y + BELT_H + 20);
      ctx.stroke();
      ctx.fillStyle = running ? '#f59e0b' : '#475569';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SORT', SORTER_X, BELT_Y - 25);

      // ── SORTING BINS ──
      const binColors = COLORS;
      const binCounts: Record<string, number> = {};
      sim.workpieces.filter(wp => wp.type === 'sorted').forEach(wp => {
        binCounts[wp.color] = (binCounts[wp.color] || 0) + 1;
      });

      binColors.forEach((color, i) => {
        const binY = 30 + i * (BIN_H + 10);
        const count = binCounts[color] || 0;
        const hex = COLOR_HEX[color];

        ctx.fillStyle = hex + '15';
        drawRoundRect(ctx, BIN_X, binY, BIN_W, BIN_H, 4);
        ctx.fill();
        ctx.strokeStyle = hex + '60';
        ctx.lineWidth = 1;
        drawRoundRect(ctx, BIN_X, binY, BIN_W, BIN_H, 4);
        ctx.stroke();

        // Fill level
        if (count > 0) {
          const fillW = Math.min(BIN_W - 4, (count / 10) * (BIN_W - 4));
          ctx.fillStyle = hex + '40';
          drawRoundRect(ctx, BIN_X + 2, binY + 2, fillW, BIN_H - 4, 3);
          ctx.fill();
        }

        ctx.fillStyle = hex;
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${color.toUpperCase()} (${count})`, BIN_X + BIN_W / 2, binY + BIN_H / 2 + 3);
      });

      // ── WORKPIECES on belt ──
      sim.workpieces.filter(wp => wp.type === 'raw').forEach(wp => {
        const hex = COLOR_HEX[wp.color] || '#94a3b8';
        ctx.fillStyle = hex;
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        drawRoundRect(ctx, wp.x - 18, BELT_Y - 12, 36, BELT_H + 8, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(wp.color.slice(0, 3).toUpperCase(), wp.x, BELT_Y + BELT_H / 2 + 2);
      });

      // ── STATS ──
      ctx.fillStyle = 'rgba(6,8,13,0.85)';
      drawRoundRect(ctx, 10, 10, 190, 90, 5);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      drawRoundRect(ctx, 10, 10, 190, 90, 5);
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('CIM CONVEYOR SYSTEM', 20, 28);
      ctx.fillStyle = '#64748b';
      ctx.font = '8px monospace';
      ctx.fillText(`Status:     ${running ? 'RUNNING' : 'STOPPED'}`, 20, 44);
      ctx.fillStyle = running ? '#34d399' : '#ef4444';
      ctx.fillText(running ? '● RUNNING' : '■ STOPPED', 110, 44);
      ctx.fillStyle = '#64748b';
      ctx.fillText(`Speed:      ${sim.conveyorSpeed}x`, 20, 56);
      ctx.fillText(`Processed:  ${sim.totalProcessed}`, 20, 68);
      ctx.fillText(`Vision:     ${sim.visionActive ? 'ON' : 'OFF'}`, 20, 80);
      ctx.fillText(`On Belt:    ${sim.workpieces.filter(w => w.type === 'raw').length}`, 120, 56);

      ctx.restore();
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [onUpdateSim, onAddLog]);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <div className="flex-1 relative bg-[#06080d] overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
      <div className="h-10 bg-[#0a0c12] border-t border-white/5 flex items-center px-4 gap-6 text-[9px] font-mono shrink-0">
        <span className="text-zinc-400 font-bold">Conveyor:</span>
        <span className={simState.isRunning ? 'text-emerald-400' : 'text-zinc-500'}>{simState.isRunning ? 'RUNNING' : 'STOPPED'}</span>
        <span className="text-zinc-400 font-bold">Vision:</span>
        <span className={simState.visionActive ? 'text-blue-400' : 'text-zinc-500'}>{simState.visionActive ? 'ACTIVE' : 'OFF'}</span>
        <span className="text-zinc-400 font-bold">Speed:</span>
        <span className="text-zinc-300">{simState.conveyorSpeed}x</span>
        <span className="text-zinc-400 font-bold">Processed:</span>
        <span className="text-emerald-400 font-bold">{simState.totalProcessed}</span>
        <span className="text-zinc-400 font-bold">On Belt:</span>
        <span className="text-amber-400">{simState.workpieces.filter(w => w.type === 'raw').length}</span>
      </div>
    </div>
  );
}


