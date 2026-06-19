import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Layers, ShieldCheck, Activity, RefreshCw } from 'lucide-react';
import {
  floatToIEEE754, decToGray, grayToDec, generateGrayTable,
  decToBCD, decToExcess3, encodeHamming74, decodeHamming74, getSignedInfo,
  decToBin, type ArithmeticStep
} from '@/lib/binary-lab';

function cn(...c: (string | boolean | undefined | null)[]) { return c.filter(Boolean).join(' '); }

function SectionTab({ id, label, active, onClick }: { id: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn('px-3 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap',
        active ? 'bg-cyan-600/20 border border-cyan-600/30 text-cyan-400' : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800/60')}>
      {label}
    </button>
  );
}

function StepRow({ step, i }: { step: ArithmeticStep; i: number }) {
  const colors = { operand: 'text-cyan-400', result: 'text-emerald-400', note: 'text-slate-400', carry: 'text-amber-400' };
  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
      className="flex gap-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 items-start">
      <span className={cn('text-[8px] font-black uppercase font-mono shrink-0 mt-0.5', colors[step.type])}>{step.type}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] text-slate-500 font-bold">{step.label}</div>
        <div className="font-mono text-xs text-slate-200 break-all mt-0.5">{step.value}</div>
        {step.description && <div className="text-[8px] text-slate-600 mt-0.5">{step.description}</div>}
      </div>
    </motion.div>
  );
}

// ─── IEEE 754 ─────────────────────────────────────────────────────────────────

function IEEE754Panel() {
  const [val, setVal] = useState('3.14');
  const f = parseFloat(val);
  const res = useMemo(() => isNaN(f) ? null : floatToIEEE754(f), [f]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <input value={val} onChange={e => setVal(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-base text-cyan-300 focus:outline-none focus:border-cyan-600 w-48"
          placeholder="3.14" />
        <span className="text-[9px] text-slate-600">IEEE 754 Single Precision (32-bit)</span>
      </div>

      {res && (
        <>
          {/* Bit field visual */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">32-Bit Layout</div>
            <div className="flex gap-0.5 font-mono text-[10px]">
              <div className="flex flex-col items-center gap-1">
                <div className={cn('px-2 py-2 rounded border font-black text-center', res.sign === '0' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400')}>
                  {res.sign}
                </div>
                <div className="text-[7px] text-slate-700 uppercase">Sign</div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex gap-0.5">
                  {res.exponent.split('').map((b, i) => (
                    <div key={i} className={cn('w-6 h-8 rounded border flex items-center justify-center font-black', b === '1' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-600')}>
                      {b}
                    </div>
                  ))}
                </div>
                <div className="text-[7px] text-slate-700 uppercase text-center">Exponent (8 bits)</div>
              </div>
              <div className="flex flex-col gap-1 flex-1 overflow-hidden">
                <div className="flex gap-0.5 flex-wrap">
                  {res.mantissa.split('').map((b, i) => (
                    <div key={i} className={cn('w-5 h-8 rounded border flex items-center justify-center text-[8px] font-bold', b === '1' ? 'bg-violet-500/10 border-violet-500/30 text-violet-400' : 'bg-slate-900 border-slate-800 text-slate-700')}>
                      {b}
                    </div>
                  ))}
                </div>
                <div className="text-[7px] text-slate-700 uppercase">Mantissa / Fraction (23 bits)</div>
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Sign', value: res.sign === '0' ? '+ (Positive)' : '− (Negative)', color: 'emerald' },
              { label: 'Biased Exponent', value: `${res.biasedExp} dec`, color: 'amber' },
              { label: 'True Exponent', value: `${res.trueExp} (bias 127)`, color: 'amber' },
              { label: 'Hex', value: `0x${res.hex}`, color: 'violet' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`bg-${color}-950/20 border border-${color}-900/30 rounded-lg p-3`}>
                <div className={`text-[8px] font-black uppercase tracking-widest text-${color}-700 mb-1`}>{label}</div>
                <div className={`font-mono text-xs font-bold text-${color}-300`}>{value}</div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Conversion Steps</div>
            {res.steps.map((s, i) => <StepRow key={i} step={s} i={i} />)}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Gray Code ────────────────────────────────────────────────────────────────

function GrayCodePanel() {
  const [val, setVal] = useState('13');
  const [bits, setBits] = useState(4);
  const [reverseMode, setReverseMode] = useState(false);

  const result = useMemo(() => {
    if (reverseMode) {
      const dec = grayToDec(val);
      return { input: val, output: dec.toString(), outputLabel: 'Decimal', inputLabel: 'Gray Code' };
    } else {
      const n = parseInt(val) || 0;
      const g = decToGray(n, bits);
      return { input: val, output: g, outputLabel: 'Gray Code', inputLabel: 'Decimal' };
    }
  }, [val, bits, reverseMode]);

  const table = useMemo(() => generateGrayTable(bits), [bits]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center">
        <input value={val} onChange={e => setVal(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-base text-cyan-300 focus:outline-none focus:border-cyan-600 w-36"
          placeholder={reverseMode ? '1011' : '13'} />
        <button onClick={() => setReverseMode(r => !r)}
          className="flex items-center gap-2 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">
          <RefreshCw size={12} /> {reverseMode ? 'Gray → Dec' : 'Dec → Gray'}
        </button>
        {!reverseMode && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-slate-600 font-black uppercase">Bits:</span>
            {[3, 4, 5, 6].map(b => (
              <button key={b} onClick={() => setBits(b)}
                className={cn('w-7 h-7 rounded font-black text-xs', bits === b ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700')}>
                {b}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="text-[9px] text-slate-600 uppercase font-black tracking-widest mb-2">{result.inputLabel} → {result.outputLabel}</div>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-mono font-black text-white">{result.output}</span>
          <span className="text-sm text-slate-500">{result.outputLabel}</span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-800 text-[9px] font-black text-slate-500 uppercase tracking-widest">Gray Code Reference Table ({bits}-bit)</div>
        <div className="overflow-auto max-h-64">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800">
                {['Dec', 'Binary', 'Gray'].map(h => <th key={h} className="px-3 py-2 text-left text-[9px] font-black text-slate-500 uppercase">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {table.map((row, i) => (
                <tr key={i} className={cn('border-b border-slate-800/40', !reverseMode && parseInt(val) === row.decimal ? 'bg-cyan-950/30' : 'hover:bg-slate-900/40')}>
                  <td className="px-3 py-1.5 text-slate-400">{row.decimal}</td>
                  <td className="px-3 py-1.5 text-slate-500">{row.binary}</td>
                  <td className="px-3 py-1.5 text-cyan-400 font-bold">{row.gray}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── BCD / Excess-3 ───────────────────────────────────────────────────────────

function EncodingsPanel() {
  const [val, setVal] = useState('127');
  const n = parseInt(val) || 0;
  const bcd = decToBCD(n);
  const ex3 = decToExcess3(n);
  const binVal = decToBin(n, 8);

  return (
    <div className="space-y-5">
      <input value={val} onChange={e => setVal(e.target.value)}
        className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-base text-cyan-300 focus:outline-none focus:border-cyan-600 w-36"
        placeholder="127" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'BCD (8421)', value: bcd, desc: '4 bits per decimal digit', color: 'cyan' },
          { label: 'Excess-3', value: ex3, desc: 'BCD + 3 per digit', color: 'violet' },
          { label: 'Pure Binary', value: binVal, desc: '8-bit representation', color: 'emerald' },
        ].map(({ label, value, desc, color }) => (
          <div key={label} className={`bg-${color}-950/20 border border-${color}-900/30 rounded-xl p-4`}>
            <div className={`text-[9px] font-black uppercase tracking-widest text-${color}-700 mb-1`}>{label}</div>
            <div className={`font-mono text-sm font-bold text-${color}-300 break-all`}>{value}</div>
            <div className="text-[8px] text-slate-600 mt-1">{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Hamming ──────────────────────────────────────────────────────────────────

function HammingPanel() {
  const [data, setData] = useState('1011');
  const [received, setReceived] = useState('');
  const [decodeMode, setDecodeMode] = useState(false);

  const encoded = useMemo(() => encodeHamming74(data.slice(0, 4)), [data]);
  const decoded = useMemo(() => {
    if (!received || received.length !== 7) return null;
    return decodeHamming74(received);
  }, [received]);

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {[['encode', 'Encode (7,4)'], ['decode', 'Decode & Correct']].map(([id, label]) => (
          <button key={id} onClick={() => setDecodeMode(id === 'decode')}
            className={cn('px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all',
              decodeMode === (id === 'decode') ? 'bg-cyan-600/20 border border-cyan-600/30 text-cyan-400' : 'bg-slate-800 border border-slate-700 text-slate-500 hover:text-slate-300')}>
            {label}
          </button>
        ))}
      </div>

      {!decodeMode ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input value={data} onChange={e => setData(e.target.value.replace(/[^01]/g, '').slice(0, 4))}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-base text-cyan-300 focus:outline-none focus:border-cyan-600 w-36"
              placeholder="1011" maxLength={4} />
            <span className="text-[9px] text-slate-600">4-bit data word</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Encoded 7-bit Word</div>
            <div className="flex gap-1.5">
              {encoded.encoded.split('').map((b, i) => {
                const isParity = [0, 1, 3].includes(i);
                return (
                  <div key={i} className={cn('w-10 h-12 rounded border flex flex-col items-center justify-center gap-1', isParity ? 'bg-amber-500/10 border-amber-500/30' : 'bg-cyan-500/10 border-cyan-500/30')}>
                    <span className={cn('text-sm font-mono font-black', b === '1' ? (isParity ? 'text-amber-400' : 'text-cyan-400') : 'text-slate-600')}>{b}</span>
                    <span className={cn('text-[7px] font-black uppercase', isParity ? 'text-amber-700' : 'text-cyan-700')}>{isParity ? `P${[1, 2, 4][([0, 1, 3].indexOf(i))]}` : `D${[1, 2, 3, 4][[2, 4, 5, 6].indexOf(i)]}`}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-[9px] text-slate-600">
              <span className="text-amber-500 font-bold">■</span> Parity bits &nbsp;
              <span className="text-cyan-500 font-bold">■</span> Data bits
            </div>
          </div>

          <div className="space-y-2">
            {encoded.steps.map((s, i) => <StepRow key={i} step={s} i={i} />)}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input value={received} onChange={e => setReceived(e.target.value.replace(/[^01]/g, '').slice(0, 7))}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-base text-cyan-300 focus:outline-none focus:border-cyan-600 w-48"
              placeholder="1010101" maxLength={7} />
            <span className="text-[9px] text-slate-600">7-bit received word (introduce an error to test)</span>
          </div>

          {decoded && (
            <div className={cn('rounded-xl border p-5 space-y-3', decoded.errorBit > 0 ? 'bg-red-950/20 border-red-800/30' : 'bg-emerald-950/20 border-emerald-800/30')}>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className={decoded.errorBit > 0 ? 'text-red-400' : 'text-emerald-400'} />
                <div>
                  <div className={cn('text-sm font-black uppercase', decoded.errorBit > 0 ? 'text-red-400' : 'text-emerald-400')}>
                    {decoded.errorBit > 0 ? `Error Detected at Bit ${decoded.errorBit}` : 'No Error Detected'}
                  </div>
                  {decoded.errorBit > 0 && <div className="text-[9px] text-slate-500 mt-0.5">Auto-corrected: {decoded.corrected}</div>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950/60 rounded-lg p-3">
                  <div className="text-[8px] text-slate-600 uppercase font-black tracking-widest mb-1">Corrected Word</div>
                  <div className="font-mono text-sm font-bold text-emerald-400">{decoded.corrected}</div>
                </div>
                <div className="bg-slate-950/60 rounded-lg p-3">
                  <div className="text-[8px] text-slate-600 uppercase font-black tracking-widest mb-1">Recovered Data</div>
                  <div className="font-mono text-sm font-bold text-cyan-400">{decoded.data}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Signed Numbers ───────────────────────────────────────────────────────────

function SignedPanel() {
  const [val, setVal] = useState('10110011');
  const [width, setWidth] = useState(8);
  const info = useMemo(() => {
    const cleaned = val.replace(/[^01]/g, '').slice(0, width).padStart(width, '0');
    return getSignedInfo(cleaned, width);
  }, [val, width]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <input value={val} onChange={e => setVal(e.target.value.replace(/[^01]/g, ''))}
          className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-base text-cyan-300 focus:outline-none focus:border-cyan-600 w-52"
          placeholder="10110011" />
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-slate-600 font-black uppercase">Width:</span>
          {[4, 8, 16].map(w => (
            <button key={w} onClick={() => setWidth(w)}
              className={cn('w-8 h-7 rounded font-black text-xs', width === w ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700')}>
              {w}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Sign-Magnitude', value: info.signMagnitude, binary: info.smBinary, color: 'cyan', desc: 'MSB = sign bit' },
          { label: "One's Complement", value: info.onesComplement, binary: info.onesBinary, color: 'violet', desc: 'Invert all bits' },
          { label: "Two's Complement", value: info.twosComplement, binary: info.twosBinary, color: 'emerald', desc: 'Modern standard' },
        ].map(({ label, value, binary, color, desc }) => (
          <div key={label} className={`bg-${color}-950/20 border border-${color}-900/30 rounded-xl p-4 space-y-2`}>
            <div className={`text-[9px] font-black uppercase tracking-widest text-${color}-700`}>{label}</div>
            <div className={`text-2xl font-mono font-black text-${color}-300`}>{value}</div>
            <div className={`font-mono text-[10px] text-${color}-500/60 break-all`}>{binary}</div>
            <div className="text-[8px] text-slate-600">{desc}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Representable Range ({width}-bit)</div>
        <div className="font-mono text-sm text-slate-300">{info.range}</div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'ieee754',  label: 'IEEE 754 Float' },
  { id: 'gray',     label: 'Gray Code'      },
  { id: 'encodings',label: 'BCD / Excess-3' },
  { id: 'hamming',  label: 'Hamming (7,4)'  },
  { id: 'signed',   label: 'Signed Nums'    },
];

export default function NumberFormats() {
  const [tab, setTab] = useState('ieee754');

  return (
    <div className="h-full overflow-y-auto p-6 space-y-5">
      <div className="flex flex-wrap gap-1.5">
        {TABS.map(t => <SectionTab key={t.id} id={t.id} label={t.label} active={tab === t.id} onClick={() => setTab(t.id)} />)}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        {tab === 'ieee754'   && <IEEE754Panel />}
        {tab === 'gray'      && <GrayCodePanel />}
        {tab === 'encodings' && <EncodingsPanel />}
        {tab === 'hamming'   && <HammingPanel />}
        {tab === 'signed'    && <SignedPanel />}
      </div>
    </div>
  );
}
