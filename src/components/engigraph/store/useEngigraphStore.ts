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

export interface EngigraphState {
    // Current Active Tool
    activeTool: ToolType;
    setActiveTool: (tool: ToolType) => void;

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
