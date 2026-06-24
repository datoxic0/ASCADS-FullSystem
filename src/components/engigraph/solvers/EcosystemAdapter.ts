import { DrawingObject } from '../store/useEngigraphStore';
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

    static getPins(item: DrawingObject): Pin[] {
        const pins: Pin[] = [];
        if (item.type !== 'component' || !item.partType) return pins;
        
        const ox = item.x || 0;
        const oy = item.y || 0;
        const getPin = (dx: number, dy: number, role: string, pinIndex: number, name?: string, domain: 'digital' | 'analog' = 'digital') => 
            ({ pos: { x: ox + dx, y: oy + dy }, role, gateId: item.id, pinIndex, name: name || String(pinIndex + 1), domain });

        switch(item.partType) {
            case 'gate_and':
            case 'gate_or':
            case 'gate_xor':
                pins.push(getPin(-15, -5, 'in', 0, undefined, 'digital'), getPin(-15, 5, 'in', 1, undefined, 'digital'), getPin(15, 0, 'out', 2, undefined, 'digital'));
                break;
            case 'gate_not':
                pins.push(getPin(-15, 0, 'in', 0, undefined, 'digital'), getPin(15, 0, 'out', 1, undefined, 'digital'));
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
        }
        return pins;
    }

    static mapDigitalGate(item: DrawingObject): Gate | null {
        let kind: GateKind | null = null;
        let inputs = 1;

        switch(item.partType) {
            case 'gate_and': kind = 'AND'; inputs = 2; break;
            case 'gate_or': kind = 'OR'; inputs = 2; break;
            case 'gate_xor': kind = 'XOR'; inputs = 2; break;
            case 'gate_not': kind = 'NOT'; inputs = 1; break;
        }

        if (!kind) return null;

        return { id: item.id, kind, x: item.x || 0, y: item.y || 0, inputs, on: false };
    }

    static mapAnalogNode(item: DrawingObject): RawNode | null {
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
                    const wId = `w-${wireCounter++}`;
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

        // Update Visual States
        let stateChanged = false;
        const nextElements = elements.map(el => {
            let isPowered = false;

            if (el.type === 'component') {
                if (result.analogResult && result.analogResult.converged && project.analog.nodes.find(n => n.id === el.id)) {
                     const br = result.analogResult.branchResults.find(b => b.componentId === el.id);
                     if (br) {
                         isPowered = br.isActive;
                     }
                } 
                else if (project.digital.gates[el.id]) {
                    const gate = project.digital.gates[el.id];
                    const outIndex = gate.inputs; 
                    const val = result.digitalResult.pinValues.get(`${el.id}:${outIndex}`);
                    isPowered = (val === 1);
                }
            }

            // For mechatronics
            let newAngle = el.currentAngle;
            if (isPowered && (el.partType === 'dc_motor_generic' || el.partType === 'nema17')) {
                newAngle = ((el.currentAngle || 0) + (el.speed || 5)) % 360;
            }

            if (el.isPowered !== isPowered || el.currentAngle !== newAngle) {
                stateChanged = true;
                return { ...el, isPowered, currentAngle: newAngle };
            }
            return el;
        });

        return stateChanged ? nextElements : elements;
    }
}
