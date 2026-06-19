/**
 * Truth-table analyzer.
 *
 * Given a circuit, find every INPUT (toggle) and OUTPUT (LED) gate, then
 * exhaustively try every combination of input values, run the simulator
 * to convergence, and record the resulting outputs. Capped at 8 inputs
 * (256 rows) to stay snappy in the UI.
 */

import { simulate, createSimState } from "./simulator";
import type { Circuit, Signal } from "./types";

export type TruthTableResult = {
  inputs: { id: string; label: string }[];
  outputs: { id: string; label: string }[];
  rows: { inputs: number[]; outputs: Signal[]; oscillating: boolean }[];
  truncated: boolean;
};

const MAX_INPUTS = 8;
const SETTLE_PASSES = 4;

export function analyzeTruthTable(circuit: Circuit): TruthTableResult {
  const allInputs = Object.values(circuit.gates).filter(
    (g) => g.kind === "INPUT",
  );
  const allOutputs = Object.values(circuit.gates).filter(
    (g) => g.kind === "OUTPUT" || g.kind === "PROBE",
  );

  const inputs = allInputs
    .slice(0, MAX_INPUTS)
    .map((g) => ({ id: g.id, label: g.label || g.id.slice(0, 4) }));
  const outputs = allOutputs.map((g) => ({
    id: g.id,
    label: g.label || g.id.slice(0, 4),
  }));
  const truncated = allInputs.length > MAX_INPUTS;

  const rows: TruthTableResult["rows"] = [];
  const total = 1 << inputs.length;

  for (let bits = 0; bits < total; bits++) {
    const ins: number[] = inputs.map((_, i) => (bits >> i) & 1);

    // Build a temporary circuit with INPUT gates set to the trial values
    const trialGates = { ...circuit.gates };
    for (let i = 0; i < inputs.length; i++) {
      const g = trialGates[inputs[i].id];
      if (!g) continue;
      trialGates[inputs[i].id] = { ...g, on: ins[i] === 1 };
    }
    const trialCircuit: Circuit = {
      gates: trialGates,
      wires: circuit.wires,
    };

    // Run a few passes so any feedback loops have a chance to settle
    const state = createSimState();
    let result = simulate(trialCircuit, {}, state);
    let osc = result.oscillating;
    for (let p = 0; p < SETTLE_PASSES - 1; p++) {
      result = simulate(trialCircuit, {}, state);
      osc = osc || result.oscillating;
    }

    const outs: Signal[] = outputs.map((o) => {
      // For OUTPUT/PROBE the only pin is input pin 0
      return result.pinValues.get(`${o.id}:0`) ?? "X";
    });

    rows.push({ inputs: ins, outputs: outs, oscillating: osc });
  }

  return { inputs, outputs, rows, truncated };
}
