import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, X, Divide, Layers, RefreshCw, Copy, CheckCircle2, Calculator, Info } from 'lucide-react';
import {
  addBinary, subBinary, multiplyBinary, divideBinary,
  andBinary, orBinary, xorBinary, nandBinary, norBinary, xnorBinary,
  decToBin, type CalculationResult, type ArithmeticStep
} from '@/lib/binary-lab';

type ArithOp = 'add' | 'sub' | 'mul' | 'div' | 'and' | 'or' | 'xor' | 'nand' | 'nor' | 'xnor';

const OPS: { id: ArithOp; label: string; symbol: string; group: string; color: string }[] = [
  { id: 'add',  label: 'ADD',  symbol: '+',    group: 'Arithmetic', color: 'emerald' },
  { id: 'sub',  label: 'SUB',  symbol: '−',    group: 'Arithmetic', color: 'orange'  },
  { id: 'mul',  label: 'MUL',  symbol: '×',    group: 'Arithmetic', color: 'violet'  },
  { id: 'div',  label: 'DIV',  symbol: '÷',    group: 'Arithmetic', color: 'amber'   },
  { id: 'and',  label: 'AND',  symbol: '&',    group: 'Bitwise',    color: 'cyan'    },
  { id: 'or',   label: 'OR',   symbol: '|',    group: 'Bitwise',    color: 'sky'     },
  { id: 'xor',  label: 'XOR',  symbol: '⊕',   group: 'Bitwise',    color: 'indigo'  },
  { id: 'nand', label: 'NAND', symbol: '↑',    group: 'Bitwise',    color: 'rose'    },
  { id: 'nor',  label: 'NOR',  symbol: '↓',    group: 'Bitwise',    color: 'pink'    },
  { id: 'xnor', label: 'XNOR', symbol: '⊙',   group: 'Bitwise',    color: 'fuchsia' },
];

function stepColor(type: ArithmeticStep['type']) {
  return { carry: 'text-amber-400', operand: 'text-cyan-400', result: 'text-emerald-400', note: 'text-slate-400' }[type];
}

function BitDisplay({ bits, label, color = 'cyan' }: { bits: string; label: string; color?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{label}</div>
      <div className="flex flex-wrap gap-1">
        {bits.replace('-', '').split('').map((b, i) => (
          <div key={i} className={`w-7 h-7 rounded border flex items-center justify-center text-[11px] font-mono font-black transition-all ${
            b === '1'
              ? `bg-${color}-500/10 border-${color}-500/40 text-${color}-300`
              : 'bg-slate-900/80 border-slate-800 text-slate-600'
          }`}>{b}</div>
        ))}
      </div>
    </div>
  );
}

export default function BinaryArithmetic() {
  const [op, setOp] = useState<ArithOp>('add');
  const [inputA, setInputA] = useState('11001010');
  const [inputB, setInputB] = useState('00110101');
  const [mode, setMode] = useState<'binary' | 'decimal'>('binary');
  const [bitWidth, setBitWidth] = useState(8);
  const [copied, setCopied] = useState(false);

  const aVal = mode === 'decimal' ? decToBin(parseInt(inputA) || 0, bitWidth) : inputA.replace(/[^01]/g, '').slice(0, bitWidth).padStart(bitWidth, '0');
  const bVal = mode === 'decimal' ? decToBin(parseInt(inputB) || 0, bitWidth) : inputB.replace(/[^01]/g, '').slice(0, bitWidth).padStart(bitWidth, '0');

  const result: CalculationResult = useMemo(() => {
    if (!aVal || !bVal) return { binary: '0', decimal: 0, hex: '0', octal: '0', steps: [] };
    try {
      switch (op) {
        case 'add':  return addBinary(aVal, bVal);
        case 'sub':  return subBinary(aVal, bVal);
        case 'mul':  return multiplyBinary(aVal, bVal);
        case 'div':  return divideBinary(aVal, bVal);
        case 'and':  return andBinary(aVal, bVal);
        case 'or':   return orBinary(aVal, bVal);
        case 'xor':  return xorBinary(aVal, bVal);
        case 'nand': return nandBinary(aVal, bVal);
        case 'nor':  return norBinary(aVal, bVal);
        case 'xnor': return xnorBinary(aVal, bVal);
      }
    } catch { return { binary: 'ERROR', decimal: 0, hex: '0', octal: '0', steps: [] }; }
  }, [op, aVal, bVal]);

  const currentOp = OPS.find(o => o.id === op)!;
  const highCount = (result.binary.match(/1/g) || []).length;

  const copyResult = () => {
    navigator.clipboard.writeText(`${aVal} ${currentOp.symbol} ${bVal} = ${result.binary}\nDecimal: ${result.decimal}\nHex: 0x${result.hex}`).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left panel ── */}
        <aside className="lg:col-span-4 space-y-5">
          {/* Op selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Operation</div>
            {['Arithmetic', 'Bitwise'].map(grp => (
              <div key={grp}>
                <div className="text-[8px] text-slate-700 uppercase font-black tracking-widest mb-1.5">{grp}</div>
                <div className="grid grid-cols-2 gap-1">
                  {OPS.filter(o => o.group === grp).map(o => (
                    <button key={o.id} onClick={() => setOp(o.id)}
                      className={`px-2 py-2 rounded text-[10px] font-black uppercase tracking-wide transition-all flex items-center gap-1.5 ${
                        op === o.id
                          ? `bg-${o.color}-600/20 border border-${o.color}-600/40 text-${o.color}-300`
                          : 'bg-slate-800/60 border border-slate-700/30 text-slate-500 hover:text-slate-300'
                      }`}>
                      <span className="text-base font-mono leading-none">{o.symbol}</span> {o.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Config */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Configuration</div>
            <div className="flex gap-1 bg-slate-950 rounded-lg p-0.5">
              {(['binary', 'decimal'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-md transition-all ${
                    mode === m ? 'bg-slate-700 text-slate-200' : 'text-slate-600 hover:text-slate-400'
                  }`}>{m}</button>
              ))}
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Bit Width: {bitWidth}</label>
              <input type="range" min={4} max={32} step={4} value={bitWidth} onChange={e => setBitWidth(+e.target.value)} className="w-full accent-cyan-500 h-1" />
              <div className="flex justify-between text-[8px] text-slate-700 mt-1">
                <span>4</span><span>8</span><span>16</span><span>32</span>
              </div>
            </div>
          </div>
          
          <div className="bg-cyan-950/20 border border-cyan-900/30 rounded-xl p-4">
            <h3 className="text-[9px] font-black text-cyan-700 uppercase tracking-widest flex items-center gap-1.5 mb-2">
              <Info className="w-3 h-3" /> System Notes
            </h3>
            <ul className="text-[9px] text-cyan-200/40 space-y-1.5 leading-relaxed">
              <li>• Arithmetic operations wrap around based on selected bit width</li>
              <li>• Division by zero returns ERROR state</li>
              <li>• Bitwise logic is applied bit-by-bit</li>
              <li>• Negative numbers use Two's Complement representation</li>
            </ul>
          </div>
          {/* Operands */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Operands</div>
            <div className="space-y-4">
              {[
                { label: 'Operand A', val: inputA, set: setInputA },
                { label: 'Operand B', val: inputB, set: setInputB },
              ].map(({ label, val, set }) => (
                <div key={label}>
                  <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1.5">{label}</label>
                  <input value={val} onChange={e => set(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-sm text-cyan-300 focus:outline-none focus:border-cyan-600 placeholder:text-slate-700"
                    placeholder={mode === 'binary' ? '11001010' : '202'} />
                  <div className="mt-1 text-[9px] font-mono text-slate-700">
                    {mode === 'binary' ? `Dec: ${parseInt(val || '0', 2)}` : `Bin: ${decToBin(parseInt(val) || 0, bitWidth)}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Right panel ── */}
        <section className="lg:col-span-8 space-y-5 relative min-h-[400px]">
          {(!inputA.trim() || !inputB.trim() || result.binary === 'ERROR') ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
              <div className="text-center space-y-4 max-w-lg bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-2xl">
                {result.binary === 'ERROR' ? (
                  <>
                    <X size={48} className="mx-auto text-red-500 opacity-50 mb-6" />
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-300 tracking-widest uppercase mb-2">Arithmetic Error</h2>
                    <p className="text-red-200/70 text-sm leading-relaxed">The requested operation could not be computed. Check your operands.</p>
                  </>
                ) : (
                  <>
                    <Calculator size={48} className="mx-auto text-violet-500 opacity-50 mb-6" />
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-300 tracking-widest uppercase mb-2">Binary Arithmetic</h2>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Enter two operands to instantly see the result of the arithmetic or bitwise operation.
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-6">
                      <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-lg text-xs font-mono text-left">
                        <span className="text-slate-500 block mb-1">Addition (ADD):</span>
                        <code className="text-emerald-400">0101 + 0011 = 1000</code>
                      </div>
                      <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-lg text-xs font-mono text-left">
                        <span className="text-slate-500 block mb-1">Bitwise AND:</span>
                        <code className="text-emerald-400">1100 & 1010 = 1000</code>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-5">

          {/* Visual operands */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Signal Visualization</div>
            <BitDisplay bits={aVal} label="A" color="cyan" />
            <div className="flex items-center gap-2 py-1">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-xl font-black font-mono text-slate-500">{currentOp.symbol}</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>
            <BitDisplay bits={bVal} label="B" color="violet" />
            <div className="h-px bg-slate-700 my-2" />
            <BitDisplay bits={result.binary.replace('-', '')} label="Result" color="emerald" />
          </div>

          {/* Result */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Output</div>
                <div className="text-4xl font-mono font-black text-white break-all">{result.binary}</div>
              </div>
              <button onClick={copyResult} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-all">
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Decimal', value: result.decimal.toLocaleString() },
                { label: 'Hex', value: `0x${result.hex}` },
                { label: 'Octal', value: result.octal },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
                  <div className="text-[8px] text-slate-600 uppercase font-black tracking-widest mb-1">{label}</div>
                  <div className="font-mono text-xs font-bold text-slate-300">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Signal metrics */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Bit Length', value: result.binary.replace('-', '').length },
              { label: 'HIGH bits', value: highCount },
              { label: 'Signal Density', value: `${result.binary.length > 0 ? ((highCount / result.binary.replace('-', '').length) * 100).toFixed(1) : 0}%` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                <div className="text-[8px] text-slate-600 uppercase font-black tracking-widest mb-1">{label}</div>
                <div className="font-mono font-black text-cyan-400 text-lg">{value}</div>
              </div>
            ))}
          </div>

          {/* Steps */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" /> Operation Trace
            </div>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {result.steps.map((step, i) => (
                  <motion.div key={`${op}-${i}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className={`text-[10px] font-black font-mono mt-0.5 ${stepColor(step.type)}`}>{step.type.toUpperCase()}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-slate-500 font-bold">{step.label}</div>
                      <div className="font-mono text-xs text-slate-300 break-all mt-0.5">{step.value}</div>
                      {step.description && <div className="text-[9px] text-slate-600 mt-0.5">{step.description}</div>}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
        )}
      </section>
    </div>
  </div>
);
}
