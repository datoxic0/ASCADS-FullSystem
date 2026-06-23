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
    <div className="flex-1 bg-emerald-50 dark:bg-slate-950 flex flex-col p-2 md:p-4 overflow-hidden font-sans">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4 shrink-0">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-black text-emerald-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
             <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-600 dark:bg-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(5,150,105,0.4)] dark:shadow-[0_0_20px_rgba(79,70,229,0.4)] text-white">
                <Braces size={18} />
             </div>
             Logic Analysis Center
          </h2>
          <p className="text-[9px] md:text-[10px] font-black text-emerald-700 dark:text-indigo-400 uppercase tracking-widest pl-1">Siyabonga Boolean Engine v1.1</p>
        </div>

        <div className="flex bg-emerald-100 dark:bg-slate-900 p-1 rounded-xl border border-emerald-200 dark:border-slate-800 overflow-x-auto max-w-full scrollbar-hide">
           {[
             { id: 'TABLE', icon: Table, label: 'Truth Table' },
             { id: 'EXPRESSION', icon: Calculator, label: 'Boolean algebra' },
             { id: 'FORMS', icon: Hash, label: 'Standard Forms' },
             { id: 'MATRIX', icon: LayoutGrid, label: 'State Matrix' }
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex items-center gap-1.5 px-3 md:px-5 py-1.5 md:py-2 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                 activeTab === tab.id ? 'bg-emerald-600 dark:bg-indigo-600 text-white shadow-md' : 'text-emerald-700 dark:text-slate-500 hover:text-emerald-900 dark:hover:text-slate-300'
               }`}
             >
                <tab.icon size={14} />
                {tab.label}
             </button>
           ))}
        </div>
      </header>

      {/* Boolean Compiler Bar */}
      <div className="mb-4 p-3 md:p-4 bg-white/80 dark:bg-slate-900/80 border border-emerald-300/50 dark:border-indigo-500/20 rounded-2xl md:rounded-3xl backdrop-blur-xl flex flex-col gap-3 md:gap-4 shrink-0">
         <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center">
            <div className="flex-1 w-full relative">
               <Calculator className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-indigo-400" size={16} />
               <input 
                 value={inputExpression}
                 onChange={(e) => setInputExpression(e.target.value)}
                 placeholder="Industrial Boolean Syntax: (A + B) . ¬C"
                 className="w-full bg-emerald-50/50 dark:bg-slate-950 border border-emerald-200 dark:border-slate-800 rounded-xl md:rounded-2xl py-2 md:py-2.5 pl-10 md:pl-12 pr-4 text-emerald-900 dark:text-white font-mono text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-indigo-600 transition-all placeholder:text-emerald-400/70 dark:placeholder:text-slate-700"
               />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
               <button 
                 onClick={() => {
                   const firstOutput = Object.keys(expressions)[0];
                   if (firstOutput) setInputExpression(expressions[firstOutput]);
                 }}
                 className="px-3 py-2 md:px-4 md:py-2.5 bg-emerald-100 dark:bg-indigo-600/10 hover:bg-emerald-200 dark:hover:bg-indigo-600/20 text-emerald-700 dark:text-indigo-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-emerald-300/50 dark:border-indigo-500/20 active:scale-95 flex items-center gap-1.5"
                 title="Import from Canvas"
               >
                  <RefreshCcw size={12} className="rotate-180" />
                  <span className="hidden sm:inline">Sync</span>
               </button>
               <button 
                 onClick={() => setInputExpression(LogicAnalyzer.simplify(inputExpression))}
                 className="px-3 py-2 md:px-4 md:py-2.5 bg-emerald-50 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-slate-700 text-emerald-800 dark:text-slate-300 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-emerald-200 dark:border-slate-700 active:scale-95 flex items-center gap-1.5"
                 title="Optimize Logic"
               >
                  <Search size={12} />
                  <span className="hidden sm:inline">Simplify</span>
               </button>
               <button 
                 onClick={handleCompile}
                 className="flex-1 md:flex-initial px-4 md:px-8 py-2 md:py-2.5 bg-emerald-600 dark:bg-indigo-600 hover:bg-emerald-700 dark:hover:bg-indigo-500 text-white text-[9px] md:text-[10px] font-black uppercase tracking-[.2em] rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-1.5"
               >
                  <RefreshCcw size={12} />
                  Compile to RTL
               </button>
            </div>
         </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-4 pt-3 border-t border-emerald-200 dark:border-slate-800/50">
            {[
              { label: 'AND', sym: '.', lightColor: 'text-emerald-700', darkColor: 'dark:text-indigo-400' },
              { label: 'OR', sym: '+', lightColor: 'text-green-600', darkColor: 'dark:text-emerald-400' },
              { label: 'NOT', sym: '¬ / !', lightColor: 'text-red-600', darkColor: 'dark:text-rose-400' },
              { label: 'XOR', sym: '⊕ / ^', lightColor: 'text-amber-600', darkColor: 'dark:text-amber-400' },
              { label: 'LITERAL', sym: '0 / 1', lightColor: 'text-slate-600', darkColor: 'dark:text-slate-400' },
              { label: 'GROUP', sym: '()', lightColor: 'text-slate-600', darkColor: 'dark:text-slate-400' },
            ].map(op => (
              <div key={op.label} className="p-2 bg-emerald-50 dark:bg-slate-950/50 rounded-lg border border-emerald-200 dark:border-slate-800 flex justify-between items-center group hover:border-emerald-400 dark:hover:border-indigo-500/30 transition-colors">
                <span className="text-[7px] md:text-[8px] font-black text-emerald-600 dark:text-slate-500 uppercase tracking-widest">{op.label}</span>
                <code className={`text-[10px] md:text-xs font-mono font-bold ${op.lightColor} ${op.darkColor}`}>{op.sym}</code>
              </div>
            ))}
          </div>
      </div>

      {insights && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 shrink-0">
           {[
             { label: 'Gate Count', value: insights.gateCount, lightColor: 'text-emerald-700', darkColor: 'dark:text-indigo-400' },
             { label: 'Max Depth', value: insights.maxDepth, lightColor: 'text-green-600', darkColor: 'dark:text-emerald-400' },
             { label: 'Sim Connections', value: insights.connectionCount, lightColor: 'text-amber-600', darkColor: 'dark:text-amber-400' },
             { label: 'I/O Density', value: `${insights.inputCount}:${insights.outputCount}`, lightColor: 'text-red-600', darkColor: 'dark:text-rose-400' }
           ].map(item => (
             <div key={item.label} className="p-2 md:p-3 bg-white/50 dark:bg-slate-900/50 border border-emerald-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center shadow-sm dark:shadow-inner">
                <span className="text-[8px] md:text-[10px] font-black text-emerald-600 dark:text-slate-500 uppercase tracking-widest">{item.label}</span>
                <span className={`text-sm md:text-xl font-black ${item.lightColor} ${item.darkColor}`}>{item.value}</span>
             </div>
           ))}
        </div>
      )}

      <div className="flex-1 min-h-0 relative">
        <AnimatePresence mode="wait">
          {activeTab === 'TABLE' && (
            <motion.div 
              key="table"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 border border-emerald-300 dark:border-slate-800 rounded-2xl md:rounded-3xl bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl flex flex-col min-h-0 overflow-hidden"
            >
              <div className="p-2 md:p-3 border-b border-emerald-200 dark:border-white/5 bg-emerald-100/50 dark:bg-slate-950 flex flex-col md:flex-row justify-between items-center gap-2">
                 <span className="text-[9px] md:text-[10px] font-black text-emerald-800 dark:text-slate-400 uppercase tracking-widest">Logic Enumeration Matrix</span>
                 <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-indigo-500" />
                       <span className="text-[7px] md:text-[8px] font-bold text-emerald-700 dark:text-slate-500 uppercase tracking-widest">Input Vector</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-green-500 dark:bg-emerald-500" />
                       <span className="text-[7px] md:text-[8px] font-bold text-emerald-700 dark:text-slate-500 uppercase tracking-widest">Output Signal</span>
                    </div>
                 </div>
              </div>
              {truthTable.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-emerald-600/50 dark:text-slate-600 p-10 text-center">
                   <Zap size={40} className="mb-4 opacity-50" />
                   <p className="text-[10px] font-black uppercase tracking-[.3em]">No valid logic inputs/outputs detected or too many inputs (Max 8)</p>
                </div>
              ) : (
                <div className="flex-1 min-h-0 overflow-auto scrollbar-thin scrollbar-thumb-emerald-500/20 dark:scrollbar-thumb-indigo-500/20 scrollbar-track-transparent">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead className="sticky top-0 bg-emerald-100 dark:bg-slate-950 z-10 shadow-md dark:shadow-xl">
                      <tr>
                        {inputs.map(input => (
                          <th key={input} className="px-3 md:px-6 py-2 md:py-3 text-[9px] md:text-[10px] font-black text-emerald-700 dark:text-indigo-400 uppercase tracking-widest border-b border-emerald-200 dark:border-slate-800">{input}</th>
                        ))}
                        <th className="w-px bg-emerald-200 dark:bg-slate-800 px-0 py-0" />
                        {outputs.map(output => (
                          <th key={output} className="px-3 md:px-6 py-2 md:py-3 text-[9px] md:text-[10px] font-black text-green-600 dark:text-emerald-400 uppercase tracking-widest border-b border-emerald-200 dark:border-slate-800">{output}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="font-mono text-[10px] md:text-xs">
                      {truthTable.map((row, idx) => (
                        <tr key={idx} className="hover:bg-emerald-50/50 dark:hover:bg-white/5 transition-colors border-b border-emerald-100 dark:border-white/5 group">
                          {inputs.map((input, iidx) => (
                            <td key={input} className={`px-3 md:px-6 py-1.5 md:py-2 font-bold ${row.inputs[input] ? 'text-emerald-800 dark:text-indigo-400' : 'text-emerald-400 dark:text-slate-600'}`}>
                               <span className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded ${row.inputs[input] ? 'bg-emerald-200/50 dark:bg-indigo-500/10' : ''}`}>
                                  {row.inputs[input] ? '1' : '0'}
                               </span>
                            </td>
                          ))}
                          <td className="w-px bg-emerald-200 dark:bg-slate-800 px-0 py-0" />
                          {outputs.map(output => (
                            <td key={output} className={`px-3 md:px-6 py-1.5 md:py-2 font-bold ${row.outputs[output] ? 'text-green-700 dark:text-emerald-400' : 'text-emerald-400 dark:text-slate-600'}`}>
                               <span className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded ${row.outputs[output] ? 'bg-green-200/50 dark:bg-emerald-500/10' : ''}`}>
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
               className="absolute inset-0 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-1 pb-4 scrollbar-hide min-h-0"
            >
               {Object.entries(expressions).map(([name, expr]) => (
                  <div key={name} className="p-4 md:p-6 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-800 rounded-2xl space-y-4 shadow-md dark:shadow-2xl relative overflow-hidden group shrink-0">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/5 dark:bg-indigo-600/5 rounded-bl-full pointer-events-none" />
                     
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] md:text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Signal Target: {name}</span>
                        <div className="flex gap-1 md:gap-2">
                           <div 
                               onClick={() => navigator.clipboard.writeText(expr)}
                               className="p-1.5 md:p-2 bg-emerald-50 dark:bg-slate-950 rounded-lg text-emerald-600 dark:text-slate-500 hover:text-emerald-900 dark:hover:text-indigo-400 transition-colors cursor-pointer group/card"
                               title="Copy Original"
                           >
                              <Calculator size={12} className="group-hover/card:scale-110 transition-transform" />
                           </div>
                           <div 
                               onClick={() => navigator.clipboard.writeText(LogicAnalyzer.simplify(expr))}
                               className="p-1.5 md:p-2 bg-emerald-50 dark:bg-slate-950 rounded-lg text-emerald-600 dark:text-slate-500 hover:text-emerald-900 dark:hover:text-indigo-400 transition-colors cursor-pointer group/card"
                               title="Copy Simplified"
                           >
                              <Zap size={12} className="group-hover/card:scale-110 transition-transform" />
                           </div>
                        </div>
                     </div>
                     
                     <div className="space-y-3 md:space-y-4">
                        <div className="flex flex-col">
                           <span className="text-[8px] md:text-[9px] font-black text-emerald-600 dark:text-slate-500 uppercase tracking-widest mb-1.5 md:mb-2">Literal Logic Trace</span>
                           <div className="p-3 md:p-4 bg-emerald-50 dark:bg-slate-950 rounded-xl border border-emerald-200 dark:border-slate-800 font-mono text-sm md:text-base text-emerald-950 dark:text-white break-all shadow-inner">
                              {expr}
                           </div>
                        </div>

                        <div className="flex flex-col">
                           <span className="text-[8px] md:text-[9px] font-black text-emerald-700 dark:text-indigo-500 uppercase tracking-widest mb-1.5 md:mb-2">Optimization Vector</span>
                           <div className="p-3 md:p-4 bg-emerald-100/50 dark:bg-indigo-600/10 rounded-xl border border-emerald-300/50 dark:border-indigo-500/20 font-mono text-sm md:text-base text-emerald-800 dark:text-indigo-400 shadow-inner break-all">
                              {LogicAnalyzer.simplify(expr)}
                           </div>
                        </div>
                     </div>
                  </div>
               ))}
               {Object.keys(expressions).length === 0 && (
                  <div className="col-span-full py-20 md:py-40 text-center text-emerald-600/50 dark:text-slate-600 uppercase tracking-[.2em] font-black text-[10px]">
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
               className="absolute inset-0 grid grid-cols-1 gap-4 overflow-y-auto pb-4 pr-1 scrollbar-hide min-h-0"
            >
               {outputs.map(output => (
                 <div key={output} className="p-4 md:p-6 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-800 rounded-2xl space-y-4 relative overflow-hidden shrink-0">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 dark:bg-indigo-600/10 rotate-12 blur-3xl pointer-events-none" />
                    
                    <div className="flex items-center gap-3 md:gap-4">
                       <div className="px-3 md:px-4 py-1 bg-emerald-100 dark:bg-indigo-600/20 text-emerald-800 dark:text-indigo-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-200 dark:border-indigo-500/20 whitespace-nowrap">
                          Canonical Standard Form: {output}
                       </div>
                       <div className="flex-1 h-px bg-emerald-200 dark:bg-slate-800" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                       <div className="space-y-2 md:space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                             <h4 className="text-[9px] md:text-[10px] font-black text-emerald-900 dark:text-white uppercase tracking-widest">Sum of Products (SOP)</h4>
                             <span className="text-[7px] md:text-[8px] font-mono text-emerald-600 dark:text-slate-500 uppercase">Minterm Expansion</span>
                          </div>
                          <div className="p-3 md:p-4 bg-emerald-50 dark:bg-slate-950 rounded-xl border border-emerald-200 dark:border-slate-800 font-mono text-xs text-green-700 dark:text-emerald-400 break-all leading-relaxed shadow-inner">
                             {LogicAnalyzer.generateSOP(truthTable, output)}
                          </div>
                          <p className="text-[7px] md:text-[8px] text-emerald-500 dark:text-slate-600 uppercase font-bold tracking-widest">Generated by tracking boolean 1 states</p>
                       </div>

                       <div className="space-y-2 md:space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                             <h4 className="text-[9px] md:text-[10px] font-black text-emerald-900 dark:text-white uppercase tracking-widest">Product of Sums (POS)</h4>
                             <span className="text-[7px] md:text-[8px] font-mono text-emerald-600 dark:text-slate-500 uppercase">Maxterm Expansion</span>
                          </div>
                          <div className="p-3 md:p-4 bg-emerald-50 dark:bg-slate-950 rounded-xl border border-emerald-200 dark:border-slate-800 font-mono text-xs text-red-700 dark:text-rose-400 break-all leading-relaxed shadow-inner">
                             {LogicAnalyzer.generatePOS(truthTable, output)}
                          </div>
                          <p className="text-[7px] md:text-[8px] text-emerald-500 dark:text-slate-600 uppercase font-bold tracking-widest">Generated by tracking boolean 0 states</p>
                       </div>
                    </div>
                 </div>
               ))}
               {outputs.length === 0 && (
                  <div className="py-20 md:py-40 text-center text-emerald-600/50 dark:text-slate-600 uppercase tracking-[.2em] font-black text-[10px]">
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
               className="absolute inset-0 border border-emerald-300 dark:border-slate-800 rounded-2xl md:rounded-3xl bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl flex flex-col p-4 md:p-6 overflow-hidden min-h-0"
            >
               <div className="mb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2 shrink-0">
                  <h3 className="text-xs md:text-sm font-black text-emerald-900 dark:text-white uppercase tracking-widest">Logic Adjacency Matrix</h3>
                  <span className="text-[7px] md:text-[8px] font-mono text-emerald-700 dark:text-indigo-400 uppercase tracking-widest bg-emerald-100 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-indigo-500/20 w-fit">Active Nodes: {matrixData.labels.length}</span>
               </div>

               <div className="flex-1 overflow-auto scrollbar-hide">
                  <div className="min-w-fit inline-block pb-4 pr-4">
                     <div className="flex">
                        <div className="w-12 md:w-16" />
                        {matrixData.labels.map((label, idx) => (
                           <div key={idx} className="w-8 md:w-10 h-8 md:h-10 flex items-center justify-center text-[7px] md:text-[8px] font-black text-emerald-700 dark:text-slate-500 uppercase tracking-tighter truncate px-1 border-r border-emerald-200 dark:border-slate-800/50 bg-emerald-50 dark:bg-slate-950/20" title={label}>
                              {label}
                           </div>
                        ))}
                     </div>
                     {matrixData.matrix.map((row, ridx) => (
                        <div key={ridx} className="flex border-b border-emerald-200 dark:border-slate-800/50">
                           <div className="w-12 md:w-16 h-8 md:h-10 flex items-center justify-end pr-2 md:pr-3 text-[7px] md:text-[8px] font-black text-emerald-700 dark:text-slate-500 uppercase truncate bg-emerald-50 dark:bg-slate-950/20 border-r border-emerald-200 dark:border-slate-800/50" title={matrixData.labels[ridx]}>
                              {matrixData.labels[ridx]}
                           </div>
                           {row.map((val, cidx) => (
                              <div 
                                 key={cidx} 
                                 className={`w-8 md:w-10 h-8 md:h-10 flex items-center justify-center text-[9px] md:text-[10px] font-bold border-r border-emerald-100 dark:border-slate-800/30 transition-colors ${
                                    val === 1 ? 'bg-emerald-500 dark:bg-indigo-600/40 text-white shadow-[inset_0_0_10px_rgba(16,185,129,0.3)] dark:shadow-[inset_0_0_15px_rgba(79,70,229,0.3)]' : 'text-emerald-300 dark:text-slate-800'
                                 }`}
                              >
                                 {val}
                              </div>
                           ))}
                        </div>
                     ))}
                  </div>
               </div>
               
               <p className="mt-4 text-emerald-600 dark:text-slate-600 text-[7px] md:text-[8px] font-black uppercase tracking-widest text-center border-t border-emerald-200 dark:border-slate-800 pt-3 shrink-0"> A[i][j] = 1 if node i connects to node j </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
