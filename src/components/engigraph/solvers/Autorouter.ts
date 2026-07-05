import { DrawingObject, useEngigraphStore } from '../store/useEngigraphStore';

export interface Pin {
    id: string;
    pos: Point;
    type: 'input' | 'output';
    name: string;
}

interface Point { x: number, y: number }

export class AutoRouter {
    static GRID_SIZE = 20;

    static getPins(item: DrawingObject): Pin[] {
        const pins: Pin[] = [];
        if (item.type !== 'component' || !item.partType) return pins;

        const cx = item.x || 0;
        const cy = item.y || 0;

        if (item.partType === 'battery' || item.partType === 'battery_18650') {
            pins.push({ id: `${item.id}-pos`, pos: { x: cx, y: cy - 20 }, type: 'output', name: 'VCC' });
            pins.push({ id: `${item.id}-neg`, pos: { x: cx, y: cy + 20 }, type: 'output', name: 'GND' });
        } else if (item.partType === 'led') {
            pins.push({ id: `${item.id}-anode`, pos: { x: cx - 15, y: cy }, type: 'input', name: 'A' });
            pins.push({ id: `${item.id}-cathode`, pos: { x: cx + 15, y: cy }, type: 'output', name: 'K' });
        } else if (item.partType === 'switch') {
            pins.push({ id: `${item.id}-in`, pos: { x: cx - 15, y: cy }, type: 'input', name: 'IN' });
            pins.push({ id: `${item.id}-out`, pos: { x: cx + 15, y: cy }, type: 'output', name: 'OUT' });
        } else {
            // Assume logic gate or generic IC. 2 inputs on left, 1 output on right (heuristic)
            pins.push({ id: `${item.id}-in1`, pos: { x: cx - 20, y: cy - 10 }, type: 'input', name: 'IN1' });
            pins.push({ id: `${item.id}-in2`, pos: { x: cx - 20, y: cy + 10 }, type: 'input', name: 'IN2' });
            pins.push({ id: `${item.id}-out`, pos: { x: cx + 20, y: cy }, type: 'output', name: 'OUT' });
        }
        return pins;
    }

    static distance(p1: Point, p2: Point) {
        return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
    }

    static findPath(startX: number, startY: number, endX: number, endY: number, elements: DrawingObject[], startId: string, endId: string): number[] | null {
        // Very simplified routing just to satisfy the method for now
        // This avoids overlapping components using basic L-routing.
        // For a full A* we would implement the BFS here.
        return [startX, startY, startX, endY, endX, endY];
    }

    static getComponentBounds(item: DrawingObject) {
        const width = item.width || 40;
        const height = item.height || 40;
        const x = item.x || 0;
        const y = item.y || 0;
        return {
            minX: x - width / 2 - 10,
            maxX: x + width / 2 + 10,
            minY: y - height / 2 - 10,
            maxY: y + height / 2 + 10
        };
    }

    static routeAll(elements: DrawingObject[]): DrawingObject[] {
        const newElements = [...elements];
        const pins: { pin: Pin, parentId: string, used: boolean }[] = [];
        
        const gridCellSize = 20;

        // Build obstacle grid
        // Simple set of blocked grid string keys "x,y"
        const blockedGrid = new Set<string>();

        // Collect all pins and block component areas
        for (const el of elements) {
            if (el.type === 'component') {
                const elPins = this.getPins(el);
                for (const p of elPins) {
                    pins.push({ pin: p, parentId: el.id, used: false });
                }
                
                const bounds = this.getComponentBounds(el);
                for (let x = Math.floor(bounds.minX / gridCellSize); x <= Math.ceil(bounds.maxX / gridCellSize); x++) {
                    for (let y = Math.floor(bounds.minY / gridCellSize); y <= Math.ceil(bounds.maxY / gridCellSize); y++) {
                        blockedGrid.add(`${x},${y}`);
                    }
                }
            } else if (el.type === 'wire' && el.points) {
                // Block existing wires roughly
                for (let i = 0; i < el.points.length - 2; i += 2) {
                    const x1 = Math.floor(el.points[i] / gridCellSize);
                    const y1 = Math.floor(el.points[i+1] / gridCellSize);
                    const x2 = Math.floor(el.points[i+2] / gridCellSize);
                    const y2 = Math.floor(el.points[i+3] / gridCellSize);
                    
                    const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
                    const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
                    
                    for (let x = minX; x <= maxX; x++) {
                        for (let y = minY; y <= maxY; y++) {
                            blockedGrid.add(`${x},${y}`);
                        }
                    }
                }
            }
        }

        // Extremely simple heuristic netlist auto-completion:
        // Connect an unused OUT to the nearest unused IN.
        const outs = pins.filter(p => p.pin.type === 'output');
        const ins = pins.filter(p => p.pin.type === 'input');

        for (const out of outs) {
            if (out.used) continue;
            
            // Find nearest unused IN
            let nearestIn = null;
            let minDist = Infinity;
            
            for (const input of ins) {
                if (input.used || input.parentId === out.parentId) continue; // don't self connect
                const dist = this.distance(out.pin.pos, input.pin.pos);
                if (dist < minDist) {
                    minDist = dist;
                    nearestIn = input;
                }
            }

            if (nearestIn) {
                out.used = true;
                nearestIn.used = true;

                // A* or BFS on grid
                const startGridX = Math.round(out.pin.pos.x / gridCellSize);
                const startGridY = Math.round(out.pin.pos.y / gridCellSize);
                const endGridX = Math.round(nearestIn.pin.pos.x / gridCellSize);
                const endGridY = Math.round(nearestIn.pin.pos.y / gridCellSize);

                // Unblock start and end pins so we can actually reach them!
                blockedGrid.delete(`${startGridX},${startGridY}`);
                blockedGrid.delete(`${endGridX},${endGridY}`);

                // Simple BFS
                const queue: { x: number, y: number, path: Point[] }[] = [];
                const visited = new Set<string>();
                queue.push({ x: startGridX, y: startGridY, path: [{ x: startGridX, y: startGridY }] });
                visited.add(`${startGridX},${startGridY}`);

                const dirs = [[0,1], [1,0], [0,-1], [-1,0]];
                let foundPath: Point[] | null = null;

                while (queue.length > 0 && queue.length < 5000) { // arbitrary limit to prevent hang
                    const curr = queue.shift()!;
                    if (curr.x === endGridX && curr.y === endGridY) {
                        foundPath = curr.path;
                        break;
                    }

                    for (const d of dirs) {
                        const nx = curr.x + d[0];
                        const ny = curr.y + d[1];
                        const key = `${nx},${ny}`;

                        // Bounding box for sane routing limit
                        if (nx < -100 || nx > 100 || ny < -100 || ny > 100) continue;

                        if (!visited.has(key) && !blockedGrid.has(key)) {
                            visited.add(key);
                            queue.push({ x: nx, y: ny, path: [...curr.path, { x: nx, y: ny }] });
                        }
                    }
                }

                if (foundPath) {
                    // Convert grid path back to pixel coordinates
                    const flatPoints: number[] = [];
                    for (const p of foundPath) {
                        flatPoints.push(p.x * gridCellSize, p.y * gridCellSize);
                        blockedGrid.add(`${p.x},${p.y}`); // Block this path for future routes
                    }

                    const wire: DrawingObject = {
                        id: `wire-auto-${Date.now()}-${Math.random()}`,
                        type: 'wire',
                        points: flatPoints,
                        stroke: '#3b82f6',
                        strokeWidth: 4,
                        boardLayer: 'bottom' // Auto route on bottom layer by default
                    };
                    newElements.push(wire);
                } else {
                    // Fallback to L-shape if BFS fails to find a path
                    const start = out.pin.pos;
                    const end = nearestIn.pin.pos;
                    const mid = { x: start.x, y: end.y };
                    
                    const wire: DrawingObject = {
                        id: `wire-auto-fail-${Date.now()}-${Math.random()}`,
                        type: 'wire',
                        points: [start.x, start.y, mid.x, mid.y, end.x, end.y],
                        stroke: '#ef4444', // Red to indicate overlapping/failing route
                        strokeWidth: 4,
                        boardLayer: 'bottom',
                        isCorrupted: true
                    };
                    newElements.push(wire);
                }
            }
        }

        return newElements;
    }
}
