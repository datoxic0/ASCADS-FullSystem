import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PCBLayer = 'top_copper' | 'bottom_copper' | 'top_silk' | 'bottom_silk' | 'board_outline' | 'top_mask' | 'bottom_mask' | 'drills';

export interface PCBFootprintInstance {
    id: string;
    footprintId: string; // Refers to FootprintLibrary
    x: number;
    y: number;
    rotation: number; // degrees
    layer: 'top' | 'bottom';
    refDes: string; // e.g. "R1", "U2"
    value?: string;
}

export interface PCBTrack {
    id: string;
    points: number[]; // [x1, y1, x2, y2, ...]
    width: number;
    layer: 'top_copper' | 'bottom_copper';
    netId?: string;
}

export interface PCBVia {
    id: string;
    x: number;
    y: number;
    drill: number;
    diameter: number;
    netId?: string;
}

export interface PCBNet {
    id: string; // e.g. "Net-(U1-Pad1)"
    name: string;
    nodes: { footprintId: string, padId: string }[];
}

export interface PCBState {
    activeTool: 'select' | 'track' | 'via' | 'footprint' | 'outline' | 'zone';
    activeLayer: PCBLayer;
    viewMode: '2d' | '3d';
    
    // Board Data
    boardOutline: number[]; // [x1, y1, x2, y2, ...]
    footprints: PCBFootprintInstance[];
    tracks: PCBTrack[];
    vias: PCBVia[];
    nets: PCBNet[];
    
    // UI State
    selectedIds: string[];
    visibleLayers: Record<PCBLayer, boolean>;
    gridSnap: number; // mm
    sidebarOpen: boolean;
    
    // History
    history: any[];
    future: any[];
    
    // Actions
    setTool: (tool: PCBState['activeTool']) => void;
    setActiveLayer: (layer: PCBLayer) => void;
    setViewMode: (mode: '2d' | '3d') => void;
    setGridSnap: (snap: number) => void;
    toggleLayerVisible: (layer: PCBLayer) => void;
    
    addFootprint: (fp: PCBFootprintInstance) => void;
    addTrack: (track: PCBTrack) => void;
    addVia: (via: PCBVia) => void;
    updateFootprint: (id: string, updates: Partial<PCBFootprintInstance>) => void;
    updateBoardOutline: (points: number[]) => void;
    removeSelected: () => void;
    setSelectedIds: (ids: string[]) => void;
    clearBoard: () => void;
    setNets: (nets: PCBNet[]) => void;
    
    toggleSidebar: () => void;
    pushHistory: () => void;
    undo: () => void;
    redo: () => void;
}

export const usePCBStore = create<PCBState>()(
    persist(
        (set, get) => ({
            activeTool: 'select',
            activeLayer: 'top_copper',
            viewMode: '2d',
            boardOutline: [0, 0, 100, 0, 100, 80, 0, 80, 0, 0], // Default 100x80mm board
            footprints: [],
            tracks: [],
            vias: [],
            nets: [],
            selectedIds: [],
            visibleLayers: {
                top_copper: true,
                bottom_copper: true,
                top_silk: true,
                bottom_silk: true,
                board_outline: true,
                top_mask: true,
                bottom_mask: true,
                drills: true,
            },
            gridSnap: 1.0,
            sidebarOpen: true,
            history: [],
            future: [],

            setTool: (tool) => set({ activeTool: tool }),
            setActiveLayer: (layer) => set({ activeLayer: layer }),
            setViewMode: (mode) => set({ viewMode: mode }),
            setGridSnap: (snap) => set({ gridSnap: snap }),
            toggleLayerVisible: (layer) => set((state) => ({
                visibleLayers: { ...state.visibleLayers, [layer]: !state.visibleLayers[layer] }
            })),
            
            pushHistory: () => set((state) => {
                const snap = {
                    footprints: state.footprints,
                    tracks: state.tracks,
                    vias: state.vias,
                    nets: state.nets,
                    boardOutline: state.boardOutline
                };
                const hist = state.history || [];
                return { history: [...hist.slice(-49), snap], future: [] };
            }),
            
            undo: () => set((state) => {
                const hist = state.history || [];
                if (hist.length === 0) return state;
                const prev = hist[hist.length - 1];
                const currSnap = { footprints: state.footprints, tracks: state.tracks, vias: state.vias, nets: state.nets, boardOutline: state.boardOutline };
                return {
                    ...prev,
                    history: hist.slice(0, -1),
                    future: [currSnap, ...(state.future || [])],
                    selectedIds: []
                };
            }),
            
            redo: () => set((state) => {
                const fut = state.future || [];
                if (fut.length === 0) return state;
                const next = fut[0];
                const currSnap = { footprints: state.footprints, tracks: state.tracks, vias: state.vias, nets: state.nets, boardOutline: state.boardOutline };
                return {
                    ...next,
                    history: [...(state.history || []), currSnap],
                    future: fut.slice(1),
                    selectedIds: []
                };
            }),
            
            addFootprint: (fp) => set((state) => {
                state.pushHistory();
                return { footprints: [...state.footprints, fp] };
            }),
            addTrack: (track) => set((state) => {
                state.pushHistory();
                return { tracks: [...state.tracks, track] };
            }),
            addVia: (via) => set((state) => {
                state.pushHistory();
                return { vias: [...state.vias, via] };
            }),
            
            updateFootprint: (id, updates) => set((state) => {
                state.pushHistory();
                return {
                    footprints: state.footprints.map(f => f.id === id ? { ...f, ...updates } : f)
                };
            }),
            
            updateBoardOutline: (points) => set((state) => {
                state.pushHistory();
                return { boardOutline: points };
            }),
            
            setSelectedIds: (ids) => set({ selectedIds: ids }),
            
            removeSelected: () => set((state) => {
                state.pushHistory();
                return {
                    footprints: state.footprints.filter(f => !state.selectedIds.includes(f.id)),
                    tracks: state.tracks.filter(t => !state.selectedIds.includes(t.id)),
                    vias: state.vias.filter(v => !state.selectedIds.includes(v.id)),
                    selectedIds: [],
                };
            }),
            
            clearBoard: () => set((state) => {
                state.pushHistory();
                return { footprints: [], tracks: [], vias: [], selectedIds: [], boardOutline: [], nets: [] };
            }),
            setNets: (nets) => set((state) => {
                state.pushHistory();
                return { nets };
            }),
            
            toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        }),
        {
            name: 'pcb-lab-storage',
            partialize: (state) => ({
                boardOutline: state.boardOutline,
                footprints: state.footprints,
                tracks: state.tracks,
                vias: state.vias,
                nets: state.nets,
            })
        }
    )
);
