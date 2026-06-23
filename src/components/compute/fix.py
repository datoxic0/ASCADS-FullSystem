import re

with open("NumberFormats.tsx", "r", encoding="utf-8") as f:
    content = f.read()

start_marker = "// ─── Hamming ──────────────────────────────────────────────────────────────────"
end_marker = "// ─── Signed Numbers ───────────────────────────────────────────────────────────"

replacement = """// ─── Hamming ──────────────────────────────────────────────────────────────────

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

"""

pattern = re.compile(re.escape(start_marker) + r".*?" + re.escape(end_marker), re.DOTALL)
new_content = pattern.sub(replacement + end_marker, content)

with open("NumberFormats.tsx", "w", encoding="utf-8") as f:
    f.write(new_content)

print("Replaced successfully")
