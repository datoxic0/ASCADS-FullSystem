import { DrawingObject, useEngigraphStore } from '../store/useEngigraphStore';
import { Gate, GateKind } from '../../../lib/types';
import { RawNode } from '../../../lib/analog-sim-engine';
import { 
    HybridSimEngine, 
    HybridProject, 
    createHybridSimState, 
    HybridSimState,
    CrossoverConnection 
} from '../../../lib/hybrid-sim-engine';

interface Point { x: number; y: number; }
interface Pin { pos: Point; role: string; gateId: string; pinIndex: number; name?: string; domain: 'digital' | 'analog'; }

export class EcosystemAdapter {
    private static hybridState: HybridSimState = createHybridSimState();

    static getDistance(p1: Point, p2: Point): number {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static getWireLength(points: number[]): number {
        if (!points || points.length < 2) return 0;
        let len = 0;
        for (let i = 0; i < points.length - 2; i += 2) {
            const dx = points[i+2] - points[i];
            const dy = points[i+3] - points[i+1];
            len += Math.sqrt(dx*dx + dy*dy);
        }
        return len;
    }

    static getPins(item: DrawingObject): Pin[] {
        const pins: Pin[] = [];
        if (item.type !== 'component' || !item.partType) return pins;
        
        const ox = item.x || 0;
        const oy = item.y || 0;
        const getPin = (dx: number, dy: number, role: string, pinIndex: number, name?: string, domain: 'digital' | 'analog' = 'digital') => 
            ({ pos: { x: ox + dx, y: oy + dy }, role, gateId: item.id, pinIndex, name: name || String(pinIndex + 1), domain });

        const customDef = useEngigraphStore.getState().customComponentDefs[item.partType];
        if (customDef && customDef.pins) {
            customDef.pins.forEach((p: any, i: number) => {
                // Determine role from type (input/power -> in, output/ground -> out) loosely
                const role = (p.type === 'output' || p.type === 'ground' || p.type === 'out') ? 'out' : 'in';
                pins.push(getPin(p.x, p.y, role, i, p.name, 'digital'));
            });
            return pins;
        }

        switch(item.partType) {
            case 'gate_and':
            case 'gate_or':
            case 'gate_xor':
                pins.push(getPin(-15, -5, 'in', 0, undefined, 'digital'), getPin(-15, 5, 'in', 1, undefined, 'digital'), getPin(15, 0, 'out', 2, undefined, 'digital'));
                break;
            case 'gate_not':
                pins.push(getPin(-15, 0, 'in', 0, undefined, 'digital'), getPin(15, 0, 'out', 1, undefined, 'digital'));
                break;
            case 'gate_hadamard':
            case 'gate_pauli_x':
            case 'gate_measure':
                pins.push(getPin(-20, 0, 'in', 0, 'Q', 'digital'), getPin(20, 0, 'out', 1, 'Q\'', 'digital'));
                break;
            case 'gate_cnot':
                pins.push(getPin(-30, -12, 'in', 0, 'Ctrl', 'digital'), getPin(-30, 12, 'in', 1, 'Targ', 'digital'), getPin(30, -12, 'out', 2, 'Ctrl\'', 'digital'), getPin(30, 12, 'out', 3, 'Targ\'', 'digital'));
                break;
            case 'switch_spst':
                pins.push(getPin(-15, 0, 'in', 0, '1', 'analog'), getPin(15, 0, 'out', 1, '2', 'analog'));
                break;
            case 'led_red':
            case 'led_blue':
                pins.push(getPin(-15, 0, 'in', 0, '1', 'analog'), getPin(15, 0, 'out', 1, '2', 'analog'));
                break;
            case 'resistor':
                pins.push(getPin(-15, 0, 'in', 0, '1', 'analog'), getPin(15, 0, 'out', 1, '2', 'analog'));
                break;
            case 'battery_18650':
                pins.push(getPin(0, -15, 'out', 0, 'pos', 'analog'), getPin(0, 15, 'out', 1, 'neg', 'analog'));
                break;
            case 'arduino_uno':
            case 'esp32':
            case 'rpi_pico':
                pins.push(getPin(-20, -10, 'in', 0, 'D2', 'digital'));
                pins.push(getPin(-20, 0, 'in', 1, 'D3', 'digital'));
                pins.push(getPin(-20, 10, 'in', 2, 'D4', 'digital'));
                pins.push(getPin(20, -10, 'out', 3, 'D5', 'digital'));
                pins.push(getPin(20, 0, 'out', 4, 'D6', 'digital'));
                pins.push(getPin(20, 10, 'out', 5, 'D7', 'digital'));
                break;
            case 'via':
                // A via acts as a single point connection, but we expose an 'in' and 'out' exactly at the same center
                // to allow signals to route through it. 
                pins.push(getPin(0, 0, 'in', 0, 'top', 'digital'));
                pins.push(getPin(0, 0, 'out', 1, 'bottom', 'digital'));
                break;
        }
        return pins;
    }

    static mapDigitalGate(item: DrawingObject): Gate | null {
        let kind: GateKind | null = null;
        let inputs = 1;

        if (item.partType && useEngigraphStore.getState().customComponentDefs[item.partType]) {
            // Treat AI components as OR gates conceptually so the solver passes data through,
            // the custom logic layer will handle the real evaluation.
            kind = 'OR';
            inputs = useEngigraphStore.getState().customComponentDefs[item.partType].pins.length;
        } else {
            switch(item.partType) {
            case 'gate_and': kind = 'AND'; inputs = 2; break;
            case 'gate_or': kind = 'OR'; inputs = 2; break;
            case 'gate_xor': kind = 'XOR'; inputs = 2; break;
            case 'gate_not': kind = 'NOT'; inputs = 1; break;
            case 'gate_hadamard': kind = 'Q_HADAMARD'; inputs = 1; break;
            case 'gate_pauli_x': kind = 'Q_PAULI_X'; inputs = 1; break;
            case 'gate_cnot': kind = 'Q_CNOT'; inputs = 2; break;
            case 'gate_measure': kind = 'Q_MEASURE'; inputs = 1; break;
            case 'arduino_uno': 
            case 'esp32': 
            case 'rpi_pico': 
            case 'via':
                kind = 'OR'; inputs = 3; break; // Map as OR gate to trick the solver into passing state.
            }
        }

        if (!kind) return null;

        return { id: item.id, kind, x: item.x || 0, y: item.y || 0, inputs, on: false };
    }

    static mapAnalogNode(item: DrawingObject): RawNode | null {
        if (item.isBurnedOut) return null; // Burned out components act as open circuits

        let templateId: string | null = null;
        let values: Record<string, string> = {};

        switch(item.partType) {
            case 'resistor': templateId = 'resistor'; values = { resistance: '1k' }; break;
            case 'battery_18650': templateId = 'battery'; values = { voltage: '3.7V' }; break;
            case 'switch_spst': templateId = 'switch'; break;
            case 'led_red': templateId = 'led-red'; values = { Vf: '2.0V' }; break;
            case 'led_blue': templateId = 'led-blue'; values = { Vf: '3.0V' }; break;
        }

        if (!templateId) return null;

        return {
            id: item.id,
            position: { x: item.x || 0, y: item.y || 0 },
            data: {
                templateId,
                values,
                state: { closed: item.state === 'closed' }
            }
        };
    }

    static getProject(elements: DrawingObject[]): HybridProject {
        const project: HybridProject = {
            digital: { gates: {}, wires: {} },
            analog: { nodes: [], edges: [] },
            crossovers: []
        };
        
        const pins: Pin[] = [];

        // 1. Map Components
        elements.forEach(el => {
            if (el.type === 'component') {
                const dGate = this.mapDigitalGate(el);
                if (dGate) project.digital.gates[dGate.id] = dGate;
                
                const aNode = this.mapAnalogNode(el);
                if (aNode) project.analog.nodes.push(aNode);

                pins.push(...this.getPins(el));
            }
        });

        // 2. Map Wires via spatial endpoints
        let wireCounter = 0;
        elements.forEach(el => {
            if (el.type === 'wire' && el.points && el.points.length >= 4) {
                const pStart = { x: el.points[0], y: el.points[1] };
                const pEnd = { x: el.points[el.points.length - 2], y: el.points[el.points.length - 1] };

                const startPin = pins.find(p => this.getDistance(p.pos, pStart) < 15);
                const endPin = pins.find(p => this.getDistance(p.pos, pEnd) < 15);

                if (startPin && endPin && startPin.gateId !== endPin.gateId) {
                    const wId = el.id;
                    const isStrictCrossover = startPin.domain !== endPin.domain;

                    if (isStrictCrossover) {
                        const aPin = startPin.domain === 'analog' ? startPin : endPin;
                        const dPin = startPin.domain === 'digital' ? startPin : endPin;

                        if (dPin.role === 'in') {
                            project.crossovers.push({
                                sourceDomain: 'analog',
                                sourceId: `${aPin.gateId}/${aPin.name}`,
                                targetDomain: 'digital',
                                targetId: `${dPin.gateId}:${dPin.pinIndex}`,
                                wireId: wId
                            });
                        } else {
                            project.crossovers.push({
                                sourceDomain: 'digital',
                                sourceId: `${dPin.gateId}:${dPin.pinIndex}`,
                                targetDomain: 'analog',
                                targetId: `${aPin.gateId}:${aPin.name}`,
                                wireId: wId
                            });
                        }
                    } else {
                        // NATIVE CONNECTIONS
                        if (startPin.domain === 'digital') {
                            let fromPin = startPin;
                            let toPin = endPin;
                            if (startPin.role === 'in' && endPin.role === 'out') {
                                fromPin = endPin;
                                toPin = startPin;
                            }
                            if (fromPin.role === 'out' && toPin.role === 'in') {
                                project.digital.wires[wId] = {
                                    id: wId,
                                    from: { gateId: fromPin.gateId, pinIndex: fromPin.pinIndex },
                                    to: { gateId: toPin.gateId, pinIndex: toPin.pinIndex }
                                };
                            }
                        } else {
                            project.analog.edges.push({
                                id: wId,
                                source: startPin.gateId,
                                sourceHandle: startPin.name,
                                target: endPin.gateId,
                                targetHandle: endPin.name
                            });
                        }
                    }
                }
            }
        });

        return project;
    }

    static tick(elements: DrawingObject[]): DrawingObject[] {
        const project = this.getProject(elements);
        const result = HybridSimEngine.tick(project, this.hybridState);

        const store = useEngigraphStore.getState();

        // Custom MCU Execution Layer
        const mcuOverrides = new Map<string, boolean>();
        elements.forEach(el => {
            if (el.mcuCode) {
                try {
                    const inputs: Record<string, boolean> = {};
                    const outputs: Record<string, boolean> = {};
                    
                    // Pre-populate input states based on connected wires
                    const pins = this.getPins(el);
                    pins.forEach(pin => {
                        if (pin.role === 'in') {
                            const val = result.digitalResult.pinValues?.get(`${el.id}:${pin.pinIndex}`);
                            inputs[pin.name || `pin${pin.pinIndex}`] = (val === 1);
                        }
                    });
                    
                    const sandbox = new Function('inputs', 'outputs', el.mcuCode);
                    sandbox(inputs, outputs);
                    
                    // Force inject the output into the solver's state so connected wires pick it up next tick
                    // For now, we will just visually power the MCU if any output is true.
                    const hasOutput = Object.values(outputs).some(val => val === true);
                    if (hasOutput) {
                        mcuOverrides.set(el.id, true);
                    }
                } catch(e) {
                    // Silent catch for sandbox errors
                }
            }
        });

        // Pre-pass for CFD (Active Cooling)
        const activeFans = elements.filter(e => e.partType === 'fan' && e.isPowered);

        // Pre-pass for Signal Integrity / Crosstalk (Phase 14)
        const wireInterference = new Map<string, number>();
        const wiresOnly = elements.filter(el => el.type === 'wire');
        for (let i = 0; i < wiresOnly.length; i++) {
            const w1 = wiresOnly[i];
            for (let j = i + 1; j < wiresOnly.length; j++) {
                const w2 = wiresOnly[j];
                const b1 = this.getWireBounds(w1);
                const b2 = this.getWireBounds(w2);
                
                // Expanded bounds for crosstalk (approx 40px radius for high-frequency interference)
                const expandedB2 = { minX: b2.minX - 40, maxX: b2.maxX + 40, minY: b2.minY - 40, maxY: b2.maxY + 40 };
                
                if (this.boundsIntersect(b1, expandedB2)) {
                    // Induce crosstalk if either wire is actively powered (simulating high dB/dt switching noise)
                    if (w1.isPowered || w2.isPowered) {
                        wireInterference.set(w1.id, (wireInterference.get(w1.id) || 0) + 1);
                        wireInterference.set(w2.id, (wireInterference.get(w2.id) || 0) + 1);
                    }
                }
            }
            
            // Pre-pass for PDN (Phase 15): Voltage Drop Calculation
            if (w1.isPowered) {
                const len = this.getWireLength(w1.points || []);
                w1.voltageDrop = len * 0.002; // 0.002V drop per pixel (high resistance simulation)
            } else {
                w1.voltageDrop = 0;
            }
        }

        // Update Visual States
        let stateChanged = false;
        const nextElements = elements.map(el => {
            let isPowered = false;
            let probeValue = 0;

            if (el.type === 'component') {
                // Phase 21: MCU Code Execution
                if (el.mcuCode && ['arduino_uno', 'esp32', 'rpi_pico'].includes(el.partType || '')) {
                    try {
                        // Very simple sandbox evaluation for the MCU
                        // Expecting a loop(inputs, outputs) function in mcuCode
                        // We extract just the body of the loop or evaluate it if it's raw logic
                        // Let's pass inputs/outputs objects
                        const inputs: Record<string, boolean> = {};
                        const outputs: Record<string, boolean> = {};
                        
                        // Populate inputs from connected wires (mocking D2 as true if any connected wire is powered)
                        // This is a naive heuristic for demonstration:
                        inputs['D2'] = false; 
                        inputs['D3'] = false;
                        
                        // Extract just the inner logic from void loop() if it exists
                        let executableCode = el.mcuCode;
                        const loopMatch = el.mcuCode.match(/void loop\s*\([^)]*\)\s*\{([\s\S]*)\}/);
                        if (loopMatch) {
                            executableCode = loopMatch[1];
                        }

                        // Run it!
                        const fn = new Function('inputs', 'outputs', executableCode);
                        fn(inputs, outputs);

                        // If D5 is high, we'll power the MCU object (this will light up wires connected to it)
                        if (outputs['D5']) {
                            isPowered = true;
                        }
                    } catch (err) {
                        console.error("MCU Code Error:", err);
                    }
                } else if (result.analogResult && result.analogResult.converged && project.analog.nodes.find(n => n.id === el.id)) {
                     const br = result.analogResult.branchResults.find(b => b.componentId === el.id);
                     if (br) {
                         isPowered = br.isActive;
                     }
                     // Analog rough estimation
                     probeValue = isPowered ? (el.partType === 'battery_18650' ? 3.7 : 2.5) : 0;
                } 
                else if (project.digital.gates[el.id]) {
                    if (mcuOverrides.has(el.id)) {
                        isPowered = mcuOverrides.get(el.id)!;
                        probeValue = isPowered ? 5.0 : 0.0;
                    } else {
                        const gate = project.digital.gates[el.id];
                        const outIndex = gate.inputs; 
                        const val = result.digitalResult.pinValues.get(`${el.id}:${outIndex}`);
                        isPowered = (val === 1);
                        probeValue = isPowered ? 5.0 : 0.0;
                    }
                }
                
                // Track probe data in store
                store.pushProbeData(el.id, probeValue);
            }

            // For mechatronics (Physics Sandbox)
            let newAngle = el.currentAngle;
            let newIsColliding = false;
            let armLength = el.armLength || 60; // Default arm length for motors

            if (isPowered && (el.partType === 'dc_motor_generic' || el.partType === 'nema17' || el.partType === 'servo') && !el.isBurnedOut) {
                let intendedAngle = ((el.currentAngle || 0) + (el.speed || 5)) % 360;
                
                // Calculate arm tip position
                const rad = intendedAngle * (Math.PI / 180);
                const tipX = (el.x || 0) + Math.cos(rad) * armLength;
                const tipY = (el.y || 0) + Math.sin(rad) * armLength;

                // Simple point-in-rect collision against ALL canvas rects and components (except self)
                let collisionDetected = false;
                for (const rigid of elements) {
                    if (rigid.id === el.id) continue;
                    
                    let bounds = { x1: 0, y1: 0, x2: 0, y2: 0 };
                    
                    if (rigid.type === 'rect') {
                        bounds = { 
                            x1: rigid.x || 0, y1: rigid.y || 0, 
                            x2: (rigid.x || 0) + (rigid.width || 0), y2: (rigid.y || 0) + (rigid.height || 0) 
                        };
                    } else if (rigid.type === 'component') {
                        // Rough 40x40 bounding box for generic components
                        bounds = {
                            x1: (rigid.x || 0) - 20, y1: (rigid.y || 0) - 20,
                            x2: (rigid.x || 0) + 20, y2: (rigid.y || 0) + 20
                        };
                    }

                    if (bounds.x1 !== bounds.x2 && tipX >= bounds.x1 && tipX <= bounds.x2 && tipY >= bounds.y1 && tipY <= bounds.y2) {
                        collisionDetected = true;
                        break;
                    }
                }

                if (collisionDetected) {
                    newIsColliding = true;
                    // Rotation is blocked! Do not update angle.
                } else {
                    newAngle = intendedAngle;
                    newIsColliding = false;
                }
            }

            // Signal Integrity & Crosstalk
            let newIsCorrupted = el.isCorrupted || false;
            let newCrosstalk = el.crosstalkInterference || 0;

            // Wire dynamic coloring
            if (el.type === 'wire') {
                newCrosstalk = wireInterference.get(el.id) || 0;
                newIsCorrupted = newCrosstalk > 1; // Threshold for corruption

                if (project.digital.wires[el.id]) {
                    const wire = project.digital.wires[el.id];
                    const val = result.digitalResult.pinValues?.get(`${wire.from.gateId}:${wire.from.pinIndex}`);
                    isPowered = (val === 1);
                    
                    // Logic solver propagation of corrupted signal (stochastic bit flips)
                    if (newIsCorrupted && isPowered && Math.random() > 0.8) {
                        isPowered = false; // Corrupted signal drops out
                    }
                } else if (project.analog.edges.find(e => e.id === el.id)) {
                    // If it's an analog wire, see if any connected component is active
                    const edge = project.analog.edges.find(e => e.id === el.id);
                    if (edge) {
                        const br1 = result.analogResult?.branchResults.find(b => b.componentId === edge.source);
                        const br2 = result.analogResult?.branchResults.find(b => b.componentId === edge.target);
                        isPowered = !!((br1 && br1.isActive) || (br2 && br2.isActive));
                        
                        if (newIsCorrupted && isPowered && Math.random() > 0.8) {
                            isPowered = false;
                        }
                    }
                }
                
                // Oscilloscope (Phase 16)
                if (useEngigraphStore.getState().probedWireId === el.id) {
                    // Send 5V or 0V representation, add noise if corrupted
                    let voltage = isPowered ? 5 : 0;
                    if (newIsCorrupted) {
                        voltage += (Math.random() - 0.5) * 2.0; // Random noise ±1V
                    }
                    useEngigraphStore.getState().pushProbeData(el.id, voltage);
                }
            }

            // Thermal Simulation (P = I^2 R approx) & CFD Airflow
            let newTemp = el.temperature || 20; // Ambient 20C
            let newBurnedOut = el.isBurnedOut || false;

            if (el.type === 'component' && !newBurnedOut && el.partType !== 'battery_18650' && el.partType !== 'fan') {
                // Calculate spatial cooling from nearby active fans
                let fanCooling = 1; // base ambient cooling rate
                for (const fan of activeFans) {
                    const dx = (el.x || 0) - (fan.x || 0);
                    const dy = (el.y || 0) - (fan.y || 0);
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist > 0 && dist < 400) {
                        // Phase 19: Directional Airflow CFD
                        // Fan pushes air in the direction of its currentAngle (default 0 -> Right)
                        const rad = ((fan.currentAngle || 0) * Math.PI) / 180;
                        const fanVecX = Math.cos(rad);
                        const fanVecY = Math.sin(rad);
                        
                        // Normalize vector to element
                        const elVecX = dx / dist;
                        const elVecY = dy / dist;
                        
                        // Dot product to find alignment (1 = perfectly downwind, -1 = upwind)
                        const dot = fanVecX * elVecX + fanVecY * elVecY;
                        
                        // Only cool if component is downwind (dot > 0.5 is a 60 degree cone)
                        if (dot > 0.5) {
                            // The more aligned (dot near 1), the stronger the airflow
                            fanCooling += ((400 - dist) / 40) * dot;
                        }
                    }
                }

                if (isPowered) {
                    // Simulate heat rising, offset by fan cooling
                    const heatGen = (Math.random() * 5 + 2);
                    newTemp = Math.min(150, newTemp + heatGen - (fanCooling * 0.5)); 
                    newTemp = Math.max(20, newTemp); // Can't cool below ambient
                } else {
                    // Cooling down to ambient rapidly if fan is on
                    newTemp = Math.max(20, newTemp - fanCooling);
                }

                if (newTemp >= 100) {
                    newBurnedOut = true;
                    useEngigraphStore.getState().pushTerminalLog(`[THERMAL ALERT] Component ${el.id} has exceeded 100°C and burned out!`, 'system');
                }
            }

            // Phase 20: Component Aging & Thermodynamics
            let newOperationalHours = el.operationalHours || 0;
            let newWearLevel = el.wearLevel || 0;
            const mtbfRating = el.mtbfRating || 10000; // default 10k hours MTBF

            if (el.type === 'component' && isPowered && !newBurnedOut) {
                // tick is every 100ms. Let's say 1 second real-time = 1 hour simulated time for visual feedback
                // so 0.1 hours per tick.
                newOperationalHours += 0.1;
                
                // Arrhenius Equation simplified: higher temp exponentially accelerates wear
                // base temp = 25C. 
                const tempFactor = Math.max(1, Math.exp((newTemp - 25) / 20));
                
                // wear level increases based on MTBF and temp factor
                const wearIncrement = (0.1 / mtbfRating) * tempFactor;
                newWearLevel = Math.min(1.0, newWearLevel + wearIncrement);

                // If wear reaches 1.0, or random catastrophic failure based on high wear
                if (newWearLevel >= 1.0 || (newWearLevel > 0.8 && Math.random() < 0.001)) {
                    newBurnedOut = true;
                    useEngigraphStore.getState().pushTerminalLog(`[MAINTENANCE] Component ${el.id} failed due to age/wear (MTBF exceeded).`, 'system');
                }
            }

            // Power Delivery Network (Phase 15)
            let newIsPowerStarved = el.isPowerStarved || false;
            
            if (el.type === 'component' && isPowered) {
                const pins = this.getPins(el);
                let worstDrop = 0;
                pins.forEach(p => {
                    wiresOnly.forEach(w => {
                        if (w.isPowered && w.points && w.points.length >= 2) {
                            const lastX = w.points[w.points.length-2];
                            const lastY = w.points[w.points.length-1];
                            const dist = this.getDistance(p.pos, {x: lastX, y: lastY});
                            if (dist < 15) {
                                worstDrop = Math.max(worstDrop, w.voltageDrop || 0);
                            }
                        }
                    });
                });
                
                // If drop is > 0.5V (arriving at < 4.5V on a 5V system), the component starves
                newIsPowerStarved = worstDrop > 0.5;
                
                // Brownout simulation: Power starved components fail randomly
                if (newIsPowerStarved && Math.random() > 0.5) {
                    isPowered = false;
                }
            }

            if (el.isPowered !== isPowered || el.currentAngle !== newAngle || el.temperature !== newTemp || el.isBurnedOut !== newBurnedOut || el.isColliding !== newIsColliding || el.isCorrupted !== newIsCorrupted || el.crosstalkInterference !== newCrosstalk || el.isPowerStarved !== newIsPowerStarved || el.voltageDrop !== (el.type==='wire' ? el.voltageDrop : 0) || el.operationalHours !== newOperationalHours || el.wearLevel !== newWearLevel) {
                stateChanged = true;
                return { ...el, isPowered, currentAngle: newAngle, temperature: newTemp, isBurnedOut: newBurnedOut, isColliding: newIsColliding, isCorrupted: newIsCorrupted, crosstalkInterference: newCrosstalk, isPowerStarved: newIsPowerStarved, voltageDrop: el.type === 'wire' ? el.voltageDrop : 0, operationalHours: newOperationalHours, wearLevel: newWearLevel };
            }
            return el;
        });

        // Background Design Rule Check (DRC)
        let drcFails = 0;
        const wires = nextElements.filter(el => el.type === 'wire');
        for (let i = 0; i < wires.length; i++) {
            for (let j = i + 1; j < wires.length; j++) {
                const w1 = wires[i];
                const w2 = wires[j];
                // Only care if they are on the same layer
                if ((w1.boardLayer || 'top') === (w2.boardLayer || 'top')) {
                    // Quick bounding box check first
                    const w1Bounds = this.getWireBounds(w1);
                    const w2Bounds = this.getWireBounds(w2);
                    if (this.boundsIntersect(w1Bounds, w2Bounds)) {
                        drcFails++;
                    }
                }
            }
        }
        
        if (drcFails > 0) {
            // Note: In a real app we'd debounce this log, but this is a proof of concept.
            if (Math.random() < 0.01) { // 1% chance per tick to prevent log spam
                store.pushTerminalLog(`[DRC WARNING] Detected ${drcFails} potential wire intersections on the same layer. Use Vias!`, 'user');
            }
        }

        return stateChanged ? nextElements : elements;
    }

    private static getWireBounds(wire: DrawingObject) {
        if (!wire.points || wire.points.length < 2) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (let i = 0; i < wire.points.length; i += 2) {
            minX = Math.min(minX, wire.points[i]);
            maxX = Math.max(maxX, wire.points[i]);
            minY = Math.min(minY, wire.points[i+1]);
            maxY = Math.max(maxY, wire.points[i+1]);
        }
        return { minX, maxX, minY, maxY };
    }

    private static boundsIntersect(a: any, b: any) {
        return (a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY);
    }
}
