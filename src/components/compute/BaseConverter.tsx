import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Trash2, Copy, CheckCircle2, ArrowRightLeft, Info, Hash, Binary, Cpu, AlertCircle } from 'lucide-react';
import katex from 'katex';
import { runConversion, CONVERSION_MODES, type BaseConvertMode, type ConversionStep } from '@/lib/number-systems';

function MathBlock({ tex }: { tex: string }) {
  const html = useMemo(() => {
    try { return katex.renderToString(tex, { throwOnError: false, displayMode: true }); }
    catch { return `<span>${tex}</span>`; }
  }, [tex]);
  return <div className="math-display text-sm overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-white/10 pb-2" dangerouslySetInnerHTML={{ __html: html }} />;
}

function StepCard({ step, index }: { step: ConversionStep; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="p-4 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Step {index + 1}: {step.label}</span>
        <span className="font-mono text-[9px] text-slate-600 bg-slate-900 px-1.5 py-0.5 rounded">{step.result}</span>
      </div>
      <MathBlock tex={step.expression} />
      {Object.keys(step.variables).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(step.variables).map(([k, v]) => (
            <div key={k} className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
              <div className="text-[9px] text-slate-600 uppercase font-bold">{k}</div>
              <div className="text-[10px] font-mono text-cyan-300">{v}</div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

const GROUPS = ['Decimal', 'Binary', 'Octal', 'Hexadecimal', 'Signed'];

export default function BaseConverter() {
  const [mode, setMode] = useState<BaseConvertMode>('dec2bin');
  const [input, setInput] = useState('255');
  const [precision, setPrecision] = useState(8);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const cfg = CONVERSION_MODES.find(m => m.id === mode)!;

  const result = useMemo(() => {
    if (!input.trim()) return null;
    try {
      setError(null);
      return runConversion(mode, input, precision);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Invalid input');
      return null;
    }
  }, [mode, input, precision]);

  useEffect(() => { setInput(cfg.placeholder); }, [mode]);

  const copyResult = () => {
    if (!result) return;
    const text = `Result: ${result.finalValue}\n\nSteps:\n` + result.steps.map((s, i) => `Step ${i + 1}: ${s.label} → ${s.result}`).join('\n');
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const baseLabel = mode.includes('2oct') ? '₈' : mode.includes('2bin') ? '₂' : mode.includes('2hex') ? '₁₆' : mode.includes('2dec') ? '₁₀' : '';

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Sidebar ── */}
        <aside className="lg:col-span-4 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <ArrowRightLeft className="w-3.5 h-3.5" /> Conversion Mode
            </h3>

            {GROUPS.map(grp => {
              const modes = CONVERSION_MODES.filter(m => m.group === grp);
              return (
                <div key={grp}>
                  <div className="text-[8px] text-slate-700 uppercase font-black tracking-widest mb-1.5">{grp}</div>
                  <div className="grid grid-cols-2 gap-1">
                    {modes.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        className={`px-2 py-1.5 rounded text-[9px] font-bold uppercase tracking-tight transition-all text-left ${
                          mode === m.id
                            ? 'bg-cyan-600/20 border border-cyan-600/40 text-cyan-300'
                            : 'bg-slate-800/60 border border-slate-700/30 text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Input Value</h3>
            <div className="relative">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={cfg.placeholder}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-base font-mono text-cyan-300 placeholder:text-slate-700 focus:outline-none focus:border-cyan-600 pr-8"
              />
              <button onClick={() => setInput('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {(mode === 'dec2oct' || mode === 'dec2bin') && (
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                  Fractional Precision: {precision}
                </label>
                <input type="range" min={1} max={16} value={precision} onChange={e => setPrecision(+e.target.value)}
                  className="w-full accent-cyan-500 h-1" />
              </div>
            )}
          </div>

          <div className="bg-cyan-950/20 border border-cyan-900/30 rounded-xl p-4">
            <h3 className="text-[9px] font-black text-cyan-700 uppercase tracking-widest flex items-center gap-1.5 mb-2">
              <Info className="w-3 h-3" /> System Notes
            </h3>
            <ul className="text-[9px] text-cyan-200/40 space-y-1.5 leading-relaxed">
              <li>• Octal digits: <strong className="text-cyan-400">0–7</strong>; Binary: <strong className="text-cyan-400">0–1</strong>; Hex: <strong className="text-cyan-400">0–F</strong></li>
              <li>• Fractional conversion uses repeated ×base method</li>
              <li>• Two's complement: invert all bits, then add 1</li>
              <li>• Each octal digit = 3 bits; each hex digit = 4 bits</li>
            </ul>
          </div>
        </aside>

        {/* ── Main ── */}
        <section className="lg:col-span-8 space-y-5 relative min-h-[400px]">
          {(!input.trim() || error) ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
              <div className="text-center space-y-4 max-w-lg bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-2xl">
                {error ? (
                  <>
                    <AlertCircle size={48} className="mx-auto text-red-500 opacity-50 mb-6" />
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-300 tracking-widest uppercase mb-2">Invalid Input</h2>
                    <p className="text-red-200/70 text-sm leading-relaxed">{error}</p>
                  </>
                ) : (
                  <>
                    <ArrowRightLeft size={48} className="mx-auto text-cyan-500 opacity-50 mb-6" />
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-300 tracking-widest uppercase mb-2">Base Converter</h2>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Enter a value in the input field to instantly see the conversion across all bases.
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-6">
                      <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-lg text-xs font-mono text-left">
                        <span className="text-slate-500 block mb-1">Decimal to Binary:</span>
                        <code className="text-emerald-400">255 → 11111111</code>
                      </div>
                      <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-lg text-xs font-mono text-left">
                        <span className="text-slate-500 block mb-1">Hex to Decimal:</span>
                        <code className="text-emerald-400">FF → 255</code>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Result card */}
              <div className="bg-slate-900/60 border-slate-800 rounded-2xl border p-7 relative overflow-hidden transition-all duration-500">
                <div className="absolute top-0 right-0 p-4 opacity-[0.04] pointer-events-none">
                  <Binary className="w-48 h-48" />
                </div>

                <div className="flex items-end justify-between gap-4 relative z-10">
                  <div>
                    <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Computed Output</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-mono font-black text-white tracking-tight tabular-nums break-all">
                        {result?.finalValue ?? '—'}
                      </span>
                      <span className="text-cyan-400 font-black text-lg">{baseLabel}</span>
                    </div>
                  </div>
                  <button onClick={copyResult} className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all group">
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400 group-hover:text-white" />}
                  </button>
                </div>
              </div>

              {/* Binary cross-check */}
              {result?.binaryCrossCheck && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-cyan-950/20 border border-cyan-900/30 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Binary className="w-4 h-4 text-cyan-500" />
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">Binary Cross-check</span>
                  </div>
                  <code className="text-[10px] font-mono text-cyan-300/70 select-all">{result.binaryCrossCheck}</code>
                </motion.div>
              )}

              {/* Steps */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5" /> Operational Trace
                  </h3>
                  <span className="text-[9px] font-mono text-slate-700">
                    {result ? `${result.steps.length} step${result.steps.length !== 1 ? 's' : ''}` : ''}
                  </span>
                </div>

                <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                  <AnimatePresence mode="popLayout">
                    {result && result.steps.map((step, i) => (
                      <StepCard key={`${mode}-${i}`} step={step} index={i} />
                    ))}
                  </AnimatePresence>

                  {result && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="p-4 bg-cyan-950/20 border-t border-cyan-900/20 rounded-b-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-cyan-500" />
                        <span className="text-[10px] text-slate-400">Final: <span className="font-mono font-black text-white">{result.finalValue}</span></span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-700">{result.steps.length} cycles completed</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
