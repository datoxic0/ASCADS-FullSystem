import { create } from 'zustand';

// Types
export type ToolType = 'select' | 'line' | 'rect' | 'circle' | 'spline' | 'wire' | 'component' | 'text' | 'dimension' | 'move' | 'pan';
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
    resistance?: number;
    capacitance?: string;
    inductance?: string;
    logicType?: string;
    targetAngle?: number;
    currentAngle?: number;
    powerDrawMA?: number;
    capacityMAH?: number;
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
    generateBOM: () => void;

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
}

export const useEngigraphStore = create<EngigraphState>((set) => ({
    activeTool: 'select',
    setActiveTool: (tool) => set({ activeTool: tool }),
    activePartType: null,
    setActivePartType: (partType) => set({ activePartType: partType }),

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

    exportProject: (format) => {
        const state = useEngigraphStore.getState();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.elements));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href",     dataStr);
        downloadAnchorNode.setAttribute("download", "engigraph_export.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    },

    generateBOM: () => {
        const elements = useEngigraphStore.getState().elements;
        const components = elements.filter(el => el.type === 'component');
        const bom = components.reduce((acc: Record<string, number>, el) => {
            const name = el.partType || 'Unknown Part';
            acc[name] = (acc[name] || 0) + 1;
            return acc;
        }, {});
        
        let bomText = "=== BILL OF MATERIALS ===\n\n";
        Object.entries(bom).forEach(([part, count]) => {
            bomText += `${count}x ${part.toUpperCase()}\n`;
        });
        
        alert(bomText); // Temporary simple output
    },

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
}));
