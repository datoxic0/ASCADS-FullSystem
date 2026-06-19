/**
 * Logic Lab simulator.
 *
 * The simulator runs in three phases per call:
 *   1. Seed source pins (INPUT, CLOCK, CONST*, PULL*) and emit Q/Q̄/counter
 *      bits from cached gate memory.
 *   2. Iterate combinational propagation until pin values stabilise (capped
 *      to MAX_ITERATIONS to detect oscillation).
 *   3. Detect rising-edge events on stateful gates by comparing the freshly
 *      settled pin values to the previous-call snapshot, update memory, then
 *      re-run combinational propagation.
 *
 * Memory and previous-pin snapshots live outside the Circuit so they survive
 * across React renders without polluting the saved data model.
 */

import {
  CLOCK_PIN_INDEX,
  evaluateGate,
  isCombinational,
  isStateful,
  pinsFor,
} from "./component-defs";
import type {
  Circuit,
  Gate,
  GateMemory,
  Signal,
  SimState,
  SimulationResult,
} from "./types";

const MAX_ITERATIONS = 200;

export function createSimState(): SimState {
  return { memory: new Map(), prevPinValues: new Map() };
}

export function clearSimState(state: SimState): void {
  state.memory.clear();
  state.prevPinValues.clear();
}

function outputPinIndices(g: Gate): number[] {
  const indices: number[] = [];
  pinsFor(g).forEach((p, i) => {
    if (p.type === "out") indices.push(i);
  });
  return indices;
}

function inputPinIndices(g: Gate): number[] {
  const indices: number[] = [];
  pinsFor(g).forEach((p, i) => {
    if (p.type === "in") indices.push(i);
  });
  return indices;
}

/** Seed source-only outputs that don't depend on any input. */
function seedSources(
  pinValues: Map<string, Signal>,
  gates: Gate[],
  clockState: Record<string, boolean>,
): void {
  for (const g of gates) {
    const outs = outputPinIndices(g);
    if (outs.length === 0) continue;
    const out0 = `${g.id}:${outs[0]}`;
    switch (g.kind) {
      case "INPUT":
        pinValues.set(out0, g.on ? 1 : 0);
        break;
      case "CLOCK":
        pinValues.set(out0, clockState[g.id] ? 1 : 0);
        break;
      case "CONST0":
      case "PULLDOWN":
        pinValues.set(out0, 0);
        break;
      case "CONST1":
      case "PULLUP":
        pinValues.set(out0, 1);
        break;
      case "BUTTON":
        pinValues.set(out0, g.on ? 1 : 0);
        break;
      default:
        // not a source
        break;
    }
  }
}

/** Emit current Q / Q̄ / counter bits from memory onto stateful gate output pins. */
function emitStatefulOutputs(
  pinValues: Map<string, Signal>,
  gates: Gate[],
  state: SimState,
): void {
  for (const g of gates) {
    if (!isStateful(g.kind)) continue;
    const outs = outputPinIndices(g);
    const mem = state.memory.get(g.id);
    switch (g.kind) {
      case "SRLATCH":
      case "DLATCH":
      case "DFF":
      case "TFF":
      case "JKFF": {
        const q: Signal = mem?.q ?? "X";
        const qbar: Signal = q === "X" ? "X" : q === 1 ? 0 : 1;
        if (outs[0] !== undefined) pinValues.set(`${g.id}:${outs[0]}`, q);
        if (outs[1] !== undefined) pinValues.set(`${g.id}:${outs[1]}`, qbar);
        break;
      }
      case "COUNTER4": {
        const c = mem?.count ?? 0;
        for (let i = 0; i < 4; i++) {
          if (outs[i] === undefined) continue;
          const bit = (c >> i) & 1;
          pinValues.set(`${g.id}:${outs[i]}`, bit ? 1 : 0);
        }
        break;
      }
      case "SHIFT8":
      case "RAM8": {
        const val = g.kind === "SHIFT8" ? (mem?.shift ?? 0) : (mem?.count ?? 0);
        for (let i = 0; i < 8; i++) {
          if (outs[i] === undefined) continue;
          const bit = (val >> i) & 1;
          pinValues.set(`${g.id}:${outs[i]}`, bit ? 1 : 0);
        }
        break;
      }
    }
  }
}

/** Iterate combinational propagation until pin values converge. */
function combinationalLoop(
  circuit: Circuit,
  pinValues: Map<string, Signal>,
  wireValues: Map<string, Signal>,
): { stable: boolean; iterations: number } {
  const gates = Object.values(circuit.gates);
  const wires = Object.values(circuit.wires);

  let stable = false;
  let iterations = 0;

  while (!stable && iterations < MAX_ITERATIONS) {
    stable = true;
    iterations++;

    // Propagate wires: source output → target input
    for (const w of wires) {
      const sourceKey = `${w.from.gateId}:${w.from.pinIndex}`;
      const targetKey = `${w.to.gateId}:${w.to.pinIndex}`;
      const source = pinValues.get(sourceKey) ?? "X";
      wireValues.set(w.id, source);
      const old = pinValues.get(targetKey) ?? "X";
      if (old !== source) {
        pinValues.set(targetKey, source);
        stable = false;
      }
    }

    // Recompute outputs of combinational gates
    for (const g of gates) {
      if (!isCombinational(g.kind)) continue;
      const ins = inputPinIndices(g);
      const outs = outputPinIndices(g);
      const inputs: Signal[] = ins.map(
        (i) => pinValues.get(`${g.id}:${i}`) ?? "X",
      );
      const newOutputs = evaluateGate(g.kind, inputs);
      for (let k = 0; k < outs.length; k++) {
        const key = `${g.id}:${outs[k]}`;
        const next = newOutputs[k] ?? "X";
        if (pinValues.get(key) !== next) {
          pinValues.set(key, next);
          stable = false;
        }
      }
    }
  }

  return { stable, iterations };
}

/** Update stateful gate memory in response to new pin values. */
function applyStatefulUpdates(
  gates: Gate[],
  pinValues: Map<string, Signal>,
  prevPinValues: Map<string, Signal>,
  state: SimState,
): boolean {
  let memChanged = false;

  const ensureMem = (id: string): GateMemory => {
    let m = state.memory.get(id);
    if (!m) {
      m = {};
      state.memory.set(id, m);
    }
    return m;
  };

  for (const g of gates) {
    if (!isStateful(g.kind)) continue;
    const ins = inputPinIndices(g);
    const sigAt = (idx: number) => pinValues.get(`${g.id}:${ins[idx]}`) ?? "X";

    if (g.kind === "SRLATCH") {
      const s = sigAt(0);
      const r = sigAt(1);
      const mem = ensureMem(g.id);
      let next = mem.q;
      if (s === 1 && r === 0) next = 1;
      else if (s === 0 && r === 1) next = 0;
      // S=R=1 is undefined; treat as hold (avoids races in the simulator)
      // S=R=0: hold
      if (next !== undefined && next !== mem.q) {
        mem.q = next;
        memChanged = true;
      } else if (mem.q === undefined && next !== undefined) {
        mem.q = next;
        memChanged = true;
      }
      continue;
    }

    if (g.kind === "DLATCH") {
      const d = sigAt(0);
      const en = sigAt(1);
      if (en === 1 && (d === 0 || d === 1)) {
        const mem = ensureMem(g.id);
        if (mem.q !== d) {
          mem.q = d;
          memChanged = true;
        }
      }
      continue;
    }

    // Edge-triggered devices share rising-edge detection on a designated CLK pin.
    const clkPinIndex = CLOCK_PIN_INDEX[g.kind];
    if (clkPinIndex === undefined) continue;
    const clkKey = `${g.id}:${clkPinIndex}`;
    const newClk = pinValues.get(clkKey) ?? "X";
    const oldClk = prevPinValues.get(clkKey);
    const rising = oldClk !== undefined && oldClk !== 1 && newClk === 1;
    if (!rising) continue;

    if (g.kind === "DFF") {
      const d = sigAt(0);
      if (d === 0 || d === 1) {
        const mem = ensureMem(g.id);
        if (mem.q !== d) {
          mem.q = d;
          memChanged = true;
        }
      }
    } else if (g.kind === "TFF") {
      const t = sigAt(0);
      if (t === 1) {
        const mem = ensureMem(g.id);
        const cur = mem.q ?? 0;
        mem.q = cur === 1 ? 0 : 1;
        memChanged = true;
      }
    } else if (g.kind === "JKFF") {
      const j = sigAt(0);
      const k = sigAt(1);
      if (j !== "X" && k !== "X") {
        const mem = ensureMem(g.id);
        const cur = mem.q ?? 0;
        let next: 0 | 1 = cur;
        if (j === 0 && k === 0) next = cur;
        else if (j === 0 && k === 1) next = 0;
        else if (j === 1 && k === 0) next = 1;
        else if (j === 1 && k === 1) next = cur === 1 ? 0 : 1;
        if (mem.q !== next) {
          mem.q = next;
          memChanged = true;
        }
      }
    } else if (g.kind === "COUNTER4") {
      const reset = sigAt(1);
      const mem = ensureMem(g.id);
      const cur = mem.count ?? 0;
      const next = reset === 1 ? 0 : (cur + 1) & 0xf;
      if (mem.count !== next) {
        mem.count = next;
        memChanged = true;
      }
    } else if (g.kind === "SHIFT8") {
      const reset = sigAt(2);
      const mem = ensureMem(g.id);
      if (reset === 1) {
        if (mem.shift !== 0) { mem.shift = 0; memChanged = true; }
      } else {
        const d = sigAt(0);
        if (d === 0 || d === 1) {
          const next = (((mem.shift ?? 0) << 1) | d) & 0xff;
          if (mem.shift !== next) { mem.shift = next; memChanged = true; }
        }
      }
    } else if (g.kind === "RAM8") {
      // RAM8 inputs: D (0), A0 (1), A1 (2), A2 (3), WE (4), CLK (5)
      const d = sigAt(0);
      const a0 = sigAt(1); const a1 = sigAt(2); const a2 = sigAt(3);
      const we = sigAt(4);
      if (a0 !== "X" && a1 !== "X" && a2 !== "X") {
        const addr = (a2 as number) * 4 + (a1 as number) * 2 + (a0 as number);
        const mem = ensureMem(g.id);
        if (!mem.ram) mem.ram = Array(8).fill(0);
        if (we === 1 && (d === 0 || d === 1)) {
          // write
          if (mem.ram[addr] !== d) {
            mem.ram[addr] = d;
            // if we are reading the same addr, output changes next cycle
          }
        }
        // synchronous read
        if (mem.count !== mem.ram[addr]) {
          mem.count = mem.ram[addr]; // use count as the output buffer
          memChanged = true;
        }
      }
    }
  }

  // Handle continuous cylinder states (not edge-triggered)
  for (const g of gates) {
    if (g.kind === "CYLINDER_SA") {
      const p = pinValues.get(`${g.id}:0`) ?? 0;
      const mem = ensureMem(g.id);
      const ext = mem.extension ?? 0;
      const next = p === 1 ? Math.min(1, ext + 0.1) : Math.max(0, ext - 0.1);
      if (Math.abs(ext - next) > 0.01) { mem.extension = next; memChanged = true; }
    } else if (g.kind === "CYLINDER_DA") {
      const a = pinValues.get(`${g.id}:0`) ?? 0;
      const b = pinValues.get(`${g.id}:1`) ?? 0;
      const mem = ensureMem(g.id);
      const ext = mem.extension ?? 0;
      let next = ext;
      if (a === 1 && b === 0) next = Math.min(1, ext + 0.1);
      else if (b === 1 && a === 0) next = Math.max(0, ext - 0.1);
      if (Math.abs(ext - next) > 0.01) { mem.extension = next; memChanged = true; }
    }
  }

  return memChanged;
}

/** Initialise stateful memory if missing so first frame produces clean values. */
function ensureStatefulInitial(gates: Gate[], state: SimState): void {
  for (const g of gates) {
    if (!isStateful(g.kind)) continue;
    if (state.memory.has(g.id)) continue;
    if (g.kind === "COUNTER4") {
      state.memory.set(g.id, { count: 0 });
    } else if (g.kind === "SHIFT8") {
      state.memory.set(g.id, { shift: 0 });
    } else if (g.kind === "RAM8") {
      state.memory.set(g.id, { ram: Array(8).fill(0), count: 0 });
    } else if (g.kind === "CYLINDER_SA" || g.kind === "CYLINDER_DA") {
      state.memory.set(g.id, { extension: 0 });
    } else {
      state.memory.set(g.id, { q: 0 });
    }
  }
}

export function simulate(
  circuit: Circuit,
  clockState: Record<string, boolean>,
  state: SimState,
): SimulationResult {
  const pinValues = new Map<string, Signal>();
  const wireValues = new Map<string, Signal>();
  const gates = Object.values(circuit.gates);

  // 1. Initialise every pin to "X"
  for (const g of gates) {
    const pins = pinsFor(g);
    for (let i = 0; i < pins.length; i++) {
      pinValues.set(`${g.id}:${i}`, "X");
    }
  }

  ensureStatefulInitial(gates, state);

  // 2. Seed sources & stateful outputs
  seedSources(pinValues, gates, clockState);
  emitStatefulOutputs(pinValues, gates, state);

  // 3. First combinational pass
  let { stable, iterations } = combinationalLoop(circuit, pinValues, wireValues);

  // 4. Apply stateful updates against the previous-call pin snapshot
  const memChanged = applyStatefulUpdates(
    gates,
    pinValues,
    state.prevPinValues,
    state,
  );

  // 5. If memory changed, re-emit and run combinational again so visible pin
  //    values reflect the new Q immediately.
  if (memChanged) {
    emitStatefulOutputs(pinValues, gates, state);
    const second = combinationalLoop(circuit, pinValues, wireValues);
    iterations += second.iterations;
    stable = stable && second.stable;
  }

  // 6. Save snapshot for next-call edge detection
  state.prevPinValues = new Map(pinValues);

  return { pinValues, wireValues, iterations, oscillating: !stable };
}

export function signalColor(s: Signal | undefined): string {
  if (s === 1) return "var(--color-signal-high)";
  if (s === 0) return "var(--color-signal-low)";
  return "var(--color-signal-unknown)";
}
