import { useRef, useEffect, useState, useCallback } from 'react';
import type { RobotDesignConfig, RobotSimulationState } from '@/lib/robot-types';
import { solveIK, forwardKinematics } from '@/lib/ik-solver';

interface Props {
  config: RobotDesignConfig;
  simState: RobotSimulationState;
  onJointChange: (jointId: string, angle: number) => void;
}

interface Trail {
  x: number;
  y: number;
  age: number;
}

const RAD = (d: number) => d * Math.PI / 180;
const DEG = (r: number) => r * 180 / Math.PI;

export function RobotWorkspace({ config, simState, onJointChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ikTarget, setIkTarget] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingTarget, setIsDraggingTarget] = useState(false);
  const [livePositions, setLivePositions] = useState<{ x: number; y: number }[]>([]);
  const trailRef = useRef<Trail[]>([]);
  const animFrameRef = useRef<number>(0);
  const targetAnimRef = useRef<{ x: number; y: number } | null>(null);
  const [hovered, setHovered] = useState(false);

  // Keep target in sync
  useEffect(() => { targetAnimRef.current = ikTarget; }, [ikTarget]);

  const getCanvasXY = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingTarget) return;
    const { x, y } = getCanvasXY(e);
    setIkTarget({ x, y });
  }, [isDraggingTarget, getCanvasXY]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!ikTarget) return;
    const { x, y } = getCanvasXY(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    const tx = ikTarget.x * dpr;
    const ty = ikTarget.y * dpr;
    const px = x;
    const py = y;
    if (Math.hypot(px - tx, py - ty) < 20) {
      setIsDraggingTarget(true);
      e.preventDefault();
    }
  }, [ikTarget, getCanvasXY]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingTarget) return;
    const { x, y } = getCanvasXY(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    setIkTarget({ x: x / dpr, y: y / dpr });
  }, [isDraggingTarget, getCanvasXY]);

  const handleMouseUp = useCallback(() => setIsDraggingTarget(false), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId = 0;
    let lastTime = 0;

    const draw = (time: number) => {
      frameId = requestAnimationFrame(draw);
      if (time - lastTime < 16) return; // ~60fps cap
      lastTime = time;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      }
      const W = rect.width;
      const H = rect.height;

      // Solve IK if target set
      let positions: { x: number; y: number }[] = [];
      if (targetAnimRef.current) {
        const ikJoints = config.joints.map(j => ({
          ...j,
          length: j.length * 0.6, // scale down to canvas pixels
        }));
        const result = solveIK(
          { x: config.baseX * (W / 800), y: config.baseY * (H / 600) },
          { x: targetAnimRef.current.x, y: targetAnimRef.current.y },
          ikJoints,
        );
        positions = result.positions;
        // Update joint angles
        if (result.converged || result.iterations > 0) {
          result.jointAngles.forEach((absAngle, i) => {
            if (i < config.joints.length) {
              const prevAngle = i === 0 ? 0 : result.jointAngles[i - 1];
              const localDeg = DEG(absAngle - prevAngle);
              const clamped = Math.max(config.joints[i].minAngle, Math.min(config.joints[i].maxAngle, localDeg));
              onJointChange(config.joints[i].id, Math.round(clamped * 10) / 10);
            }
          });
        }
        // Update trail
        const end = positions[positions.length - 1];
        if (end) {
          trailRef.current.push({ x: end.x, y: end.y, age: 0 });
          if (trailRef.current.length > 120) trailRef.current.shift();
          trailRef.current.forEach(t => t.age++);
        }
        setLivePositions(positions);
      } else {
        // Forward kinematics only
        const base = { x: config.baseX * (W / 800), y: config.baseY * (H / 600) };
        const fkJoints = config.joints.map(j => ({ ...j, length: j.length * 0.6 }));
        positions = forwardKinematics(base, fkJoints);
        setLivePositions(positions);
      }

      // ── Background ──
      ctx.fillStyle = '#06080d';
      ctx.fillRect(0, 0, W, H);

      // ── Fine grid ──
      ctx.strokeStyle = 'rgba(255,255,255,0.025)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // ── Work envelope (reachability arc) ──
      const bx = config.baseX * (W / 800);
      const by = config.baseY * (H / 600);
      const totalReach = config.joints.reduce((s, j) => s + j.length * 0.6, 0);
      const minReach = config.joints.length > 0 ? config.joints[0].length * 0.6 : 0;
      ctx.strokeStyle = 'rgba(52,211,153,0.07)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.arc(bx, by, totalReach, 0, Math.PI * 2);
      ctx.stroke();
      if (minReach > 0) {
        ctx.beginPath();
        ctx.arc(bx, by, minReach, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // ── Floor line ──
      ctx.strokeStyle = 'rgba(100,116,139,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, H - 30);
      ctx.lineTo(W, H - 30);
      ctx.stroke();

      // ── Trail ──
      trailRef.current.forEach((t, i) => {
        const alpha = Math.max(0, 1 - t.age / 120);
        ctx.fillStyle = `rgba(52,211,153,${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // ── Arm segments ──
      if (positions.length >= 2) {
        for (let i = 0; i < positions.length - 1; i++) {
          const p1 = positions[i];
          const p2 = positions[i + 1];
          const joint = config.joints[i];
          const conducting = simState.isRunning;

          // Shadow
          ctx.strokeStyle = 'rgba(0,0,0,0.5)';
          ctx.lineWidth = 10;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(p1.x + 2, p1.y + 2);
          ctx.lineTo(p2.x + 2, p2.y + 2);
          ctx.stroke();

          // Main segment
          const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
          grad.addColorStop(0, joint.color + 'cc');
          grad.addColorStop(1, joint.color + '88');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          // Segment highlight
          ctx.strokeStyle = 'rgba(255,255,255,0.12)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          // Joint circle
          ctx.fillStyle = '#0a0b0e';
          ctx.strokeStyle = joint.color;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(p2.x, p2.y, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Glow when running
          if (conducting) {
            ctx.strokeStyle = joint.color + '40';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(p2.x, p2.y, 14, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Joint label
          ctx.fillStyle = joint.color;
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(joint.name, p2.x, p2.y - 18);
          ctx.fillStyle = '#64748b';
          ctx.font = '7px monospace';
          const absAngle = i === 0 ? joint.angle : config.joints.slice(0, i + 1).reduce((s, j) => s + j.angle, 0);
          ctx.fillText(`${joint.angle.toFixed(1)}°`, p2.x, p2.y + 22);
        }
      }

      // ── Base pedestal ──
      const gradient = ctx.createRadialGradient(bx, by, 0, bx, by, 28);
      gradient.addColorStop(0, '#1e293b');
      gradient.addColorStop(1, '#0f172a');
      ctx.fillStyle = gradient;
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(bx, by, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BASE', bx, by + 4);

      // ── End effector ──
      if (positions.length > 0) {
        const end = positions[positions.length - 1];
        const ee = config.endEffector;
        const eeColor = simState.isRunning ? '#34d399' : '#94a3b8';

        if (ee === 'gripper') {
          ctx.strokeStyle = eeColor;
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          [-1, 1].forEach(side => {
            ctx.beginPath();
            ctx.moveTo(end.x, end.y);
            ctx.lineTo(end.x + side * 12, end.y - 14);
            ctx.lineTo(end.x + side * 6, end.y - 22);
            ctx.stroke();
          });
        } else if (ee === 'welder') {
          ctx.fillStyle = eeColor + '30';
          ctx.beginPath();
          ctx.arc(end.x, end.y, simState.isRunning ? 24 : 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = eeColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(end.x, end.y, 7, 0, Math.PI * 2);
          ctx.stroke();
          if (simState.isRunning) {
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(end.x + (Math.random() - 0.5) * 4, end.y + (Math.random() - 0.5) * 4, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (ee === 'camera') {
          ctx.fillStyle = '#0a0b0e';
          ctx.strokeStyle = eeColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(end.x, end.y, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(end.x, end.y, 5, 0, Math.PI * 2);
          ctx.fill();
          if (simState.isRunning && simState.visionActive) {
            ctx.strokeStyle = 'rgba(56,189,248,0.3)';
            ctx.setLineDash([3, 5]);
            ctx.beginPath();
            ctx.moveTo(end.x - 20, end.y + 15);
            ctx.lineTo(end.x, end.y + 2);
            ctx.lineTo(end.x + 20, end.y + 15);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        } else if (ee === 'vacuum') {
          ctx.fillStyle = eeColor + '20';
          ctx.strokeStyle = eeColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(end.x, end.y, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.strokeStyle = eeColor + '60';
          ctx.setLineDash([2, 4]);
          ctx.beginPath();
          ctx.arc(end.x, end.y, 18, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          ctx.fillStyle = eeColor + '20';
          ctx.strokeStyle = eeColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(end.x, end.y, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        ctx.fillStyle = eeColor;
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ee.toUpperCase(), end.x, end.y + 32);
        ctx.fillStyle = '#64748b';
        ctx.font = '7px monospace';
        ctx.fillText(`(${Math.round(end.x)}, ${Math.round(end.y)})`, end.x, end.y + 42);
      }

      // ── IK Target ──
      if (targetAnimRef.current) {
        const t = targetAnimRef.current;
        ctx.strokeStyle = 'rgba(250,204,21,0.8)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(t.x, t.y, 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(250,204,21,0.6)';
        ctx.lineWidth = 1;
        [[-18, 0], [18, 0], [0, -18], [0, 18]].forEach(([dx, dy]) => {
          ctx.beginPath();
          ctx.moveTo(t.x + dx * 0.4, t.y + dy * 0.4);
          ctx.lineTo(t.x + dx, t.y + dy);
          ctx.stroke();
        });
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`IK TARGET (${Math.round(t.x)},${Math.round(t.y)})`, t.x + 18, t.y - 4);
      }

      // ── Info overlay ──
      ctx.fillStyle = 'rgba(6,8,13,0.85)';
      ctx.fillRect(10, 10, 160, 72);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, 160, 72);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('ROBOT ARM TELEMETRY', 18, 26);
      ctx.fillStyle = '#64748b';
      ctx.font = '8px monospace';
      const reach = config.joints.reduce((s, j) => s + j.length, 0);
      ctx.fillText(`Joints: ${config.joints.length}   Reach: ${reach}mm`, 18, 40);
      ctx.fillText(`End Effector: ${config.endEffector.toUpperCase()}`, 18, 52);
      ctx.fillStyle = simState.isRunning ? '#34d399' : '#64748b';
      ctx.fillText(`Status: ${simState.isRunning ? 'RUNNING' : 'IDLE'}`, 18, 64);
      ctx.fillText(`IK: ${ikTarget ? 'ACTIVE' : 'Click canvas to set target'}`, 18, 76);
    };

    frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, [config, simState, ikTarget, onJointChange]);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <div className="flex-1 relative bg-[#06080d] overflow-hidden"
        onMouseLeave={() => setHovered(false)}
        onMouseEnter={() => setHovered(true)}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
        {!ikTarget && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/50 border border-emerald-400 dark:border-white/10 rounded text-[9px] font-mono text-zinc-500 pointer-events-none">
            Click anywhere to set IK target · Drag target to move
          </div>
        )}
        {ikTarget && (
          <button
            className="absolute top-3 right-3 px-2 py-1 bg-[#111318] border border-emerald-400 dark:border-white/10 rounded text-[9px] font-mono text-zinc-500 hover:text-red-400 hover:border-red-500/30 transition-colors"
            onClick={(e) => { e.stopPropagation(); setIkTarget(null); trailRef.current = []; }}
          >
            Clear IK Target
          </button>
        )}
      </div>
      {/* Joint sliders */}
      <div className="shrink-0 bg-[#0a0c12] border-t border-emerald-300 dark:border-white/5 px-4 py-2">
        <div className="flex items-center gap-4 overflow-x-auto">
          {config.joints.map(joint => (
            <div key={joint.id} className="flex flex-col gap-1 min-w-[100px]">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-bold font-mono" style={{ color: joint.color }}>{joint.name}</span>
                <span className="text-[8px] font-mono text-zinc-500">{joint.angle.toFixed(1)}°</span>
              </div>
              <input
                type="range"
                min={joint.minAngle}
                max={joint.maxAngle}
                step={1}
                value={joint.angle}
                onChange={e => { setIkTarget(null); onJointChange(joint.id, parseFloat(e.target.value)); }}
                className="w-full h-1 appearance-none cursor-pointer"
                style={{ accentColor: joint.color }}
              />
              <div className="flex justify-between text-[7px] font-mono text-zinc-700">
                <span>{joint.minAngle}°</span>
                <span>{joint.maxAngle}°</span>
              </div>
            </div>
          ))}
          <div className="ml-auto flex flex-col gap-1 text-[8px] font-mono text-zinc-600 shrink-0 pl-4 border-l border-emerald-300 dark:border-white/5">
            <span>Reach: {config.joints.reduce((s, j) => s + j.length, 0)}mm</span>
            <span>DOF: {config.joints.length}</span>
            <span>Status: <span className={simState.isRunning ? 'text-emerald-400' : 'text-zinc-500'}>{simState.isRunning ? 'ACTIVE' : 'IDLE'}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}


