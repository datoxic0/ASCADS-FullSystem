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
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex flex-wrap gap-1">
          {PRESETS.map((p, i) => (
            <button key={i} onClick={() => setPreset(i)}
              className={cn('px-2.5 py-1.5 rounded text-[9px] font-black uppercase tracking-wide transition-all',
                preset === i ? 'bg-cyan-600/20 border border-cyan-600/30 text-cyan-400' : 'bg-slate-800 border border-slate-700 text-slate-500 hover:text-slate-300')}>
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] text-slate-600 font-black uppercase">Width:</span>
          {[4, 8, 16].map(w => (
            <button key={w} onClick={() => setWidth(w)}
              className={cn('w-8 h-7 rounded font-black text-xs', width === w ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700')}>
              {w}
            </button>
          ))}
        </div>

        <div className="relative ml-auto">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            className="bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs font-mono text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-cyan-600 w-36" />
        </div>

        <button onClick={exportCSV}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">
          <Download size={11} /> CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Rows shown', value: filtered.length },
          { label: 'Even parity', value: filtered.filter(r => r.parity % 2 === 0).length },
          { label: 'Odd parity',  value: filtered.filter(r => r.parity % 2 !== 0).length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
            <div className="text-[8px] text-slate-600 uppercase font-black tracking-widest mb-1">{label}</div>
            <div className="font-mono font-black text-cyan-400 text-lg">{value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-auto max-h-[560px]">
          <table className="w-full text-xs font-mono">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-900 border-b border-slate-800">
                {['Dec', 'Binary', 'Hex', 'Octal', 'Char', 'Parity', 'Signal Density'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
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
                    <td className="px-3 py-2 text-slate-400 font-bold">{row.dec}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-0.5">
                        {row.bin.split('').map((b, i) => (
                          <span key={i} className={cn('font-black', b === '1' ? 'text-cyan-400' : 'text-slate-700')}>{b}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-violet-400 font-bold">{row.hex}</td>
                    <td className="px-3 py-2 text-amber-400/70">{row.oct}</td>
                    <td className="px-3 py-2">
                      <span className={cn('px-2 py-0.5 rounded border text-[10px] font-black',
                        row.char === 'CTRL' || row.char === 'EXT'
                          ? 'bg-slate-900 border-slate-700 text-slate-500'
                          : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300')}>
                        {row.char}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-2 h-2 rounded-full', row.parity % 2 === 0 ? 'bg-blue-500/60' : 'bg-orange-500/60')} />
                        <span className={cn('text-[9px] font-black uppercase', row.parity % 2 === 0 ? 'text-blue-400' : 'text-orange-400')}>
                          {row.parity % 2 === 0 ? 'Even' : 'Odd'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
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
          {filtered.length === 0 && (
            <div className="p-10 text-center text-slate-600 text-sm">No results for "{search}"</div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-[9px] text-slate-700 font-mono flex gap-4">
        <span><span className="text-blue-500 font-bold">■</span> Even Parity</span>
        <span><span className="text-orange-500 font-bold">■</span> Odd Parity</span>
        <span><span className="text-cyan-500 font-bold">■</span> HIGH bit</span>
        <span className="ml-auto">Click a row to highlight it</span>
      </div>
    </div>
  );
}
