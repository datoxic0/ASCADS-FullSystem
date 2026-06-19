import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Activity, Zap, RefreshCw, Table } from 'lucide-react';
import { synthesizeLogic, type LogicTableRow } from '@/lib/binary-lab';

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

// ─── Interactive Circuit Schematic ────────────────────────────────────────────

function CircuitSchematic({ sop, variables }: { sop: string; variables: string[] }) {
  const [vals, setVals] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<{ type: string; index: number; data: string[] } | null>(null);

  const allVals = useMemo(() => {
    const s: Record<string, boolean> = {};
    variables.forEach(v => { s[v] = vals[v] ?? false; });
    return s;
  }, [vals, variables]);

  const toggle = (v: string) => setVals(p => ({ ...p, [v]: !p[v] }));

  if (sop === '0' || sop === '1') {
    return (
      <div className="h-48 bg-slate-950 border border-slate-800 rounded-lg flex flex-col items-center justify-center font-mono text-cyan-400 gap-2">
        <div className="text-[9px] text-slate-600 uppercase tracking-widest">Constant Output</div>
        <div className="text-3xl font-black">{sop === '1' ? 'VCC (1)' : 'GND (0)'}</div>
      </div>
    );
  }

  const terms = sop.split('+').map(t =>
    t.trim().replace(/[()]/g, '').split('·').map(l => l.trim())
  );

  const termResults = terms.map(lits =>
    lits.every(lit => {
      const inv = lit.startsWith('!');
      const v = inv ? lit.slice(1) : lit;
      return inv ? !allVals[v] : !!allVals[v];
    })
  );

  const out = termResults.some(Boolean);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
        <div className="flex items-center gap-2">
          <Cpu size={12} className="text-cyan-400" />
          <span className="text-[9px] font-black text-white uppercase tracking-widest">Interactive Logic Simulator</span>
        </div>
        <button onClick={() => setSelected(null)} className="text-[8px] font-black text-slate-600 hover:text-slate-300 uppercase tracking-tighter">
          [Reset View]
        </button>
      </div>

      <div className="relative min-h-[360px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden p-5 font-mono">
        {/* Grid backdrop */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#06b6d4 1px, transparent 0)', backgroundSize: '20px 20px' }} />

        <div className="relative z-10 flex h-full gap-5 items-center">
          {/* Inputs */}
          <div className="flex flex-col gap-5">
            {variables.map((v) => (
              <div key={v} className="flex items-center gap-3">
                <button onClick={() => toggle(v)}
                  className={cn(
                    'w-8 h-8 border flex items-center justify-center text-xs font-black transition-all hover:scale-110',
                    allVals[v] ? 'bg-cyan-500 border-cyan-300 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-slate-900 border-slate-700 text-slate-500'
                  )}>
                  {v}
                </button>
                <div className={cn('w-6 h-0.5 transition-all duration-500', allVals[v] ? 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]' : 'bg-slate-800')} />
              </div>
            ))}
          </div>

          {/* NOT gates */}
          <div className="flex flex-col gap-5">
            {variables.map((v) => (
              <div key={v} className="flex items-center gap-3">
                <button onClick={() => setSelected({ type: 'NOT', index: 0, data: [v] })}
                  className={cn(
                    'w-9 h-9 rounded-full border flex items-center justify-center transition-all hover:scale-110',
                    !allVals[v] ? 'bg-purple-500/10 border-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.2)]' : 'bg-slate-900 border-slate-800'
                  )}>
                  <span className={cn('text-[7px] font-black italic', !allVals[v] ? 'text-purple-400' : 'text-slate-600')}>NOT</span>
                </button>
                <div className={cn('w-5 h-0.5 transition-all duration-500', !allVals[v] ? 'bg-purple-400' : 'bg-slate-800')} />
              </div>
            ))}
          </div>

          {/* AND gates */}
          <div className="flex-1 flex flex-col gap-3 max-h-[300px] overflow-y-auto">
            {terms.map((lits, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                className="flex items-center gap-3">
                <button onClick={() => setSelected({ type: 'AND', index: i, data: lits })}
                  className={cn(
                    'flex-1 p-2 rounded border text-left transition-all hover:scale-[1.02] flex items-center justify-between',
                    termResults[i] ? 'bg-cyan-500/10 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.1)]' : 'bg-slate-900 border-slate-800'
                  )}>
                  <div>
                    <div className={cn('text-[8px] font-black uppercase tracking-widest', termResults[i] ? 'text-cyan-400' : 'text-slate-600')}>
                      AND_{i}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {lits.map((l, li) => <span key={li} className="text-[9px] text-slate-400">{l}</span>)}
                    </div>
                  </div>
                  <Activity size={12} className={cn(termResults[i] ? 'text-cyan-400' : 'text-slate-700')} />
                </button>
                <div className={cn('w-6 h-0.5 transition-all', termResults[i] ? 'bg-cyan-400' : 'bg-slate-800')} />
              </motion.div>
            ))}
          </div>

          {/* OR gate + output */}
          <div className="flex flex-col items-center gap-3">
            <button onClick={() => setSelected({ type: 'OR', index: 0, data: terms.map(t => t.join('·')) })}>
              <motion.div animate={{ rotate: out ? 135 : 45 }} transition={{ type: 'spring', stiffness: 120 }}
                className={cn(
                  'w-14 h-14 border-2 rounded-lg flex items-center justify-center transition-all duration-700 cursor-pointer hover:scale-110',
                  out ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'bg-slate-900 border-slate-800'
                )}>
                <div className={cn('transition-all font-black flex flex-col items-center', out ? 'text-amber-400 -rotate-[135deg]' : 'text-slate-700 -rotate-45')}>
                  <span className="text-[8px]">7432</span>
                  <Zap size={14} />
                </div>
              </motion.div>
            </button>

            <div className={cn(
              'w-10 h-10 rounded border-2 flex items-center justify-center text-xl font-black font-mono transition-all duration-700',
              out ? 'bg-amber-500 border-amber-300 text-black shadow-[0_0_30px_rgba(245,158,11,0.5)]' : 'bg-slate-950 border-slate-800 text-slate-800'
            )}>
              {out ? '1' : '0'}
            </div>
          </div>
        </div>

        {/* Info overlay */}
        <AnimatePresence>
          {selected && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute inset-x-0 bottom-0 m-3 p-4 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-lg shadow-2xl z-50">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{selected.type} Gate Diagnostics</div>
                  <div className="text-[8px] text-slate-600 font-mono">ID: GATE_{selected.type}_{selected.index}</div>
                </div>
                <button onClick={() => setSelected(null)} className="text-slate-600 hover:text-white"><RefreshCw size={11} /></button>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {selected.data.map((d, i) => {
                  const inv = d.startsWith('!');
                  const v = inv ? d.slice(1) : d;
                  const val = inv ? !allVals[v] : !!allVals[v];
                  return (
                    <div key={i} className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-center">
                      <div className="text-[9px] font-mono text-white">{d}</div>
                      <div className={cn('text-[8px] font-black', val ? 'text-cyan-400' : 'text-slate-700')}>{val ? 'HIGH' : 'LOW'}</div>
                    </div>
                  );
                })}
              </div>
              <div className="text-[8px] text-slate-600 italic font-mono">Prop_Delay: 12ns · Click inputs to toggle signal states</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="flex gap-4">
          {variables.map(v => (
            <div key={v}>
              <div className="text-[7px] text-slate-600 uppercase">{v}</div>
              <div className={cn('text-[9px] font-black font-mono', allVals[v] ? 'text-cyan-400' : 'text-slate-700')}>
                {allVals[v] ? 'HIGH' : 'LOW'}
              </div>
            </div>
          ))}
        </div>
        <div className={cn('text-xs font-black font-mono px-3 py-1 rounded border transition-all', out ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-slate-700 border-slate-800')}>
          f = {out ? '1' : '0'}
        </div>
      </div>
    </div>
  );
}

// ─── Truth Table ──────────────────────────────────────────────────────────────

function TruthTable({ table, variables, onToggle }: {
  table: LogicTableRow[];
  variables: string[];
  onToggle: (index: number) => void;
}) {
  return (
    <div className="overflow-auto rounded-lg border border-slate-800">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/80">
            <th className="px-3 py-2 text-left text-[9px] font-black text-slate-600 uppercase tracking-widest">#</th>
            {variables.map(v => <th key={v} className="px-3 py-2 text-center text-[9px] font-black text-slate-400 uppercase">{v}</th>)}
            <th className="px-3 py-2 text-center text-[9px] font-black text-cyan-600 uppercase tracking-widest">f(out)</th>
          </tr>
        </thead>
        <tbody>
          {table.map((row, i) => (
            <tr key={i} className={cn('border-b border-slate-800/50 transition-colors', row.output ? 'bg-cyan-950/20' : 'hover:bg-slate-900/40')}>
              <td className="px-3 py-1.5 text-slate-700">{i}</td>
              {row.inputs.map((b, j) => (
                <td key={j} className={cn('px-3 py-1.5 text-center font-black', b ? 'text-cyan-400' : 'text-slate-600')}>{b}</td>
              ))}
              <td className="px-3 py-1.5 text-center">
                <button onClick={() => onToggle(i)}
                  className={cn(
                    'w-7 h-7 rounded border font-black transition-all hover:scale-110',
                    row.output ? 'bg-cyan-500 border-cyan-400 text-black' : 'bg-slate-900 border-slate-700 text-slate-600'
                  )}>
                  {row.output}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BooleanLogic() {
  const [numVars, setNumVars] = useState(3);
  const [outputs, setOutputs] = useState<string[]>(Array(8).fill('0'));
  const [view, setView] = useState<'table' | 'circuit'>('table');

  const rows = Math.pow(2, numVars);

  const paddedOutputs = useMemo(() => {
    const arr = [...outputs];
    while (arr.length < rows) arr.push('0');
    return arr.slice(0, rows);
  }, [outputs, rows]);

  const logic = useMemo(() => synthesizeLogic(numVars, paddedOutputs), [numVars, paddedOutputs]);

  const toggleOutput = (i: number) => {
    setOutputs(prev => {
      const next = [...prev];
      while (next.length <= i) next.push('0');
      next[i] = next[i] === '1' ? '0' : '1';
      return next;
    });
  };

  const setPreset = (preset: string) => {
    const arr = Array(rows).fill('0');
    if (preset === 'all1')  return setOutputs(Array(rows).fill('1'));
    if (preset === 'alt')   return setOutputs(arr.map((_, i) => i % 2 === 1 ? '1' : '0'));
    if (preset === 'even')  return setOutputs(arr.map((_, i) => i % 2 === 0 ? '1' : '0'));
    if (preset === 'clear') return setOutputs(Array(rows).fill('0'));
  };

  const minterms = logic.table.filter(r => r.output === 1).map(r => r.minterm);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Variables</span>
          <div className="flex gap-1">
            {[2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => { setNumVars(n); setOutputs(Array(Math.pow(2, n)).fill('0')); }}
                className={cn('w-7 h-7 rounded font-black text-xs transition-all', numVars === n ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700')}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Presets:</span>
          {[['clear', 'Clear'], ['all1', 'All 1s'], ['alt', 'Alternate'], ['even', 'Even']].map(([id, label]) => (
            <button key={id} onClick={() => setPreset(id)}
              className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-[9px] font-bold text-slate-400 hover:text-white hover:bg-slate-700 transition-all uppercase tracking-wide">
              {label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          {([['table', <Table size={12} />], ['circuit', <Cpu size={12} />]] as const).map(([id, icon]) => (
            <button key={id} onClick={() => setView(id as 'table' | 'circuit')}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-wide transition-all',
                view === id ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-600/30' : 'text-slate-600 hover:text-slate-300')}>
              {icon} {id}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: table / circuit */}
        <div className="lg:col-span-7">
          {view === 'table' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Table size={12} /> Truth Table
                </div>
                <span className="text-[9px] text-slate-700">Click f(out) to toggle</span>
              </div>
              <TruthTable table={logic.table} variables={logic.variables} onToggle={toggleOutput} />
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Cpu size={12} /> Gate Schematic
              </div>
              <CircuitSchematic sop={logic.minimized} variables={logic.variables} />
            </div>
          )}
        </div>

        {/* Right: expressions */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Boolean Expressions</div>

            {[
              { label: 'Minimized (K-map)', expr: logic.minimized, color: 'emerald', desc: 'Quine-McCluskey reduced' },
              { label: 'Sum of Products (SOP)', expr: logic.sop, color: 'cyan', desc: 'Canonical minterm form' },
              { label: 'Product of Sums (POS)', expr: logic.pos, color: 'violet', desc: 'Canonical maxterm form' },
            ].map(({ label, expr, color, desc }) => (
              <div key={label} className={cn(`bg-${color}-950/20 border border-${color}-900/30 rounded-lg p-3`)}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className={cn(`text-[9px] font-black uppercase tracking-widest text-${color}-600`)}>{label}</div>
                  <div className="text-[8px] text-slate-700 italic">{desc}</div>
                </div>
                <div className={cn('font-mono text-xs break-all leading-relaxed', `text-${color}-300`)}>
                  f = {expr}
                </div>
              </div>
            ))}

            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-2">
              <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Minterms</div>
              <div className="flex flex-wrap gap-1.5">
                {minterms.map(m => (
                  <span key={m} className="px-2 py-0.5 bg-cyan-950/40 border border-cyan-900/30 rounded text-[10px] font-mono text-cyan-400">m({m})</span>
                ))}
                {minterms.length === 0 && <span className="text-[10px] text-slate-700">No minterms (all outputs = 0)</span>}
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Statistics</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Variables', value: numVars },
                { label: 'Rows', value: rows },
                { label: 'Minterms', value: minterms.length },
                { label: 'Maxterms', value: rows - minterms.length },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-950/60 border border-slate-800 rounded-lg p-2 text-center">
                  <div className="text-[8px] text-slate-600 uppercase font-black tracking-widest mb-0.5">{label}</div>
                  <div className="font-mono font-black text-cyan-400 text-sm">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
