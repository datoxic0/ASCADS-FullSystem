import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, Activity, Cpu, Settings2, ShieldCheck, ArrowRightLeft } from 'lucide-react';

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

// ─── RLC Circuit Calculator ──────────────────────────────────────────

function RLCCalculator() {
  const [R, setR] = useState('100');
  const [L, setL] = useState('10');
  const [C, setC] = useState('100');
  const [f, setF] = useState('50');

  const R_val = parseFloat(R);
  const L_val = parseFloat(L) * 1e-3; // mH to H
  const C_val = parseFloat(C) * 1e-6; // uF to F
  const f_val = parseFloat(f);

  const results = useMemo(() => {
    if (isNaN(R_val) || isNaN(L_val) || isNaN(C_val) || isNaN(f_val)) return null;
    
    const XL = 2 * Math.PI * f_val * L_val;
    const XC = 1 / (2 * Math.PI * f_val * C_val);
    const Z = Math.sqrt(R_val * R_val + Math.pow(XL - XC, 2));
    const phase = Math.atan((XL - XC) / R_val) * (180 / Math.PI);
    const fres = 1 / (2 * Math.PI * Math.sqrt(L_val * C_val));

    return {
      XL: XL.toFixed(2),
      XC: XC.toFixed(2),
      Z: Z.toFixed(2),
      phase: phase.toFixed(2),
      fres: fres.toFixed(2)
    };
  }, [R_val, L_val, C_val, f_val]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Resistor (Ω)</label>
          <input value={R} onChange={e => setR(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-sm text-cyan-300 focus:outline-none focus:border-cyan-600 placeholder:text-slate-700" placeholder="100" />
        </div>
        <div>
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Inductor (mH)</label>
          <input value={L} onChange={e => setL(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-sm text-cyan-300 focus:outline-none focus:border-cyan-600 placeholder:text-slate-700" placeholder="10" />
        </div>
        <div>
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Capacitor (µF)</label>
          <input value={C} onChange={e => setC(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-sm text-cyan-300 focus:outline-none focus:border-cyan-600 placeholder:text-slate-700" placeholder="100" />
        </div>
        <div>
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Frequency (Hz)</label>
          <input value={f} onChange={e => setF(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-sm text-cyan-300 focus:outline-none focus:border-cyan-600 placeholder:text-slate-700" placeholder="50" />
        </div>
      </div>

      {!results ? (
        <div className="flex flex-col items-center justify-center p-8 z-10 w-full relative min-h-[200px]">
          <div className="text-center space-y-4 max-w-lg bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-2xl">
            <Activity size={48} className="mx-auto text-blue-500 opacity-50 mb-6" />
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 tracking-widest uppercase mb-2">RLC Calculator</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Enter valid numbers for Resistance, Inductance, Capacitance, and Frequency to calculate impedance and resonance.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Inductive Reactance (XL)', value: `${results.XL} Ω`, color: 'emerald' },
            { label: 'Capacitive Reactance (XC)', value: `${results.XC} Ω`, color: 'violet' },
            { label: 'Total Impedance (Z)', value: `${results.Z} Ω`, color: 'amber' },
            { label: 'Phase Angle (θ)', value: `${results.phase}°`, color: 'cyan' },
            { label: 'Resonant Freq (f0)', value: `${results.fres} Hz`, color: 'rose' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`bg-${color}-950/20 border border-${color}-900/30 rounded-xl p-4 space-y-1`}>
              <div className={`text-[8px] font-black uppercase tracking-widest text-${color}-700`}>{label}</div>
              <div className={`text-sm font-mono font-black text-${color}-300`}>{value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Ohm's Law & Power Calculator ──────────────────────────────────────

function OhmsLawCalculator() {
  const [V, setV] = useState('12');
  const [I, setI] = useState('');
  const [R, setR] = useState('100');
  const [P, setP] = useState('');

  // Auto calculate remaining 2 based on 2 inputs
  const calculate = () => {
    let v = parseFloat(V);
    let i = parseFloat(I);
    let r = parseFloat(R);
    let p = parseFloat(P);

    let count = 0;
    if (!isNaN(v)) count++;
    if (!isNaN(i)) count++;
    if (!isNaN(r)) count++;
    if (!isNaN(p)) count++;

    if (count < 2) return null;

    if (!isNaN(v) && !isNaN(i)) {
      r = v / i;
      p = v * i;
    } else if (!isNaN(v) && !isNaN(r)) {
      i = v / r;
      p = (v * v) / r;
    } else if (!isNaN(v) && !isNaN(p)) {
      i = p / v;
      r = (v * v) / p;
    } else if (!isNaN(i) && !isNaN(r)) {
      v = i * r;
      p = i * i * r;
    } else if (!isNaN(i) && !isNaN(p)) {
      v = p / i;
      r = p / (i * i);
    } else if (!isNaN(r) && !isNaN(p)) {
      v = Math.sqrt(p * r);
      i = Math.sqrt(p / r);
    }

    return {
      V: v.toFixed(3),
      I: i.toFixed(3),
      R: r.toFixed(3),
      P: p.toFixed(3),
    };
  };

  const results = calculate();

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Voltage (V)', val: V, set: setV, placeholder: '12' },
          { label: 'Current (I)', val: I, set: setI, placeholder: '0.12' },
          { label: 'Resistance (Ω)', val: R, set: setR, placeholder: '100' },
          { label: 'Power (W)', val: P, set: setP, placeholder: '1.44' },
        ].map(({ label, val, set, placeholder }) => (
          <div key={label}>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">{label}</label>
            <input value={val} onChange={e => set(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-sm text-amber-300 focus:outline-none focus:border-amber-600 placeholder:text-slate-700" placeholder={placeholder} />
          </div>
        ))}
      </div>

      {!results ? (
        <div className="flex flex-col items-center justify-center p-8 z-10 w-full relative min-h-[200px]">
          <div className="text-center space-y-4 max-w-lg bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-2xl">
            <Zap size={48} className="mx-auto text-amber-500 opacity-50 mb-6" />
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-300 tracking-widest uppercase mb-2">Ohm's Law & Power</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Enter exactly 2 known values to automatically calculate the remaining 2 values.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Voltage', value: `${results.V} V`, color: 'amber' },
            { label: 'Current', value: `${results.I} A`, color: 'cyan' },
            { label: 'Resistance', value: `${results.R} Ω`, color: 'violet' },
            { label: 'Power', value: `${results.P} W`, color: 'emerald' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`bg-${color}-950/20 border border-${color}-900/30 rounded-xl p-4 space-y-1`}>
              <div className={`text-[8px] font-black uppercase tracking-widest text-${color}-700`}>{label}</div>
              <div className={`text-xl font-mono font-black text-${color}-300`}>{value}</div>
            </div>
          ))}
        </div>
      )}
      <div className="text-right">
        <button onClick={() => { setV(''); setI(''); setR(''); setP(''); }} className="text-[10px] font-black text-slate-500 hover:text-slate-300 uppercase tracking-widest">Clear All</button>
      </div>
    </div>
  );
}

// ─── Basic / Advanced Component Parameters ────────────────────────────────

function BasicAdvancedCalculator() {
  const [subTab, setSubTab] = useState('resistivity');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 mb-4 bg-slate-950 p-2 rounded-xl">
        {[
          { id: 'resistivity', label: 'Resistivity (ρ)' },
          { id: 'resistors', label: 'Resistors (Series/Parallel)' },
          { id: 'capacitors', label: 'Capacitors (Series/Parallel)' },
        ].map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            className={cn('px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all',
              subTab === t.id ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300')}>
            {t.label}
          </button>
        ))}
      </div>
      
      {subTab === 'resistivity' && <ResistivitySubTool />}
      {subTab === 'resistors' && <ResistorsSubTool />}
      {subTab === 'capacitors' && <CapacitorsSubTool />}
    </div>
  );
}

function ResistivitySubTool() {
  const [rho, setRho] = useState('1.68e-8'); // Copper
  const [L, setL] = useState('10');
  const [A, setA] = useState('1'); // mm^2

  const results = useMemo(() => {
    const r = parseFloat(rho);
    const l = parseFloat(L);
    const a = parseFloat(A) * 1e-6;
    if (isNaN(r) || isNaN(l) || isNaN(a) || a === 0) return null;
    return { R: ((r * l) / a).toExponential(3) };
  }, [rho, L, A]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Resistivity (ρ) [Ω·m]</label>
          <input value={rho} onChange={e => setRho(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-sm text-indigo-300 focus:outline-none focus:border-indigo-600" placeholder="1.68e-8" />
        </div>
        <div>
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Length (m)</label>
          <input value={L} onChange={e => setL(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-sm text-indigo-300 focus:outline-none focus:border-indigo-600" placeholder="10" />
        </div>
        <div>
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Area (mm²)</label>
          <input value={A} onChange={e => setA(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-sm text-indigo-300 focus:outline-none focus:border-indigo-600" placeholder="1" />
        </div>
      </div>
      {!results ? (
        <div className="flex flex-col items-center justify-center p-8 z-10 w-full relative min-h-[200px]">
          <div className="text-center space-y-4 max-w-lg bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-2xl">
            <Settings2 size={48} className="mx-auto text-indigo-500 opacity-50 mb-6" />
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-300 tracking-widest uppercase mb-2">Resistivity Calculator</h2>
            <p className="text-slate-400 text-sm leading-relaxed">Calculate wire resistance from material resistivity, length, and cross-sectional area.</p>
          </div>
        </div>
      ) : (
        <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-xl p-4 space-y-1 w-full max-w-xs">
          <div className="text-[8px] font-black uppercase tracking-widest text-indigo-700">Total Resistance</div>
          <div className="text-xl font-mono font-black text-indigo-300">{results.R} Ω</div>
        </div>
      )}
    </div>
  );
}

function ResistorsSubTool() {
  const [r1, setR1] = useState('100');
  const [r2, setR2] = useState('200');

  const results = useMemo(() => {
    const v1 = parseFloat(r1);
    const v2 = parseFloat(r2);
    if (isNaN(v1) || isNaN(v2)) return null;
    return {
      series: (v1 + v2).toFixed(2),
      parallel: v1 === 0 && v2 === 0 ? '0' : ((v1 * v2) / (v1 + v2)).toFixed(2)
    };
  }, [r1, r2]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Resistor 1 (Ω)</label>
          <input value={r1} onChange={e => setR1(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-sm text-indigo-300 focus:outline-none focus:border-indigo-600" />
        </div>
        <div>
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Resistor 2 (Ω)</label>
          <input value={r2} onChange={e => setR2(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-sm text-indigo-300 focus:outline-none focus:border-indigo-600" />
        </div>
      </div>
      {!results ? (
        <div className="flex flex-col items-center justify-center p-8 z-10 w-full relative min-h-[200px]">
          <div className="text-center space-y-4 max-w-lg bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-2xl">
            <ArrowRightLeft size={48} className="mx-auto text-indigo-500 opacity-50 mb-6" />
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-300 tracking-widest uppercase mb-2">Equivalent Resistance</h2>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-xl p-4 space-y-1">
            <div className="text-[8px] font-black uppercase tracking-widest text-indigo-700">Series Equivalent</div>
            <div className="text-xl font-mono font-black text-indigo-300">{results.series} Ω</div>
          </div>
          <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-4 space-y-1">
            <div className="text-[8px] font-black uppercase tracking-widest text-emerald-700">Parallel Equivalent</div>
            <div className="text-xl font-mono font-black text-emerald-300">{results.parallel} Ω</div>
          </div>
        </div>
      )}
    </div>
  );
}

function CapacitorsSubTool() {
  const [c1, setC1] = useState('10');
  const [c2, setC2] = useState('20');

  const results = useMemo(() => {
    const v1 = parseFloat(c1);
    const v2 = parseFloat(c2);
    if (isNaN(v1) || isNaN(v2)) return null;
    return {
      parallel: (v1 + v2).toFixed(2),
      series: v1 === 0 && v2 === 0 ? '0' : ((v1 * v2) / (v1 + v2)).toFixed(2)
    };
  }, [c1, c2]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Capacitor 1 (µF)</label>
          <input value={c1} onChange={e => setC1(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-sm text-indigo-300 focus:outline-none focus:border-indigo-600" />
        </div>
        <div>
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Capacitor 2 (µF)</label>
          <input value={c2} onChange={e => setC2(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-sm text-indigo-300 focus:outline-none focus:border-indigo-600" />
        </div>
      </div>
      {!results ? (
        <div className="flex flex-col items-center justify-center p-8 z-10 w-full relative min-h-[200px]">
          <div className="text-center space-y-4 max-w-lg bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-2xl">
            <Settings2 size={48} className="mx-auto text-indigo-500 opacity-50 mb-6" />
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-300 tracking-widest uppercase mb-2">Equivalent Capacitance</h2>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-xl p-4 space-y-1">
            <div className="text-[8px] font-black uppercase tracking-widest text-indigo-700">Parallel Equivalent</div>
            <div className="text-xl font-mono font-black text-indigo-300">{results.parallel} µF</div>
          </div>
          <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-4 space-y-1">
            <div className="text-[8px] font-black uppercase tracking-widest text-emerald-700">Series Equivalent</div>
            <div className="text-xl font-mono font-black text-emerald-300">{results.series} µF</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Transformer Calculator ──────────────────────────────────────────────────

function TransformerCalculator() {
  const [Vp, setVp] = useState('240');
  const [Vs, setVs] = useState('');
  const [Np, setNp] = useState('1000');
  const [Ns, setNs] = useState('100');

  const calculate = () => {
    let vp = parseFloat(Vp);
    let vs = parseFloat(Vs);
    let np = parseFloat(Np);
    let ns = parseFloat(Ns);

    let count = 0;
    if (!isNaN(vp)) count++;
    if (!isNaN(vs)) count++;
    if (!isNaN(np)) count++;
    if (!isNaN(ns)) count++;

    if (count < 3) return null;

    if (isNaN(vp)) vp = (vs * np) / ns;
    if (isNaN(vs)) vs = (vp * ns) / np;
    if (isNaN(np)) np = (vp * ns) / vs;
    if (isNaN(ns)) ns = (vs * np) / vp;

    const ratio = np / ns;

    return {
      Vp: vp.toFixed(2),
      Vs: vs.toFixed(2),
      Np: Math.round(np).toString(),
      Ns: Math.round(ns).toString(),
      Ratio: ratio.toFixed(2)
    };
  };

  const results = calculate();

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Primary Voltage (V)', val: Vp, set: setVp, placeholder: '240' },
          { label: 'Secondary Voltage (V)', val: Vs, set: setVs, placeholder: '24' },
          { label: 'Primary Turns (N)', val: Np, set: setNp, placeholder: '1000' },
          { label: 'Secondary Turns (N)', val: Ns, set: setNs, placeholder: '100' },
        ].map(({ label, val, set, placeholder }) => (
          <div key={label}>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">{label}</label>
            <input value={val} onChange={e => set(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-sm text-fuchsia-300 focus:outline-none focus:border-fuchsia-600 placeholder:text-slate-700" placeholder={placeholder} />
          </div>
        ))}
      </div>

      {!results ? (
        <div className="flex flex-col items-center justify-center p-8 z-10 w-full relative min-h-[200px]">
          <div className="text-center space-y-4 max-w-lg bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-2xl">
            <Cpu size={48} className="mx-auto text-fuchsia-500 opacity-50 mb-6" />
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-pink-300 tracking-widest uppercase mb-2">Ideal Transformer</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Enter exactly 3 known values to automatically calculate the 4th value and the turns ratio.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Primary Volts', value: `${results.Vp} V`, color: 'fuchsia' },
            { label: 'Secondary Volts', value: `${results.Vs} V`, color: 'pink' },
            { label: 'Primary Turns', value: `${results.Np}`, color: 'violet' },
            { label: 'Secondary Turns', value: `${results.Ns}`, color: 'indigo' },
            { label: 'Turns Ratio (Np/Ns)', value: `${results.Ratio}`, color: 'rose' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`bg-${color}-950/20 border border-${color}-900/30 rounded-xl p-4 space-y-1`}>
              <div className={`text-[8px] font-black uppercase tracking-widest text-${color}-700`}>{label}</div>
              <div className={`text-sm font-mono font-black text-${color}-300`}>{value}</div>
            </div>
          ))}
        </div>
      )}
      <div className="text-right">
        <button onClick={() => { setVp(''); setVs(''); setNp(''); setNs(''); }} className="text-[10px] font-black text-slate-500 hover:text-slate-300 uppercase tracking-widest">Clear All</button>
      </div>
    </div>
  );
}

// ─── 3-Phase Power Analyzer ────────────────────────────────────────────────

function ThreePhasePowerCalculator() {
  const [Vll, setVll] = useState('400');
  const [I, setI] = useState('10');
  const [PF, setPF] = useState('0.85');

  const results = useMemo(() => {
    const v = parseFloat(Vll);
    const i = parseFloat(I);
    const pf = parseFloat(PF);

    if (isNaN(v) || isNaN(i) || isNaN(pf) || pf < 0 || pf > 1) return null;

    const S = Math.sqrt(3) * v * i; // Apparent Power (VA)
    const P = S * pf; // Real Power (W)
    const Q = S * Math.sin(Math.acos(pf)); // Reactive Power (VAR)

    return {
      S: (S / 1000).toFixed(2), // kVA
      P: (P / 1000).toFixed(2), // kW
      Q: (Q / 1000).toFixed(2), // kVAR
      I: i.toFixed(2),
    };
  }, [Vll, I, PF]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Line-to-Line Voltage (V)</label>
          <input value={Vll} onChange={e => setVll(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-sm text-rose-300 focus:outline-none focus:border-rose-600" placeholder="400" />
        </div>
        <div>
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Line Current (A)</label>
          <input value={I} onChange={e => setI(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-sm text-rose-300 focus:outline-none focus:border-rose-600" placeholder="10" />
        </div>
        <div>
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Power Factor (0.0 - 1.0)</label>
          <input value={PF} onChange={e => setPF(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-sm text-rose-300 focus:outline-none focus:border-rose-600" placeholder="0.85" />
        </div>
      </div>
      {!results ? (
        <div className="flex flex-col items-center justify-center p-8 z-10 w-full relative min-h-[200px]">
          <div className="text-center space-y-4 max-w-lg bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-2xl">
            <ShieldCheck size={48} className="mx-auto text-rose-500 opacity-50 mb-6" />
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-300 tracking-widest uppercase mb-2">3-Phase Power Analyzer</h2>
            <p className="text-slate-400 text-sm leading-relaxed">Calculate Apparent (S), Real (P), and Reactive (Q) power for a balanced 3-phase system.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Real Power (P)', value: `${results.P} kW`, color: 'emerald' },
            { label: 'Reactive Power (Q)', value: `${results.Q} kVAR`, color: 'rose' },
            { label: 'Apparent Power (S)', value: `${results.S} kVA`, color: 'amber' },
            { label: 'Line Current', value: `${results.I} A`, color: 'cyan' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`bg-${color}-950/20 border border-${color}-900/30 rounded-xl p-4 space-y-1`}>
              <div className={`text-[8px] font-black uppercase tracking-widest text-${color}-700`}>{label}</div>
              <div className={`text-sm font-mono font-black text-${color}-300`}>{value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'rlc', label: 'RLC / Impedance' },
  { id: 'ohms', label: "Ohm's Law / Power" },
  { id: 'basic', label: 'Component Params' },
  { id: 'transformer', label: 'Transformer' },
  { id: '3phase', label: '3-Phase Power' },
];

export default function Electrotechnology() {
  const [tab, setTab] = useState('rlc');

  return (
    <div className="h-full overflow-y-auto p-6 space-y-5">
      <div className="flex flex-wrap gap-1.5">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('px-3 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap',
              tab === t.id ? 'bg-amber-600/20 border border-amber-600/30 text-amber-400' : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800/60')}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        {tab === 'rlc' && <RLCCalculator />}
        {tab === 'ohms' && <OhmsLawCalculator />}
        {tab === 'basic' && <BasicAdvancedCalculator />}
        {tab === 'transformer' && <TransformerCalculator />}
        {tab === '3phase' && <ThreePhasePowerCalculator />}
      </div>
    </div>
  );
}
