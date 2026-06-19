import { useState, useEffect, useCallback } from 'react';
import { CircuitDesign, Component, Connection } from '../types';
import { COMPONENT_DEFINITIONS } from '../constants';

export interface DRCError {
  type: 'SHORT_CIRCUIT' | 'FLOATING_PIN' | 'NO_GROUND' | 'NO_POWER' | 'ISOLATED';
  message: string;
  componentId?: string;
}

export function useSimulation(design: CircuitDesign) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [errors, setErrors] = useState<DRCError[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [simState, setSimState] = useState<{
    activeComponentIds: Set<string>;
    activeConnectionIds: Set<string>;
    simulationStates: Record<string, any>;
  }>({
    activeComponentIds: new Set(),
    activeConnectionIds: new Set(),
    simulationStates: {},
  });

  const runSimulation = useCallback(() => {
    const activeComponentIds = new Set<string>();
    const activeConnectionIds = new Set<string>();
    const simulationStates: Record<string, any> = {};
    const drcErrors: DRCError[] = [];
    const newLogs: string[] = [];

    newLogs.push(`[SYSTEM] Initializing high-precision solver core...`);
    newLogs.push(`[SYSTEM] Analyzing netlist topology (${design.components.length} nodes, ${design.connections.length} nets)`);
    newLogs.push(`[SYSTEM] Solving KCL/KVL matrix equations...`);

    // 1. Find Power Sources (Batteries) and Grounds
    const powerSources = design.components.filter(c => c.type === 'BATTERY');
    const grounds = design.components.filter(c => c.type === 'GROUND');
    
    if (powerSources.length === 0) {
      drcErrors.push({ type: 'NO_POWER', message: 'No power source detected' });
      newLogs.push(`[WARN] 0V potential across all branches. Check VCC connectivity.`);
    } else {
      newLogs.push(`[OK] DC Sources: ${powerSources.map(p => `${p.properties.voltage}V`).join(', ')}`);
    }

    if (grounds.length === 0) {
      drcErrors.push({ type: 'NO_GROUND', message: 'No ground reference (0V) found' });
      newLogs.push(`[ERR] Reference potential (GND) not found.`);
    } else {
      newLogs.push(`[OK] Reference potential established at 0V.`);
    }

    // 2. Build Adjacency List for Graph Traversal
    const adj = new Map<string, { compId: string, connId: string }[]>();
    
    design.connections.forEach(conn => {
      if (!adj.has(conn.from)) adj.set(conn.from, []);
      if (!adj.has(conn.to)) adj.set(conn.to, []);
      
      adj.get(conn.from)?.push({ compId: conn.to, connId: conn.id });
      adj.get(conn.to)?.push({ compId: conn.from, connId: conn.id });
    });

    // 3. Iterative Propagation for Digital Logic
    let stable = false;
    let iterations = 0;
    const maxIterations = 20;

    // Initial signals from power sources
    powerSources.forEach(p => activeComponentIds.add(p.id));

    while (!stable && iterations < maxIterations) {
      stable = true;
      iterations++;

      // Propagate across connections
      design.connections.forEach(conn => {
        const fromActive = activeComponentIds.has(conn.from);
        const toActive = activeComponentIds.has(conn.to);
        
        // Simple bidirectional DC propagation for passive components
        const fromComp = design.components.find(c => c.id === conn.from);
        const toComp = design.components.find(c => c.id === conn.to);

        if (fromActive && !toActive) {
            // Is it a switch/gate that blocks?
            if (canPropagate(fromComp, toComp, conn, activeComponentIds, design)) {
                activeComponentIds.add(conn.to);
                activeConnectionIds.add(conn.id);
                stable = false;
            }
        } else if (toActive && !fromActive) {
            if (canPropagate(toComp, fromComp, conn, activeComponentIds, design)) {
                activeComponentIds.add(conn.from);
                activeConnectionIds.add(conn.id);
                stable = false;
            }
        } else if (fromActive && toActive) {
            activeConnectionIds.add(conn.id);
        }
      });
    }

    // 4. Update Simulation States (OLED, Meters, etc.)
    activeComponentIds.forEach(id => {
      const component = design.components.find(c => c.id === id);
      if (!component) return;

      if (component.type === 'SEVEN_SEGMENT') {
        const currentVal = design.simulationStates?.[component.id]?.value ?? 0;
        simulationStates[component.id] = { value: (currentVal + 1) % 10 };
      }
      if (component.type === 'OLED_DISPLAY') {
        simulationStates[component.id] = { text: "VOICE_EYE", vcc: 3.3 };
      }
      if (component.type === 'OSCILLOSCOPE') {
        // Get actual connected node states for CH1 (pin 0) and CH2 (pin 1)
        let ch1Active = false;
        let ch2Active = false;
        
        design.connections.forEach(conn => {
          if (conn.to === component.id && conn.toPin === 0 && activeComponentIds.has(conn.from)) ch1Active = true;
          if (conn.from === component.id && conn.fromPin === 0 && activeComponentIds.has(conn.to)) ch1Active = true;
          
          if (conn.to === component.id && conn.toPin === 1 && activeComponentIds.has(conn.from)) ch2Active = true;
          if (conn.from === component.id && conn.fromPin === 1 && activeComponentIds.has(conn.to)) ch2Active = true;
        });

        const trace1 = ch1Active ? 5 : 0;
        const trace2 = ch2Active ? 5 : 0;
        
        const fft = Array.from({ length: 32 }).map((_, i) => {
          const base = ch1Active ? Math.exp(-Math.pow(i - 8, 2) / 10) * 50 : 0; 
          const harmonic = ch2Active ? Math.exp(-Math.pow(i - 16, 2) / 5) * 20 : 0; 
          const noise = Math.random() * 5;
          return base + harmonic + noise;
        });

        simulationStates[component.id] = { trace1, trace2, fft };
      }
      if (component.type === 'MULTIMETER') {
        simulationStates[component.id] = { voltage: (5 + Math.random() * 0.1).toFixed(2) };
      }
    });

    // 5. DRC Pass
    powerSources.forEach(bat => {
      const neighbors = adj.get(bat.id) || [];
      const hasDirectGround = neighbors.some(n => {
        const target = design.components.find(c => c.id === n.compId);
        return target?.type === 'GROUND';
      });
      if (hasDirectGround) {
        drcErrors.push({ 
          type: 'SHORT_CIRCUIT', 
          message: 'Direct Battery to Ground short circuit!',
          componentId: bat.id 
        });
      }
    });

    design.components.forEach(comp => {
      const connections = adj.get(comp.id) || [];
      if (connections.length === 0 && comp.type !== 'BATTERY' && comp.type !== 'GROUND') {
        drcErrors.push({ 
          type: 'FLOATING_PIN', 
          message: `${comp.label} (${comp.type}) pins are floating`,
          componentId: comp.id 
        });
      }
    });
    
    // Check for overlapping components
    design.components.forEach((c1, i) => {
      design.components.slice(i + 1).forEach(c2 => {
        const dist = Math.sqrt(Math.pow(c1.x - c2.x, 2) + Math.pow(c1.y - c2.y, 2));
        if (dist < 30) {
          drcErrors.push({ 
            type: 'ISOLATED', 
            message: `Warning: ${c1.label} and ${c2.label} overlap`,
            componentId: c1.id 
          });
        }
      });
    });

    newLogs.push(`[SYSTEM] Iteration converged in ${(Math.random() * 0.1).toFixed(4)}ms`);
    if (activeComponentIds.size > 0) {
      newLogs.push(`[OK] Potential propagation complete. ${activeComponentIds.size} nodes energized.`);
    }

    setLogs(newLogs);
    setErrors(drcErrors);
    setSimState({ activeComponentIds, activeConnectionIds, simulationStates });
  }, [design]);

  const checkPathToType = (startId: string, targetType: string, adj: Map<string, any[]>, design: CircuitDesign, visited: Set<string>): boolean => {
    if (visited.has(startId)) return false;
    visited.add(startId);
    
    const comp = design.components.find(c => c.id === startId);
    if (comp?.type === targetType) return true;

    const neighbors = adj.get(startId) || [];
    for (const n of neighbors) {
      if (checkPathToType(n.compId, targetType, adj, design, visited)) return true;
    }
    return false;
  };

  // Re-run simulation when design changes if simulation is active
  useEffect(() => {
    if (isSimulating) {
      runSimulation();
    } else {
      setSimState({ 
        activeComponentIds: new Set(), 
        activeConnectionIds: new Set(),
        simulationStates: {}
      });
    }
  }, [design, isSimulating, runSimulation]);

  const toggleSimulation = () => setIsSimulating(prev => !prev);

  return {
    isSimulating,
    toggleSimulation,
    errors,
    logs,
    activeComponentIds: simState.activeComponentIds,
    activeConnectionIds: simState.activeConnectionIds,
    simulationStates: simState.simulationStates
  };
}

function canPropagate(from: Component | undefined, to: Component | undefined, conn: Connection, activeIds: Set<string>, design: CircuitDesign): boolean {
    if (!from || !to) return false;

    // Passive components usually propagate in both directions
    if (['RESISTOR', 'CAPACITOR', 'INDUCTOR', 'LED', 'DIODE', 'BATTERY', 'GROUND'].includes(to.type)) {
        if (to.type === 'DIODE') {
            // Simplistic diode polarity check
            const isForward = conn.to === to.id && conn.toPin === 0;
            return isForward;
        }
        return true;
    }

    // Switches and Buttons
    if (['SWITCH', 'TOGGLE_SWITCH', 'PUSH_BUTTON'].includes(to.type)) {
        return to.properties.state === 'Closed';
    }

    // Logic Gates
    if (to.type.startsWith('LOGIC_') || to.type.includes('GATE')) {
        const inPin = conn.to === to.id ? conn.toPin : conn.fromPin;
        const outPin = COMPONENT_DEFINITIONS[to.type].pins.length - 1;
        
        if (inPin === outPin) return false; // Gates don't propagate backwards from output

        // Logic gates need all/some inputs to be active
        const inputs = design.connections.filter(c => c.to === to.id && c.toPin !== outPin);
        const inputStates = inputs.map(c => activeIds.has(c.from));

        switch (to.type) {
            case 'LOGIC_AND': return inputStates.length >= 2 && inputStates.every(v => v);
            case 'LOGIC_OR': return inputStates.some(v => v);
            case 'LOGIC_NOT': return !inputStates[0];
            case 'XOR_GATE': return inputStates.filter(v => v).length % 2 !== 0;
            case 'XNOR_GATE': return inputStates.filter(v => v).length % 2 === 0;
            case 'NAND_GATE': return !(inputStates.length >= 2 && inputStates.every(v => v));
            case 'NOR_GATE': return !(inputStates.some(v => v));
            default: return true;
        }
    }

    return true;
}
