import { useState, useMemo } from 'react';
import { Search, Download } from 'lucide-react';
import { generateReferenceData } from '@/lib/binary-lab';

function cn(...c: (string | boolean | undefined | null)[]) { return c.filter(Boolean).join(' '); }

type RangePreset = { label: string; start: number; end: number };
const PRESETS: RangePreset[] = [
  { label: 'Control (0–31)',   start: 0,   end: 31  },
  { label: 'Printable (32–127)', start: 32, end: 127 },
  { label: 'Full ASCII (0–127)', start: 0,  end: 127 },
  { label: '0–255',            start: 0,   end: 255 },
];

export default function ReferenceTable() {
  const [preset, setPreset] = useState(1);
  const [search, setSearch] = useState('');
  const [width, setWidth] = useState(8);
  const [highlight, setHighlight] = useState<number | null>(null);

  const { start, end } = PRESETS[preset];
  const data = useMemo(() => generateReferenceData(start, end, width), [start, end, width]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(r =>
      r.dec.toString().includes(q) ||
      r.bin.includes(q) ||
      r.hex.toLowerCase().includes(q) ||
      r.oct.includes(q) ||
      r.char.toLowerCase().includes(q)
    );
  }, [data, search]);

  const exportCSV = () => {
    const header = 'Dec,Bin,Hex,Oct,Char,Parity\n';
    const rows = data.map(r => `${r.dec},${r.bin},${r.hex},${r.oct},${r.char},${r.parity % 2 === 0 ? 'Even' : 'Odd'}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'reference_table.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-5">
      <div className="space-y-5">
        
        {/* ── Controls & Stats ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Reference Table Config</div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-2">Presets</label>
                <div className="flex flex-col gap-1.5">
                  {PRESETS.map((p, i) => (
                    <button key={i} onClick={() => setPreset(i)}
                      className={cn('px-3 py-1.5 text-left rounded text-[10px] font-black uppercase tracking-wide transition-all',
                        preset === i ? 'bg-cyan-600/20 border border-cyan-600/30 text-cyan-400' : 'bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-300')}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-2">Bit Width</label>
                  <div className="flex items-center gap-2">
                    {[4, 8, 16].map(w => (
                      <button key={w} onClick={() => setWidth(w)}
                        className={cn('flex-1 py-1.5 rounded font-black text-xs transition-all border', width === w ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300')}>
                        {w}-bit
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={exportCSV}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">
                  <Download size={13} /> Export to CSV
                </button>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-2">Search</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search values..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-cyan-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Statistics</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Rows shown', value: filtered.length },
                { label: 'Even parity', value: filtered.filter(r => r.parity % 2 === 0).length },
                { label: 'Odd parity',  value: filtered.filter(r => r.parity % 2 !== 0).length },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                  <div className="text-[8px] text-slate-600 uppercase font-black tracking-widest mb-1">{label}</div>
                  <div className="font-mono font-black text-cyan-400 text-lg">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="relative min-h-[400px]">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 z-10">
              <div className="text-center space-y-4 max-w-lg bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-2xl">
                <Search size={48} className="mx-auto text-cyan-500 opacity-50 mb-6" />
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-300 tracking-widest uppercase mb-2">No Results Found</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  No matching reference data was found for "{search}".
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden h-[600px] flex flex-col">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data Table</div>
                <div className="text-[9px] text-slate-600 font-mono flex gap-4">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Even Parity</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Odd Parity</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-500"></span> HIGH bit</span>
                </div>
              </div>
              <div className="overflow-auto flex-1">
                <table className="w-full text-xs font-mono">
                  <thead className="sticky top-0 z-10 bg-slate-950 shadow-sm border-b border-slate-800">
                    <tr>
                      {['Dec', 'Binary', 'Hex', 'Octal', 'Char', 'Parity', 'Signal Density'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(row => {
                      const density = ((row.parity / (row.bin.length || 1)) * 100);
                      const isHL = highlight === row.dec;
                      return (
                        <tr key={row.dec}
                          onClick={() => setHighlight(h => h === row.dec ? null : row.dec)}
                          className={cn('border-b border-slate-800/40 transition-colors cursor-pointer',
                            isHL ? 'bg-cyan-950/30 border-cyan-900/30' : 'hover:bg-slate-800/30')}>
                          <td className="px-4 py-2.5 text-slate-400 font-bold">{row.dec}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex gap-0.5">
                              {row.bin.split('').map((b, i) => (
                                <span key={i} className={cn('font-black', b === '1' ? 'text-cyan-400' : 'text-slate-700')}>{b}</span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-violet-400 font-bold">{row.hex}</td>
                          <td className="px-4 py-2.5 text-amber-400/70">{row.oct}</td>
                          <td className="px-4 py-2.5">
                            <span className={cn('px-2 py-0.5 rounded border text-[10px] font-black',
                              row.char === 'CTRL' || row.char === 'EXT'
                                ? 'bg-slate-900 border-slate-700 text-slate-500'
                                : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300')}>
                              {row.char}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className={cn('w-2 h-2 rounded-full', row.parity % 2 === 0 ? 'bg-blue-500/60' : 'bg-orange-500/60')} />
                              <span className={cn('text-[9px] font-black uppercase', row.parity % 2 === 0 ? 'text-blue-400' : 'text-orange-400')}>
                                {row.parity % 2 === 0 ? 'Even' : 'Odd'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-500 transition-all" style={{ width: `${density}%` }} />
                              </div>
                              <span className="text-[9px] text-slate-600">{density.toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
