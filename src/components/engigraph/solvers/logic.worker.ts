// Custom simple node-based logic solver tailored for Engigraph Pro
import { DrawingObject } from '../store/useEngigraphStore';

self.onmessage = (e: MessageEvent) => {
    const elements: DrawingObject[] = e.data.elements;
    
    // We want to find sources of power (e.g. Battery, VCC, Switch closed) and trace them through wires
    // to components like LEDs, Motors, etc.
    
    // Very simplified generic graph traversal to find powered networks:
    // 1. Identify power sources
    const sources = elements.filter(el => el.partType === 'battery_18650' || (el.partType === 'switch_spst' && el.state === 'closed'));
    
    // Create a bounding box or node point mapping to connect wires to parts
    const tolerance = 25; // pixel distance to consider a "connection"
    
    let updatedElements = [...elements];
    
    // Start by un-powering everything
    updatedElements = updatedElements.map(el => {
        if (el.type === 'component' || el.type === 'wire') {
            return { ...el, isPowered: false, speed: 0 };
        }
        return el;
    });

    // Simple proximity-based graph traversal (Not an actual SPICE solver, but sufficient for visual logic)
    const poweredIds = new Set<string>();
    
    const getConnections = (x: number, y: number) => {
        return updatedElements.filter(el => {
            if (el.type === 'wire' && el.points) {
                // Check if any point in the wire is close to (x,y)
                for(let i=0; i<el.points.length; i+=2) {
                    const wx = el.points[i];
                    const wy = el.points[i+1];
                    if (Math.abs(wx - x) < tolerance && Math.abs(wy - y) < tolerance) return true;
                }
            }
            if (el.type === 'component' && el.x !== undefined && el.y !== undefined) {
                 if (Math.abs(el.x - x) < tolerance && Math.abs(el.y - y) < tolerance) return true;
            }
            return false;
        });
    };

    const traverse = (startEl: DrawingObject) => {
        if (poweredIds.has(startEl.id)) return;
        poweredIds.add(startEl.id);
        
        // Find all connections touching this element
        if (startEl.type === 'wire' && startEl.points) {
             for(let i=0; i<startEl.points.length; i+=2) {
                 const conns = getConnections(startEl.points[i], startEl.points[i+1]);
                 conns.forEach(c => {
                     // If it's a switch and it's open, stop traversing through it
                     if (c.partType === 'switch_spst' && c.state !== 'closed') return;
                     traverse(c);
                 });
             }
        } else if (startEl.type === 'component' && startEl.x !== undefined && startEl.y !== undefined) {
             const conns = getConnections(startEl.x, startEl.y);
             conns.forEach(c => {
                 if (c.partType === 'switch_spst' && c.state !== 'closed') return;
                 traverse(c);
             });
        }
    };

    // Run traversal from all sources
    sources.forEach(src => traverse(src));

    // Update elements with power status
    updatedElements = updatedElements.map(el => {
        if (poweredIds.has(el.id)) {
            let speed = 0;
            if (el.partType === 'nema17') speed = 5; // example RPM
            return { ...el, isPowered: true, speed };
        }
        return el;
    });

    self.postMessage({ type: 'LOGIC_RESULT', elements: updatedElements });
};
