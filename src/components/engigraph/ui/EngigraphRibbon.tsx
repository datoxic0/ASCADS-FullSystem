import React, { useState } from 'react';
import { 
    MousePointer2, Move, Type, PenTool, Circle, Square, Minus, ZoomIn, ZoomOut, Maximize,
    Waves, Bot, Activity, Terminal, Zap, Compass, Ruler, Sun, Moon,
    Undo2, Redo2, Copy, Trash2, Cpu
} from 'lucide-react';
import { useEngigraphStore } from '../store/useEngigraphStore';

export const EngigraphRibbon: React.FC = () => {
    const { activeTool, setActiveTool, theme, toggleTheme, toggleScope, toggleTerminal, toggleLeftSidebar } = useEngigraphStore();
    const [activeTab, setActiveTab] = useState('home');

    const tabs = [
        { id: 'home', label: 'Home' },
        { id: 'draw', label: 'Draw & Sketch' },
        { id: 'components', label: 'Mechatronics' },
        { id: 'circuit', label: 'Electrotechnology' },
        { id: 'simulate', label: 'Simulation' },
    ];

    const handleToolClick = (tool: any) => {
        setActiveTool(tool);
    };

    return (
        <header className="flex flex-col bg-slate-900 border-b border-slate-700 text-slate-200">
            {/* Top Branding / Tabs Bar */}
            <div className="flex items-center justify-between px-4 h-8 bg-slate-950">
                <div className="flex items-center gap-2">
                    <img src="/EngiGraphLogo.png" alt="Logo" className="w-5 h-5 rounded" />
                    <span className="font-bold text-xs tracking-wider">ENGIGRAPH <span className="bg-gradient-to-br from-blue-500 to-cyan-400 text-white px-1 py-0.5 rounded text-[9px]">PRO</span></span>
                </div>
                <div className="flex space-x-1 flex-1 px-8">
                    {tabs.map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3 py-1 text-xs font-medium rounded-t-md transition-colors ${
                                activeTab === tab.id ? 'bg-slate-800 text-cyan-400 border-t-2 border-cyan-400' : 'hover:bg-slate-800 hover:text-white text-slate-400'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={toggleTheme} className="p-1 hover:bg-slate-800 rounded">
                        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                    </button>
                </div>
            </div>

            {/* Ribbon Content Panel */}
            <div className="h-24 bg-slate-800 flex items-center px-4 overflow-x-auto gap-6 shrink-0">
                
                {/* Home Tab */}
                {activeTab === 'home' && (
                    <>
                        <div className="flex flex-col gap-1 border-r border-slate-700 pr-4">
                            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">Clipboard</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<Undo2 size={18} />} label="Undo" onClick={() => {}} />
                                <RibbonButton icon={<Redo2 size={18} />} label="Redo" onClick={() => {}} />
                                <div className="w-px h-8 bg-slate-700 mx-1"></div>
                                <RibbonButton icon={<Copy size={18} />} label="Copy" onClick={() => {}} />
                                <RibbonButton icon={<Trash2 size={18} />} label="Delete" onClick={() => {}} />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 border-r border-slate-700 pr-4">
                            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">Tools</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<MousePointer2 size={18} />} label="Select" active={activeTool === 'select'} onClick={() => handleToolClick('select')} />
                                <RibbonButton icon={<Move size={18} />} label="Pan" active={activeTool === 'pan'} onClick={() => handleToolClick('pan')} />
                                <RibbonButton icon={<Type size={18} />} label="Text" active={activeTool === 'text'} onClick={() => handleToolClick('text')} />
                            </div>
                        </div>
                    </>
                )}

                {/* Draw Tab */}
                {activeTab === 'draw' && (
                    <div className="flex flex-col gap-1 border-r border-slate-700 pr-4">
                        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">Shapes</div>
                        <div className="flex gap-1">
                            <RibbonButton icon={<Minus size={18} />} label="Line" active={activeTool === 'line'} onClick={() => handleToolClick('line')} />
                            <RibbonButton icon={<Square size={18} />} label="Rect" active={activeTool === 'rect'} onClick={() => handleToolClick('rect')} />
                            <RibbonButton icon={<Circle size={18} />} label="Circle" active={activeTool === 'circle'} onClick={() => handleToolClick('circle')} />
                            <RibbonButton icon={<PenTool size={18} />} label="Spline" onClick={() => handleToolClick('spline')} />
                        </div>
                    </div>
                )}

                {/* Simulation Tab */}
                {activeTab === 'simulate' && (
                    <div className="flex flex-col gap-1 border-r border-slate-700 pr-4">
                        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">Solvers</div>
                        <div className="flex gap-1">
                            <RibbonButton icon={<Activity size={18} />} label="Oscilloscope" onClick={toggleScope} />
                            <RibbonButton icon={<Terminal size={18} />} label="Terminal" onClick={toggleTerminal} />
                            <RibbonButton icon={<Waves size={18} />} label="CFD Flow" onClick={() => {}} />
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
        className={`flex flex-col items-center justify-center p-1.5 min-w-[50px] rounded transition-colors ${
            active ? 'bg-cyan-900/50 text-cyan-400 border border-cyan-800' : 'hover:bg-slate-700 text-slate-300 border border-transparent'
        }`}
    >
        <div className="mb-1">{icon}</div>
        <span className="text-[9px] font-medium leading-none">{label}</span>
    </button>
);
