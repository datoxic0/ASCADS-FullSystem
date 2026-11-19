import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Binary,
  Timer,
  Hash,
  SlidersHorizontal,
  RotateCcw,
  Info,
  Activity,
} from 'lucide-react';

import {
  andBlock,
  onDelay,
  upDownCounter,
  analogThresholdTrigger,
  type Digital,
} from '@/lib/engines/fbdBlocks';

/** Toggle switch styled to match the app's dark slate theme. */
function Toggle({ label, value, onChange }: { label: string; value: Digital; onChange: (v: Digital) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(value === 1 ? 0 : 1)}
      aria-pressed={value === 1}
      className="group flex items-center gap-2 select-none"
    >
      <span
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          value === 1 ? 'bg-purple-500/90 shadow-[0_0_10px_rgba(168,85,247,0.45)]' : 'bg-slate-700'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-slate-100 transition-transform ${
            value === 1 ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-200 transition-colors">{label}</span>
    </button>
  );
}

/** LED readout. */
function Led({ on, label }: { on: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
      <span
        className={`w-4 h-4 rounded-full border ${
          on
            ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.7)]'
            : 'bg-slate-800 border-slate-700'
        }`}
      />
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      <span className={`ml-auto font-mono text-xs font-bold ${on ? 'text-emerald-300' : 'text-slate-500'}`}>{on ? '1' : '0'}</span>
    </div>
  );
}

const CLOCK_TICK_MS = 50;

const panelCls = 'rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden';
const panelHeaderCls = 'flex items-center gap-2 border-b border-slate-800 bg-slate-900/70 px-4 py-2.5';
const panelTitleCls = 'text-xs font-black uppercase tracking-widest text-slate-200';
const panelBlurbCls = 'text-[10px] text-slate-500 mt-0.5';
const btnCls = 'inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:border-purple-500/50 hover:text-purple-200 transition-colors';
const numInputCls = 'w-24 rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 font-mono text-[11px] text-slate-200 focus:border-purple-500/50 focus:outline-none';

/** Stable interval hook (cb identity may change freely between renders). */
function useInterval(cb: () => void, ms: number) {
  const saved = useRef(cb);
  useEffect(() => {
    saved.current = cb;
  });
  useEffect(() => {
    const id = window.setInterval(() => saved.current(), ms);
    return () => window.clearInterval(id);
  }, [ms]);
}

/** Shared chrome for one live block demo panel. */
function Panel(props: {
  icon: React.ReactNode;
  title: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <section className={panelCls}>
      <div className={panelHeaderCls}>
        <span className="text-purple-400">{props.icon}</span>
        <div>
          <div className={panelTitleCls}>{props.title}</div>
          <div className={panelBlurbCls}>{props.blurb}</div>
        </div>
      </div>
      <div className="p-4 space-y-4">{props.children}</div>
    </section>
  );
}

/* ── Demo 1: AND ─────────────────────────────────────────────────────── */
function AndDemo() {
  const [inputs, setInputs] = useState<[Digital, Digital, Digital, Digital]>([1, 1, 1, 1]);
  const q = useMemo(() => andBlock().tick([...inputs]), [inputs]);
  const setAt = (idx: number) => (v: Digital) =>
    setInputs((prev) => prev.map((p, i) => (i === idx ? v : p)) as [Digital, Digital, Digital, Digital]);
  return (
    <Panel
      icon={<Binary className="w-4 h-4" />}
      title="AND — basic bit logic"
      blurb="Unused tail inputs default to 1 (documented); aggregate = 1 only when all wired inputs are 1"
    >
      <div className="grid grid-cols-2 gap-3">
        <Toggle label="I1" value={inputs[0]} onChange={setAt(0)} />
        <Toggle label="I2" value={inputs[1]} onChange={setAt(1)} />
        <Toggle label="I3" value={inputs[2]} onChange={setAt(2)} />
        <Toggle label="I4" value={inputs[3]} onChange={setAt(3)} />
      </div>
      <Led on={q === 1} label="Q" />
      <p className="font-mono text-[10px] text-slate-500">Q = {inputs.join(' ∧ ')} → {q}</p>
    </Panel>
  );
}

/* ── Demo 2: On-delay timer ──────────────────────────────────────────── */
function OnDelayDemo() {
  const [trg, setTrg] = useState<Digital>(1);
  const [tMs, setTMs] = useState(2000);
  const [out, setOut] = useState<{ q: Digital; taMs: number }>({ q: 0, taMs: 0 });
  const blockRef = useRef<ReturnType<typeof onDelay> | null>(null);
  const startedAt = useRef(performance.now());
  const trgRef = useRef(trg);
  trgRef.current = trg;

  useEffect(() => {
    blockRef.current = onDelay(tMs);
    startedAt.current = performance.now();
    setOut({ q: 0, taMs: 0 });
  }, [tMs]);

  useInterval(() => {
    const blk = blockRef.current;
    if (!blk) return;
    setOut(blk.tick({ trg: trgRef.current }, performance.now() - startedAt.current));
  }, CLOCK_TICK_MS);

  const reset = () => {
    blockRef.current = onDelay(tMs);
    startedAt.current = performance.now();
    setOut({ q: 0, taMs: 0 });
  };

  const progress = Math.min(100, (out.taMs / Math.max(1, tMs)) * 100);
  return (
    <Panel
      icon={<Timer className="w-4 h-4" />}
      title="On-delay timer"
      blurb="Ta accumulates while Trg = 1; Q rises at Ta = T (topic 12228447243)"
    >
      <div className="flex flex-wrap items-center gap-4">
        <Toggle label="Trg" value={trg} onChange={setTrg} />
        <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          T (ms)
          <input
            type="number"
            min={100}
            max={60000}
            step={100}
            value={tMs}
            onChange={(e) => setTMs(Math.max(100, Math.min(60000, Number(e.target.value) || 100)))}
            className={numInputCls}
          />
        </label>
        <button type="button" onClick={reset} className={btnCls} title="Re-create the block instance">
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
          <span>Ta = {Math.round(out.taMs)} ms</span>
          <span>T = {tMs} ms</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div className="h-full bg-purple-500 transition-all duration-100" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <Led on={out.q === 1} label="Q" />
    </Panel>
  );
}

/* ── Demo 3: Up/down counter ─────────────────────────────────────────── */
function CounterDemo() {
  const [trg, setTrg] = useState<Digital>(0);
  const [onVal, setOnVal] = useState(6);
  const [offVal, setOffVal] = useState(2);
  const [dir, setDir] = useState<0 | 1>(0);
  const [out, setOut] = useState<{ q: Digital; value: number }>({ q: 0, value: 0 });
  const blockRef = useRef<ReturnType<typeof upDownCounter> | null>(null);
  const trgRef = useRef(trg);
  trgRef.current = trg;

  useEffect(() => {
    blockRef.current = upDownCounter({ on: onVal, off: offVal, dir });
    setOut({ q: 0, value: 0 });
  }, [onVal, offVal, dir]);

  useInterval(() => {
    const blk = blockRef.current;
    if (!blk) return;
    setOut(blk.tick({ trg: trgRef.current }, performance.now()));
  }, CLOCK_TICK_MS);

  const reset = () => {
    blockRef.current = upDownCounter({ on: onVal, off: offVal, dir });
    setOut({ q: 0, value: 0 });
  };

  return (
    <Panel
      icon={<Hash className="w-4 h-4" />}
      title="Up/down counter"
      blurb="Counts 0→1 edges only; Q per two-case threshold (ON ≥ OFF variant)"
    >
      <div className="flex flex-wrap items-center gap-4">
        <Toggle label="Trg" value={trg} onChange={setTrg} />
        <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          ON
          <input type="number" min={0} max={999999} value={onVal}
            onChange={(e) => setOnVal(Math.max(0, Math.min(999999, Math.trunc(Number(e.target.value) || 0))))}
            className={numInputCls} />
        </label>
        <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          OFF
          <input type="number" min={0} max={999999} value={offVal}
            onChange={(e) => setOffVal(Math.max(0, Math.min(999999, Math.trunc(Number(e.target.value) || 0))))}
            className={numInputCls} />
        </label>
        <button type="button" onClick={() => setDir((d) => (d === 0 ? 1 : 0))} className={btnCls} title="0 = up, 1 = down">
          Dir: {dir === 0 ? 'Up' : 'Down'}
        </button>
        <button type="button" onClick={reset} className={btnCls} title="Re-create the block instance">
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Count</span>
        <span className="font-mono text-lg font-bold text-purple-300 tabular-nums">{out.value}</span>
      </div>
      <Led on={out.q === 1} label="Q" />
      <p className="text-[9px] text-slate-600">Toggle Trg off → on to count an edge. Internal value saturates at 0 / 999999.</p>
    </Panel>
  );
}

/* Demo 4: Analog threshold trigger */
function AnalogThresholdDemo() {
  const [ax, setAx] = useState(500);
  const [onVal, setOnVal] = useState(650);
  const [offVal, setOffVal] = useState(350);
  const [out, setOut] = useState<{ q?: Digital; actual: number }>({ q: 0, actual: 0 });
  const blockRef = useRef<ReturnType<typeof analogThresholdTrigger> | null>(null);
  const axRef = useRef(ax);
  axRef.current = ax;

  useEffect(() => {
    blockRef.current = analogThresholdTrigger({ gain: 1, offset: 0, on: onVal, off: offVal });
  }, [onVal, offVal]);

  useInterval(() => {
    const blk = blockRef.current;
    if (!blk) return;
    setOut(blk.tick({ ax: axRef.current }, performance.now()));
  }, CLOCK_TICK_MS);

  return (
    <Panel
      icon={<SlidersHorizontal className="w-4 h-4" />}
      title="Analog threshold trigger"
      blurb="Frequency-style threshold: Q = 1 when actual > ON; Q = 0 when actual <= OFF (topic 18405506059)"
    >
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <span>Ax (0–1000)</span>
          <span className="font-mono text-purple-300 normal-case tracking-normal">{ax}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1000}
          step={1}
          value={ax}
          onChange={(e) => setAx(Number(e.target.value))}
          className="w-full accent-purple-500"
          aria-label="Analog input Ax"
        />
        <div className="flex flex-wrap items-center gap-4 pt-1">
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            ON
            <input type="number" min={-32768} max={32767} value={onVal}
              onChange={(e) => setOnVal(Math.trunc(Number(e.target.value) || 0))}
              className={numInputCls} />
          </label>
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            OFF
            <input type="number" min={-32768} max={32767} value={offVal}
              onChange={(e) => setOffVal(Math.trunc(Number(e.target.value) || 0))}
              className={numInputCls} />
          </label>
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Actual</span>
        <span className="font-mono text-lg font-bold text-purple-300 tabular-nums">{Math.round(out.actual)}</span>
      </div>
      <Led on={out.q === 1} label="Q" />
    </Panel>
  );
}

/* Page shell */
export default function FbdBlocksPage() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-950 text-slate-200">
      <header className="flex flex-wrap items-center gap-3 border-b border-slate-800 bg-slate-900/70 px-5 py-3 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/25 bg-purple-500/15">
          <Activity className="h-4 w-4 text-purple-400" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-black uppercase tracking-[0.2em] text-slate-100">FBD Blocks</h1>
          <p className="font-mono text-[9px] text-slate-500 truncate">src/lib/engines/fbdBlocks · cycle-based · caller-supplied nowMs</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-purple-300">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" /> Engine Live
        </span>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto bg-slate-950">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 p-5 lg:grid-cols-2">
          <AndDemo />
          <OnDelayDemo />
          <CounterDemo />
          <AnalogThresholdDemo />
        </div>
        <div className="mx-auto max-w-5xl px-5 pb-6">
          <div className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <p className="text-[10px] leading-relaxed text-slate-500">
              Clean-room engine. Behaviour specified from public on-device documentation; no target-product
              source, firmware or assets are used. Evaluation is cycle-based: the host calls
              <code className="mx-1 rounded bg-slate-800/80 px-1 py-0.5 font-mono text-[9px] text-purple-300">tick(inputs, nowMs)</code>
              once per program cycle; outputs and flags carry the previous cycle. RTC blocks receive LocalTime
              explicitly — the engine never reads the wall clock. Demos above run the same engine the test suite covers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
