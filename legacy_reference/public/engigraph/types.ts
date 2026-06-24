import paper from 'https://esm.sh/paper';

export interface PinDefinition {
    pos: paper.Point;
    role: string;
    ox?: number;
    oy?: number;
}

export interface CircuitComponentData {
    type: string;
    partType: string;
    role?: string;
    isHandle?: boolean;
    pinRole?: string;
    instrumentType?: string;
    metadata?: string;
    terminals?: any[];
    electrical?: any;
    simId?: string;
    originalRadius?: number;
    _slideStartPos?: paper.Point;
    _dragStartPoint?: paper.Point;
}

export interface EngigraphItem extends paper.Item {
    data: CircuitComponentData;
}

export interface EngigraphGroup extends paper.Group {
    data: CircuitComponentData;
    _updatingHandles?: boolean;
}

export interface TerminalHandle extends paper.Path.Circle {
    data: CircuitComponentData;
}
