import { LadderNode, LadderState, LEFT_RAIL_X, GRID_SIZE } from '@/lib/plc-types';

/**
 * High-Fidelity Nodal Graph-Based PLC Logic Solver
 * Operates exact nodal analysis to route signal flow, supporting
 * arbitrary wire-inking, branch routes, cross-rung configurations,
 * and standard traditional rungs seamless fallbacks.
 */
export function solveCircuit(state: LadderState): Record<string, boolean | number> {
  const values = { ...state.simulation.values };
  
  // Memoization maps for nodal evaluation to avoid redundant calculations and loops
  const memoLeft = new Map<string, boolean>();
  const memoRight = new Map<string, boolean>();

  // Unified helper to locate which rung index (0-based) a node vertical position belongs to
  const getRungIndex = (n: LadderNode) => Math.round((n.y + n.height / 2 - 48) / 96);

  // Determine if power flows into the LEFT side call of a node
  const getPowerLeft = (node: LadderNode, visited = new Set<string>()): boolean => {
    if (memoLeft.has(node.id)) return memoLeft.get(node.id)!;
    if (visited.has(node.id)) return false;

    const nextVisited = new Set(visited);
    nextVisited.add(node.id);

    // 1. Left Rail direct check: if it is at the left boundary of schematic
    if (node.x <= LEFT_RAIL_X + GRID_SIZE) {
      memoLeft.set(node.id, true);
      return true;
    }

    // 2. Scan explicit manual wires leading to this node's LEFT side
    const incomingWires = state.wires.filter(w => w.toId === node.id && w.toSide === 'left');
    if (incomingWires.length > 0) {
      for (const wire of incomingWires) {
        const fromNode = state.nodes.find(n => n.id === wire.fromId);
        if (fromNode) {
          // Check if power conducts out of the fromNode's output side
          if (getPowerRight(fromNode, nextVisited)) {
            memoLeft.set(node.id, true);
            return true;
          }
        }
      }
      // If explicit wire linkages are present but none conduct, left is unenergized
      memoLeft.set(node.id, false);
      return false;
    }

    // 3. Fallback: series rung continuity if no explicit wiring is present on its left side
    const myRungIdx = getRungIndex(node);
    const rungNodes = state.nodes.filter(n => getRungIndex(n) === myRungIdx);
    rungNodes.sort((a, b) => a.x - b.x);
    const myIdx = rungNodes.findIndex(n => n.id === node.id);
    if (myIdx === 0) {
      // If it is the first node on this rung horizontally, it implicitly receives power from the left rail!
      memoLeft.set(node.id, true);
      return true;
    } else if (myIdx > 0) {
      const leftNeighbor = rungNodes[myIdx - 1];
      // Neighbor must transmit power from its right side
      if (getPowerRight(leftNeighbor, nextVisited)) {
        memoLeft.set(node.id, true);
        return true;
      }
    }

    memoLeft.set(node.id, false);
    return false;
  };

  // Determine if power conducts OUT of the right side of a node
  const getPowerRight = (node: LadderNode, visited = new Set<string>()): boolean => {
    if (memoRight.has(node.id)) return memoRight.get(node.id)!;
    if (visited.has(node.id)) return false;

    const nextVisited = new Set(visited);
    nextVisited.add(node.id);

    // If power does not even arrive at the left side, it cannot conduct out
    const hasInput = getPowerLeft(node, nextVisited);
    if (!hasInput) {
      memoRight.set(node.id, false);
      return false;
    }

    let conducts = false;
    const type = node.type;

    if (type === 'contact-no') {
      conducts = Boolean(values[node.address]);
    } else if (type === 'contact-nc') {
      conducts = !Boolean(values[node.address]);
    } else if (type === 'wire-junction' || type === 'branch-start' || type === 'branch-end' || type === 'wire-vertical') {
      conducts = true; // conductors pass power unconditionally
    } else if (type === 'one-shot') {
      conducts = Boolean(values[node.address]);
    } else if (type === 'coil' || type === 'coil-latch' || type === 'coil-unlatch') {
      conducts = true; // pass-through conducts power when input is energized
    } else if (type.startsWith('timer-') || type === 'retentive-timer') {
      conducts = true; // pass through input power to allow visual continuity/cascading
    } else if (type.startsWith('counter-')) {
      conducts = true; // pass through input power to allow visual continuity/cascading
    } else if (type.startsWith('compare-') || type.startsWith('math-') || type === 'reset') {
      conducts = true; // pass through input power to allow visual continuity/cascading
    } else {
      conducts = true;
    }

    memoRight.set(node.id, conducts);
    return conducts;
  };

  // Helper to fetch register values for math & comparative elements
  const getValue = (valOrAddr: string | number | undefined): number => {
    if (valOrAddr === undefined) return 0;
    if (typeof valOrAddr === 'number') return valOrAddr;
    if (values[valOrAddr] !== undefined) return Number(values[valOrAddr]);
    
    // Address check for preset or accum values
    if (typeof valOrAddr === 'string' && valOrAddr.includes('_')) {
      return Number(values[valOrAddr]) || 0;
    }
    return 0;
  };

  // Gather and sort all outputs/timed blocks in standard PLC execution order: top-to-bottom, left-to-right
  const outputs = state.nodes.filter(n => 
    n.type === 'coil' || 
    n.type === 'coil-latch' ||
    n.type === 'coil-unlatch' ||
    n.type === 'one-shot' ||
    n.type === 'timer-on' || 
    n.type === 'timer-off' ||
    n.type === 'retentive-timer' ||
    n.type === 'counter-up' || 
    n.type === 'counter-down' ||
    n.type === 'reset' ||
    n.type.startsWith('compare') ||
    n.type.startsWith('math')
  );
  outputs.sort((a, b) => {
    const rungA = getRungIndex(a);
    const rungB = getRungIndex(b);
    if (rungA !== rungB) return rungA - rungB;
    return a.x - b.x;
  });

  // Evaluate each output logic sequentially
  for (const output of outputs) {
    const isPathEnergized = getPowerLeft(output, new Set());

    if (output.type === 'coil') {
      values[output.address] = isPathEnergized;
    } else if (output.type === 'coil-latch') {
      if (isPathEnergized) values[output.address] = true;
    } else if (output.type === 'coil-unlatch') {
      if (isPathEnergized) values[output.address] = false;
    } else if (output.type === 'one-shot') {
      const lastStateKey = `${output.address}_ONS_LAST`;
      const lastState = Boolean(values[lastStateKey]);
      const result = isPathEnergized && !lastState;
      values[lastStateKey] = isPathEnergized;
      values[output.address] = result;
    } else if (output.type === 'timer-on') {
      const preset = (output.params?.preset || 0) * 1000;
      const accumKey = `${output.address}_ACC`;
      const dnKey = `${output.address}_DN`;
      let accum = Number(values[accumKey]) || 0;

      if (isPathEnergized) {
        if (accum < preset) {
          accum += 100; // 100ms tick accumulation
        }
      } else {
        accum = 0; 
      }
      
      values[accumKey] = accum;
      values[dnKey] = preset > 0 && accum >= preset;
      values[output.address] = values[dnKey]; // main target reflects state
    } else if (output.type === 'timer-off') {
      const preset = (output.params?.preset || 0) * 1000;
      const accumKey = `${output.address}_ACC`;
      const dnKey = `${output.address}_DN`;
      let accum = Number(values[accumKey]) || 0;

      if (!isPathEnergized) {
        if (accum < preset) {
          accum += 100;
        }
      } else {
        accum = 0;
      }

      values[accumKey] = accum;
      values[dnKey] = isPathEnergized || (preset > 0 && accum < preset);
      values[output.address] = values[dnKey];
    } else if (output.type === 'retentive-timer') {
      const preset = (output.params?.preset || 0) * 1000;
      const accumKey = `${output.address}_ACC`;
      const dnKey = `${output.address}_DN`;
      let accum = Number(values[accumKey]) || 0;

      if (isPathEnergized && accum < preset) {
        accum += 100;
      }

      values[accumKey] = accum;
      values[dnKey] = preset > 0 && accum >= preset;
      values[output.address] = values[dnKey];
    } else if (output.type === 'counter-up') {
      const preset = output.params?.preset || 0;
      const accumKey = `${output.address}_ACC`;
      const cuKey = `${output.address}_CU`;
      const dnKey = `${output.address}_DN`;
      const lastInKey = `${output.address}_LAST_IN`;
      
      let accum = Number(values[accumKey]) || 0;
      const lastIn = Boolean(values[lastInKey]);

      if (isPathEnergized && !lastIn) {
        accum += 1;
      }

      values[accumKey] = accum;
      values[cuKey] = isPathEnergized;
      values[dnKey] = accum >= preset;
      values[lastInKey] = isPathEnergized;
      values[output.address] = values[dnKey];
    } else if (output.type === 'counter-down') {
      const preset = output.params?.preset || 0;
      const accumKey = `${output.address}_ACC`;
      const cdKey = `${output.address}_CD`;
      const dnKey = `${output.address}_DN`;
      const lastInKey = `${output.address}_LAST_IN`;
      
      let accum = Number(values[accumKey]) || 0;
      const lastIn = Boolean(values[lastInKey]);

      if (isPathEnergized && !lastIn) {
        accum -= 1;
      }

      values[accumKey] = accum;
      values[cdKey] = isPathEnergized;
      values[dnKey] = accum >= preset;
      values[lastInKey] = isPathEnergized;
      values[output.address] = values[dnKey];
    } else if (output.type === 'reset') {
      if (isPathEnergized) {
        const resetTarget = output.address; // Mapped directly
        values[`${resetTarget}_ACC`] = 0;
        values[`${resetTarget}_DN`] = false;
        values[resetTarget] = false;
      }
    } else if (output.type.startsWith('compare-')) {
      const a = getValue(output.params?.sourceA);
      const b = getValue(output.params?.sourceB);
      let result = false;
      
      if (output.type === 'compare-eq') result = a === b;
      else if (output.type === 'compare-ne') result = a !== b;
      else if (output.type === 'compare-lt') result = a < b;
      else if (output.type === 'compare-gt') result = a > b;
      
      values[output.address] = result;
    } else if (output.type.startsWith('math-')) {
      if (isPathEnergized) {
        const a = getValue(output.params?.sourceA);
        const b = getValue(output.params?.sourceB);
        const dest = output.params?.dest || output.address;
        let result = 0;
        
        if (output.type === 'math-add') result = a + b;
        else if (output.type === 'math-sub') result = a - b;
        else if (output.type === 'math-mul') result = a * b;
        else if (output.type === 'math-div') result = b !== 0 ? a / b : 0;
        else if (output.type === 'math-mov') result = a;
        
        values[dest] = result;
      }
    }
  }

  // Clear memoizations to run a fresh final sweep matching new register values
  memoLeft.clear();
  memoRight.clear();

  // Populate absolute final input/output power variables into `values` map and return
  state.nodes.forEach(node => {
    const pIn = getPowerLeft(node, new Set());
    const pOut = getPowerRight(node, new Set());
    values[`__pin_${node.id}`] = pIn;
    values[`__pout_${node.id}`] = pOut;
  });

  // Apply Forces globally if enabled
  if (state.simulation.forcesEnabled && state.simulation.forces) {
    Object.entries(state.simulation.forces).forEach(([addr, val]) => {
      values[addr] = val;
    });
  }

  return values;
}
