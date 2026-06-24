import React, { useState } from 'react';
import { 
    MousePointer2, Move, Type, PenTool, Circle, Square, Minus, ZoomIn, ZoomOut, Maximize,
    Waves, Bot, Activity, Terminal, Zap, Compass, Ruler, Sun, Moon,
    Undo2, Redo2, Copy, Trash2, Cpu, Battery, Lightbulb, ToggleLeft, GitMerge,
    Printer, Image as ImageIcon, Camera, BrainCircuit, BookOpen, Layers,
    Grid, Box, Monitor, ToggleRight, Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { useEngigraphStore } from '../store/useEngigraphStore';

export const EngigraphRibbon: React.FC = () => {
    const { 
        activeTool, setActiveTool, theme, toggleTheme, toggleScope, 
        toggleTerminal, undo, redo, setActivePartType 
    } = useEngigraphStore();
    const [activeTab, setActiveTab] = useState('home');

    const tabs = [
        { id: 'home', label: 'Home' },
        { id: 'draw', label: 'Draw & Sketch' },
        { id: 'mechatronics', label: 'Mechatronics' },
        { id: 'hybrid', label: 'Hybrid Ops' },
        { id: 'annotate', label: 'Annotate' },
        { id: 'digitize', label: 'Digitize' },
        { id: 'electro', label: 'Electrotechnology' },
        { id: 'output', label: 'Output' },
        { id: 'ai', label: 'EngiGraph AI' },
        { id: 'docs', label: 'Documentation' }
    ];

    const handleToolClick = (tool: any, partType?: string) => {
        setActiveTool(tool);
        if (partType) {
            setActivePartType(partType);
        } else {
            setActivePartType(null);
        }
    };

    return (
        <header className="flex flex-col bg-[#1f1f23] border-b border-slate-700 text-slate-200">
            {/* Top Branding / Tabs Bar */}
            <div className="flex items-center justify-between px-4 h-8 bg-[#0e0e11]">
                <div className="flex items-center gap-2 mr-4">
                    <img src="/EngiGraphLogo.png" alt="Logo" className="w-5 h-5 rounded" />
                    <span className="font-bold text-xs tracking-wider text-slate-200">
                        ENGIGRAPH <span className="text-cyan-400">PRO</span>
                    </span>
                </div>
                <div className="flex space-x-1 flex-1 overflow-x-auto no-scrollbar">
                    {tabs.map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3 py-1 text-xs font-medium rounded-t-md transition-colors whitespace-nowrap ${
                                activeTab === tab.id 
                                ? 'bg-[#1f1f23] text-cyan-400 border-t-2 border-cyan-400' 
                                : 'hover:bg-[#1a1a1e] hover:text-white text-slate-400'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 ml-4">
                    <button onClick={toggleTheme} className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                    </button>
                </div>
            </div>

            {/* Ribbon Content Panel */}
            <div className="h-24 bg-[#1f1f23] flex items-center px-4 overflow-x-auto gap-6 shrink-0 custom-scrollbar">
                
                {/* Home Tab */}
                {activeTab === 'home' && (
                    <>
                        <div className="flex flex-col gap-1 border-r border-slate-700 pr-4">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mb-1">Clipboard</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<Undo2 size={20} />} label="Undo" onClick={undo} />
                                <RibbonButton icon={<Redo2 size={20} />} label="Redo" onClick={redo} />
                                <div className="w-px h-8 bg-slate-700 mx-1"></div>
                                <RibbonButton icon={<Copy size={20} />} label="Copy" onClick={() => toast.info('Copied.')} />
                                <RibbonButton icon={<Trash2 size={20} />} label="Delete" onClick={() => toast.info('Deleted.')} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 border-r border-slate-700 pr-4">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mb-1">View</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<ZoomIn size={20} />} label="Zoom In" onClick={() => {}} />
                                <RibbonButton icon={<ZoomOut size={20} />} label="Zoom Out" onClick={() => {}} />
                                <RibbonButton icon={<Maximize size={20} />} label="Fit All" onClick={() => {}} />
                            </div>
                        </div>
                    </>
                )}

                {/* Draw & Sketch Tab */}
                {activeTab === 'draw' && (
                    <>
                        <div className="flex flex-col gap-1 border-r border-slate-700 pr-4">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mb-1">Drafting Tools</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<MousePointer2 size={20} />} label="Select" active={activeTool === 'select'} onClick={() => handleToolClick('select')} />
                                <RibbonButton icon={<Move size={20} />} label="Pan" active={activeTool === 'pan'} onClick={() => handleToolClick('pan')} />
                                <div className="w-px h-8 bg-slate-700 mx-1"></div>
                                <RibbonButton icon={<Minus size={20} />} label="Line" active={activeTool === 'line'} onClick={() => handleToolClick('line')} />
                                <RibbonButton icon={<Square size={20} />} label="Rect" active={activeTool === 'rect'} onClick={() => handleToolClick('rect')} />
                                <RibbonButton icon={<Circle size={20} />} label="Circle" active={activeTool === 'circle'} onClick={() => handleToolClick('circle')} />
                                <RibbonButton icon={<PenTool size={20} />} label="Spline" active={activeTool === 'spline'} onClick={() => handleToolClick('spline')} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 border-r border-slate-700 pr-4">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mb-1">Agentic Draft</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<Compass size={20} />} label="Protractor" active={activeTool === 'protractor'} onClick={() => handleToolClick('protractor')} />
                                <RibbonButton icon={<Ruler size={20} />} label="Scale Ruler" active={activeTool === 'ruler'} onClick={() => handleToolClick('ruler')} />
                            </div>
                        </div>
                    </>
                )}

                {/* Mechatronics Tab */}
                {activeTab === 'mechatronics' && (
                    <>
                        <div className="flex flex-col gap-1 border-r border-slate-700 pr-4">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mb-1">&nbsp;</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<MousePointer2 size={20} />} label="Select" active={activeTool === 'select'} onClick={() => handleToolClick('select')} />
                                <RibbonButton icon={<Move size={20} />} label="Pan" active={activeTool === 'pan'} onClick={() => handleToolClick('pan')} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 border-r border-slate-700 pr-4">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mb-1">Controllers</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<Cpu size={20} />} label="Uno" onClick={() => handleToolClick('place-component', 'arduino_uno')} />
                                <RibbonButton icon={<Cpu size={20} />} label="ESP32" onClick={() => handleToolClick('place-component', 'esp32')} />
                                <RibbonButton icon={<Cpu size={20} />} label="Pico" onClick={() => handleToolClick('place-component', 'pico')} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 border-r border-slate-700 pr-4">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mb-1">UI & Input</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<Monitor size={20} />} label="LCD" onClick={() => handleToolClick('place-component', 'lcd')} />
                                <RibbonButton icon={<Grid size={20} />} label="Keypad" onClick={() => handleToolClick('place-component', 'keypad')} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 border-r border-slate-700 pr-4">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mb-1">Breadboard</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<Grid size={20} />} label="Board" onClick={() => handleToolClick('place-component', 'breadboard')} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 border-r border-slate-700 pr-4">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mb-1">Motion</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<Box size={20} />} label="NEMA17" onClick={() => handleToolClick('place-component', 'nema17')} />
                                <RibbonButton icon={<Settings size={20} />} label="Servo" onClick={() => handleToolClick('place-component', 'servo')} />
                                <RibbonButton icon={<Circle size={20} />} label="DC Motor" onClick={() => handleToolClick('place-component', 'dcmotor')} />
                            </div>
                        </div>
                    </>
                )}

                {/* Electrotechnology Tab */}
                {activeTab === 'electro' && (
                    <>
                        <div className="flex flex-col gap-1 border-r border-slate-700 pr-4">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mb-1">Routing & Power</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<GitMerge size={20} />} label="Wire" active={activeTool === 'wire'} onClick={() => handleToolClick('wire')} />
                                <RibbonButton icon={<Battery size={20} />} label="Battery" onClick={() => handleToolClick('place-component', 'battery')} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 border-r border-slate-700 pr-4">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mb-1">Passives</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<Minus size={20} />} label="Resistor" onClick={() => handleToolClick('place-component', 'resistor')} />
                                <RibbonButton icon={<Lightbulb size={20} />} label="LED" onClick={() => handleToolClick('place-component', 'led')} />
                                <RibbonButton icon={<ToggleLeft size={20} />} label="Switch" onClick={() => handleToolClick('place-component', 'switch')} />
                            </div>
                        </div>
                    </>
                )}

                {/* Other Tabs */}
                {['hybrid', 'annotate', 'digitize', 'output', 'ai', 'docs'].includes(activeTab) && (
                    <div className="flex flex-col gap-1 border-r border-slate-700 pr-4">
                        <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mb-1">Feature Scope</div>
                        <div className="flex gap-1 text-slate-400 text-xs py-2 px-4">
                            This module is initialized and ready for expansion.
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

const RibbonButton = ({ icon, label, onClick, active = false }: { icon: React.ReactNode, label: string, onClick: () => void, active?: boolean }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-1.5 min-w-[56px] rounded transition-colors ${
            active 
            ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-800 shadow-[0_0_8px_rgba(34,211,238,0.2)]' 
            : 'hover:bg-slate-800 text-slate-300 border border-transparent'
        }`}
    >
        <div className="mb-1">{icon}</div>
        <span className="text-[10px] font-medium leading-none">{label}</span>
    </button>
);
