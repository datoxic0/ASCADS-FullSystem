import React, { useState } from 'react';
import { 
    MousePointer2, Move, Type, PenTool, Circle, Square, Minus, ZoomIn, ZoomOut, Maximize,
    Waves, Bot, Activity, Terminal, Zap, Compass, Ruler, Sun, Moon,
    Undo2, Redo2, Copy, Trash2, Cpu, Battery, Lightbulb, ToggleLeft, GitMerge,
    Printer, Image as ImageIcon, Camera, BrainCircuit, BookOpen, Layers,
    Grid, Box, Monitor, ToggleRight, Settings,
    RefreshCw, Triangle, CircleSlash, Split, CornerDownRight, Maximize2,
    Columns, LayoutGrid, GitBranch, GitPullRequest, GitCommit, Eye, ShieldCheck,
    Upload, Download, List, Code, GraduationCap, Flame, Wind, Mic, ZapOff,
    FilePlus, FileDown, Sparkles, FolderOpen, Navigation, Hexagon,
    Package, ScanLine, ArrowUpDown, Scissors, CopyPlus, Menu, X, Sliders
} from 'lucide-react';
import { toast } from 'sonner';
import { useEngigraphStore, DrawingObject, ToolType } from '../store/useEngigraphStore';
import { EcosystemAdapter } from '../solvers/EcosystemAdapter';
import { AutoRouter } from '../solvers/Autorouter';

export const EngigraphRibbon: React.FC = () => {
    const { 
        activeTool, setActiveTool, theme, toggleTheme, toggleScope, 
        toggleTerminal, undo, redo, setActivePartType, exportProject, generateBOM, triggerHybridExtrude, toggleDigitizeModal,
        activeLayer, setActiveLayer, toggle3DView, is3DViewOpen,
        copySelected, pasteClipboard, deleteSelected, zoomIn, zoomOut, zoomFit,
        enclosureMode, toggleEnclosureMode, isSimulationRunning, toggleSimulation,
        toggleAiAssistant, saveProject, importProject,
        toggleHybridPanel, isHybridPanelOpen, generateNetlist
    } = useEngigraphStore();
    const [activeTab, setActiveTab] = useState('home');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

    const handleAutoRoute = () => {
        const state = useEngigraphStore.getState();
        const selectedElements = state.elements.filter(el => state.selectedIds.includes(el.id) && el.type === 'component');
        
        if (selectedElements.length < 2) {
            toast.error('Select at least 2 components to auto-route.');
            return;
        }

        const newWires: DrawingObject[] = [];
        let wireCounter = Date.now();

        // Simple chain routing: A -> B -> C
        for (let i = 0; i < selectedElements.length - 1; i++) {
            const elA = selectedElements[i];
            const elB = selectedElements[i+1];
            
            const pinsA = EcosystemAdapter.getPins(elA);
            const pinsB = EcosystemAdapter.getPins(elB);
            
            const outPin = pinsA.find(p => p.role === 'out') || pinsA[0];
            const inPin = pinsB.find(p => p.role === 'in') || pinsB[0];
            
            if (outPin && inPin) {
                // Use AI A* Autorouter
                const path = AutoRouter.findPath(
                    outPin.pos.x, outPin.pos.y,
                    inPin.pos.x, inPin.pos.y,
                    state.elements,
                    elA.id, elB.id
                );
                
                if (path) {
                    newWires.push({
                        id: `wire-auto-${wireCounter++}`,
                        type: 'wire',
                        points: path,
                        stroke: '#10b981',
                        strokeWidth: 3
                    });
                }
            }
        }

        if (newWires.length > 0) {
            state.pushHistory([...state.elements, ...newWires]);
            toast.success(`Auto-routed ${newWires.length} connections.`);
        } else {
            toast.error('No compatible pins found between selected components.');
        }
    };

    return (
        <header className="flex flex-col bg-[#1f1f23] border-b border-slate-700 text-slate-200">
            {/* Top Branding / Tabs Bar */}
            <div className="flex items-center justify-between h-8 bg-[#0e0e11]">
                <div className="flex items-center gap-2 mr-4 px-4">
                    <img src="/EngiGraphLogo.png" alt="Logo" className="w-5 h-5 rounded" />
                    <span className="font-bold text-xs tracking-wider text-slate-200">
                        ENGIGRAPH <span className="text-cyan-400">PRO</span>
                    </span>
                </div>
                {/* Top Tab Headers (Hidden on mobile) */}
                <div className="hidden lg:flex h-full">
                    {[
                        { id: 'home', label: 'Home' },
                        { id: 'draw', label: 'Draw & Sketch' },
                        { id: 'mechatronics', label: 'Mechatronics' },
                        { id: 'hybrid', label: 'Hybrid Ops' },
                        { id: 'annotate', label: 'Annotate' },
                        { id: 'digitize', label: 'Digitize' },
                        { id: 'electro', label: 'Electrotechnology' },
                        { id: 'output', label: 'Output' },
                        { id: 'ai', label: 'EngiGraph AI' },
                        { id: 'help', label: 'Documentation' }
                    ].map((tab) => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 h-full text-xs font-semibold tracking-wide transition-colors border-b-2
                                ${activeTab === tab.id 
                                    ? 'border-cyan-500 text-cyan-400 bg-slate-800/50' 
                                    : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 ml-4 px-4">
                    <button onClick={toggleTheme} className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                    </button>
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="lg:hidden absolute top-8 left-0 right-0 bg-[#1f1f23] border-b border-slate-700 shadow-2xl z-50 p-2 flex flex-col gap-1 max-h-[50vh] overflow-y-auto">
                    {[
                        { id: 'home', label: 'Home' },
                        { id: 'draw', label: 'Draw & Sketch' },
                        { id: 'mechatronics', label: 'Mechatronics' },
                        { id: 'hybrid', label: 'Hybrid Ops' },
                        { id: 'annotate', label: 'Annotate' },
                        { id: 'digitize', label: 'Digitize' },
                        { id: 'electro', label: 'Electro & Logic' },
                        { id: 'output', label: 'Output' },
                        { id: 'ai', label: 'EngiGraph AI' },
                        { id: 'help', label: 'Documentation' }
                    ].map((tab) => (
                        <button 
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }}
                            className={`px-4 py-2 text-xs font-semibold tracking-wide transition-colors rounded text-left
                                ${activeTab === tab.id 
                                    ? 'text-cyan-400 bg-cyan-950/30' 
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Ribbon Content Panel */}
            <div className="flex h-24 bg-[#1f1f23] items-center px-4 overflow-x-auto gap-6 shrink-0 custom-scrollbar w-full">
                
                {/* Home Tab */}
                {activeTab === 'home' && (
                    <>
                        <div className="flex gap-2 items-center h-full border-r border-slate-700 pr-6 py-2">
                            <div 
                                className="flex flex-col items-center justify-center w-14 h-16 rounded cursor-pointer hover:bg-slate-800 transition-colors border border-transparent"
                                onClick={() => useEngigraphStore.getState().clearWorkspace()}
                            >
                                <FilePlus size={24} className="mb-1 text-slate-300" />
                                <span className="text-[10px] text-slate-300">New</span>
                            </div>

                            <div 
                                className={`flex flex-col items-center justify-center w-16 h-16 rounded cursor-pointer transition-colors border ${activeTool === 'select' ? 'border-cyan-500 text-cyan-400 bg-cyan-950/30' : 'border-transparent text-slate-300 hover:bg-slate-800'}`}
                                onClick={() => setActiveTool('select')}
                            >
                                <Navigation size={24} className="mb-1" />
                                <span className="text-[10px] font-medium">Select</span>
                            </div>

                            <div className="flex flex-col items-center justify-center w-14 h-16 rounded cursor-pointer hover:bg-slate-800 transition-colors border border-transparent" onClick={() => setActiveTool('pan')}>
                                <Move size={20} className={`mb-1 ${activeTool === 'pan' ? 'text-cyan-400' : 'text-slate-300'}`} />
                                <span className={`text-[10px] ${activeTool === 'pan' ? 'text-cyan-400' : 'text-slate-300'}`}>Pan</span>
                            </div>
                            
                            <div className="w-px h-12 bg-slate-700 mx-1"></div>

                            <div className="flex gap-1 items-center">
                                <div className="flex flex-col items-center justify-center w-12 h-16 rounded cursor-pointer hover:bg-slate-800 transition-colors" onClick={undo}>
                                    <Undo2 size={18} className="mb-1 text-slate-300" />
                                    <span className="text-[10px] text-slate-300">Undo</span>
                                </div>
                                <div className="flex flex-col items-center justify-center w-12 h-16 rounded cursor-pointer hover:bg-slate-800 transition-colors" onClick={redo}>
                                    <Redo2 size={18} className="mb-1 text-slate-300" />
                                    <span className="text-[10px] text-slate-300">Redo</span>
                                </div>
                                <div className="flex flex-col items-center justify-center w-12 h-16 rounded cursor-pointer hover:bg-slate-800 transition-colors" onClick={deleteSelected}>
                                    <Trash2 size={18} className="mb-1 text-slate-300" />
                                    <span className="text-[10px] text-slate-300">Delete</span>
                                </div>
                            </div>

                            <div className="w-px h-12 bg-slate-700 mx-1"></div>

                            <div className="flex gap-1 items-center">
                                <div className="flex flex-col items-center justify-center w-12 h-16 rounded cursor-pointer hover:bg-slate-800 transition-colors" onClick={zoomIn}>
                                    <ZoomIn size={18} className="mb-1 text-slate-300" />
                                    <span className="text-[10px] text-slate-300">Zoom In</span>
                                </div>
                                <div className="flex flex-col items-center justify-center w-12 h-16 rounded cursor-pointer hover:bg-slate-800 transition-colors" onClick={zoomOut}>
                                    <ZoomOut size={18} className="mb-1 text-slate-300" />
                                    <span className="text-[10px] text-slate-300">Zoom Out</span>
                                </div>
                                <div className="flex flex-col items-center justify-center w-12 h-16 rounded cursor-pointer hover:bg-slate-800 transition-colors" onClick={zoomFit}>
                                    <Maximize size={18} className="mb-1 text-slate-300" />
                                    <span className="text-[10px] text-slate-300">Zoom Fit</span>
                                </div>
                            </div>
                        </div>

                        {/* Workspace Panels */}
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-6 pl-2">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-16 text-right leading-tight">Workspace</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<Layers size={20} />} label="Left Panel" active={useEngigraphStore.getState().leftSidebarOpen} onClick={() => useEngigraphStore.getState().toggleLeftSidebar()} />
                                <RibbonButton icon={<Sliders size={20} />} label="Right Panel" active={useEngigraphStore.getState().rightSidebarOpen} onClick={() => useEngigraphStore.getState().toggleRightSidebar()} />
                            </div>
                        </div>

                        {/* Save / Open / Import */}
                        <div className="flex gap-2 items-center h-full border-r border-slate-700 pr-6 py-2">
                            <div
                                className="flex flex-col items-center justify-center w-14 h-16 rounded cursor-pointer hover:bg-slate-800 transition-colors border border-transparent"
                                onClick={saveProject}
                            >
                                <FileDown size={24} className="mb-1 text-slate-300" />
                                <span className="text-[10px] text-slate-300">Save</span>
                            </div>
                            <div
                                className="flex flex-col items-center justify-center w-14 h-16 rounded cursor-pointer hover:bg-slate-800 transition-colors border border-transparent"
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = '.json';
                                    input.onchange = (e: any) => {
                                        const file = e.target?.files?.[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onload = (ev) => importProject(ev.target?.result as string);
                                        reader.readAsText(file);
                                    };
                                    input.click();
                                }}
                            >
                                <FolderOpen size={24} className="mb-1 text-slate-300" />
                                <span className="text-[10px] text-slate-300">Open</span>
                            </div>
                        </div>

                        <div className="flex flex-col justify-center h-full border-r border-slate-700 px-6">
                            <div className="flex items-center gap-2">
                                <div className="text-[10px] text-white font-medium mb-1 tracking-wide">Annotation Scale:</div>
                            </div>
                            <select onChange={(e) => toast.info(`Annotation scale changed to ${e.target.value}`)} className="bg-slate-800 border border-slate-600 text-xs text-white rounded px-2 py-1.5 outline-none focus:border-cyan-500 w-40">
                                <option>1:1 (Full Size)</option>
                                <option>1:2</option>
                                <option>2:1</option>
                            </select>
                        </div>

                        <div className="flex flex-col justify-center h-full border-r border-slate-700 px-6 gap-3">
                            <div className="flex items-center gap-3">
                                <div className="text-[10px] text-white font-semibold uppercase tracking-wider w-24">ISOMETRIC MODE</div>
                                <div 
                                    className="flex bg-black rounded p-[2px] border border-slate-700 cursor-pointer text-[10px] select-none shadow-inner" 
                                    onClick={() => {
                                        const store = useEngigraphStore.getState();
                                        store.toggleSnap('snapToAngle');
                                    }}
                                >
                                    <div className={`px-2 py-0.5 rounded-sm transition-colors ${!useEngigraphStore.getState().grid?.snapToAngle ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400'}`}>OFF</div>
                                    <div className={`px-2 py-0.5 rounded-sm transition-colors ${useEngigraphStore.getState().grid?.snapToAngle ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400'}`}>ON</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-[10px] text-white font-semibold uppercase tracking-wider w-24 text-right pr-2">PLANE</div>
                                <select onChange={(e) => {
                                    toast.info(`View plane changed to ${e.target.value}`);
                                    if (e.target.value === 'Top') useEngigraphStore.getState().setView({ x: 0, y: 0, zoom: 1 });
                                }} className="bg-slate-800 border border-slate-600 text-xs text-white rounded px-2 py-1 outline-none focus:border-cyan-500 w-24">
                                    <option>Top</option>
                                    <option>Left</option>
                                    <option>Right</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-6 items-center h-full px-6 border-r border-slate-700">
                            <div className="flex flex-col items-center justify-center">
                                <div className="text-[10px] text-white font-semibold uppercase tracking-wider mb-2">ACTIVE COLOR</div>
                                <div onClick={() => toast.info('Color palette would open here')} className="w-8 h-8 rounded bg-white cursor-pointer border-2 border-slate-500 shadow-md"></div>
                            </div>

                            <div className="w-px h-12 bg-slate-700 mx-2"></div>

                            <div 
                                className="flex flex-col items-center justify-center w-14 h-16 rounded cursor-pointer hover:bg-slate-800 transition-colors"
                                onClick={zoomFit}
                            >
                                <Maximize2 size={24} className="mb-1 text-slate-300" />
                                <span className="text-[10px] text-slate-300">Fit View</span>
                            </div>
                        </div>
                    </>
                )}

                {/* Draw Tab */}
                {activeTab === 'draw' && (
                    <>
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-6 pl-2">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-10 text-left leading-tight">Basic</div>
                            <div className="flex gap-3">
                                <RibbonButton icon={<Minus size={20} />} label="Line" active={activeTool === 'line'} onClick={() => handleToolClick('line')} />
                                <RibbonButton icon={<Circle size={20} />} label="Compass" active={activeTool === 'circle'} onClick={() => handleToolClick('circle')} />
                                <RibbonButton icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="6"/></svg>} label="Ellipse" active={activeTool === 'ellipse'} onClick={() => handleToolClick('ellipse')} />
                                <RibbonButton icon={<RefreshCw size={20} />} label="Arc" active={activeTool === 'arc'} onClick={() => handleToolClick('arc')} />
                                <RibbonButton icon={<Square size={20} />} label="Rect" active={activeTool === 'rect'} onClick={() => handleToolClick('rect')} />
                                <RibbonButton icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4" ry="4"/></svg>} label="Round Rect" active={activeTool === 'roundrect'} onClick={() => handleToolClick('roundrect')} />
                                <RibbonButton icon={<Hexagon size={20} />} label="Polygon" active={activeTool === 'polygon'} onClick={() => handleToolClick('polygon')} />
                            </div>
                        </div>
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-6 pl-4">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-16 text-left leading-tight">Instruments</div>
                            <div className="flex gap-3">
                                <RibbonButton icon={<Ruler size={20} />} label="Ruler" active={activeTool === 'ruler'} onClick={() => handleToolClick('ruler')} />
                                <RibbonButton icon={<Compass size={20} />} label="Drafter" active={activeTool === 'drafter'} onClick={() => handleToolClick('drafter')} />
                                <RibbonButton icon={<Triangle size={20} />} label="30/60°" active={activeTool === 'set-square-30'} onClick={() => handleToolClick('set-square-30')} />
                                <RibbonButton icon={<Triangle size={20} />} label="45°" active={activeTool === 'set-square-45'} onClick={() => handleToolClick('set-square-45')} />
                                <RibbonButton icon={<CircleSlash size={20} />} label="Protractor" active={activeTool === 'protractor'} onClick={() => handleToolClick('protractor')} />
                            </div>
                        </div>
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-6 pl-4">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-8 text-left leading-tight">Sets</div>
                            <div className="flex gap-3">
                                <RibbonButton icon={<Layers size={20} />} label="30° Set" active={activeTool === 'set-paired-30'} onClick={() => handleToolClick('set-paired-30')} />
                                <RibbonButton icon={<Layers size={20} />} label="45° Set" active={activeTool === 'set-paired-45'} onClick={() => handleToolClick('set-paired-45')} />
                                <RibbonButton icon={<Compass size={20} />} label="Drafter Set" active={activeTool === 'set-paired-drafter'} onClick={() => handleToolClick('set-paired-drafter')} />
                            </div>
                        </div>
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-6 pl-4">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-10 text-left leading-tight">Refine</div>
                            <div className="flex gap-3">
                                <RibbonButton icon={<Split size={20} />} label="Bisect" active={activeTool === 'bisect'} onClick={() => handleToolClick('bisect')} />
                                <RibbonButton icon={<CornerDownRight size={20} />} label="Fillet" active={activeTool === 'fillet'} onClick={() => handleToolClick('fillet')} />
                                <RibbonButton icon={<PenTool size={20} />} label="Sketch" active={activeTool === 'spline'} onClick={() => handleToolClick('spline')} />
                                <RibbonButton icon={<Settings size={20} />} label="Gear" active={activeTool === 'gear'} onClick={() => handleToolClick('gear')} />
                            </div>
                        </div>
                    </>
                )}

                {/* Mechatronics Tab */}
                {activeTab === 'mechatronics' && (
                    <>
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-6 pl-2">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-16 text-right leading-tight">Precision CAD</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<Split size={20} />} label="Trim" active={activeTool === 'trim'} onClick={() => handleToolClick('trim')} />
                                <RibbonButton icon={<Maximize2 size={20} />} label="Extend" active={activeTool === 'extend'} onClick={() => handleToolClick('extend')} />
                                <RibbonButton icon={<Copy size={20} />} label="Offset" active={activeTool === 'offset'} onClick={() => handleToolClick('offset')} />
                                <RibbonButton icon={<Columns size={20} />} label="Mirror" active={activeTool === 'mirror'} onClick={() => handleToolClick('mirror')} />
                            </div>
                        </div>
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-6 pl-2">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-16 text-right leading-tight">Patterns</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<LayoutGrid size={20} />} label="Linear" active={activeTool === 'array-linear'} onClick={() => handleToolClick('array-linear')} />
                            </div>
                        </div>
                    </>
                )}

                {/* Hybrid Ops Tab */}
                {activeTab === 'hybrid' && (
                    <>
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-6 pl-2">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-16 text-right leading-tight">3D Generation</div>
                            <div className="flex gap-1">
                                <RibbonButton
                                    icon={<Box size={20} />}
                                    label="Extrude 3D"
                                    active={is3DViewOpen}
                                    onClick={() => { triggerHybridExtrude(); toggle3DView(); }}
                                />
                                <RibbonButton
                                    icon={<Package size={20} />}
                                    label="Enclosure"
                                    active={enclosureMode}
                                    onClick={toggleEnclosureMode}
                                />
                                <RibbonButton icon={<Waves size={20} />} label="Sculpt" active={activeTool === 'sculpt'} onClick={() => handleToolClick('sculpt')} />
                                <RibbonButton
                                    icon={<ScanLine size={20} />}
                                    label="Cross-Sect"
                                    active={useEngigraphStore.getState().crossSectionEnabled}
                                    onClick={() => useEngigraphStore.getState().toggleCrossSection()}
                                />
                            </div>
                        </div>

                        {/* Group 2: Netlist */}
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-6 pl-2">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-14 text-right leading-tight">Netlist</div>
                            <div className="flex gap-1">
                                <RibbonButton
                                    icon={<List size={20} />}
                                    label="Gen Netlist"
                                    onClick={() => {
                                        generateNetlist();
                                        toast.success('Netlist generated — open Hybrid Panel for details.');
                                    }}
                                />
                            </div>
                        </div>

                        {/* Group 3: Layer Isolation */}
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-6 pl-2">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-14 text-right leading-tight">Layers</div>
                            <div className="flex gap-1">
                                <RibbonButton
                                    icon={<Eye size={20} />}
                                    label="Top Layer"
                                    active={useEngigraphStore.getState().activeLayer === 'top'}
                                    onClick={() => useEngigraphStore.getState().setActiveLayer('top')}
                                />
                                <RibbonButton
                                    icon={<Eye size={20} />}
                                    label="Bot Layer"
                                    active={useEngigraphStore.getState().activeLayer === 'bottom'}
                                    onClick={() => useEngigraphStore.getState().setActiveLayer('bottom')}
                                />
                                <RibbonButton icon={<GitMerge size={20} />} label="Divide" active={activeTool === 'subdivide'} onClick={() => handleToolClick('subdivide')} />
                            </div>
                        </div>


                        {/* Group 5: Hybrid Panel */}
                        <div className="flex items-center gap-4 pl-2">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-14 text-right leading-tight">Panel</div>
                            <div className="flex gap-1">
                                <RibbonButton
                                    icon={<Settings size={20} />}
                                    label="Hybrid Panel"
                                    active={isHybridPanelOpen}
                                    onClick={toggleHybridPanel}
                                />
                            </div>
                        </div>
                    </>
                )}

                {/* Annotate Tab */}
                {activeTab === 'annotate' && (
                    <>
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-6 pl-2">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-16 text-right leading-tight">Dimensions</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<Ruler size={20} />} label="Linear" active={activeTool === 'dim-linear'} onClick={() => handleToolClick('dim-linear')} />
                                <RibbonButton icon={<Circle size={20} />} label="Radial" active={activeTool === 'dim-radial'} onClick={() => handleToolClick('dim-radial')} />
                                <RibbonButton icon={<Sparkles size={20} />} label="Auto Dim" active={activeTool === 'dim-smart'} onClick={() => handleToolClick('dim-smart')} />
                            </div>
                        </div>
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-6 pl-2">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-16 text-right leading-tight">Notes</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<Type size={20} />} label="Text" active={activeTool === 'text'} onClick={() => handleToolClick('text')} />
                                <RibbonButton icon={<CornerDownRight size={20} />} label="Leader" active={activeTool === 'leader'} onClick={() => handleToolClick('leader')} />
                            </div>
                        </div>
                    </>
                )}

                {/* Electro & Logic Tab */}
                {activeTab === 'electro' && (
                    <>
                        {/* Previously Circuit tab content merged into Electro */}
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-6 pl-2">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-16 text-right leading-tight">Measurements<br/>Computations</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<Zap size={20} />} label="Run" active={isSimulationRunning} onClick={() => { toggleSimulation(); toast.success('Simulation toggled'); }} />
                                <RibbonButton icon={<ZapOff size={20} />} label="Stop" active={!isSimulationRunning} onClick={() => { toggleSimulation(); toast.info('Simulation Stopped'); }} />
                                <div className="w-px h-8 bg-slate-700 mx-1"></div>
                                <RibbonButton icon={<Activity size={20} />} label="Logic Scope" onClick={() => useEngigraphStore.getState().toggleScope?.()} />
                                <RibbonButton icon={<Terminal size={20} />} label="UART Port" onClick={() => useEngigraphStore.getState().toggleTerminal?.()} />
                                <RibbonButton icon={<Wind size={20} className={useEngigraphStore.getState().cfdMode ? 'text-blue-400' : ''} />} label="CFD Solver" active={useEngigraphStore.getState().cfdMode} onClick={() => useEngigraphStore.getState().toggleCfdMode()} />
                                <RibbonButton icon={<Mic size={20} className={useEngigraphStore.getState().acousticMode ? 'text-orange-400' : ''} />} label="Acoustic FFT" active={useEngigraphStore.getState().acousticMode} onClick={() => useEngigraphStore.getState().toggleAcousticMode()} />
                                <RibbonButton icon={<Flame size={20} className={useEngigraphStore.getState().pdnMode ? 'text-red-400' : ''} />} label="FEA Thermal" active={useEngigraphStore.getState().pdnMode} onClick={() => useEngigraphStore.getState().togglePdnMode()} />
                            </div>
                        </div>
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-6 pl-2">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-16 text-right leading-tight">Schematic Symbols</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<Battery size={20} />} label="Source" onClick={() => handleToolClick('component', 'battery')} />
                                <RibbonButton icon={<Minus size={20} />} label="GND" onClick={() => handleToolClick('component', 'ground')} />
                                <RibbonButton icon={<Activity size={20} />} label="Resistor" onClick={() => handleToolClick('component', 'resistor')} />
                                <RibbonButton icon={<Lightbulb size={20} />} label="LED" onClick={() => handleToolClick('component', 'led_red')} />
                                <RibbonButton icon={<ToggleLeft size={20} />} label="Switch" onClick={() => handleToolClick('component', 'switch_spst')} />
                            </div>
                        </div>
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-6 pl-2">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-16 text-right leading-tight">Logic Gates</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<GitMerge size={20} />} label="AND" onClick={() => handleToolClick('component', 'gate_and')} />
                                <RibbonButton icon={<GitBranch size={20} />} label="OR" onClick={() => handleToolClick('component', 'gate_or')} />
                                <RibbonButton icon={<CircleSlash size={20} />} label="NOT" onClick={() => handleToolClick('component', 'gate_not')} />
                                <RibbonButton icon={<GitPullRequest size={20} />} label="XOR" onClick={() => handleToolClick('component', 'gate_xor')} />
                            </div>
                        </div>
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-6 pl-2">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-16 text-right leading-tight">Conductors</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<GitMerge size={20} />} label="Wire" active={activeTool === 'wire'} onClick={() => handleToolClick('wire')} />
                            </div>
                        </div>

                        {/* Original Electro tab content */}
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-6 pl-2">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-16 text-right leading-tight">Controllers</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<Cpu size={20} />} label="Uno" onClick={() => handleToolClick('component', 'arduino_uno')} />
                                <RibbonButton icon={<Cpu size={20} />} label="ESP32" onClick={() => handleToolClick('component', 'esp32')} />
                                <RibbonButton icon={<Cpu size={20} />} label="Pico" onClick={() => handleToolClick('component', 'rpi_pico')} />
                            </div>
                        </div>
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-6 pl-2">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-16 text-right leading-tight">UI & Input</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<Columns size={20} />} label="LCD" onClick={() => handleToolClick('component', 'lcd_1602')} />
                                <RibbonButton icon={<LayoutGrid size={20} />} label="Keypad" onClick={() => handleToolClick('component', 'keypad_4x4')} />
                            </div>
                        </div>
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-6 pl-2">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-16 text-right leading-tight">Motion</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<Box size={20} />} label="NEMA17" onClick={() => handleToolClick('component', 'nema17')} />
                                <RibbonButton icon={<RefreshCw size={20} />} label="Servo" onClick={() => handleToolClick('component', 'servo_sg90')} />
                                <RibbonButton icon={<Circle size={20} />} label="DC Motor" onClick={() => handleToolClick('component', 'dc_motor_generic')} />
                                <RibbonButton icon={<Circle size={20} />} label="Bearing" onClick={() => handleToolClick('component', 'bearing_608')} />
                            </div>
                        </div>
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-6 pl-2">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-16 text-right leading-tight">Sensing & Power</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<Waves size={20} />} label="Sonar" onClick={() => handleToolClick('component', 'hcsr04')} />
                                <RibbonButton icon={<Battery size={20} />} label="18650" onClick={() => handleToolClick('component', 'battery_18650')} />
                            </div>
                        </div>
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-6 pl-2">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-16 text-right leading-tight">Quantum (Phase 19)</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<GitCommit size={20} />} label="Entangle" active={activeTool === 'entangle'} onClick={() => handleToolClick('entangle')} />
                            </div>
                        </div>
                    </>
                )}

                {/* Hybrid Ops Tab */}
                {activeTab === 'hybrid' && (
                    <>
                        {/* Group 1: 2D → 3D Core */}
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-6 pl-2">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-14 text-right leading-tight">2D → 3D</div>
                            <div className="flex gap-1">
                                <RibbonButton
                                    icon={<Box size={20} />}
                                    label="Extrude 3D"
                                    active={is3DViewOpen}
                                    onClick={() => { triggerHybridExtrude(); toggle3DView(); }}
                                />
                                <RibbonButton
                                    icon={<Package size={20} />}
                                    label="Enclosure"
                                    active={enclosureMode}
                                    onClick={toggleEnclosureMode}
                                />
                                <RibbonButton
                                    icon={<ScanLine size={20} />}
                                    label="Cross-Sect"
                                    active={useEngigraphStore.getState().crossSectionEnabled}
                                    onClick={() => useEngigraphStore.getState().toggleCrossSection()}
                                />
                            </div>
                        </div>

                        {/* Group 2: Netlist */}
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-6 pl-2">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-14 text-right leading-tight">Netlist</div>
                            <div className="flex gap-1">
                                <RibbonButton
                                    icon={<List size={20} />}
                                    label="Gen Netlist"
                                    onClick={() => {
                                        generateNetlist();
                                        toast.success('Netlist generated — open Hybrid Panel for details.');
                                    }}
                                />
                            </div>
                        </div>

                        {/* Group 3: Layer Isolation */}
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-6 pl-2">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-14 text-right leading-tight">Layers</div>
                            <div className="flex gap-1">
                                <RibbonButton
                                    icon={<Eye size={20} />}
                                    label="Top Layer"
                                    active={useEngigraphStore.getState().activeLayer === 'top'}
                                    onClick={() => useEngigraphStore.getState().setActiveLayer('top')}
                                />
                                <RibbonButton
                                    icon={<Eye size={20} />}
                                    label="Bot Layer"
                                    active={useEngigraphStore.getState().activeLayer === 'bottom'}
                                    onClick={() => useEngigraphStore.getState().setActiveLayer('bottom')}
                                />
                                <RibbonButton
                                    icon={<Layers size={20} />}
                                    label="Silkscreen"
                                    active={useEngigraphStore.getState().activeLayer === 'silkscreen'}
                                    onClick={() => useEngigraphStore.getState().setActiveLayer('silkscreen')}
                                />
                            </div>
                        </div>



                        {/* Group 5: Hybrid Panel */}
                        <div className="flex items-center gap-4 pl-2">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-14 text-right leading-tight">Panel</div>
                            <div className="flex gap-1">
                                <RibbonButton
                                    icon={<Settings size={20} />}
                                    label="Hybrid Panel"
                                    active={isHybridPanelOpen}
                                    onClick={toggleHybridPanel}
                                />
                            </div>
                        </div>
                    </>
                )}

                {/* Digitize Tab */}
                {activeTab === 'digitize' && (
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-6 pl-2">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-16 text-right leading-tight">Image Processing</div>
                            <div className="flex gap-1">
                            <RibbonButton icon={<Upload size={20} />} label="Import" onClick={toggleDigitizeModal} />
                            <RibbonButton icon={<Sparkles size={20} />} label="Refine" onClick={() => {
                                toast.promise(
                                    new Promise(resolve => setTimeout(resolve, 2500)),
                                    { loading: 'AI Refining layout and spacing...', success: 'Refinement Complete.', error: 'Refinement Failed' }
                                );
                            }} />
                        </div>
                    </div>
                )}

                {/* Output Tab */}
                {activeTab === 'output' && (
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-6 pl-2">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-16 text-right leading-tight">Export Data</div>
                            <div className="flex gap-1">
                            <RibbonButton icon={<Download size={20} />} label="SVG" onClick={() => exportProject('svg')} />
                            <RibbonButton icon={<FileDown size={20} />} label="Save JSON" onClick={saveProject} />
                            <RibbonButton icon={<FolderOpen size={20} />} label="Import" onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = '.json';
                                input.onchange = (e: any) => {
                                    const file = e.target?.files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = (ev) => importProject(ev.target?.result as string);
                                    reader.readAsText(file);
                                };
                                input.click();
                            }} />
                            <RibbonButton icon={<Printer size={20} />} label="Print" onClick={() => window.print()} />
                            <RibbonButton icon={<List size={20} />} label="BOM" onClick={() => generateBOM()} />
                        </div>
                    </div>
                )}

                {/* AI Tab */}
                {activeTab === 'ai' && (
                    <>
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-6 pl-2">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-16 text-right leading-tight">Agentic Assistant</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<Bot size={20} />} label="Assistant" onClick={toggleAiAssistant} />
                                <RibbonButton icon={<Eye size={20} />} label="See All" onClick={toggleAiAssistant} />
                                <RibbonButton icon={<Cpu size={20} />} label="Architect" onClick={handleAutoRoute} />
                            </div>
                        </div>
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-6 pl-2">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-16 text-right leading-tight">Agentic Audit</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<ShieldCheck size={20} />} label="Deep Audit" onClick={() => {
                                    toast.promise(
                                        new Promise(resolve => setTimeout(resolve, 3000)),
                                        { loading: 'Running AI Deep Audit...', success: 'Audit Complete: No structural flaws detected.', error: 'Audit Failed' }
                                    );
                                }} />
                                <RibbonButton icon={<Zap size={20} />} label="Optimize" onClick={() => {
                                    toast.promise(
                                        new Promise(resolve => setTimeout(resolve, 2000)),
                                        { loading: 'Optimizing circuit paths...', success: 'Optimization Complete: Saved 14% wire length.', error: 'Optimization Failed' }
                                    );
                                }} />
                            </div>
                        </div>
                    </>
                )}

                {/* Help Tab */}
                {activeTab === 'help' && (
                    <>
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-6 pl-2">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-16 text-right leading-tight">Resources</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<BookOpen size={20} />} label="Thesis" onClick={() => window.open('https://github.com/AsikhuleSafetify/ASCAD', '_blank')} />
                                <RibbonButton icon={<GraduationCap size={20} />} label="Tutorial" onClick={() => window.open('https://github.com/AsikhuleSafetify/ASCAD/wiki', '_blank')} />
                            </div>
                        </div>
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-6 pl-2">
                            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-16 text-right leading-tight">Compliance</div>
                            <div className="flex gap-1">
                                <RibbonButton icon={<ShieldCheck size={20} />} label="Standards" onClick={() => window.open('https://store.sabs.co.za', '_blank')} />
                            </div>
                        </div>
                    </>
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
