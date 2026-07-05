/**
 * Logic and Potential Solver for Circuit Engine.
 * Upgraded to Advanced Nodal Logic for better component state resolution.
 */
import { CircuitUtils } from './engine-circuit-utils.js';

export const CircuitSolver = {
    solveStaticNets: (nets) => {
        nets.forEach(net => {
            net.potential = 0;
            net.state = 'FLOATING';
        });

        nets.forEach(net => {
            let maxPotential = 0;
            let isGrounded = false;

            net.pins.forEach(pin => {
                const part = pin.item.data.partType;

                if (part === 'ground') isGrounded = true;
                if (part === 'battery_18650' && pin.role === 'vcc') maxPotential = Math.max(maxPotential, pin.item.data.voltage || 3.7);
                if (['arduino_uno', 'esp32', 'rpi_pico'].includes(part) && pin.role === 'vcc') maxPotential = Math.max(maxPotential, 5.0);
            });

            if (isGrounded) {
                net.potential = 0;
                net.state = 'LOW';
            } else if (maxPotential > 0) {
                net.potential = maxPotential;
                net.state = 'HIGH';
            }
        });

        for (let i = 0; i < 5; i++) {
            nets.forEach(net => {
                net.pins.forEach(pin => {
                    if (pin.item.data.partType === 'resistor') {
                        const otherPinRole = pin.role === 'p1' ? 'p2' : 'p1';
                        const otherNet = nets.find(n => n.pins.some(p => p.item === pin.item && p.role === otherPinRole));
                        if (otherNet && otherNet.potential !== net.potential) {
                            const avg = (otherNet.potential + net.potential) / 2;
                            otherNet.potential = otherNet.potential * 0.9 + avg * 0.1;
                            net.potential = net.potential * 0.9 + avg * 0.1;
                        }
                    }
                });
            });
        }

        nets.forEach(net => {
            if (net.state !== 'LOW') {
                if (net.potential > 2.0) net.state = 'HIGH';
                else if (net.potential > 0.5) net.state = 'MEDIUM';
                else net.state = 'FLOATING';
            }
        });

        nets.forEach(net => {
            net.wires.forEach(w => {
                w.data.isPowered = (net.state === 'HIGH');
                w.data.nodePotential = net.potential;
            });
            net.pins.forEach(pin => {
                if (net.state === 'HIGH') pin.item.data.isPowered = true;
                if (net.state === 'LOW') pin.item.data.isGrounded = true;
                pin.item.data.nodePotential = net.potential;
            });
        });
    },

    solveLogicIteration: (nets) => {
        let anyChange = false;
        
        // 1. Digital Logic Gates
        const gatesSet = new Set();
        nets.forEach(net => net.pins.forEach(pin => {
            if (pin.item.data && pin.item.data.logicType) gatesSet.add(pin.item);
        }));

        gatesSet.forEach(gate => {
            const inputStates = nets.reduce((acc, net) => {
                const isInput = net.pins.some(p => p.item === gate && p.role === 'input');
                if (isInput) acc.push(net.state);
                return acc;
            }, []);

            let result = false;
            switch(gate.data.logicType) {
                case 'AND': result = inputStates.length >= 2 && inputStates.every(s => s === 'HIGH'); break;
                case 'NAND': result = !(inputStates.length >= 2 && inputStates.every(s => s === 'HIGH')); break;
                case 'OR':  result = inputStates.some(s => s === 'HIGH'); break;
                case 'NOR': result = !(inputStates.some(s => s === 'HIGH')); break;
                case 'NOT': result = inputStates[0] === 'LOW'; break;
                case 'XOR': 
                    const highCount = inputStates.filter(s => s === 'HIGH').length;
                    result = highCount > 0 && highCount % 2 === 1; 
                    break;
            }

            const outNet = nets.find(n => n.pins.some(p => p.item === gate && p.role === 'output'));
            if (outNet) {
                if (result && outNet.state !== 'HIGH') {
                    outNet.state = 'HIGH';
                    outNet.potential = 5.0;
                    anyChange = true;
                } else if (!result && outNet.state === 'HIGH') {
                    outNet.state = 'LOW';
                    outNet.potential = 0.0;
                    anyChange = true;
                }
            }
        });

        // 2. Analog Components Logic (Bridging and Directing)
        const componentsSet = new Set();
        nets.forEach(net => net.pins.forEach(pin => {
            if (pin.item.data && ['diode', 'transistor', 'mosfet', 'op_amp', 'voltage_regulator', 'relay'].includes(pin.item.data.partType)) {
                componentsSet.add(pin.item);
            }
        }));

        componentsSet.forEach(comp => {
            const type = comp.data.partType;

            const getNet = (role) => nets.find(n => n.pins.some(p => p.item === comp && p.role === role));
            const passState = (src, dst) => {
                if (src && dst && src.state === 'HIGH' && dst.state !== 'HIGH') {
                    dst.state = 'HIGH';
                    dst.potential = src.potential;
                    anyChange = true;
                }
            };

            if (type === 'diode') {
                const anode = getNet('p1');
                const cathode = getNet('p2');
                passState(anode, cathode);
            } 
            else if (type === 'transistor') {
                const base = getNet('base');
                const coll = getNet('collector');
                const emit = getNet('emitter');
                if (base && base.state === 'HIGH') {
                    comp.data.isPowered = true;
                    passState(coll, emit);
                } else {
                    comp.data.isPowered = false;
                }
            }
            else if (type === 'mosfet') {
                const gate = getNet('gate');
                const drain = getNet('drain');
                const source = getNet('source');
                if (gate && gate.state === 'HIGH') {
                    comp.data.isPowered = true;
                    passState(drain, source);
                } else {
                    comp.data.isPowered = false;
                }
            }
            else if (type === 'voltage_regulator') {
                const inNet = getNet('in');
                const outNet = getNet('out');
                if (inNet && inNet.state === 'HIGH') {
                    if (outNet && outNet.state !== 'HIGH') {
                        outNet.state = 'HIGH';
                        outNet.potential = 5.0;
                        anyChange = true;
                    }
                }
            }
            else if (type === 'op_amp') {
                const inInv = getNet('in_inv');
                const inNon = getNet('in_non');
                const out = getNet('out');
                const invPot = inInv ? inInv.potential : 0;
                const nonPot = inNon ? inNon.potential : 0;
                
                if (out) {
                    if (nonPot > invPot && out.state !== 'HIGH') {
                        out.state = 'HIGH';
                        out.potential = 5.0; // typical swing
                        anyChange = true;
                    } else if (nonPot <= invPot && out.state === 'HIGH') {
                        out.state = 'LOW';
                        out.potential = 0.0;
                        anyChange = true;
                    }
                }
            }
            else if (type === 'relay') {
                const c1 = getNet('coil1');
                const c2 = getNet('coil2');
                const com = getNet('com');
                const no = getNet('no');
                const nc = getNet('nc');
                
                const c1Pot = c1 ? c1.potential : 0;
                const c2Pot = c2 ? c2.potential : 0;
                const isCoilPowered = Math.abs(c1Pot - c2Pot) > 2.0; // Assume 2V threshold
                comp.data.isPowered = isCoilPowered;

                if (isCoilPowered) {
                    passState(com, no);
                    passState(no, com);
                } else {
                    passState(com, nc);
                    passState(nc, com);
                }
            }
        });

        return anyChange;
    }
};