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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      <aside className="lg:col-span-4 space-y-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Decimal Float</div>
          <input value={val} onChange={e => setVal(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-base text-cyan-300 focus:outline-none focus:border-cyan-600"
            placeholder="3.14" />
          <div className="text-[9px] text-slate-600 mt-2">IEEE 754 Single Precision (32-bit)</div>
        </div>
      </aside>

      <section className="lg:col-span-8 space-y-5 relative min-h-[400px]">
        {res ? (
          <div className="space-y-5">
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
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
            <div className="text-center space-y-4 max-w-lg bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-2xl">
              <Layers size={48} className="mx-auto text-amber-500 opacity-50 mb-6" />
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-300 tracking-widest uppercase mb-2">Invalid Float</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Please enter a valid floating-point number to see its IEEE-754 representation.
              </p>
            </div>
          </div>
        )}
      </section>
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      <aside className="lg:col-span-4 space-y-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Code Settings</div>
          <div className="space-y-3">
            <input value={val} onChange={e => setVal(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-base text-cyan-300 focus:outline-none focus:border-cyan-600"
              placeholder={reverseMode ? '1011' : '13'} />
            <button onClick={() => setReverseMode(r => !r)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">
              <RefreshCw size={12} /> {reverseMode ? 'Gray → Dec' : 'Dec → Gray'}
            </button>
            {!reverseMode && (
              <div className="flex items-center gap-2 justify-between pt-2 border-t border-slate-800">
                <span className="text-[9px] text-slate-600 font-black uppercase">Bits:</span>
                <div className="flex gap-1">
                  {[3, 4, 5, 6].map(b => (
                    <button key={b} onClick={() => setBits(b)}
                      className={cn('w-7 h-7 rounded font-black text-xs', bits === b ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700')}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      <section className="lg:col-span-8 space-y-5 relative min-h-[400px]">
        {val.trim() && !isNaN(parseInt(val)) ? (
          <div className="space-y-5">
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
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
            <div className="text-center space-y-4 max-w-lg bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-2xl">
              <Layers size={48} className="mx-auto text-cyan-500 opacity-50 mb-6" />
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-300 tracking-widest uppercase mb-2">Gray Code Converter</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Enter a value to see its Gray Code representation and view the full {bits}-bit reference table.
              </p>
            </div>
          </div>
        )}
      </section>
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      <aside className="lg:col-span-4 space-y-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Decimal Input</div>
          <input value={val} onChange={e => setVal(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-base text-cyan-300 focus:outline-none focus:border-cyan-600"
            placeholder="127" />
        </div>
      </aside>

      <section className="lg:col-span-8 space-y-5 relative min-h-[400px]">
        {!val.trim() || isNaN(parseInt(val)) ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
            <div className="text-center space-y-4 max-w-lg bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-2xl">
              <Layers size={48} className="mx-auto text-cyan-500 opacity-50 mb-6" />
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-300 tracking-widest uppercase mb-2">Binary Encodings</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Enter a decimal number to view its representation in BCD (8421), Excess-3, and Pure Binary formats.
              </p>
            </div>
          </div>
        ) : (
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
        )}
      </section>
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      <aside className="lg:col-span-4 space-y-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{decodeMode ? 'Received (7-bit)' : 'Data to Encode (4-bit)'}</span>
            <button onClick={() => setDecodeMode(d => !d)}
              className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 rounded text-[8px] font-bold uppercase tracking-wider text-slate-400 hover:text-white">
              <RefreshCw size={10} /> {decodeMode ? 'Switch to Encode' : 'Switch to Decode'}
            </button>
          </div>
          <input value={decodeMode ? received : data} onChange={e => {
            const v = e.target.value.replace(/[^01]/g, '').slice(0, decodeMode ? 7 : 4);
            decodeMode ? setReceived(v) : setData(v);
          }}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-base text-cyan-300 focus:outline-none focus:border-cyan-600"
            placeholder={decodeMode ? '1011010' : '1011'} />
        </div>
      </aside>

      <section className="lg:col-span-8 space-y-5 relative min-h-[400px]">
        {decodeMode ? (
          decoded ? (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">Decoding Results</div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl font-mono font-black text-white">{decoded.data}</div>
                  <div className={cn('px-3 py-1 rounded text-xs font-black uppercase tracking-widest', decoded.errorBit > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30')}>
                    {decoded.errorBit > 0 ? `Error at Bit ${decoded.errorBit}` : 'No Error Detected'}
                  </div>
                </div>
                {decoded.errorBit > 0 && (
                  <div className="text-sm font-mono text-slate-400">
                    Corrected word: <span className="text-emerald-400 font-bold">{decoded.corrected}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
              <div className="text-center space-y-4 max-w-lg bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-2xl">
                <ShieldCheck size={48} className="mx-auto text-amber-500 opacity-50 mb-6" />
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-300 tracking-widest uppercase mb-2">Hamming Decode</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Enter 7 bits to decode and check for errors using Hamming(7,4).
                </p>
              </div>
            </div>
          )
        ) : (
          data.length === 4 ? (
            <div className="space-y-4">
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
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
              <div className="text-center space-y-4 max-w-lg bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-2xl">
                <ShieldCheck size={48} className="mx-auto text-emerald-500 opacity-50 mb-6" />
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 tracking-widest uppercase mb-2">Hamming Encode</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Enter exactly 4 bits of data to generate a Hamming(7,4) encoded word.
                </p>
              </div>
            </div>
          )
        )}
      </section>
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

      {!val.trim() ? (
        <div className="flex flex-col items-center justify-center p-8 z-10 w-full relative min-h-[200px]">
          <div className="text-center space-y-4 max-w-lg bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-2xl">
            <Activity size={48} className="mx-auto text-emerald-500 opacity-50 mb-6" />
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 tracking-widest uppercase mb-2">Signed Numbers</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Enter a binary sequence to see its decimal value using different signed representations.
            </p>
          </div>
        </div>
      ) : (
        <>
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
        </>
      )}
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
