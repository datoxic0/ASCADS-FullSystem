import { Circuit, SimulationResult } from './types';
import { simulate, createSimState, SimState } from './simulator';
import { buildNetlist, solveDC, RawNode, RawEdge, SimEngineResult } from './analog-sim-engine';

export interface CrossoverConnection {
    sourceDomain: 'analog' | 'digital';
    sourceId: string; // for analog: 'gateId/pinName' (net name), for digital: 'gateId:pinIndex'
    targetDomain: 'analog' | 'digital';
    targetId: string; // for analog: 'gateId:pinName' (where to inject), for digital: 'gateId:pinIndex' (where to inject)
    wireId: string;
}

export interface HybridProject {
    digital: Circuit;
    analog: {
        nodes: RawNode[];
        edges: RawEdge[];
    };
    crossovers: CrossoverConnection[];
}

export interface HybridSimState {
    digitalState: SimState;
    crossoverMemory: {
        analogToDigital: Map<string, number>; // netName -> voltage
        digitalToAnalog: Map<string, number>; // gateId:pin -> logic level
    };
}

export interface HybridSimResult {
    digitalResult: SimulationResult;
    analogResult: SimEngineResult | null;
}

export function createHybridSimState(): HybridSimState {
    return {
        digitalState: createSimState(),
        crossoverMemory: {
            analogToDigital: new Map(),
            digitalToAnalog: new Map()
        }
    };
}

export class HybridSimEngine {
    
    /**
     * Executes one tick of the hybrid mechatronics engine.
     * Guarantees crossover propagation between Analog and Digital topologies.
     */
    static tick(project: HybridProject, state: HybridSimState): HybridSimResult {
        // 1. Pre-process crossovers: Inject virtual components into Digital and Analog circuits
        const modifiedCircuit: Circuit = {
            gates: { ...project.digital.gates },
            wires: { ...project.digital.wires }
        };
        
        const modifiedAnalogNodes: RawNode[] = [...project.analog.nodes];
        const modifiedAnalogEdges: RawEdge[] = [...project.analog.edges];

        const analogToDigitalRequests: string[] = [];
        const digitalToAnalogRequests: string[] = [];

        project.crossovers.forEach(cross => {
            if (cross.sourceDomain === 'analog' && cross.targetDomain === 'digital') {
                // Analog driving Digital
                const vGateId = `v_in_${cross.wireId}`;
                const prevVolts = state.crossoverMemory.analogToDigital.get(cross.sourceId) || 0;
                
                // Inject virtual INPUT gate
                modifiedCircuit.gates[vGateId] = {
                    id: vGateId,
                    kind: 'INPUT',
                    x: 0, y: 0,
                    inputs: 1,
                    on: prevVolts > 2.5
                };
                
                // Inject virtual wire
                const targetParts = cross.targetId.split(':');
                modifiedCircuit.wires[cross.wireId] = {
                    id: cross.wireId,
                    from: { gateId: vGateId, pinIndex: 0 },
                    to: { gateId: targetParts[0], pinIndex: parseInt(targetParts[1], 10) }
                };

                analogToDigitalRequests.push(cross.sourceId);

            } else if (cross.sourceDomain === 'digital' && cross.targetDomain === 'analog') {
                // Digital driving Analog
                const vNodeId = `v_src_${cross.wireId}`;
                const prevState = state.crossoverMemory.digitalToAnalog.get(cross.sourceId) || 0;
                
                // Inject virtual voltage source
                modifiedAnalogNodes.push({
                    id: vNodeId,
                    position: { x: 0, y: 0 },
                    data: { templateId: 'vcc', values: { voltage: prevState === 1 ? '5V' : '0V' } }
                });
                
                // Inject virtual edge
                const targetParts = cross.targetId.split(':');
                modifiedAnalogEdges.push({
                    id: cross.wireId,
                    source: vNodeId,
                    sourceHandle: '1',
                    target: targetParts[0],
                    targetHandle: targetParts[1]
                });

                digitalToAnalogRequests.push(cross.sourceId);
            }
        });

        // Ensure analog circuit has a ground reference for MNA to work if it's floating
        if (modifiedAnalogNodes.length > 0 && !modifiedAnalogNodes.find(n => n.data?.templateId === 'ground')) {
            const batt = modifiedAnalogNodes.find(n => n.data?.templateId === 'battery');
            if (batt) {
                modifiedAnalogNodes.push({ id: 'virtual_gnd', position: {x:0, y:0}, data: { templateId: 'ground' } });
                modifiedAnalogEdges.push({ id: 'v_gnd_wire', source: batt.id, sourceHandle: 'neg', target: 'virtual_gnd', targetHandle: 'gnd' });
            } else {
                modifiedAnalogNodes.push({ id: 'virtual_gnd', position: {x:0, y:0}, data: { templateId: 'ground' } });
                if (modifiedAnalogEdges.length > 0) {
                    modifiedAnalogEdges.push({ id: 'v_gnd_wire', source: modifiedAnalogEdges[0].source, sourceHandle: modifiedAnalogEdges[0].sourceHandle, target: 'virtual_gnd', targetHandle: 'gnd' });
                }
            }
        }

        // 2. Simulate Digital
        const digitalResult = simulate(modifiedCircuit, {}, state.digitalState);

        // 3. Simulate Analog
        let analogResult: SimEngineResult | null = null;
        let edgeToNet: Record<string, string> = {};
        
        if (modifiedAnalogNodes.length > 0) {
            const netlist = buildNetlist(modifiedAnalogNodes, modifiedAnalogEdges);
            edgeToNet = netlist.edgeToNet;
            analogResult = solveDC(netlist);
        }

        // 4. Update Crossover Memory for the next tick
        analogToDigitalRequests.forEach(req => {
            if (analogResult && analogResult.converged) {
                const nv = analogResult.nodeVoltages.find(n => n.nodeId.includes(req) || Object.keys(edgeToNet).find(k => edgeToNet[k] === n.nodeId));
                if (nv) {
                    state.crossoverMemory.analogToDigital.set(req, nv.voltage);
                } else {
                    const net = analogResult.nodeVoltages.find(n => n.nodeId === edgeToNet[req] || n.nodeId === req);
                    if (net) state.crossoverMemory.analogToDigital.set(req, net.voltage);
                }
            }
        });

        digitalToAnalogRequests.forEach(req => {
            const val = digitalResult.pinValues.get(req);
            state.crossoverMemory.digitalToAnalog.set(req, val === 1 ? 1 : 0);
        });

        return {
            digitalResult,
            analogResult
        };
    }
}
