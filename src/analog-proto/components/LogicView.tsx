import React, { useState, useEffect } from 'react';
import { CircuitDesign, Component } from '../types';
import { LogicAnalyzer, TruthTableRow } from '../services/logicAnalyzer';
import { motion, AnimatePresence } from 'motion/react';
import { Table, Calculator, Hash, Zap, Braces, RefreshCcw, LayoutGrid, Search } from 'lucide-react';

interface LogicViewProps {
  design: CircuitDesign;
  onUpdateDesign: (design: CircuitDesign) => void;
  onViewChange?: (view: any) => void;
}

export default function LogicView({ design, onUpdateDesign, onViewChange }: LogicViewProps) {
  const [truthTable, setTruthTable] = useState<TruthTableRow[]>([]);
  const [expressions, setExpressions] = useState<Record<string, string>>({});
  const [matrixData, setMatrixData] = useState<{ labels: string[], matrix: number[][] }>({ labels: [], matrix: [] });
  const [insights, setInsights] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'TABLE' | 'EXPRESSION' | 'FORMS' | 'MATRIX'>('TABLE');
  const [inputExpression, setInputExpression] = useState('');

  const handleCompile = () => {
    if (!inputExpression.trim()) return;
    const newDesign = LogicAnalyzer.compileToDesign(inputExpression);
    onUpdateDesign(newDesign);
    onViewChange?.('DESIGN');
  };

  useEffect(() => {
    const table = LogicAnalyzer.generateTruthTable(design);
    setTruthTable(table);

    const outputExprs: Record<string, string> = {};
    const outputs = design.components.filter(c => 
      c.type === 'LED' || c.type === 'BUZZER' || c.type === 'SPEAKER'
    );
    outputs.forEach(output => {
      outputExprs[output.label || output.id] = LogicAnalyzer.getExpression(design, output.id);
    });
    setExpressions(outputExprs);

    const matrix = LogicAnalyzer.generateAdjacencyMatrix(design);
    setMatrixData(matrix);

    const circuitInsights = LogicAnalyzer.analyzeCircuit(design);
    setInsights(circuitInsights);
  }, [design]);

  const inputs = truthTable.length > 0 ? Object.keys(truthTable[0].inputs) : [];
  const outputs = truthTable.length > 0 ? Object.keys(truthTable[0].outputs) : [];

  return (
    <div className="flex-1 bg-slate-950 flex flex-col p-4 md:p-8 overflow-auto font-sans scrollbar-hide">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 shrink-0">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                <Braces size={20} />
             </div>
             Logic Analysis Center
          </h2>
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest pl-1">Siyabonga Boolean Engine v1.1</p>
        </div>

        <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 overflow-x-auto max-w-full scrollbar-hide">
           {[
             { id: 'TABLE', icon: Table, label: 'Truth Table' },
             { id: 'EXPRESSION', icon: Calculator, label: 'Boolean algebra' },
             { id: 'FORMS', icon: Hash, label: 'Standard Forms' },
             { id: 'MATRIX', icon: LayoutGrid, label: 'State Matrix' }
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                 activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'
               }`}
             >
                <tab.icon size={14} />
                {tab.label}
             </button>
           ))}
        </div>
      </header>

      {/* Boolean Compiler Bar */}
      <div className="mb-8 p-6 bg-slate-900/80 border border-indigo-500/20 rounded-3xl backdrop-blur-xl flex flex-col gap-6">
         <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full relative">
               <Calculator className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
               <input 
                 value={inputExpression}
                 onChange={(e) => setInputExpression(e.target.value)}
                 placeholder="Industrial Boolean Syntax: (A + B) . ¬C"
                 className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all placeholder:text-slate-700"
               />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
               <button 
                 onClick={() => {
                   const firstOutput = Object.keys(expressions)[0];
                   if (firstOutput) setInputExpression(expressions[firstOutput]);
                 }}
                 className="px-4 py-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all border border-indigo-500/20 active:scale-95 flex items-center gap-2"
                 title="Import from Canvas"
               >
                  <RefreshCcw size={14} className="rotate-180" />
                  Sync
               </button>
               <button 
                 onClick={() => setInputExpression(LogicAnalyzer.simplify(inputExpression))}
                 className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all border border-slate-700 active:scale-95 flex items-center gap-2"
                 title="Optimize Logic"
               >
                  <Search size={14} />
                  Simplify
               </button>
               <button 
                 onClick={handleCompile}
                 className="flex-1 md:flex-initial px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[.2em] rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2"
               >
                  <RefreshCcw size={14} />
                  Compile to RTL
               </button>
            </div>
         </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-4 border-t border-slate-800/50">
            {[
              { label: 'AND', sym: '.', color: 'text-indigo-400' },
              { label: 'OR', sym: '+', color: 'text-emerald-400' },
              { label: 'NOT', sym: '¬ / !', color: 'text-rose-400' },
              { label: 'XOR', sym: '⊕ / ^', color: 'text-amber-400' },
              { label: 'LITERAL', sym: '0 / 1', color: 'text-slate-400' },
              { label: 'GROUP', sym: '()', color: 'text-slate-400' },
            ].map(op => (
              <div key={op.label} className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 flex justify-between items-center group hover:border-indigo-500/30 transition-colors">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{op.label}</span>
                <code className={`text-xs font-mono font-bold ${op.color}`}>{op.sym}</code>
              </div>
            ))}
          </div>
      </div>

      {insights && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
           {[
             { label: 'Gate Count', value: insights.gateCount, color: 'text-indigo-400' },
             { label: 'Max Depth', value: insights.maxDepth, color: 'text-emerald-400' },
             { label: 'Sim Connections', value: insights.connectionCount, color: 'text-amber-400' },
             { label: 'I/O Density', value: `${insights.inputCount}:${insights.outputCount}`, color: 'text-rose-400' }
           ].map(item => (
             <div key={item.label} className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-1 shadow-inner">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                <span className={`text-xl font-black ${item.color}`}>{item.value}</span>
             </div>
           ))}
        </div>
      )}

      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {activeTab === 'TABLE' && (
            <motion.div 
              key="table"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full border border-slate-800 rounded-3xl bg-slate-900/50 backdrop-blur-xl overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-white/5 bg-slate-950 flex justify-between items-center">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logic Enumeration Matrix</span>
                 <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-indigo-500" />
                       <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Input Vector</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500" />
                       <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Output Signal</span>
                    </div>
                 </div>
              </div>
              {truthTable.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-10 text-center">
                   <Zap size={40} className="mb-4 opacity-20" />
                   <p className="text-[10px] font-black uppercase tracking-[.3em]">No valid logic inputs/outputs detected or too many inputs (Max 8)</p>
                </div>
              ) : (
                <div className="h-full overflow-auto scrollbar-thin scrollbar-thumb-indigo-500/20 scrollbar-track-transparent">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead className="sticky top-0 bg-slate-950 z-10 shadow-xl">
                      <tr>
                        {inputs.map(input => (
                          <th key={input} className="px-6 py-4 text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-slate-800">{input}</th>
                        ))}
                        <th className="w-px bg-slate-800 px-0 py-0" />
                        {outputs.map(output => (
                          <th key={output} className="px-6 py-4 text-[10px] font-black text-emerald-400 uppercase tracking-widest border-b border-slate-800">{output}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="font-mono text-xs">
                      {truthTable.map((row, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors border-b border-white/5 group">
                          {inputs.map((input, iidx) => (
                            <td key={input} className={`px-6 py-3 font-bold ${row.inputs[input] ? 'text-indigo-400' : 'text-slate-600'}`}>
                               <span className={`px-2 py-1 rounded ${row.inputs[input] ? 'bg-indigo-500/10' : ''}`}>
                                  {row.inputs[input] ? '1' : '0'}
                               </span>
                            </td>
                          ))}
                          <td className="w-px bg-slate-800 px-0 py-0" />
                          {outputs.map(output => (
                            <td key={output} className={`px-6 py-3 font-bold ${row.outputs[output] ? 'text-emerald-400' : 'text-slate-600'}`}>
                               <span className={`px-2 py-1 rounded ${row.outputs[output] ? 'bg-emerald-500/10' : ''}`}>
                                  {row.outputs[output] ? '1' : '0'}
                               </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'EXPRESSION' && (
            <motion.div 
               key="expression"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-auto pr-2 pb-20 scrollbar-hide"
            >
               {Object.entries(expressions).map(([name, expr]) => (
                  <div key={name} className="p-8 bg-slate-900 border border-slate-800 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-bl-full pointer-events-none" />
                     
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[.4em]">Signal Target: {name}</span>
                        <div className="flex gap-2">
                           <div 
                              onClick={() => navigator.clipboard.writeText(expr)}
                              className="p-2 bg-slate-950 rounded-lg text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer group/card"
                              title="Copy Original"
                           >
                              <Calculator size={14} className="group-hover/card:scale-110 transition-transform" />
                           </div>
                           <div 
                              onClick={() => navigator.clipboard.writeText(LogicAnalyzer.simplify(expr))}
                              className="p-2 bg-slate-950 rounded-lg text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer group/card"
                              title="Copy Simplified"
                           >
                              <Zap size={14} className="group-hover/card:scale-110 transition-transform" />
                           </div>
                        </div>
                     </div>
                     
                     <div className="space-y-4">
                        <div className="flex flex-col">
                           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Literal Logic Trace</span>
                           <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-lg text-white break-all shadow-inner">
                              {expr}
                           </div>
                        </div>

                        <div className="flex flex-col">
                           <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-2">Optimization Vector</span>
                           <div className="p-4 bg-indigo-600/10 rounded-2xl border border-indigo-500/20 font-mono text-lg text-indigo-400 shadow-inner break-all">
                              {LogicAnalyzer.simplify(expr)}
                           </div>
                        </div>
                     </div>
                  </div>
               ))}
               {Object.keys(expressions).length === 0 && (
                  <div className="col-span-full py-40 text-center text-slate-600 uppercase tracking-[.2em] font-black text-[10px]">
                     No output signals detected in design matrix.
                  </div>
               )}
            </motion.div>
          )}

          {activeTab === 'FORMS' && (
            <motion.div 
               key="forms"
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               className="grid grid-cols-1 gap-6 overflow-auto pb-20 pr-2 scrollbar-hide"
            >
               {outputs.map(output => (
                 <div key={output} className="p-10 bg-slate-900 border border-slate-800 rounded-4xl space-y-10 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600/10 rotate-12 blur-3xl pointer-events-none" />
                    
                    <div className="flex items-center gap-4">
                       <div className="px-4 py-1.5 bg-indigo-600/20 text-indigo-400 text-[10px] font-black uppercase tracking-[.4em] rounded-full border border-indigo-500/20">
                          Canonical Standard Form: {output}
                       </div>
                       <div className="flex-1 h-px bg-slate-800" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                       <div className="space-y-4">
                          <div className="flex items-center justify-between">
                             <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Sum of Products (SOP)</h4>
                             <span className="text-[8px] font-mono text-slate-500 uppercase">Minterm Expansion</span>
                          </div>
                          <div className="p-6 bg-slate-950 rounded-3xl border border-slate-800 font-mono text-sm text-emerald-400 break-all leading-relaxed shadow-2xl">
                             {LogicAnalyzer.generateSOP(truthTable, output)}
                          </div>
                          <p className="text-[8px] text-slate-600 uppercase font-bold tracking-widest">Generated by tracking boolean 1 states across input vector</p>
                       </div>

                       <div className="space-y-4">
                          <div className="flex items-center justify-between">
                             <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Product of Sums (POS)</h4>
                             <span className="text-[8px] font-mono text-slate-500 uppercase">Maxterm Expansion</span>
                          </div>
                          <div className="p-6 bg-slate-950 rounded-3xl border border-slate-800 font-mono text-sm text-rose-400 break-all leading-relaxed shadow-2xl">
                             {LogicAnalyzer.generatePOS(truthTable, output)}
                          </div>
                          <p className="text-[8px] text-slate-600 uppercase font-bold tracking-widest">Generated by tracking boolean 0 states across input vector</p>
                       </div>
                    </div>
                 </div>
               ))}
               {outputs.length === 0 && (
                  <div className="py-40 text-center text-slate-600 uppercase tracking-[.2em] font-black text-[10px]">
                     No output signals detected for standard form generation.
                  </div>
               )}
            </motion.div>
          )}

          {activeTab === 'MATRIX' && (
            <motion.div 
               key="matrix"
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="h-full border border-slate-800 rounded-3xl bg-slate-900/50 backdrop-blur-xl flex flex-col p-8 overflow-hidden"
            >
               <div className="mb-6 flex justify-between items-center">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Logic Adjacency Matrix</h3>
                  <span className="text-[8px] font-mono text-indigo-400 uppercase tracking-[.2em] bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">Active Graph Nodes: {matrixData.labels.length}</span>
               </div>

               <div className="flex-1 overflow-auto scrollbar-hide">
                  <div className="min-w-fit inline-block p-4">
                     <div className="flex">
                        <div className="w-20" />
                        {matrixData.labels.map((label, idx) => (
                           <div key={idx} className="w-10 h-10 flex items-center justify-center text-[8px] font-black text-slate-500 uppercase tracking-tighter truncate px-1 border-r border-slate-800/50 bg-slate-950/20" title={label}>
                              {label}
                           </div>
                        ))}
                     </div>
                     {matrixData.matrix.map((row, ridx) => (
                        <div key={ridx} className="flex border-b border-slate-800/50">
                           <div className="w-20 h-10 flex items-center justify-end pr-4 text-[8px] font-black text-slate-500 uppercase truncate bg-slate-950/20 border-r border-slate-800/50" title={matrixData.labels[ridx]}>
                              {matrixData.labels[ridx]}
                           </div>
                           {row.map((val, cidx) => (
                              <div 
                                 key={cidx} 
                                 className={`w-10 h-10 flex items-center justify-center text-[10px] font-bold border-r border-slate-800/30 transition-colors ${
                                    val === 1 ? 'bg-indigo-600/40 text-white shadow-[inset_0_0_15px_rgba(79,70,229,0.3)]' : 'text-slate-800'
                                 }`}
                              >
                                 {val}
                              </div>
                           ))}
                        </div>
                     ))}
                  </div>
               </div>
               
               <p className="mt-6 text-slate-600 text-[8px] font-black uppercase tracking-[0.3em] text-center border-t border-slate-800 pt-4"> Adjacency Matrix where A[i][j] = 1 if node i is connected to node j </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
