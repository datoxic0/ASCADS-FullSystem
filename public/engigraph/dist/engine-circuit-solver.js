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
                if (part === 'ground')
                    isGrounded = true;
                if (part === 'battery_18650' && pin.role === 'vcc')
                    maxPotential = Math.max(maxPotential, pin.item.data.voltage || 3.7);
                if (['arduino_uno', 'esp32', 'rpi_pico'].includes(part) && pin.role === 'vcc')
                    maxPotential = Math.max(maxPotential, 5.0);
            });
            if (isGrounded) {
                net.potential = 0;
                net.state = 'LOW';
            }
            else if (maxPotential > 0) {
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
                if (net.potential > 2.0)
                    net.state = 'HIGH';
                else if (net.potential > 0.5)
                    net.state = 'MEDIUM';
                else
                    net.state = 'FLOATING';
            }
        });
        nets.forEach(net => {
            net.wires.forEach(w => {
                w.data.isPowered = (net.state === 'HIGH');
                w.data.nodePotential = net.potential;
            });
            net.pins.forEach(pin => {
                if (net.state === 'HIGH')
                    pin.item.data.isPowered = true;
                if (net.state === 'LOW')
                    pin.item.data.isGrounded = true;
                pin.item.data.nodePotential = net.potential;
            });
        });
    },
    solveLogicIteration: (nets) => {
        let anyChange = false;
        // 1. Digital Logic Gates
        const gatesSet = new Set();
        nets.forEach(net => net.pins.forEach(pin => {
            if (pin.item.data && pin.item.data.logicType)
                gatesSet.add(pin.item);
        }));
        gatesSet.forEach(gate => {
            const inputStates = nets.reduce((acc, net) => {
                const isInput = net.pins.some(p => p.item === gate && p.role === 'input');
                if (isInput)
                    acc.push(net.state);
                return acc;
            }, []);
            let result = false;
            switch (gate.data.logicType) {
                case 'AND':
                    result = inputStates.length >= 2 && inputStates.every(s => s === 'HIGH');
                    break;
                case 'NAND':
                    result = !(inputStates.length >= 2 && inputStates.every(s => s === 'HIGH'));
                    break;
                case 'OR':
                    result = inputStates.some(s => s === 'HIGH');
                    break;
                case 'NOR':
                    result = !(inputStates.some(s => s === 'HIGH'));
                    break;
                case 'NOT':
                    result = inputStates[0] === 'LOW';
                    break;
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
                }
                else if (!result && outNet.state === 'HIGH') {
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
                }
                else {
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
                }
                else {
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
                    }
                    else if (nonPot <= invPot && out.state === 'HIGH') {
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
                }
                else {
                    passState(com, nc);
                    passState(nc, com);
                }
            }
        });
        return anyChange;
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5naW5lLWNpcmN1aXQtc29sdmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vZW5naW5lLWNpcmN1aXQtc29sdmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQU1BLE1BQU0sQ0FBQyxNQUFNLGFBQWEsR0FBRztJQUN6QixlQUFlLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtRQUN0QixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ2YsR0FBRyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7WUFDbEIsR0FBRyxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUM7UUFDM0IsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ2YsSUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDO1lBQ3JCLElBQUksVUFBVSxHQUFHLEtBQUssQ0FBQztZQUV2QixHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDbkIsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO2dCQUVwQyxJQUFJLElBQUksS0FBSyxRQUFRO29CQUFFLFVBQVUsR0FBRyxJQUFJLENBQUM7Z0JBQ3pDLElBQUksSUFBSSxLQUFLLGVBQWUsSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEtBQUs7b0JBQUUsWUFBWSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sSUFBSSxHQUFHLENBQUMsQ0FBQztnQkFDeEgsSUFBSSxDQUFDLGFBQWEsRUFBRSxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssS0FBSztvQkFBRSxZQUFZLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDOUgsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLFVBQVUsRUFBRSxDQUFDO2dCQUNiLEdBQUcsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO2dCQUNsQixHQUFHLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUN0QixDQUFDO2lCQUFNLElBQUksWUFBWSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUMxQixHQUFHLENBQUMsU0FBUyxHQUFHLFlBQVksQ0FBQztnQkFDN0IsR0FBRyxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUM7WUFDdkIsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ2YsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7b0JBQ25CLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxLQUFLLFVBQVUsRUFBRSxDQUFDO3dCQUN4QyxNQUFNLFlBQVksR0FBRyxHQUFHLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7d0JBQ3JELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsSUFBSSxLQUFLLFlBQVksQ0FBQyxDQUFDLENBQUM7d0JBQ2xHLElBQUksUUFBUSxJQUFJLFFBQVEsQ0FBQyxTQUFTLEtBQUssR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDOzRCQUNuRCxNQUFNLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxTQUFTLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQzs0QkFDckQsUUFBUSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsU0FBUyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDOzRCQUMxRCxHQUFHLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQyxTQUFTLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUM7d0JBQ3BELENBQUM7b0JBQ0wsQ0FBQztnQkFDTCxDQUFDLENBQUMsQ0FBQztZQUNQLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztRQUVELElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDZixJQUFJLEdBQUcsQ0FBQyxLQUFLLEtBQUssS0FBSyxFQUFFLENBQUM7Z0JBQ3RCLElBQUksR0FBRyxDQUFDLFNBQVMsR0FBRyxHQUFHO29CQUFFLEdBQUcsQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDO3FCQUN2QyxJQUFJLEdBQUcsQ0FBQyxTQUFTLEdBQUcsR0FBRztvQkFBRSxHQUFHLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQzs7b0JBQzlDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsVUFBVSxDQUFDO1lBQ2hDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDZixHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDbEIsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxLQUFLLE1BQU0sQ0FBQyxDQUFDO2dCQUMxQyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDO1lBQ3pDLENBQUMsQ0FBQyxDQUFDO1lBQ0gsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ25CLElBQUksR0FBRyxDQUFDLEtBQUssS0FBSyxNQUFNO29CQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7Z0JBQ3pELElBQUksR0FBRyxDQUFDLEtBQUssS0FBSyxLQUFLO29CQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7Z0JBQ3pELEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDO1lBQ2hELENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsbUJBQW1CLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtRQUMxQixJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFFdEIseUJBQXlCO1FBQ3pCLE1BQU0sUUFBUSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFDM0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ3ZDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUztnQkFBRSxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN6RSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRUosUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNwQixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFO2dCQUN6QyxNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFJLEtBQUssT0FBTyxDQUFDLENBQUM7Z0JBQzFFLElBQUksT0FBTztvQkFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDakMsT0FBTyxHQUFHLENBQUM7WUFDZixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFUCxJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDbkIsUUFBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUN6QixLQUFLLEtBQUs7b0JBQUUsTUFBTSxHQUFHLFdBQVcsQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssTUFBTSxDQUFDLENBQUM7b0JBQUMsTUFBTTtnQkFDNUYsS0FBSyxNQUFNO29CQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUFDLE1BQU07Z0JBQ2hHLEtBQUssSUFBSTtvQkFBRyxNQUFNLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxNQUFNLENBQUMsQ0FBQztvQkFBQyxNQUFNO2dCQUNoRSxLQUFLLEtBQUs7b0JBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUM7b0JBQUMsTUFBTTtnQkFDbkUsS0FBSyxLQUFLO29CQUFFLE1BQU0sR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDO29CQUFDLE1BQU07Z0JBQ3JELEtBQUssS0FBSztvQkFDTixNQUFNLFNBQVMsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQztvQkFDL0QsTUFBTSxHQUFHLFNBQVMsR0FBRyxDQUFDLElBQUksU0FBUyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQzlDLE1BQU07WUFDZCxDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxJQUFJLElBQUksQ0FBQyxDQUFDLElBQUksS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3hGLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ1QsSUFBSSxNQUFNLElBQUksTUFBTSxDQUFDLEtBQUssS0FBSyxNQUFNLEVBQUUsQ0FBQztvQkFDcEMsTUFBTSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUM7b0JBQ3RCLE1BQU0sQ0FBQyxTQUFTLEdBQUcsR0FBRyxDQUFDO29CQUN2QixTQUFTLEdBQUcsSUFBSSxDQUFDO2dCQUNyQixDQUFDO3FCQUFNLElBQUksQ0FBQyxNQUFNLElBQUksTUFBTSxDQUFDLEtBQUssS0FBSyxNQUFNLEVBQUUsQ0FBQztvQkFDNUMsTUFBTSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7b0JBQ3JCLE1BQU0sQ0FBQyxTQUFTLEdBQUcsR0FBRyxDQUFDO29CQUN2QixTQUFTLEdBQUcsSUFBSSxDQUFDO2dCQUNyQixDQUFDO1lBQ0wsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsc0RBQXNEO1FBQ3RELE1BQU0sYUFBYSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFDaEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ3ZDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsbUJBQW1CLEVBQUUsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQzlILGFBQWEsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2hDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRUosYUFBYSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUN6QixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUVoQyxNQUFNLE1BQU0sR0FBRyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxJQUFJLElBQUksQ0FBQyxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzlGLE1BQU0sU0FBUyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFO2dCQUMzQixJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssS0FBSyxNQUFNLElBQUksR0FBRyxDQUFDLEtBQUssS0FBSyxNQUFNLEVBQUUsQ0FBQztvQkFDN0QsR0FBRyxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUM7b0JBQ25CLEdBQUcsQ0FBQyxTQUFTLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQztvQkFDOUIsU0FBUyxHQUFHLElBQUksQ0FBQztnQkFDckIsQ0FBQztZQUNMLENBQUMsQ0FBQztZQUVGLElBQUksSUFBSSxLQUFLLE9BQU8sRUFBRSxDQUFDO2dCQUNuQixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzNCLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDN0IsU0FBUyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztZQUM5QixDQUFDO2lCQUNJLElBQUksSUFBSSxLQUFLLFlBQVksRUFBRSxDQUFDO2dCQUM3QixNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzVCLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDakMsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUMvQixJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLE1BQU0sRUFBRSxDQUFDO29CQUNoQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7b0JBQzNCLFNBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzFCLENBQUM7cUJBQU0sQ0FBQztvQkFDSixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7Z0JBQ2hDLENBQUM7WUFDTCxDQUFDO2lCQUNJLElBQUksSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUN6QixNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzVCLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDOUIsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNoQyxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLE1BQU0sRUFBRSxDQUFDO29CQUNoQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7b0JBQzNCLFNBQVMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQzdCLENBQUM7cUJBQU0sQ0FBQztvQkFDSixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7Z0JBQ2hDLENBQUM7WUFDTCxDQUFDO2lCQUNJLElBQUksSUFBSSxLQUFLLG1CQUFtQixFQUFFLENBQUM7Z0JBQ3BDLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDM0IsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUM3QixJQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsS0FBSyxLQUFLLE1BQU0sRUFBRSxDQUFDO29CQUNsQyxJQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsS0FBSyxLQUFLLE1BQU0sRUFBRSxDQUFDO3dCQUNwQyxNQUFNLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQzt3QkFDdEIsTUFBTSxDQUFDLFNBQVMsR0FBRyxHQUFHLENBQUM7d0JBQ3ZCLFNBQVMsR0FBRyxJQUFJLENBQUM7b0JBQ3JCLENBQUM7Z0JBQ0wsQ0FBQztZQUNMLENBQUM7aUJBQ0ksSUFBSSxJQUFJLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ3pCLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDL0IsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMvQixNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzFCLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMzQyxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFM0MsSUFBSSxHQUFHLEVBQUUsQ0FBQztvQkFDTixJQUFJLE1BQU0sR0FBRyxNQUFNLElBQUksR0FBRyxDQUFDLEtBQUssS0FBSyxNQUFNLEVBQUUsQ0FBQzt3QkFDMUMsR0FBRyxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUM7d0JBQ25CLEdBQUcsQ0FBQyxTQUFTLEdBQUcsR0FBRyxDQUFDLENBQUMsZ0JBQWdCO3dCQUNyQyxTQUFTLEdBQUcsSUFBSSxDQUFDO29CQUNyQixDQUFDO3lCQUFNLElBQUksTUFBTSxJQUFJLE1BQU0sSUFBSSxHQUFHLENBQUMsS0FBSyxLQUFLLE1BQU0sRUFBRSxDQUFDO3dCQUNsRCxHQUFHLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQzt3QkFDbEIsR0FBRyxDQUFDLFNBQVMsR0FBRyxHQUFHLENBQUM7d0JBQ3BCLFNBQVMsR0FBRyxJQUFJLENBQUM7b0JBQ3JCLENBQUM7Z0JBQ0wsQ0FBQztZQUNMLENBQUM7aUJBQ0ksSUFBSSxJQUFJLEtBQUssT0FBTyxFQUFFLENBQUM7Z0JBQ3hCLE1BQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDM0IsTUFBTSxFQUFFLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUMzQixNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzFCLE1BQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDeEIsTUFBTSxFQUFFLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUV4QixNQUFNLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDcEMsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BDLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLHNCQUFzQjtnQkFDM0UsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEdBQUcsYUFBYSxDQUFDO2dCQUVwQyxJQUFJLGFBQWEsRUFBRSxDQUFDO29CQUNoQixTQUFTLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUNuQixTQUFTLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUN2QixDQUFDO3FCQUFNLENBQUM7b0JBQ0osU0FBUyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztvQkFDbkIsU0FBUyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDdkIsQ0FBQztZQUNMLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sU0FBUyxDQUFDO0lBQ3JCLENBQUM7Q0FDSixDQUFDIn0=