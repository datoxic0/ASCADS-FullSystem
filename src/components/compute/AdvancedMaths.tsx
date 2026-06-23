import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sigma, Grid, Waves, Activity, Calculator, X } from 'lucide-react';

function cn(...c: (string | boolean | undefined | null)[]) { return c.filter(Boolean).join(' '); }

// ─── Complex Numbers Calculator ──────────────────────────────────────────────
function ComplexCalculator() {
  const [r1, setR1] = useState('3');
  const [i1, setI1] = useState('4');
  const [r2, setR2] = useState('1');
  const [i2, setI2] = useState('-2');
  const [op, setOp] = useState<'add' | 'sub' | 'mul' | 'div'>('add');

  const results = useMemo(() => {
    const a = parseFloat(r1);
    const b = parseFloat(i1);
    const c = parseFloat(r2);
    const d = parseFloat(i2);
    
    if (isNaN(a) || isNaN(b) || isNaN(c) || isNaN(d)) return null;

    let resR = 0;
    let resI = 0;
    
    if (op === 'add') { resR = a + c; resI = b + d; }
    else if (op === 'sub') { resR = a - c; resI = b - d; }
    else if (op === 'mul') { resR = (a * c) - (b * d); resI = (a * d) + (b * c); }
    else if (op === 'div') { 
      const den = c*c + d*d;
      if (den === 0) return 'error';
      resR = ((a * c) + (b * d)) / den; 
      resI = ((b * c) - (a * d)) / den; 
    }

    const mag = Math.sqrt(resR*resR + resI*resI);
    const phase = Math.atan2(resI, resR) * (180 / Math.PI);

    return {
      r: resR.toFixed(3),
      i: resI.toFixed(3),
      mag: mag.toFixed(3),
      phase: phase.toFixed(2),
      formatted: `${resR.toFixed(2)} ${resI >= 0 ? '+' : '-'} ${Math.abs(resI).toFixed(2)}i`
    };
  }, [r1, i1, r2, i2, op]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <aside className="lg:col-span-4 space-y-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Complex Operands</div>
          <div className="space-y-4">
            <div>
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1.5">Z1 = a + bi</label>
              <div className="flex gap-2">
                <input value={r1} onChange={e => setR1(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-sm text-cyan-300 focus:outline-none focus:border-cyan-600" placeholder="Real" />
                <input value={i1} onChange={e => setI1(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-sm text-cyan-300 focus:outline-none focus:border-cyan-600" placeholder="Imaginary" />
              </div>
            </div>
            
            <div className="flex gap-1 bg-slate-950 rounded-lg p-0.5">
              {[
                { id: 'add', label: '+' }, { id: 'sub', label: '−' },
                { id: 'mul', label: '×' }, { id: 'div', label: '÷' }
              ].map(o => (
                <button key={o.id} onClick={() => setOp(o.id as any)}
                  className={`flex-1 py-1 text-sm font-black transition-all rounded ${op === o.id ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                  {o.label}
                </button>
              ))}
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1.5">Z2 = c + di</label>
              <div className="flex gap-2">
                <input value={r2} onChange={e => setR2(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-sm text-violet-300 focus:outline-none focus:border-violet-600" placeholder="Real" />
                <input value={i2} onChange={e => setI2(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-sm text-violet-300 focus:outline-none focus:border-violet-600" placeholder="Imaginary" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      <section className="lg:col-span-8 space-y-5 relative min-h-[400px]">
        {!results ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
            <div className="text-center space-y-4 max-w-lg bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-2xl">
              <Calculator size={48} className="mx-auto text-cyan-500 opacity-50 mb-6" />
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-300 tracking-widest uppercase mb-2">Complex Numbers</h2>
              <p className="text-slate-400 text-sm leading-relaxed">Enter real and imaginary components for two complex numbers to compute their sum, difference, product, or quotient.</p>
            </div>
          </div>
        ) : results === 'error' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
            <div className="text-center space-y-4 max-w-lg bg-red-950/40 p-8 rounded-2xl border border-red-500/20">
              <X size={48} className="mx-auto text-red-500 opacity-50 mb-6" />
              <h2 className="text-xl font-black text-red-400 uppercase tracking-widest">Division by Zero</h2>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center min-h-[200px]">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Result (Rectangular)</div>
              <div className="text-4xl md:text-6xl font-mono font-black text-white">{results.formatted}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Magnitude |Z|</div>
                <div className="text-2xl font-mono font-bold text-emerald-400">{results.mag}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Phase Angle θ</div>
                <div className="text-2xl font-mono font-bold text-amber-400">{results.phase}°</div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Matrix Operations ──────────────────────────────────────────────────────
function MatrixCalculator() {
  const [matA, setMatA] = useState('1, 2\n3, 4');
  const [matB, setMatB] = useState('2, 0\n1, 2');
  const [op, setOp] = useState<'add' | 'mul' | 'detA' | 'invA'>('mul');

  const parseMatrix = (str: string) => str.trim().split('\n').map(row => row.split(',').map(n => parseFloat(n.trim())));

  const results = useMemo(() => {
    try {
      const A = parseMatrix(matA);
      const B = parseMatrix(matB);
      
      // Validation
      if (A.some(r => r.some(isNaN)) || B.some(r => r.some(isNaN))) return null;

      if (op === 'detA') {
        if (A.length !== A[0].length || A.length > 3) return 'Unsupported dimension for determinant (max 3x3).';
        let det = 0;
        if (A.length === 1) det = A[0][0];
        else if (A.length === 2) det = A[0][0]*A[1][1] - A[0][1]*A[1][0];
        else if (A.length === 3) {
          det = A[0][0]*(A[1][1]*A[2][2] - A[1][2]*A[2][1])
              - A[0][1]*(A[1][0]*A[2][2] - A[1][2]*A[2][0])
              + A[0][2]*(A[1][0]*A[2][1] - A[1][1]*A[2][0]);
        }
        return { type: 'scalar', val: det.toFixed(3) };
      }

      if (op === 'invA') {
        if (A.length !== 2 || A[0].length !== 2) return 'Only 2x2 inverse supported currently.';
        const det = A[0][0]*A[1][1] - A[0][1]*A[1][0];
        if (det === 0) return 'Matrix is singular (det = 0).';
        const inv = [
          [ A[1][1]/det, -A[0][1]/det ],
          [ -A[1][0]/det, A[0][0]/det ]
        ];
        return { type: 'matrix', val: inv.map(r => r.map(n => n.toFixed(3)).join(', ')).join('\n') };
      }

      if (op === 'add') {
        if (A.length !== B.length || A[0].length !== B[0].length) return 'Dimensions mismatch for addition.';
        const res = A.map((r, i) => r.map((n, j) => n + B[i][j]));
        return { type: 'matrix', val: res.map(r => r.map(n => n.toFixed(3)).join(', ')).join('\n') };
      }

      if (op === 'mul') {
        if (A[0].length !== B.length) return 'Inner dimensions mismatch for multiplication.';
        const res = Array(A.length).fill(0).map(() => Array(B[0].length).fill(0));
        for (let i = 0; i < A.length; i++) {
          for (let j = 0; j < B[0].length; j++) {
            for (let k = 0; k < B.length; k++) {
              res[i][j] += A[i][k] * B[k][j];
            }
          }
        }
        return { type: 'matrix', val: res.map(r => r.map(n => n.toFixed(3)).join(', ')).join('\n') };
      }

      return null;
    } catch {
      return null;
    }
  }, [matA, matB, op]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <aside className="lg:col-span-4 space-y-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Matrices</div>
          
          <div>
            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1.5">Matrix A (CSV format)</label>
            <textarea value={matA} onChange={e => setMatA(e.target.value)} rows={4}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-xs text-indigo-300 focus:outline-none focus:border-indigo-600 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'mul', label: 'A × B' },
              { id: 'add', label: 'A + B' },
              { id: 'detA', label: 'Det(A)' },
              { id: 'invA', label: 'Inv(A)' },
            ].map(o => (
              <button key={o.id} onClick={() => setOp(o.id as any)}
                className={`py-2 text-[10px] uppercase tracking-widest font-black transition-all rounded-lg border ${op === o.id ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'}`}>
                {o.label}
              </button>
            ))}
          </div>

          {(op === 'mul' || op === 'add') && (
            <div>
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1.5">Matrix B (CSV format)</label>
              <textarea value={matB} onChange={e => setMatB(e.target.value)} rows={4}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-xs text-violet-300 focus:outline-none focus:border-violet-600 resize-none" />
            </div>
          )}
        </div>
      </aside>

      <section className="lg:col-span-8 space-y-5 relative min-h-[400px]">
        {!results ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
            <div className="text-center space-y-4 max-w-lg bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-2xl">
              <Grid size={48} className="mx-auto text-indigo-500 opacity-50 mb-6" />
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-300 tracking-widest uppercase mb-2">Matrix Operations</h2>
              <p className="text-slate-400 text-sm leading-relaxed">Enter matrices using comma-separated values for rows. Supports multiplication, addition, determinants, and inverses.</p>
            </div>
          </div>
        ) : typeof results === 'string' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
            <div className="text-center space-y-4 max-w-lg bg-red-950/40 p-8 rounded-2xl border border-red-500/20">
              <X size={48} className="mx-auto text-red-500 opacity-50 mb-6" />
              <h2 className="text-xl font-black text-red-400 uppercase tracking-widest">Mathematical Error</h2>
              <p className="text-red-300/70 text-sm">{results}</p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-full flex flex-col">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Output</div>
            <div className="flex-1 flex items-center justify-center">
              {results.type === 'scalar' ? (
                <div className="text-6xl font-mono font-black text-white">{results.val}</div>
              ) : (
                <div className="inline-block relative">
                  <div className="absolute left-0 top-0 bottom-0 w-4 border-l-4 border-t-4 border-b-4 border-slate-600 rounded-l-xl"></div>
                  <div className="absolute right-0 top-0 bottom-0 w-4 border-r-4 border-t-4 border-b-4 border-slate-600 rounded-r-xl"></div>
                  <pre className="px-8 py-4 text-xl sm:text-3xl font-mono font-bold text-indigo-300 leading-loose text-center">
                    {results.val}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Fourier Series Analyzer ────────────────────────────────────────────────
function FourierAnalyzer() {
  const [wave, setWave] = useState<'square' | 'sawtooth' | 'triangle'>('square');
  const [harmonics, setHarmonics] = useState(5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <aside className="lg:col-span-4 space-y-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Waveform Selection</div>
            <div className="flex flex-col gap-2">
              {[
                { id: 'square', label: 'Square Wave' },
                { id: 'sawtooth', label: 'Sawtooth Wave' },
                { id: 'triangle', label: 'Triangle Wave' }
              ].map(w => (
                <button key={w.id} onClick={() => setWave(w.id as any)}
                  className={`px-3 py-2 text-left rounded border transition-all ${wave === w.id ? 'bg-rose-600/20 border-rose-500 text-rose-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Harmonics (N)</label>
              <span className="text-rose-400 font-mono font-bold">{harmonics}</span>
            </div>
            <input type="range" min={1} max={50} value={harmonics} onChange={e => setHarmonics(+e.target.value)}
              className="w-full accent-rose-500" />
          </div>
        </div>
      </aside>

      <section className="lg:col-span-8 space-y-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-[400px] flex flex-col">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2"><Waves size={14} /> Fourier Approximation</span>
          </div>
          <div className="flex-1 relative border border-slate-800 bg-black rounded-lg overflow-hidden flex items-center justify-center p-4">
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
              {/* Grid */}
              <line x1="0" y1="100" x2="500" y2="100" stroke="#1e293b" strokeWidth="2" />
              <line x1="250" y1="0" x2="250" y2="200" stroke="#1e293b" strokeWidth="2" />
              
              {/* Signal */}
              <path
                d={`M 0 100 ` + Array.from({ length: 500 }).map((_, i) => {
                  const x = i;
                  const t = (x / 250) * Math.PI * 2; // 2 full cycles
                  let y = 0;
                  
                  for (let n = 1; n <= harmonics; n++) {
                    if (wave === 'square') {
                      if (n % 2 !== 0) y += (4 / Math.PI) * (Math.sin(n * t) / n);
                    } else if (wave === 'sawtooth') {
                      y += (2 / Math.PI) * (Math.pow(-1, n + 1) * Math.sin(n * t) / n);
                    } else if (wave === 'triangle') {
                      if (n % 2 !== 0) {
                        y += (8 / (Math.PI * Math.PI)) * (Math.pow(-1, (n-1)/2) * Math.sin(n * t) / (n * n));
                      }
                    }
                  }
                  return `L ${x} ${100 - y * 40}`;
                }).join(' ')}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="text-center mt-4 text-xs font-mono text-slate-400">
            {wave === 'square' && 'f(t) = (4/π) ∑ [sin(n·t) / n] for n = 1,3,5...'}
            {wave === 'sawtooth' && 'f(t) = (2/π) ∑ [(-1)^(n+1) · sin(n·t) / n]'}
            {wave === 'triangle' && 'f(t) = (8/π²) ∑ [(-1)^((n-1)/2) · sin(n·t) / n²]'}
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Vectors & Geometry ─────────────────────────────────────────────────────
function VectorCalculator() {
  const [v1x, setV1x] = useState('3');
  const [v1y, setV1y] = useState('4');
  const [v1z, setV1z] = useState('0');
  
  const [v2x, setV2x] = useState('1');
  const [v2y, setV2y] = useState('-2');
  const [v2z, setV2z] = useState('5');

  const results = useMemo(() => {
    const ax = parseFloat(v1x); const ay = parseFloat(v1y); const az = parseFloat(v1z);
    const bx = parseFloat(v2x); const by = parseFloat(v2y); const bz = parseFloat(v2z);
    
    if (isNaN(ax) || isNaN(ay) || isNaN(az) || isNaN(bx) || isNaN(by) || isNaN(bz)) return null;

    const dot = ax*bx + ay*by + az*bz;
    const cross = [ay*bz - az*by, az*bx - ax*bz, ax*by - ay*bx];
    const magA = Math.sqrt(ax*ax + ay*ay + az*az);
    const magB = Math.sqrt(bx*bx + by*by + bz*bz);
    
    let angle = 0;
    if (magA > 0 && magB > 0) {
      const cosTheta = dot / (magA * magB);
      // clamp to handle float precision issues
      angle = Math.acos(Math.max(-1, Math.min(1, cosTheta))) * (180 / Math.PI);
    }

    return {
      dot: dot.toFixed(2),
      cross: `[${cross[0].toFixed(2)}, ${cross[1].toFixed(2)}, ${cross[2].toFixed(2)}]`,
      magA: magA.toFixed(2),
      magB: magB.toFixed(2),
      angle: angle.toFixed(2)
    };
  }, [v1x, v1y, v1z, v2x, v2y, v2z]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <aside className="lg:col-span-4 space-y-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Vector A (x, y, z)</div>
            <div className="flex gap-2">
              <input value={v1x} onChange={e => setV1x(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 font-mono text-xs text-amber-300 text-center" />
              <input value={v1y} onChange={e => setV1y(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 font-mono text-xs text-amber-300 text-center" />
              <input value={v1z} onChange={e => setV1z(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 font-mono text-xs text-amber-300 text-center" />
            </div>
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Vector B (x, y, z)</div>
            <div className="flex gap-2">
              <input value={v2x} onChange={e => setV2x(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 font-mono text-xs text-emerald-300 text-center" />
              <input value={v2y} onChange={e => setV2y(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 font-mono text-xs text-emerald-300 text-center" />
              <input value={v2z} onChange={e => setV2z(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 font-mono text-xs text-emerald-300 text-center" />
            </div>
          </div>
        </div>
      </aside>

      <section className="lg:col-span-8 space-y-5 relative min-h-[400px]">
        {!results ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
            <div className="text-center space-y-4 max-w-lg bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-2xl">
              <Activity size={48} className="mx-auto text-amber-500 opacity-50 mb-6" />
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 tracking-widest uppercase mb-2">3D Vector Calculus</h2>
              <p className="text-slate-400 text-sm leading-relaxed">Enter 3D coordinates for two vectors to compute dot product, cross product, and relative angle.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Dot Product (A • B)</div>
              <div className="text-3xl font-mono font-bold text-white">{results.dot}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Angle Between (θ)</div>
              <div className="text-3xl font-mono font-bold text-blue-400">{results.angle}°</div>
            </div>
            <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Cross Product (A × B)</div>
              <div className="text-4xl font-mono font-bold text-emerald-400 tracking-wider">{results.cross}</div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
              <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Magnitude |A|</div>
              <div className="text-xl font-mono font-bold text-amber-500">{results.magA}</div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
              <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Magnitude |B|</div>
              <div className="text-xl font-mono font-bold text-emerald-500">{results.magB}</div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Main Hub ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'complex', label: 'Complex Numbers' },
  { id: 'matrix', label: 'Matrix Algebra' },
  { id: 'fourier', label: 'Fourier Series' },
  { id: 'vectors', label: 'Vector Geometry' },
];

export default function AdvancedMaths() {
  const [tab, setTab] = useState('complex');

  return (
    <div className="h-full overflow-y-auto p-6 space-y-5">
      <div className="flex flex-wrap gap-1.5">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('px-3 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap',
              tab === t.id ? 'bg-indigo-600/20 border border-indigo-600/30 text-indigo-400' : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800/60 border border-transparent')}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-slate-950 rounded-xl border border-transparent">
        {tab === 'complex' && <ComplexCalculator />}
        {tab === 'matrix' && <MatrixCalculator />}
        {tab === 'fourier' && <FourierAnalyzer />}
        {tab === 'vectors' && <VectorCalculator />}
      </div>
    </div>
  );
}
