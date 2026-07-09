import { create } from 'zustand';
import { AutoRouter } from '../solvers/Autorouter';

// Types
export type ToolType = 'select' | 'line' | 'rect' | 'circle' | 'ellipse' | 'roundrect' | 'polygon' | 'spline' | 'wire' | 'entangle' | 'component' | 'text' | 'dimension' | 'move' | 'pan' | 'probe' | 'arc' | 'ruler' | 'drafter' | 'set-square-30' | 'set-square-45' | 'protractor' | 'set-paired-30' | 'set-paired-45' | 'set-paired-drafter' | 'bisect' | 'fillet' | 'gear' | 'trim' | 'extend' | 'offset' | 'mirror' | 'array-linear' | 'subdivide' | 'sculpt' | 'dim-linear' | 'dim-radial' | 'dim-smart' | 'leader';
export type TabType = 'home' | 'draw' | 'modelling' | 'annotate' | 'electro' | 'circuit' | 'hybrid' | 'digitize' | 'output' | 'ai' | 'help';
export type ViewState = {
    x: number;
    y: number;
    zoom: number;
};
export type GridState = {
    snapToGrid: boolean;
    snapToObject: boolean;
    snapToAngle: boolean;
    orthoMode: boolean;
    gridSize: number;
};

export interface TerminalLog {
    id: string;
    type: 'system' | 'user' | 'data';
    text: string;
    timestamp: number;
}

export interface DRCViolation {
    id: string;
    type: 'clearance' | 'width' | 'unrouted' | 'overlap';
    message: string;
    elementIds: string[];
    x: number;
    y: number;
}

export interface DrawingObject {
    id: string;
    type: ToolType | string;
    partType?: string;
    points?: number[];
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    radius?: number;
    radiusX?: number;
    radiusY?: number;
    innerRadius?: number;
    outerRadius?: number;
    cornerRadius?: number;
    sides?: number;
    angle?: number;
    text?: string;
    stroke?: string;
    fill?: string;
    strokeWidth?: number;
    dash?: number[];
    // Circuit/Logic Metadata
    isPowered?: boolean;
    state?: any;
    speed?: number;
    voltage?: number;
    boardLayer?: 'top' | 'bottom' | 'silkscreen';
    temperature?: number;
    isBurnedOut?: boolean;
    armLength?: number;
    isColliding?: boolean;
    netId?: string; // PCB Logical Net Association
    resistance?: number;
    capacitance?: string;
    inductance?: string;
    logicType?: string;
    targetAngle?: number;
    currentAngle?: number;
    powerDrawMA?: number;
    capacityMAH?: number;
    // MCU specific
    mcuCode?: string;
    
    // Signal Integrity (Phase 14)
    signalFrequency?: number;
    isCorrupted?: boolean;
    crosstalkInterference?: number;
    isEntangled?: boolean; // Quantum Phase 19

    // Power Delivery Network (Phase 15)
    voltageDrop?: number;
    isPowerStarved?: boolean;

    // Thermodynamics & Aging (Phase 20)
    operationalHours?: number;
    mtbfRating?: number;
    wearLevel?: number; // 0.0 to 1.0 (1.0 = failed)
}

export interface EngigraphState {
    // Current Active Tool
    activeTool: ToolType;
    setActiveTool: (tool: ToolType) => void;
    activePartType: string | null;
    setActivePartType: (partType: string | null) => void;

    // Elements & History
    elements: DrawingObject[];
    undoStack: DrawingObject[][];
    redoStack: DrawingObject[][];
    selectedIds: string[];
    setSelectedIds: (ids: string[]) => void;
    pushHistory: (newElements: DrawingObject[]) => void;
    undo: () => void;
    redo: () => void;
    setElements: (elements: DrawingObject[]) => void;
    updateElement: (id: string, updates: Partial<DrawingObject>) => void;
    removeSelected: () => void;
    clearWorkspace: () => void;
    exportProject: (format: 'svg' | 'json') => void;
    saveProject: () => void;
    importProject: (jsonStr: string) => void;
    generateBOM: () => void;
    
    // 3D View
    is3DViewOpen: boolean;
    toggle3DView: () => void;

    // Firmware IDE
    isIdeOpen: boolean;
    activeMcuId: string | null;
    openIde: (mcuId: string) => void;
    closeIde: () => void;
    
    // AI Component Generator (Datasheet RAG)
    isDatasheetModalOpen: boolean;
    toggleDatasheetModal: () => void;
    customComponentDefs: Record<string, any>;
    addCustomComponentDef: (id: string, def: any) => void;

    // PDN Heatmap
    pdnMode: boolean;
    togglePdnMode: () => void;

    // CFD & Acoustic
    cfdMode: boolean;
    toggleCfdMode: () => void;
    acousticMode: boolean;
    toggleAcousticMode: () => void;

    // Hybrid Ops
    hybridExtrudeSignal: number;
    triggerHybridExtrude: () => void;
    // push3DCode: sends an arbitrary CSG script string to the 3D viewer
    pending3DCode: string | null;
    push3DCode: (code: string) => void;
    clear3DCode: () => void;

    // Phase 18: Auto Routing & PCB rules
    triggerAutoRoute: () => void;

    // Oscilloscope (Phase 16)
    probedWireId: string | null;
    probeHistory: { time: number; val: number }[];
    setProbedWire: (id: string | null) => void;
    pushProbeData: (id: string, val: number) => void;

    // View & Canvas
    view: ViewState;
    setView: (view: Partial<ViewState>) => void;
    
    // Grid & Snapping
    grid: GridState;
    setGrid: (grid: Partial<GridState>) => void;
    toggleSnap: (key: keyof Omit<GridState, 'gridSize'>) => void;

    // Theming & UI
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    
    leftSidebarOpen: boolean;
    rightSidebarOpen: boolean;
    toggleLeftSidebar: () => void;
    toggleRightSidebar: () => void;

    // Terminal & Simulation
    isTerminalOpen: boolean;
    toggleTerminal: () => void;
    isScopeOpen: boolean;
    toggleScope: () => void;
    isDigitizeModalOpen: boolean;
    toggleDigitizeModal: () => void;

    // Layer System
    layers: { id: string; name: string; visible: boolean; color: string }[];
    addLayer: (name: string, color: string) => void;
    toggleLayerVisibility: (id: string) => void;
    activeLayer: 'top' | 'bottom' | 'silkscreen' | string;
    setActiveLayer: (layer: string) => void;

    // Sheet Layout
    sheetLayout: string;
    setSheetLayout: (layout: string) => void;

    // Simulation Data
    probeData: Record<string, number[]>;
    terminalHistory: TerminalLog[];
    pushTerminalLog: (text: string, type?: 'system' | 'user' | 'data') => void;

    // Clipboard
    clipboard: DrawingObject[];
    copySelected: () => void;
    pasteClipboard: () => void;
    deleteSelected: () => void;

    // Simulation Execution
    isSimulationRunning: boolean;
    toggleSimulation: () => void;

    // Zoom Controls
    zoomIn: () => void;
    zoomOut: () => void;
    zoomFit: () => void;

    // UI Toggles
    enclosureMode: boolean;
    toggleEnclosureMode: () => void;
    isAiAssistantOpen: boolean;
    toggleAiAssistant: () => void;

    // ── Hybrid Ops ──────────────────────────────────────────────────────────
    isHybridPanelOpen: boolean;
    toggleHybridPanel: () => void;

    // 2D → 3D Extrusion settings (persisted per session)
    extrudeDepth: number;
    setExtrudeDepth: (depth: number) => void;
    extrudeScale: number;
    setExtrudeScale: (scale: number) => void;
    extrudeMaterial: 'plastic' | 'metal' | 'glass' | 'neon';
    setExtrudeMaterial: (mat: 'plastic' | 'metal' | 'glass' | 'neon') => void;

    // Enclosure Generator
    enclosureWallThickness: number;
    setEnclosureWallThickness: (t: number) => void;
    enclosurePadding: number;
    setEnclosurePadding: (p: number) => void;
    enclosureHasMountHoles: boolean;
    toggleEnclosureHasMountHoles: () => void;
    enclosureHasVents: boolean;
    toggleEnclosureHasVents: () => void;

    // Wire-to-Track (PCB import)
    wireTrackWidth: number;
    setWireTrackWidth: (w: number) => void;
    wireTrackCopperWeight: '1oz' | '2oz';
    setWireTrackCopperWeight: (w: '1oz' | '2oz') => void;

    // Schematic → Netlist
    netlist: { id: string; label: string; nets: string[] }[];
    generateNetlist: () => void;

    // Cross-section view
    crossSectionEnabled: boolean;
    crossSectionAxis: 'x' | 'y' | 'z';
    crossSectionOffset: number;
    toggleCrossSection: () => void;
    setCrossSectionAxis: (axis: 'x' | 'y' | 'z') => void;
    setCrossSectionOffset: (offset: number) => void;
}

export const useEngigraphStore = create<EngigraphState>((set, get) => ({
    activeTool: 'select',
    setActiveTool: (tool) => set({ activeTool: tool }),
    activePartType: null,
    setActivePartType: (partType) => set({ activePartType: partType }),
    
    hybridExtrudeSignal: 0,
    triggerHybridExtrude: () => set((state) => ({ hybridExtrudeSignal: state.hybridExtrudeSignal + 1 })),
    pending3DCode: null,
    push3DCode: (code) => set({ pending3DCode: code }),
    clear3DCode: () => set({ pending3DCode: null }),
    // Phase 18
    triggerAutoRoute: () => {
        const { elements, setElements, pushTerminalLog } = get();
        const newElements = AutoRouter.routeAll(elements);
        if (newElements !== elements) {
            setElements(newElements);
            pushTerminalLog('Auto-Route completed.', 'system');
        }
    },

    elements: [],
    undoStack: [],
    redoStack: [],
    selectedIds: [],
    setSelectedIds: (ids) => set({ selectedIds: ids }),
    pushHistory: (newElements) => set((state) => ({
        undoStack: [...state.undoStack, state.elements],
        redoStack: [],
        elements: newElements
    })),
    undo: () => set((state) => {
        if (state.undoStack.length === 0) return state;
        const previous = state.undoStack[state.undoStack.length - 1];
        return {
            undoStack: state.undoStack.slice(0, -1),
            redoStack: [...state.redoStack, state.elements],
            elements: previous,
            selectedIds: []
        };
    }),
    redo: () => set((state) => {
        if (state.redoStack.length === 0) return state;
        const next = state.redoStack[state.redoStack.length - 1];
        return {
            redoStack: state.redoStack.slice(0, -1),
            undoStack: [...state.undoStack, state.elements],
            elements: next,
            selectedIds: []
        };
    }),
    setElements: (elements) => set({ elements }),
    updateElement: (id, updates) => set((state) => ({
        elements: state.elements.map(el => el.id === id ? { ...el, ...updates } : el)
    })),
    removeSelected: () => set((state) => {
        if (state.selectedIds.length === 0) return state;
        const newElements = state.elements.filter(el => !state.selectedIds.includes(el.id));
        return {
            undoStack: [...state.undoStack, state.elements],
            redoStack: [],
            elements: newElements,
            selectedIds: []
        };
    }),

    clearWorkspace: () => set((state) => ({
        elements: [],
        undoStack: [...state.undoStack, state.elements],
        redoStack: []
    })),

    clipboard: [],
    copySelected: () => set((state) => {
        const selectedElements = state.elements.filter(el => state.selectedIds.includes(el.id));
        return { clipboard: selectedElements };
    }),
    pasteClipboard: () => set((state) => {
        if (state.clipboard.length === 0) return state;
        const newElements = state.clipboard.map(el => ({
            ...el,
            id: `${el.partType || el.type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            x: (el.x || 0) + 20,
            y: (el.y || 0) + 20,
            points: el.points ? el.points.map((p, i) => i % 2 === 0 ? p + 20 : p + 20) : undefined
        }));
        return {
            elements: [...state.elements, ...newElements],
            selectedIds: newElements.map(el => el.id)
        };
    }),
    deleteSelected: () => set((state) => {
        if (state.selectedIds.length === 0) return state;
        const newElements = state.elements.filter(el => !state.selectedIds.includes(el.id));
        return {
            elements: newElements,
            selectedIds: []
        };
    }),

    isSimulationRunning: true,
    toggleSimulation: () => set((state) => ({ isSimulationRunning: !state.isSimulationRunning })),

    zoomIn: () => set((state) => ({ view: { ...state.view, zoom: Math.min(state.view.zoom * 1.2, 5) } })),
    zoomOut: () => set((state) => ({ view: { ...state.view, zoom: Math.max(state.view.zoom / 1.2, 0.1) } })),
    zoomFit: () => set((state) => ({ view: { ...state.view, zoom: 1, x: 0, y: 0 } })),

    enclosureMode: false,
    toggleEnclosureMode: () => set((state) => ({ enclosureMode: !state.enclosureMode })),

    isAiAssistantOpen: false,
    toggleAiAssistant: () => set((state) => ({ isAiAssistantOpen: !state.isAiAssistantOpen })),

    exportProject: (format) => {
        const state = useEngigraphStore.getState();
        if (format === 'json') {
            const payload = { elements: state.elements, version: '2.0' };
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
            const a = document.createElement('a');
            a.setAttribute("href", dataStr);
            a.setAttribute("download", `EngiGraph_Project_${Date.now()}.json`);
            document.body.appendChild(a);
            a.click();
            a.remove();
        } else {
            console.log("SVG export not fully implemented, outputting json");
        }
    },

    saveProject: () => {
        const state = useEngigraphStore.getState();
        const payload = { elements: state.elements, version: '2.0', savedAt: new Date().toISOString() };
        try {
            localStorage.setItem('engigraph_autosave', JSON.stringify(payload));
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
            const a = document.createElement('a');
            a.setAttribute("href", dataStr);
            a.setAttribute("download", `EngiGraph_Save_${Date.now()}.json`);
            document.body.appendChild(a);
            a.click();
            a.remove();
            state.pushTerminalLog('Project saved successfully.', 'system');
        } catch(e) {
            state.pushTerminalLog('Save failed: ' + String(e), 'system');
        }
    },

    importProject: (jsonStr) => {
        try {
            const parsed = JSON.parse(jsonStr);
            const elements: DrawingObject[] = parsed.elements || parsed;
            if (!Array.isArray(elements)) throw new Error('Invalid project file');
            useEngigraphStore.getState().pushHistory(elements);
            useEngigraphStore.getState().pushTerminalLog(`Imported ${elements.length} elements.`, 'system');
        } catch (e) {
            useEngigraphStore.getState().pushTerminalLog('Import failed: ' + String(e), 'system');
        }
    },

    generateBOM: () => {
        const elements = useEngigraphStore.getState().elements;
        const components = elements.filter(el => el.type === 'component');
        const bom = components.reduce((acc: Record<string, number>, el) => {
            const name = el.partType || 'Unknown Part';
            acc[name] = (acc[name] || 0) + 1;
            return acc;
        }, {});
        
        let csvContent = "data:text/csv;charset=utf-8,Part Type,Quantity\n";
        Object.entries(bom).forEach(([part, count]) => {
            csvContent += `${part.toUpperCase()},${count}\n`;
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "EngiGraph_BOM.csv");
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        useEngigraphStore.getState().pushTerminalLog("BOM exported to CSV.", "system");
    },

    is3DViewOpen: false,
    toggle3DView: () => set(state => ({ is3DViewOpen: !state.is3DViewOpen })),

    isIdeOpen: false,
    activeMcuId: null,
    openIde: (mcuId: string) => set({ isIdeOpen: true, activeMcuId: mcuId }),
    closeIde: () => set({ isIdeOpen: false, activeMcuId: null }),

    isDatasheetModalOpen: false,
    toggleDatasheetModal: () => set(state => ({ isDatasheetModalOpen: !state.isDatasheetModalOpen })),
    customComponentDefs: {},
    addCustomComponentDef: (id, def) => set(state => ({ customComponentDefs: { ...state.customComponentDefs, [id]: def } })),

    pdnMode: false,
    togglePdnMode: () => set(state => ({ pdnMode: !state.pdnMode })),

    cfdMode: false,
    toggleCfdMode: () => set(state => ({ cfdMode: !state.cfdMode })),

    acousticMode: false,
    toggleAcousticMode: () => set(state => ({ acousticMode: !state.acousticMode })),

    probedWireId: null,
    probeHistory: [],
    setProbedWire: (id) => set({ probedWireId: id, probeHistory: [] }),
    pushProbeData: (id, val) => set((state) => {
        if (state.probedWireId !== id) return state;
        const newHistory = [...state.probeHistory, { time: Date.now(), val }];
        if (newHistory.length > 50) newHistory.shift(); // Keep last 50 samples
        return { probeHistory: newHistory };
    }),

    view: { x: 0, y: 0, zoom: 1 },
    setView: (viewUpdate) => set((state) => ({ view: { ...state.view, ...viewUpdate } })),

    grid: { snapToGrid: true, snapToObject: true, snapToAngle: true, orthoMode: false, gridSize: 10 },
    setGrid: (gridUpdate) => set((state) => ({ grid: { ...state.grid, ...gridUpdate } })),
    toggleSnap: (key) => set((state) => ({ grid: { ...state.grid, [key]: !state.grid[key] } })),

    theme: 'dark',
    toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

    leftSidebarOpen: true,
    rightSidebarOpen: true,
    toggleLeftSidebar: () => set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
    toggleRightSidebar: () => set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),

    isTerminalOpen: false,
    toggleTerminal: () => set((state) => ({ isTerminalOpen: !state.isTerminalOpen })),
    isScopeOpen: false,
    toggleScope: () => set((state) => ({ isScopeOpen: !state.isScopeOpen })),
    isDigitizeModalOpen: false,
    toggleDigitizeModal: () => set((state) => ({ isDigitizeModalOpen: !state.isDigitizeModalOpen })),

    activeLayer: 'top',
    setActiveLayer: (layer) => set({ activeLayer: layer }),

    layers: [
        { id: 'top', name: 'Top Copper (Red)', visible: true, color: '#ef4444' },
        { id: 'bottom', name: 'Bottom Copper (Blue)', visible: true, color: '#3b82f6' },
        { id: 'silkscreen', name: 'Silk Screen (White)', visible: true, color: '#ffffff' }
    ],
    addLayer: (name, color) => set((state) => ({
        layers: [...state.layers, { id: `layer-${Date.now()}`, name, color, visible: true }]
    })),
    toggleLayerVisibility: (id) => set((state) => ({
        layers: state.layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l)
    })),

    sheetLayout: 'none',
    setSheetLayout: (layout) => set({ sheetLayout: layout }),

    probeData: {},
    terminalHistory: [{ id: 'init-1', type: 'system', text: '> EngiGraph Virtual Console Initialized...', timestamp: Date.now() }],
    pushTerminalLog: (text, type = 'system') => set((state) => ({
        terminalHistory: [...state.terminalHistory, { id: `log-${Date.now()}-${Math.random()}`, type, text, timestamp: Date.now() }]
    })),

    // ── Hybrid Ops Implementations ─────────────────────────────────────────
    isHybridPanelOpen: false,
    toggleHybridPanel: () => set(state => ({ isHybridPanelOpen: !state.isHybridPanelOpen })),

    // Extrusion settings
    extrudeDepth: 5,
    setExtrudeDepth: (depth) => set({ extrudeDepth: depth }),
    extrudeScale: 10,
    setExtrudeScale: (scale) => set({ extrudeScale: scale }),
    extrudeMaterial: 'plastic',
    setExtrudeMaterial: (mat) => set({ extrudeMaterial: mat }),

    // Enclosure Generator
    enclosureWallThickness: 3,
    setEnclosureWallThickness: (t) => set({ enclosureWallThickness: t }),
    enclosurePadding: 5,
    setEnclosurePadding: (p) => set({ enclosurePadding: p }),
    enclosureHasMountHoles: true,
    toggleEnclosureHasMountHoles: () => set(state => ({ enclosureHasMountHoles: !state.enclosureHasMountHoles })),
    enclosureHasVents: false,
    toggleEnclosureHasVents: () => set(state => ({ enclosureHasVents: !state.enclosureHasVents })),

    // Wire-to-Track
    wireTrackWidth: 0.25,
    setWireTrackWidth: (w) => set({ wireTrackWidth: w }),
    wireTrackCopperWeight: '1oz',
    setWireTrackCopperWeight: (w) => set({ wireTrackCopperWeight: w }),

    // Netlist Generator
    netlist: [],
    generateNetlist: () => {
        const state = useEngigraphStore.getState();
        const components = state.elements.filter(el => el.type === 'component');
        const wires = state.elements.filter(el => el.type === 'wire');

        // Build adjacency: which components are connected by wires?
        const nets: { id: string; label: string; nets: string[] }[] = [];
        const visited = new Set<string>();

        components.forEach((comp, idx) => {
            if (visited.has(comp.id)) return;
            const connected: string[] = [comp.id];
            wires.forEach(wire => {
                const pts = wire.points || [];
                const startX = pts[0]; const startY = pts[1];
                const endX = pts[pts.length - 2]; const endY = pts[pts.length - 1];
                components.forEach(other => {
                    if (other.id === comp.id || visited.has(other.id)) return;
                    const cx = other.x || 0; const cy = other.y || 0;
                    const distStart = Math.sqrt((startX - cx) ** 2 + (startY - cy) ** 2);
                    const distEnd = Math.sqrt((endX - cx) ** 2 + (endY - cy) ** 2);
                    if (distStart < 30 || distEnd < 30) {
                        connected.push(other.id);
                        visited.add(other.id);
                    }
                });
            });
            visited.add(comp.id);
            nets.push({
                id: `NET_${idx + 1}`,
                label: `Net_${(comp.partType || 'node').toUpperCase()}_${idx + 1}`,
                nets: connected
            });
        });

        set({ netlist: nets });
        state.pushTerminalLog(`Netlist generated: ${nets.length} net(s) across ${components.length} component(s).`, 'system');
    },

    // Cross-section view
    crossSectionEnabled: false,
    crossSectionAxis: 'z',
    crossSectionOffset: 0,
    toggleCrossSection: () => set(state => ({ crossSectionEnabled: !state.crossSectionEnabled })),
    setCrossSectionAxis: (axis) => set({ crossSectionAxis: axis }),
    setCrossSectionOffset: (offset) => set({ crossSectionOffset: offset }),
}));


