/**
 * Logic Lab — core type definitions.
 *
 * Signals are tri-valued: 0, 1, or "X" (unknown / floating / conflict).
 * Each gate may expose any number of input pins and any number of output
 * pins; their order in `pinsFor()` is the canonical ordering used everywhere
 * (wires reference pins by index).
 */

export type GateKind =
  // Sources & sinks
  | "INPUT"
  | "OUTPUT"
  | "PROBE"
  | "CLOCK"
  | "CONST0"
  | "CONST1"
  | "PULLUP"
  | "PULLDOWN"
  // Buffers
  | "BUFFER"
  | "NOT"
  | "TRI"
  // Logic gates
  | "AND"
  | "OR"
  | "NAND"
  | "NOR"
  | "XOR"
  | "XNOR"
  // Latches & flip-flops
  | "SRLATCH"
  | "DLATCH"
  | "DFF"
  | "JKFF"
  | "TFF"
  // Combinational compound blocks
  | "MUX2"
  | "MUX4"
  | "DEMUX2"
  | "DEC2"
  | "HALFADDER"
  | "FULLADDER"
  // Sequential / display
  | "COUNTER4"
  | "SEG7"
  // Interactive I/O
  | "BUTTON"   // momentary push button
  | "RGBLED"   // RGB LED (3 inputs: R, G, B)
  | "BUZZER"   // piezo buzzer (1 input)
  | "HEX4"     // 4-bit hex display (0-F)
  | "LABEL";   // text annotation (no pins)

export type Signal = 0 | 1 | "X";

export type SymbolStyle = "ansi" | "iec";

export type Pin = {
  x: number;
  y: number;
  type: "in" | "out";
  /** Optional human-readable label rendered next to the pin (e.g. "S", "Q", "CLK"). */
  label?: string;
  /** Mark a clock pin so we can render the triangular notch. */
  clock?: boolean;
};

export type Gate = {
  id: string;
  kind: GateKind;
  x: number;
  y: number;
  /** Number of inputs for variable-arity gates (AND/OR/NAND/NOR/XOR/XNOR). */
  inputs: number;
  label?: string;
  /** For INPUT: current toggle value. */
  on?: boolean;
  /** For CLOCK: frequency in Hz. */
  hz?: number;
};

export type WireEnd = {
  gateId: string;
  pinIndex: number;
};

export type Wire = {
  id: string;
  from: WireEnd; // output side
  to: WireEnd; // input side
};

export type Circuit = {
  gates: Record<string, Gate>;
  wires: Record<string, Wire>;
};

/** Per-gate runtime memory used by latches, flip-flops, and counters. */
export type GateMemory = {
  q?: 0 | 1;
  count?: number;
};

export type SimState = {
  /** gateId → memory snapshot (Q values, counter contents, etc.). */
  memory: Map<string, GateMemory>;
  /** Pin values from the previous simulation pass; used for edge detection. */
  prevPinValues: Map<string, Signal>;
};

export type SimulationResult = {
  /** key: `${gateId}:${pinIndex}` */
  pinValues: Map<string, Signal>;
  /** key: wire.id */
  wireValues: Map<string, Signal>;
  iterations: number;
  oscillating: boolean;
};

export type Selection = {
  gates: Set<string>;
  wires: Set<string>;
};

export type ToolMode =
  | { kind: "select" }
  | { kind: "place"; gateKind: GateKind; inputs?: number }
  | { kind: "wire"; from: WireEnd; cursor: { x: number; y: number } };

export type ViewState = {
  tx: number;
  ty: number;
  scale: number;
};
