export interface PadDefinition {
    id: string; // e.g. "1", "2", "A", "K"
    x: number; // mm from footprint center
    y: number; // mm from footprint center
    width: number; // mm
    height: number; // mm
    shape: 'rect' | 'roundrect' | 'circle' | 'oval';
    layer: 'top' | 'bottom' | 'thruhole'; // top = SMD on top, thruhole = plated through hole
    drill?: number; // mm (if thruhole)
}

export interface SilkscreenLine {
    points: number[]; // [x1, y1, x2, y2, ...]
    width: number; // mm
}

export interface FootprintDefinition {
    id: string; // e.g. "0805", "DIP-8"
    name: string; // Human readable
    type: 'smd' | 'tht';
    pads: PadDefinition[];
    silkscreen: SilkscreenLine[];
}

export const FootprintLibrary: Record<string, FootprintDefinition> = {
    '0805': {
        id: '0805',
        name: '0805 (Metric 2012) SMD',
        type: 'smd',
        pads: [
            { id: '1', x: -0.95, y: 0, width: 0.9, height: 1.3, shape: 'rect', layer: 'top' },
            { id: '2', x: 0.95, y: 0, width: 0.9, height: 1.3, shape: 'rect', layer: 'top' }
        ],
        silkscreen: [
            { points: [-1.6, -0.9, 1.6, -0.9, 1.6, 0.9, -1.6, 0.9, -1.6, -0.9], width: 0.15 } // bounding box
        ]
    },
    '1206': {
        id: '1206',
        name: '1206 (Metric 3216) SMD',
        type: 'smd',
        pads: [
            { id: '1', x: -1.5, y: 0, width: 1.1, height: 1.7, shape: 'rect', layer: 'top' },
            { id: '2', x: 1.5, y: 0, width: 1.1, height: 1.7, shape: 'rect', layer: 'top' }
        ],
        silkscreen: [
            { points: [-2.2, -1.1, 2.2, -1.1, 2.2, 1.1, -2.2, 1.1, -2.2, -1.1], width: 0.15 }
        ]
    },
    'DIP-8': {
        id: 'DIP-8',
        name: 'DIP-8 (Through Hole)',
        type: 'tht',
        pads: [
            { id: '1', x: -3.81, y: 3.81, width: 1.6, height: 1.6, shape: 'rect', layer: 'thruhole', drill: 0.8 }, // Pin 1 is square
            { id: '2', x: -1.27, y: 3.81, width: 1.6, height: 1.6, shape: 'circle', layer: 'thruhole', drill: 0.8 },
            { id: '3', x: 1.27, y: 3.81, width: 1.6, height: 1.6, shape: 'circle', layer: 'thruhole', drill: 0.8 },
            { id: '4', x: 3.81, y: 3.81, width: 1.6, height: 1.6, shape: 'circle', layer: 'thruhole', drill: 0.8 },
            { id: '5', x: 3.81, y: -3.81, width: 1.6, height: 1.6, shape: 'circle', layer: 'thruhole', drill: 0.8 },
            { id: '6', x: 1.27, y: -3.81, width: 1.6, height: 1.6, shape: 'circle', layer: 'thruhole', drill: 0.8 },
            { id: '7', x: -1.27, y: -3.81, width: 1.6, height: 1.6, shape: 'circle', layer: 'thruhole', drill: 0.8 },
            { id: '8', x: -3.81, y: -3.81, width: 1.6, height: 1.6, shape: 'circle', layer: 'thruhole', drill: 0.8 }
        ],
        silkscreen: [
            { points: [-5.08, 2.54, -5.08, -2.54], width: 0.2 },
            { points: [-5.08, -2.54, 5.08, -2.54, 5.08, 2.54], width: 0.2 },
            { points: [-5.08, 2.54, -3.81, 2.54, -3.81, 1.27, -5.08, 1.27], width: 0.2 } 
        ]
    },
    'PinHeader-1x2': {
        id: 'PinHeader-1x2',
        name: 'Pin Header 1x2 (2.54mm)',
        type: 'tht',
        pads: [
            { id: '1', x: -1.27, y: 0, width: 1.8, height: 1.8, shape: 'rect', layer: 'thruhole', drill: 1.0 },
            { id: '2', x: 1.27, y: 0, width: 1.8, height: 1.8, shape: 'circle', layer: 'thruhole', drill: 1.0 }
        ],
        silkscreen: [
            { points: [-2.54, -1.27, 2.54, -1.27, 2.54, 1.27, -2.54, 1.27, -2.54, -1.27], width: 0.2 }
        ]
    },
    'SOIC-8': {
        id: 'SOIC-8',
        name: 'SOIC-8 (SMD)',
        type: 'smd',
        pads: [
            { id: '1', x: -2.7, y: 1.905, width: 1.5, height: 0.6, shape: 'rect', layer: 'top' },
            { id: '2', x: -2.7, y: 0.635, width: 1.5, height: 0.6, shape: 'rect', layer: 'top' },
            { id: '3', x: -2.7, y: -0.635, width: 1.5, height: 0.6, shape: 'rect', layer: 'top' },
            { id: '4', x: -2.7, y: -1.905, width: 1.5, height: 0.6, shape: 'rect', layer: 'top' },
            { id: '5', x: 2.7, y: -1.905, width: 1.5, height: 0.6, shape: 'rect', layer: 'top' },
            { id: '6', x: 2.7, y: -0.635, width: 1.5, height: 0.6, shape: 'rect', layer: 'top' },
            { id: '7', x: 2.7, y: 0.635, width: 1.5, height: 0.6, shape: 'rect', layer: 'top' },
            { id: '8', x: 2.7, y: 1.905, width: 1.5, height: 0.6, shape: 'rect', layer: 'top' }
        ],
        silkscreen: [
            { points: [-1.9, 2.5, 1.9, 2.5, 1.9, -2.5, -1.9, -2.5, -1.9, 2.5], width: 0.15 },
            { points: [-2.5, 2.5, -2.5, 2.5], width: 0.5 } // Pin 1 dot
        ]
    },
    'TerminalBlock-2P': {
        id: 'TerminalBlock-2P',
        name: 'Terminal Block 2-Pin (5.08mm)',
        type: 'tht',
        pads: [
            { id: '1', x: -2.54, y: 0, width: 2.5, height: 2.5, shape: 'rect', layer: 'thruhole', drill: 1.5 },
            { id: '2', x: 2.54, y: 0, width: 2.5, height: 2.5, shape: 'circle', layer: 'thruhole', drill: 1.5 }
        ],
        silkscreen: [
            { points: [-5.08, -4, 5.08, -4, 5.08, 4, -5.08, 4, -5.08, -4], width: 0.2 },
            { points: [-5.08, 2, 5.08, 2], width: 0.2 } // Front wire entry line
        ]
    },
    'E-Cap-8mm': {
        id: 'E-Cap-8mm',
        name: 'Electrolytic Cap (8mm)',
        type: 'tht',
        pads: [
            { id: '1', x: -1.75, y: 0, width: 1.6, height: 1.6, shape: 'rect', layer: 'thruhole', drill: 0.8 }, // Positive
            { id: '2', x: 1.75, y: 0, width: 1.6, height: 1.6, shape: 'circle', layer: 'thruhole', drill: 0.8 } // Negative
        ],
        silkscreen: [
            { points: [4, 0, 4, 0.1], width: 0.2 }, // Circle approximation logic will use radius in canvas if needed
            { points: [-4, -4, 4, -4, 4, 4, -4, 4, -4, -4], width: 0.15 }, // Simple bounding box for now
            // Draw a circle for silkscreen (approximate using arc in canvas or square here)
            { points: [-2.5, -1, -2.5, 1], width: 0.2 }, // Plus sign V
            { points: [-3.5, 0, -1.5, 0], width: 0.2 }   // Plus sign H
        ]
    }
};
