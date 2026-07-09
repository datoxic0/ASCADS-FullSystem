import { PCBState, PCBTrack } from '../store/usePCBStore';
import { FootprintLibrary } from '../lib/FootprintLibrary';
import { v4 as uuidv4 } from 'uuid';

export class PCBAutorouter {
    /**
     * Simple Manhattan-distance based autorouter for generating tracks for unrouted nets.
     */
    static routeBoard(state: PCBState): PCBTrack[] {
        const newTracks: PCBTrack[] = [];
        const { nets, footprints } = state;

        // Map pad references (U1-1) to physical coordinates
        const padCoords: Record<string, { x: number, y: number, layer: 'top_copper' | 'bottom_copper' }> = {};

        for (const fp of footprints) {
            const def = FootprintLibrary[fp.footprintId];
            if (!def) continue;

            for (const pad of def.pads) {
                // Determine absolute position taking rotation into account
                // Rotation is in degrees, positive clockwise
                const rad = (fp.rotation * Math.PI) / 180;
                // Pad x,y are relative to footprint center
                // If footprint is on bottom, X is mirrored, but let's assume pad definitions are already mirrored in the canvas rendering.
                // Actually, the pad definition itself isn't mirrored, the rendering mirrors it. We need to mirror X here if on bottom.
                const px = fp.layer === 'bottom' ? -pad.x : pad.x;
                const py = pad.y;

                const rotatedX = px * Math.cos(rad) - py * Math.sin(rad);
                const rotatedY = px * Math.sin(rad) + py * Math.cos(rad);

                const absX = fp.x + rotatedX;
                const absY = fp.y + rotatedY;

                const layerStr = pad.layer === 'bottom' ? 'bottom_copper' : 'top_copper'; // Through-hole we'll map to bottom by default

                padCoords[`${fp.id}-${pad.id}`] = { x: absX, y: absY, layer: layerStr as any };
            }
        }

        // For each net, route between nodes
        for (const net of nets) {
            if (net.nodes.length < 2) continue;

            // Simple point-to-point routing
            for (let i = 0; i < net.nodes.length - 1; i++) {
                const n1 = net.nodes[i];
                const n2 = net.nodes[i+1];

                const c1 = padCoords[`${n1.footprintId}-${n1.padId}`];
                const c2 = padCoords[`${n2.footprintId}-${n2.padId}`];

                if (!c1 || !c2) continue;

                // Manhattan routing (L-shape)
                const layer = c1.layer; // Assume simple routing on same layer
                
                const points = [
                    c1.x, c1.y,
                    c1.x, c2.y, // corner
                    c2.x, c2.y
                ];

                newTracks.push({
                    id: uuidv4(),
                    points,
                    layer,
                    width: 0.25,
                    netId: net.id
                });
            }
        }

        return newTracks;
    }
}
