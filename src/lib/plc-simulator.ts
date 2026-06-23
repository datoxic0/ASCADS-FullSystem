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
    // Support drawing wires backwards (from left side to target's right side)
    const incomingWires = state.wires.filter(w => 
      (w.toId === node.id && w.toSide === 'left') || 
      (w.fromId === node.id && w.fromSide === 'left')
    );
    
    let hasExplicitPower = false;
    if (incomingWires.length > 0) {
      for (const wire of incomingWires) {
        const sourceId = wire.toId === node.id ? wire.fromId : wire.toId;
        const fromNode = state.nodes.find(n => n.id === sourceId);
        if (fromNode) {
          // Check if power conducts out of the fromNode's output side
          if (getPowerRight(fromNode, nextVisited)) {
            hasExplicitPower = true;
            break;
          }
        }
      }
    }

    // 3. Accumulate series rung continuity (implicit)
    // Even if explicit wires exist, horizontal adjacency on the same rung acts as parallel source
    let hasRungPower = false;
    const myRungIdx = getRungIndex(node);
    const rungNodes = state.nodes.filter(n => getRungIndex(n) === myRungIdx);
    rungNodes.sort((a, b) => a.x - b.x);
    const myIdx = rungNodes.findIndex(n => n.id === node.id);
    
    if (myIdx === 0) {
      // If it is the first node on this rung horizontally, it implicitly receives power from the left rail!
      hasRungPower = true;
    } else if (myIdx > 0) {
      const leftNeighbor = rungNodes[myIdx - 1];
      // Neighbor must transmit power from its right side
      if (getPowerRight(leftNeighbor, nextVisited)) {
        hasRungPower = true;
      }
    }

    const hasPower = hasExplicitPower || hasRungPower;
    memoLeft.set(node.id, hasPower);
    return hasPower;
  };

  // Determine if power conducts OUT of the right side of a node
  const getPowerRight = (node: LadderNode, visited = new Set<string>()): boolean => {
    if (memoRight.has(node.id)) return memoRight.get(node.id)!;
    if (visited.has(node.id)) return false;

    // If power does not even arrive at the left side, it cannot conduct out
    const hasInput = getPowerLeft(node, visited);
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
    } else if (type.startsWith('compare-')) {
      const a = getValue(node.params?.sourceA);
      const b = getValue(node.params?.sourceB);
      if (type === 'compare-eq') conducts = a === b;
      else if (type === 'compare-ne') conducts = a !== b;
      else if (type === 'compare-lt') conducts = a < b;
      else if (type === 'compare-gt') conducts = a > b;
      else if (type === 'compare-le') conducts = a <= b;
      else if (type === 'compare-ge') conducts = a >= b;
      else conducts = true;
    } else if (type === 'limit-test') {
      const testVal = getValue(node.params?.testVal);
      const lowLimit = getValue(node.params?.lowLimit);
      const highLimit = getValue(node.params?.highLimit);
      if (lowLimit <= highLimit) {
        conducts = testVal >= lowLimit && testVal <= highLimit;
      } else {
        conducts = testVal >= lowLimit || testVal <= highLimit;
      }
    } else if (type.startsWith('math-') || type === 'reset') {
      conducts = true; // pass through input power to allow visual continuity/cascading
    } else if (type === 'pid-controller' || type === 'scale-param' || type === 'alarm-block') {
      conducts = true; // pass through
    } else {
      conducts = true;
    }

    memoRight.set(node.id, conducts);
    return conducts;
  };

  // Helper to fetch register values for math & comparative elements
  const getValue = (valOrAddr: any): number => {
    if (typeof valOrAddr === 'number') return valOrAddr;
    if (typeof valOrAddr === 'string' && !isNaN(Number(valOrAddr))) return Number(valOrAddr);
    if (typeof valOrAddr === 'string') {
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
    n.type.startsWith('math') ||
    n.type === 'pid-controller' ||
    n.type === 'scale-param' ||
    n.type === 'limit-test' ||
    n.type === 'alarm-block'
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
      const baseMult = output.params?.timeBase === 'ms' ? 1 : 1000;
      const preset = (output.params?.preset || 0) * baseMult;
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
      values[dnKey] = accum >= preset;
      values[output.address] = values[dnKey]; // main target reflects state
    } else if (output.type === 'timer-off') {
      const baseMult = output.params?.timeBase === 'ms' ? 1 : 1000;
      const preset = (output.params?.preset || 0) * baseMult;
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
      values[dnKey] = isPathEnergized || accum < preset;
      values[output.address] = values[dnKey];
    } else if (output.type === 'retentive-timer') {
      const baseMult = output.params?.timeBase === 'ms' ? 1 : 1000;
      const preset = (output.params?.preset || 0) * baseMult;
      const accumKey = `${output.address}_ACC`;
      const dnKey = `${output.address}_DN`;
      let accum = Number(values[accumKey]) || 0;

      if (isPathEnergized && accum < preset) {
        accum += 100;
      }

      values[accumKey] = accum;
      values[dnKey] = accum >= preset;
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
      else if (output.type === 'compare-le') result = a <= b;
      else if (output.type === 'compare-ge') result = a >= b;
      
      values[output.address] = isPathEnergized && result;
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
        else if (output.type === 'math-abs') result = Math.abs(a);
        else if (output.type === 'math-sqrt') result = Math.sqrt(Math.abs(a));
        else if (output.type === 'math-sin') result = Math.sin(a * (Math.PI / 180)); // Assume deg input
        else if (output.type === 'math-cos') result = Math.cos(a * (Math.PI / 180));
        else if (output.type === 'math-tan') result = Math.tan(a * (Math.PI / 180));
        else if (output.type === 'math-mod') result = b !== 0 ? a % b : 0;
        
        values[dest] = result;
      }
    } else if (output.type === 'scale-param') {
      if (isPathEnergized) {
        const inputVal = getValue(output.params?.sourceA);
        const inMin = getValue(output.params?.inMin);
        const inMax = getValue(output.params?.inMax);
        const outMin = getValue(output.params?.outMin);
        const outMax = getValue(output.params?.outMax);
        const dest = output.params?.dest || output.address;
        
        // Linear scaling: y = mx + c
        if (inMax !== inMin) {
          const scaled = outMin + ((inputVal - inMin) / (inMax - inMin)) * (outMax - outMin);
          values[dest] = scaled;
        } else {
          values[dest] = outMin;
        }
      }
    } else if (output.type === 'limit-test') {
      const testVal = getValue(output.params?.testVal);
      const lowLimit = getValue(output.params?.lowLimit);
      const highLimit = getValue(output.params?.highLimit);
      
      let inLimit = false;
      if (lowLimit <= highLimit) {
        inLimit = testVal >= lowLimit && testVal <= highLimit;
      } else {
        // Circular/wrapping limit (e.g., angle 350 to 10)
        inLimit = testVal >= lowLimit || testVal <= highLimit;
      }
      
      values[output.address] = isPathEnergized && inLimit;
    } else if (output.type === 'alarm-block') {
      const testVal = getValue(output.params?.testVal);
      const highLimit = getValue(output.params?.highLimit);
      
      // Basic high alarm
      const alarmTriggered = testVal >= highLimit;
      values[output.address] = isPathEnergized && alarmTriggered;
    } else if (output.type === 'pid-controller') {
      if (isPathEnergized) {
        const kp = output.params?.kp || 0;
        const ki = output.params?.ki || 0;
        const kd = output.params?.kd || 0;
        const sp = getValue(output.params?.sp);
        const pv = getValue(output.params?.pv);
        const cvDest = output.params?.cv || output.address;

        const error = sp - pv;
        
        // Simplified PID for 100ms fixed scan cycle (0.1 sec)
        const dt = 0.1; 
        
        const lastErrorKey = `${output.address}_lastErr`;
        const integralKey = `${output.address}_integral`;
        
        const lastError = Number(values[lastErrorKey]) || 0;
        let integral = Number(values[integralKey]) || 0;
        
        integral += error * dt;
        const derivative = (error - lastError) / dt;
        
        let cv = (kp * error) + (ki * integral) + (kd * derivative);
        
        // Clamp CV between 0 and 100% (typical)
        cv = Math.max(0, Math.min(100, cv));
        
        // Anti-windup
        if (cv === 0 || cv === 100) {
          integral -= error * dt;
        }

        values[lastErrorKey] = error;
        values[integralKey] = integral;
        values[cvDest] = cv;
      } else {
        // Reset integral on rung power loss
        values[`${output.address}_integral`] = 0;
        values[output.params?.cv || output.address] = 0;
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
