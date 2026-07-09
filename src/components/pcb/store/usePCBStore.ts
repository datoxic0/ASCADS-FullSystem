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
    
    // Actions
    setTool: (tool: PCBState['activeTool']) => void;
    setActiveLayer: (layer: PCBLayer) => void;
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
}

export const usePCBStore = create<PCBState>()(
    persist(
        (set, get) => ({
            activeTool: 'select',
            activeLayer: 'top_copper',
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

            setTool: (tool) => set({ activeTool: tool }),
            setActiveLayer: (layer) => set({ activeLayer: layer }),
            setGridSnap: (snap) => set({ gridSnap: snap }),
            toggleLayerVisible: (layer) => set((state) => ({
                visibleLayers: { ...state.visibleLayers, [layer]: !state.visibleLayers[layer] }
            })),
            
            addFootprint: (fp) => set((state) => ({ footprints: [...state.footprints, fp] })),
            addTrack: (track) => set((state) => ({ tracks: [...state.tracks, track] })),
            addVia: (via) => set((state) => ({ vias: [...state.vias, via] })),
            
            updateFootprint: (id, updates) => set((state) => ({
                footprints: state.footprints.map(f => f.id === id ? { ...f, ...updates } : f)
            })),
            
            updateBoardOutline: (points) => set({ boardOutline: points }),
            
            setSelectedIds: (ids) => set({ selectedIds: ids }),
            
            removeSelected: () => set((state) => ({
                footprints: state.footprints.filter(f => !state.selectedIds.includes(f.id)),
                tracks: state.tracks.filter(t => !state.selectedIds.includes(t.id)),
                vias: state.vias.filter(v => !state.selectedIds.includes(v.id)),
                selectedIds: [],
            })),
            
            clearBoard: () => set({ footprints: [], tracks: [], vias: [], selectedIds: [], boardOutline: [], nets: [] }),
            setNets: (nets) => set({ nets }),
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
