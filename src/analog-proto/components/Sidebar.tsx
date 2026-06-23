import React from 'react';
import { COMPONENT_DEFINITIONS } from '../constants';
import { ComponentType, SidebarTab } from '../types';
import { 
  Component as ComponentIcon, Cpu, Zap, Activity, ToggleLeft, 
  Search, Grid, LayoutGrid, List, Info, ChevronRight, 
  Terminal, ShieldCheck, Microscope, Layers, Play, StopCircle, RefreshCcw, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ScopeOverlay from './ScopeOverlay';

interface SidebarProps {
  onAddComponent: (type: ComponentType) => void;
  selectedComponentId: string | null;
  design: any;
  onUpdateProperties: (id: string, props: any) => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
  scopeHistory?: React.MutableRefObject<{ ch1: number[]; ch2: number[] }>;
}

const Sidebar = React.memo(({ 
  onAddComponent, 
  selectedComponentId, 
  design, 
  onUpdateProperties, 
  isSimulating, 
  onToggleSimulation,
  activeTab,
  setActiveTab,
  scopeHistory
}: SidebarProps) => {
  const selectedComponent = design.components.find((c: any) => c.id === selectedComponentId);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Group components by category
  const categories = {
    'PASSIVE': ['RESISTOR', 'CAPACITOR', 'INDUCTOR', 'GROUND'],
    'ACTIVE/POWER': ['BATTERY', 'DIODE', 'TRANSISTOR', 'MOSFET', 'VOLTAGE_REGULATOR'],
    'LOGIC GATES': ['LOGIC_AND', 'LOGIC_OR', 'LOGIC_NOT', 'NAND_GATE', 'NOR_GATE', 'XOR_GATE', 'XNOR_GATE', 'INTEGRATED_CIRCUIT'],
    'IO/UI': ['LED', 'SWITCH', 'PUSH_BUTTON', 'TOGGLE_SWITCH', 'OLED_DISPLAY', 'SEVEN_SEGMENT', 'BUZZER', 'SPEAKER', 'MICROPHONE'],
    'ELECTROMECH': ['RELAY', 'REED_RELAY', 'SOLENOID', 'MOTOR'],
    'LADDER LOGIC': ['LADDER_CONTACT_NO', 'LADDER_CONTACT_NC', 'LADDER_COIL'],
    'INSTRUMENTS': ['OSCILLOSCOPE', 'MULTIMETER', 'SIGNAL_GENERATOR', 'SPECTRUM_ANALYZER']
  };

  const filteredComponents = Object.values(COMPONENT_DEFINITIONS).filter(def => 
    def.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    def.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col border-l border-slate-800 bg-slate-900 w-80 z-10 overflow-hidden shadow-2xl font-sans">
      {/* Tab Header */}
      <div className="flex bg-slate-950 border-b border-slate-800 p-1 gap-1">
        {[
          { id: 'LIBRARY', icon: Grid, label: 'Nodes' },
          { id: 'PROPERTIES', icon: LayoutGrid, label: 'Matrix' },
          { id: 'SOLVER', icon: Microscope, label: 'Engine' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2.5 rounded-lg flex flex-col items-center gap-1 transition-all ${
              activeTab === tab.id ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-inner' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <tab.icon size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-hide">
        <AnimatePresence mode="wait">
          {activeTab === 'LIBRARY' && (
            <motion.div 
              key="library"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="p-4 space-y-6"
            >
              {/* Search Bar */}
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={14} />
                <input 
                  type="text"
                  placeholder="SEARCH COMPONENT MATRIX..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 pl-10 text-[10px] font-black text-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder:text-slate-700"
                />
              </div>

              {Object.entries(categories).map(([cat, types]) => {
                const availableInCat = filteredComponents.filter(def => types.includes(def.type));
                if (availableInCat.length === 0) return null;

                return (
                  <div key={cat} className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/30" />
                       {cat}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {availableInCat.map((def) => (
                        <button
                          key={def.type}
                          onClick={() => onAddComponent(def.type)}
                          className="flex flex-col items-center justify-center p-3 bg-slate-800/20 border border-slate-800 hover:border-indigo-500 hover:bg-slate-800/40 transition-all rounded-xl group relative overflow-hidden active:scale-95"
                          id={`component-${def.type}`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="mb-2 text-slate-500 group-hover:text-indigo-400 group-hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.4)] transition-all">
                             {/* Category specific icons could go here */}
                             <ComponentIcon size={18} strokeWidth={2.5} />
                          </div>
                          <span className="text-[9px] font-black leading-tight text-slate-400 uppercase tracking-tighter text-center group-hover:text-slate-100">{def.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {activeTab === 'PROPERTIES' && (
            <motion.div 
               key="properties"
               initial={{ opacity: 0, x: 10 }}
               animate={{ opacity: 1, x: 0 }}
               className="p-4"
            >
              {selectedComponent ? (
                <div className="space-y-6">
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 border-dashed">
                     <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1 block">Active ID</span>
                     <span className="text-xs font-mono text-slate-100 font-bold">{selectedComponent.id.slice(0, 8)}...</span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Info size={12} /> Reference Designator
                      </label>
                      <input
                        type="text"
                        value={selectedComponent.label || ''}
                        onChange={(e) => onUpdateProperties(selectedComponent.id, { label: e.target.value })}
                        className="bg-slate-950 border border-slate-800 p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 rounded-xl transition-all"
                      />
                    </div>

                    {Object.entries(selectedComponent.properties).map(([key, value]) => (
                      <div key={key} className="flex flex-col">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{key.toUpperCase()}</label>
                        {key === 'state' && selectedComponent.type === 'SWITCH' ? (
                          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                            {['Open', 'Closed'].map(state => (
                              <button 
                                key={state}
                                onClick={() => {
                                  const newProps = { ...selectedComponent.properties, [key]: state };
                                  onUpdateProperties(selectedComponent.id, { properties: newProps });
                                }}
                                className={`py-2 px-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                  value === state ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                                }`}
                              >
                                {state}
                              </button>
                            ))}
                          </div>
                        ) : key === 'timeBase' ? (
                          <div className="relative">
                            <select
                              value={value as string}
                              onChange={(e) => {
                                const newProps = { ...selectedComponent.properties, [key]: e.target.value };
                                onUpdateProperties(selectedComponent.id, { properties: newProps });
                              }}
                              className="w-full bg-slate-950 border border-slate-800 p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 rounded-xl transition-all appearance-none"
                            >
                              <option value="ms">Milliseconds (ms)</option>
                              <option value="s">Seconds (s)</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none">
                              <ChevronDown size={12} />
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                             <input
                              type="text"
                              value={value as string}
                              onChange={(e) => {
                                const newProps = { ...selectedComponent.properties, [key]: e.target.value };
                                onUpdateProperties(selectedComponent.id, { properties: newProps });
                              }}
                              className="w-full bg-slate-950 border border-slate-800 p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 rounded-xl transition-all"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700">
                               <RefreshCcw size={12} />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="flex flex-col">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Matrix Orientation</label>
                      <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                         {[0, 90, 180, 270].map(deg => (
                            <button 
                              key={deg}
                              onClick={() => onUpdateProperties(selectedComponent.id, { rotation: deg })}
                              className={`py-2 rounded-lg text-[10px] font-mono transition-all ${
                                selectedComponent.rotation === deg ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600 hover:text-slate-400'
                              }`}
                            >
                              {deg}°
                            </button>
                         ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 px-8">
                   <div className="w-20 h-20 rounded-3xl bg-slate-950/50 border border-slate-800 flex items-center justify-center text-slate-700 shadow-inner group">
                      <Cpu size={40} className="group-hover:text-indigo-500/50 transition-colors duration-500" />
                   </div>
                   <div className="space-y-1">
                      <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Select Control Node</div>
                      <p className="text-[9px] text-slate-600 leading-relaxed font-medium">Select a component on the matrix stage to adjust circuit parameters.</p>
                   </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'SOLVER' && (
            <motion.div 
               key="solver"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="p-4 space-y-6"
            >
              <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-2xl flex items-center justify-between shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                 <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isSimulating ? 'bg-emerald-500 shadow-[0_0_12px_#10b981] animate-pulse' : 'bg-slate-700'}`} />
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-white uppercase tracking-widest">System Status</span>
                       <span className="text-[8px] font-mono text-slate-400">{isSimulating ? 'NODE_ACTIVE_0xF1' : 'MATRIX_STABLE'}</span>
                    </div>
                 </div>
                 <ShieldCheck size={20} className={isSimulating ? 'text-emerald-500' : 'text-slate-700'} />
              </div>

              <div className="space-y-2">
                 <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                    <Terminal size={12} /> System Overrides
                 </h3>
                 <button className="w-full flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-800/40 transition-colors group">
                    <span className="text-[10px] font-black text-slate-400 uppercase group-hover:text-slate-200">Reset Net Matrix</span>
                    <RefreshCcw size={14} className="text-slate-600" />
                 </button>
                 <button className="w-full flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-800/40 transition-colors group">
                    <span className="text-[10px] font-black text-slate-400 uppercase group-hover:text-slate-200">Clear Cache Nodes</span>
                    <Terminal size={14} className="text-slate-600" />
                 </button>
              </div>

              <div className="p-4 bg-black/40 rounded-2xl border border-slate-800 space-y-4">
                 <div className="flex items-center gap-2">
                    <Layers size={14} className="text-indigo-400" />
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Design Rules (DRC)</span>
                 </div>
                 <div className="space-y-3">
                   <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-500 uppercase">Clearance</span>
                      <span className="text-emerald-500 font-bold">10 mil</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-mono border-t border-slate-800/50 pt-2">
                      <span className="text-slate-500 uppercase">Trace Width</span>
                      <span className="text-emerald-500 font-bold">12 mil</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-mono border-t border-slate-800/50 pt-2">
                      <span className="text-slate-500 uppercase">Via Density</span>
                      <span className="text-amber-500 font-bold">LOW</span>
                   </div>
                 </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-600/5 border border-indigo-500/10 space-y-2">
                 <span className="text-[8px] font-black text-indigo-400/60 uppercase tracking-[.25em]">Siyabonga Solver v4.2</span>
                 <p className="text-[9px] text-slate-500 leading-relaxed font-medium italic">"The invisible eye that bridges logic and reality."</p>
              </div>

              {scopeHistory && <ScopeOverlay design={design} scopeHistory={scopeHistory} />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Simulation Control Panel */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
         <button 
           onClick={onToggleSimulation}
           className={`w-full py-4 group flex items-center justify-center gap-3 transition-all rounded-2xl shadow-xl active:scale-[0.97] border ${
             isSimulating 
               ? 'bg-emerald-600/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/20 shadow-emerald-500/20' 
               : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500 shadow-indigo-600/40'
           }`}
         >
            {isSimulating ? <StopCircle size={18} /> : <Play size={18} />}
            <span className="text-[11px] font-black uppercase tracking-[0.3em]">
              {isSimulating ? 'Suspend Solver' : 'Initialize Logic'}
            </span>
            <div className="flex gap-1 ml-2">
               <div className={`w-1 h-3 rounded-full bg-current opacity-20 ${isSimulating ? 'animate-pulse' : ''}`} />
               <div className={`w-1 h-3 rounded-full bg-current opacity-40 ${isSimulating ? 'animate-pulse delay-75' : ''}`} />
               <div className={`w-1 h-3 rounded-full bg-current opacity-60 ${isSimulating ? 'animate-pulse delay-150' : ''}`} />
            </div>
         </button>
      </div>
    </div>
  );
});

export default Sidebar;
