import paper from 'https://esm.sh/paper';

/**
 * Connectivity and Graph Utilities for Circuit Simulation
 */

export const CircuitUtils = {
    getSimulatableItems: () => {
        const results = [];
        paper.project.layers.forEach(l => {
            if (l.name === 'grid_layer' || !l.visible) return;
            l.children.forEach(item => {
                if (item.data && (item.data.type === 'wire' || item.data.type === 'component')) {
                    results.push(item);
                }
            });
        });
        return results;
    },

    getPointsOfEntry: (item) => {
        if (!item) return [];
        
        // Handle wires/lines
        if (item.className === 'Path' && item.segments.length >= 2) {
            return [item.firstSegment.point, item.lastSegment.point];
        }

        // Handle mechatronics components
        if (item.data && item.data.type === 'component') {
            const pins = [];
            const getPin = (ox, oy) => ({ pos: item.localToParent(new paper.Point(ox, oy)), ox, oy });

            switch(item.data.partType) {
                case 'gate_and':
                case 'gate_or':
                case 'gate_xor':
                case 'gate_nand':
                case 'gate_nor':
                    // Inputs: Left; Output: Right
                    pins.push(
                        { ...getPin(-15, -5), role: 'input' }, 
                        { ...getPin(-15, 5), role: 'input' }, 
                        { ...getPin(15, 0), role: 'output' }
                    );
                    break;
                case 'arduino_uno':
                    // Map common power pins
                    pins.push(
                        { ...getPin(-10, 22), role: 'vcc' }, // 5V roughly
                        { ...getPin(-5, 22), role: 'gnd' }
                    );
                    break;
                case 'esp32':
                    pins.push(
                        { ...getPin(10.5, 18), role: 'vcc' },
                        { ...getPin(10.5, 20), role: 'gnd' }
                    );
                    break;
                case 'gate_not':
                    pins.push(
                        { ...getPin(-15, 0), role: 'input' }, 
                        { ...getPin(15, 0), role: 'output' }
                    );
                    break;
                case 'led_red':
                case 'led_blue':
                case 'buzzer':
                case 'resistor':
                case 'dc_motor_generic':
                case 'nema17':
                    pins.push(
                        { ...getPin(-15, 0), role: 'p1' }, 
                        { ...getPin(15, 0), role: 'p2' }
                    );
                    break;
                case 'servo_sg90':
                    pins.push(
                        { ...getPin(-10, 0), role: 'vcc' }, 
                        { ...getPin(0, 0), role: 'gnd' },
                        { ...getPin(10, 0), role: 'pwm' }
                    );
                    break;
                case 'switch_spst':
                    pins.push(
                        { ...getPin(-15, 0), role: 'p1' }, 
                        { ...getPin(5, 0), role: 'p2' }
                    );
                    break;
                case 'battery_18650':
                    // GND is left, VCC is right
                    pins.push(
                        { ...getPin(-15, 0), role: 'gnd' }, 
                        { ...getPin(15, 0), role: 'vcc' }
                    );
                    break;
                case 'ground':
                    pins.push({ ...getPin(0, -10), role: 'gnd' });
                    break;
                case 'switch_spst':
                case 'push_button':
                    pins.push(
                        { ...getPin(-10, 0), role: 'p1' }, 
                        { ...getPin(10, 0), role: 'p2' }
                    );
                    break;
                case 'capacitor':
                    pins.push(
                        { ...getPin(-15, 0), role: 'p1' }, 
                        { ...getPin(15, 0), role: 'p2' }
                    );
                    break;
                case 'inductor':
                    pins.push(
                        { ...getPin(-15, 0), role: 'p1' }, 
                        { ...getPin(15, 0), role: 'p2' }
                    );
                    break;
                case 'diode':
                    pins.push(
                        { ...getPin(-15, 0), role: 'anode' }, 
                        { ...getPin(15, 0), role: 'cathode' }
                    );
                    break;
                case 'transistor_npn':
                case 'transistor_pnp':
                    pins.push(
                        { ...getPin(-10, 0), role: 'base' }, 
                        { ...getPin(10, -10), role: 'collector' },
                        { ...getPin(10, 10), role: 'emitter' }
                    );
                    break;
                case 'mosfet_n':
                case 'mosfet_p':
                    pins.push(
                        { ...getPin(-10, 0), role: 'gate' }, 
                        { ...getPin(10, -10), role: 'drain' },
                        { ...getPin(10, 10), role: 'source' }
                    );
                    break;
                case 'opamp':
                    pins.push(
                        { ...getPin(-20, -10), role: 'in-' }, 
                        { ...getPin(-20, 10), role: 'in+' },
                        { ...getPin(20, 0), role: 'out' },
                        { ...getPin(0, -15), role: 'v+' },
                        { ...getPin(0, 15), role: 'v-' }
                    );
                    break;
                case 'voltage_regulator':
                    pins.push(
                        { ...getPin(-20, 0), role: 'in' }, 
                        { ...getPin(12, 0), role: 'out' },
                        { ...getPin(0, 10), role: 'gnd' }
                    );
                    break;
                case 'relay':
                    pins.push(
                        { ...getPin(-20, -6), role: 'coil1' }, 
                        { ...getPin(-20, 6), role: 'coil2' },
                        { ...getPin(20, 0), role: 'com' },
                        { ...getPin(20, -8), role: 'no' },
                        { ...getPin(20, 8), role: 'nc' }
                    );
                    break;
                default:
                    pins.push({ pos: item.position, role: 'center' });
            }
            return pins;
        }
        return [{ pos: item.position, role: 'node' }];
    },

    discoverNets: (items) => {
        const nets = [];
        const tolerance = 12;

        const wires = items.filter(it => it.data && (it.data.type === 'wire' || (it.data.type === 'line' && it.segments.length > 1)));
        const comps = items.filter(it => it.data && it.data.type === 'component');

        const allPins = [];
        comps.forEach(c => {
            const pins = CircuitUtils.getPointsOfEntry(c);
            pins.forEach(p => {
                allPins.push({ item: c, role: p.role, pos: p.pos || p, id: `${c.id}_${p.role}` });
            });
        });

        const graphNodes = [...wires, ...allPins];
        const adjacency = new Map();
        graphNodes.forEach(n => adjacency.set(n, []));

        const doTouch = (pos, wire) => {
            const nearest = wire.getNearestPoint(pos);
            return nearest && pos.getDistance(nearest) < tolerance;
        };

        // Wire-Wire
        for (let i = 0; i < wires.length; i++) {
            for (let j = i + 1; j < wires.length; j++) {
                const w1Pts = CircuitUtils.getPointsOfEntry(wires[i]).map(p => p.pos || p);
                const w2Pts = CircuitUtils.getPointsOfEntry(wires[j]).map(p => p.pos || p);
                let touches = false;
                for (let p1 of w1Pts) if (doTouch(p1, wires[j])) touches = true;
                for (let p2 of w2Pts) if (doTouch(p2, wires[i])) touches = true;
                if (touches) {
                    adjacency.get(wires[i]).push(wires[j]);
                    adjacency.get(wires[j]).push(wires[i]);
                }
            }
        }

        // Wire-Pin
        wires.forEach(w => {
            allPins.forEach(pin => {
                const wPts = CircuitUtils.getPointsOfEntry(w).map(p => p.pos || p);
                let touches = false;
                if (doTouch(pin.pos, w)) touches = true;
                else {
                    for (let wp of wPts) {
                        if (wp.getDistance(pin.pos) < tolerance) touches = true;
                    }
                }
                if (touches) {
                    adjacency.get(w).push(pin);
                    adjacency.get(pin).push(w);
                }
            });
        });

        // Pin-Pin
        for (let i = 0; i < allPins.length; i++) {
            for (let j = i + 1; j < allPins.length; j++) {
                if (allPins[i].item === allPins[j].item) continue;
                if (allPins[i].pos.getDistance(allPins[j].pos) < tolerance) {
                    adjacency.get(allPins[i]).push(allPins[j]);
                    adjacency.get(allPins[j]).push(allPins[i]);
                }
            }
        }

        // Switch & Inductor bridging
        comps.forEach(c => {
            if (c.data.partType === 'switch_spst') {
                const state = c.data.state;
                const isClosed = (state !== 'open' && state !== 'Open' && state !== false && state !== 'false');
                if (isClosed) {
                    const p1 = allPins.find(p => p.item === c && p.role === 'p1');
                    const p2 = allPins.find(p => p.item === c && p.role === 'p2');
                    if (p1 && p2) {
                        adjacency.get(p1).push(p2);
                        adjacency.get(p2).push(p1);
                    }
                }
            } else if (c.data.partType === 'inductor') {
                const p1 = allPins.find(p => p.item === c && p.role === 'p1');
                const p2 = allPins.find(p => p.item === c && p.role === 'p2');
                if (p1 && p2) {
                    adjacency.get(p1).push(p2);
                    adjacency.get(p2).push(p1);
                }
            }
        });

        const visited = new Set();
        graphNodes.forEach(startNode => {
            if (visited.has(startNode)) return;
            const netWires = [];
            const netPins = [];
            const queue = [startNode];
            visited.add(startNode);
            
            while (queue.length > 0) {
                const curr = queue.shift();
                if (curr.item) netPins.push(curr);
                else netWires.push(curr);

                const neighbors = adjacency.get(curr) || [];
                neighbors.forEach(nxt => {
                    if (!visited.has(nxt)) {
                        visited.add(nxt);
                        queue.push(nxt);
                    }
                });
            }

            nets.push({
                wires: netWires,
                pins: netPins,
                potential: 0,
                state: 'FLOATING'
            });
        });

        return nets;
    }
};