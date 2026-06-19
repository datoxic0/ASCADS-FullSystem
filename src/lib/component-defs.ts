/**
 * Definitions for every component in Logic Lab: palette grouping,
 * sizes, pin layouts, default values, IEC labels, descriptions, and
 * the pure combinational truth-tables for the gate kinds that have one.
 */

import type { Gate, GateKind, Pin, Signal } from "./types";
import { getComponentDef } from "./unified-components";

export const GRID = 10;

export type PaletteCategory = {
  label: string;
  items: { kind: GateKind; name: string; tag?: string }[];
};

export const GATE_CATEGORIES: PaletteCategory[] = [
  {
    label: "Inputs / Outputs",
    items: [
      { kind: "INPUT", name: "Toggle" },
      { kind: "OUTPUT", name: "LED" },
      { kind: "PROBE", name: "Probe" },
      { kind: "CLOCK", name: "Clock" },
      { kind: "CONST1", name: "Constant 1" },
      { kind: "CONST0", name: "Constant 0" },
      { kind: "PULLUP", name: "Pull-Up" },
      { kind: "PULLDOWN", name: "Pull-Dn" },
    ],
  },
  {
    label: "Buffers",
    items: [
      { kind: "BUFFER", name: "Buffer" },
      { kind: "NOT", name: "NOT" },
      { kind: "TRI", name: "Tri-State" },
    ],
  },
  {
    label: "Logic Gates",
    items: [
      { kind: "AND", name: "AND" },
      { kind: "NAND", name: "NAND" },
      { kind: "OR", name: "OR" },
      { kind: "NOR", name: "NOR" },
      { kind: "XOR", name: "XOR" },
      { kind: "XNOR", name: "XNOR" },
    ],
  },
  {
    label: "Latches & Flip-Flops",
    items: [
      { kind: "SRLATCH", name: "SR Latch" },
      { kind: "DLATCH", name: "D Latch" },
      { kind: "DFF", name: "D Flip-Flop" },
      { kind: "JKFF", name: "JK Flip-Flop" },
      { kind: "TFF", name: "T Flip-Flop" },
    ],
  },
  {
    label: "Combinational Blocks",
    items: [
      { kind: "MUX2", name: "2:1 Mux" },
      { kind: "MUX4", name: "4:1 Mux" },
      { kind: "DEMUX2", name: "1:2 Demux" },
      { kind: "DEC2", name: "2-to-4 Dec" },
      { kind: "HALFADDER", name: "Half Adder" },
      { kind: "FULLADDER", name: "Full Adder" },
    ],
  },
  {
    label: "Sequential & Display",
    items: [
      { kind: "COUNTER4", name: "4-bit Counter" },
      { kind: "SEG7", name: "7-Segment" },
      { kind: "HEX4", name: "Hex Display" },
    ],
  },
  {
    label: "Interactive I/O",
    items: [
      { kind: "BUTTON", name: "Push Button" },
      { kind: "RGBLED", name: "RGB LED" },
      { kind: "BUZZER", name: "Buzzer" },
      { kind: "LABEL", name: "Label" },
    ],
  },
];

const VARIABLE_INPUT_KINDS: GateKind[] = [
  "AND",
  "OR",
  "NAND",
  "NOR",
  "XOR",
  "XNOR",
];

export function isVariableInputKind(kind: GateKind): boolean {
  return VARIABLE_INPUT_KINDS.includes(kind);
}

const COMBINATIONAL_KINDS = new Set<GateKind>([
  "AND", "OR", "NOT", "NAND", "NOR", "XOR", "XNOR", "BUFFER",
  "TRI",
  "MUX2", "MUX4", "DEMUX2", "DEC2",
  "HALFADDER", "FULLADDER",
]);

const STATEFUL_KINDS = new Set<GateKind>([
  "SRLATCH", "DLATCH", "DFF", "JKFF", "TFF", "COUNTER4",
]);

const SOURCE_KINDS = new Set<GateKind>([
  "INPUT", "CLOCK", "CONST0", "CONST1", "PULLUP", "PULLDOWN", "BUTTON",
]);

export function isCombinational(kind: GateKind): boolean {
  return COMBINATIONAL_KINDS.has(kind);
}

export function isStateful(kind: GateKind): boolean {
  return STATEFUL_KINDS.has(kind);
}

export function isSource(kind: GateKind): boolean {
  return SOURCE_KINDS.has(kind);
}

export function defaultLabel(kind: GateKind): string | undefined {
  switch (kind) {
    case "INPUT": return "IN";
    case "OUTPUT": return "OUT";
    case "PROBE": return undefined;
    case "CLOCK": return "CLK";
    default: return undefined;
  }
}

export function defaultInputs(kind: GateKind): number {
  if (isVariableInputKind(kind)) return 2;
  if (kind === "NOT" || kind === "BUFFER") return 1;
  return 0;
}

export function defaultGate(kind: GateKind, x: number, y: number): Omit<Gate, "id"> {
  const base: Omit<Gate, "id"> = {
    kind,
    x,
    y,
    inputs: defaultInputs(kind),
    label: defaultLabel(kind),
  };
  if (kind === "INPUT") base.on = false;
  if (kind === "CLOCK") base.hz = 2;
  return base;
}

/* -------------------------------------------------------------------------- */
/*  Sizing                                                                    */
/* -------------------------------------------------------------------------- */

export function sizeOf(g: Pick<Gate, "kind" | "inputs">): { w: number; h: number } {
  switch (g.kind) {
    case "INPUT":
    case "OUTPUT":
    case "PROBE":
      return { w: 50, h: 40 };
    case "CLOCK":
      return { w: 60, h: 40 };
    case "CONST0":
    case "CONST1":
      return { w: 36, h: 36 };
    case "PULLUP":
    case "PULLDOWN":
      return { w: 36, h: 40 };
    case "NOT":
    case "BUFFER":
      return { w: 60, h: 40 };
    case "TRI":
      return { w: 60, h: 50 };
    case "SRLATCH":
    case "DLATCH":
    case "DFF":
    case "TFF":
      return { w: 70, h: 60 };
    case "JKFF":
      return { w: 70, h: 70 };
    case "MUX2":
      return { w: 60, h: 70 };
    case "MUX4":
      return { w: 70, h: 110 };
    case "DEMUX2":
      return { w: 60, h: 70 };
    case "DEC2":
      return { w: 70, h: 90 };
    case "HALFADDER":
      return { w: 70, h: 60 };
    case "FULLADDER":
      return { w: 70, h: 70 };
    case "COUNTER4":
      return { w: 70, h: 100 };
    case "SEG7":
      return { w: 95, h: 130 };
    case "HEX4":
      return { w: 80, h: 110 };
    case "BUTTON":
      return { w: 56, h: 44 };
    case "RGBLED":
      return { w: 68, h: 68 };
    case "BUZZER":
      return { w: 56, h: 56 };
    case "LABEL":
      return { w: 80, h: 28 };
    default: {
      // Variable-input logic gates
      const n = Math.max(2, g.inputs);
      const h = Math.max(50, 30 + n * 12);
      return { w: 70, h };
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Pin layout                                                                */
/* -------------------------------------------------------------------------- */

function distributeInputs(
  count: number,
  height: number,
  margin = 10,
): number[] {
  if (count <= 0) return [];
  if (count === 1) return [height / 2];
  const span = height - 2 * margin;
  return Array.from({ length: count }, (_, i) => margin + (span * i) / (count - 1));
}

function distributeOutputs(count: number, height: number, margin = 10): number[] {
  return distributeInputs(count, height, margin);
}

export function pinsFor(g: Pick<Gate, "kind" | "inputs">): Pin[] {
  const { w, h } = sizeOf(g);

  switch (g.kind) {
    /* Sources & sinks */
    case "INPUT":
    case "CLOCK":
    case "CONST0":
    case "CONST1":
    case "PULLUP":
    case "PULLDOWN":
      return [{ x: w, y: h / 2, type: "out" }];

    case "OUTPUT":
    case "PROBE":
      return [{ x: 0, y: h / 2, type: "in" }];

    /* Buffers */
    case "NOT":
    case "BUFFER":
      return [
        { x: 0, y: h / 2, type: "in" },
        { x: w, y: h / 2, type: "out" },
      ];

    case "TRI":
      return [
        { x: 0, y: h / 2 - 4, type: "in", label: "D" },
        { x: w / 2, y: h, type: "in", label: "EN" },
        { x: w, y: h / 2 - 4, type: "out" },
      ];

    /* Latches & flip-flops */
    case "SRLATCH":
      return [
        { x: 0, y: h * 0.3, type: "in", label: "S" },
        { x: 0, y: h * 0.7, type: "in", label: "R" },
        { x: w, y: h * 0.3, type: "out", label: "Q" },
        { x: w, y: h * 0.7, type: "out", label: "Q\u0305" },
      ];
    case "DLATCH":
      return [
        { x: 0, y: h * 0.3, type: "in", label: "D" },
        { x: 0, y: h * 0.7, type: "in", label: "EN" },
        { x: w, y: h * 0.3, type: "out", label: "Q" },
        { x: w, y: h * 0.7, type: "out", label: "Q\u0305" },
      ];
    case "DFF":
      return [
        { x: 0, y: h * 0.3, type: "in", label: "D" },
        { x: 0, y: h * 0.7, type: "in", label: "CLK", clock: true },
        { x: w, y: h * 0.3, type: "out", label: "Q" },
        { x: w, y: h * 0.7, type: "out", label: "Q\u0305" },
      ];
    case "TFF":
      return [
        { x: 0, y: h * 0.3, type: "in", label: "T" },
        { x: 0, y: h * 0.7, type: "in", label: "CLK", clock: true },
        { x: w, y: h * 0.3, type: "out", label: "Q" },
        { x: w, y: h * 0.7, type: "out", label: "Q\u0305" },
      ];
    case "JKFF":
      return [
        { x: 0, y: h * 0.25, type: "in", label: "J" },
        { x: 0, y: h * 0.55, type: "in", label: "K" },
        { x: 0, y: h * 0.85, type: "in", label: "CLK", clock: true },
        { x: w, y: h * 0.3, type: "out", label: "Q" },
        { x: w, y: h * 0.7, type: "out", label: "Q\u0305" },
      ];

    /* Combinational compound blocks */
    case "MUX2": {
      const ys = distributeInputs(2, h, 14);
      return [
        { x: 0, y: ys[0], type: "in", label: "0" },
        { x: 0, y: ys[1], type: "in", label: "1" },
        { x: w / 2, y: h, type: "in", label: "S" },
        { x: w, y: h / 2, type: "out", label: "Y" },
      ];
    }
    case "MUX4": {
      const ys = distributeInputs(4, h, 14);
      return [
        { x: 0, y: ys[0], type: "in", label: "0" },
        { x: 0, y: ys[1], type: "in", label: "1" },
        { x: 0, y: ys[2], type: "in", label: "2" },
        { x: 0, y: ys[3], type: "in", label: "3" },
        { x: w * 0.35, y: h, type: "in", label: "S0" },
        { x: w * 0.65, y: h, type: "in", label: "S1" },
        { x: w, y: h / 2, type: "out", label: "Y" },
      ];
    }
    case "DEMUX2": {
      const ys = distributeOutputs(2, h, 14);
      return [
        { x: 0, y: h / 2, type: "in", label: "D" },
        { x: w / 2, y: h, type: "in", label: "S" },
        { x: w, y: ys[0], type: "out", label: "0" },
        { x: w, y: ys[1], type: "out", label: "1" },
      ];
    }
    case "DEC2": {
      const ys = distributeOutputs(4, h, 12);
      return [
        { x: 0, y: h * 0.3, type: "in", label: "A" },
        { x: 0, y: h * 0.7, type: "in", label: "B" },
        { x: w, y: ys[0], type: "out", label: "0" },
        { x: w, y: ys[1], type: "out", label: "1" },
        { x: w, y: ys[2], type: "out", label: "2" },
        { x: w, y: ys[3], type: "out", label: "3" },
      ];
    }
    case "HALFADDER":
      return [
        { x: 0, y: h * 0.3, type: "in", label: "A" },
        { x: 0, y: h * 0.7, type: "in", label: "B" },
        { x: w, y: h * 0.3, type: "out", label: "S" },
        { x: w, y: h * 0.7, type: "out", label: "C" },
      ];
    case "FULLADDER":
      return [
        { x: 0, y: h * 0.22, type: "in", label: "A" },
        { x: 0, y: h * 0.5, type: "in", label: "B" },
        { x: 0, y: h * 0.78, type: "in", label: "Cin" },
        { x: w, y: h * 0.3, type: "out", label: "S" },
        { x: w, y: h * 0.7, type: "out", label: "Cout" },
      ];

    /* Sequential & display */
    case "COUNTER4": {
      const ys = distributeOutputs(4, h, 14);
      return [
        { x: 0, y: h * 0.35, type: "in", label: "CLK", clock: true },
        { x: 0, y: h * 0.7, type: "in", label: "RST" },
        { x: w, y: ys[0], type: "out", label: "Q0" },
        { x: w, y: ys[1], type: "out", label: "Q1" },
        { x: w, y: ys[2], type: "out", label: "Q2" },
        { x: w, y: ys[3], type: "out", label: "Q3" },
      ];
    }
    case "SEG7": {
      const ys = distributeInputs(4, h, 16);
      return [
        { x: 0, y: ys[0], type: "in", label: "8" },
        { x: 0, y: ys[1], type: "in", label: "4" },
        { x: 0, y: ys[2], type: "in", label: "2" },
        { x: 0, y: ys[3], type: "in", label: "1" },
      ];
    }
    case "HEX4": {
      const ys = distributeInputs(4, h, 16);
      return [
        { x: 0, y: ys[0], type: "in", label: "I3" },
        { x: 0, y: ys[1], type: "in", label: "I2" },
        { x: 0, y: ys[2], type: "in", label: "I1" },
        { x: 0, y: ys[3], type: "in", label: "I0" },
      ];
    }
    case "BUTTON":
      return [{ x: w, y: h / 2, type: "out" }];
    case "RGBLED": {
      return [
        { x: 0, y: h * 0.25, type: "in", label: "R" },
        { x: 0, y: h * 0.5,  type: "in", label: "G" },
        { x: 0, y: h * 0.75, type: "in", label: "B" },
      ];
    }
    case "BUZZER":
      return [{ x: 0, y: h / 2, type: "in" }];
    case "LABEL":
      return [];

    /* Variable input logic gates */
    default: {
      const n = Math.max(2, g.inputs);
      const ys = distributeInputs(n, h, 8);
      const pins: Pin[] = ys.map((y) => ({
        x: 0,
        y: Math.round(y * 2) / 2,
        type: "in",
      }));
      pins.push({ x: w, y: h / 2, type: "out" });
      return pins;
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Combinational truth tables                                                */
/* -------------------------------------------------------------------------- */

function reduceAnd(inputs: Signal[]): Signal {
  if (inputs.includes(0)) return 0;
  if (inputs.includes("X")) return "X";
  return 1;
}
function reduceOr(inputs: Signal[]): Signal {
  if (inputs.includes(1)) return 1;
  if (inputs.includes("X")) return "X";
  return 0;
}
function reduceXor(inputs: Signal[]): Signal {
  if (inputs.includes("X")) return "X";
  const ones = inputs.filter((v) => v === 1).length;
  return ones % 2 === 1 ? 1 : 0;
}

/**
 * Pure combinational evaluation. Returns one Signal per output pin in order.
 * Stateful gates (latches/FFs/counter) and sources are NOT handled here —
 * the simulator drives those separately.
 */
export function evaluateGate(kind: GateKind, inputs: Signal[]): Signal[] {
  switch (kind) {
    case "BUFFER":
      return [inputs[0] ?? "X"];
    case "NOT": {
      const v = inputs[0] ?? "X";
      if (v === "X") return ["X"];
      return [v === 1 ? 0 : 1];
    }
    case "AND":
      return [reduceAnd(inputs)];
    case "NAND": {
      const a = reduceAnd(inputs);
      return [a === "X" ? "X" : a === 0 ? 1 : 0];
    }
    case "OR":
      return [reduceOr(inputs)];
    case "NOR": {
      const a = reduceOr(inputs);
      return [a === "X" ? "X" : a === 0 ? 1 : 0];
    }
    case "XOR":
      return [reduceXor(inputs)];
    case "XNOR": {
      const a = reduceXor(inputs);
      return [a === "X" ? "X" : a === 0 ? 1 : 0];
    }
    case "TRI": {
      const [d, en] = inputs;
      if (en === 1) return [d ?? "X"];
      // disabled or unknown enable → high-impedance / floating
      return ["X"];
    }
    case "MUX2": {
      const [a, b, s] = inputs;
      if (s === "X" || s === undefined) return ["X"];
      return [s === 1 ? b ?? "X" : a ?? "X"];
    }
    case "MUX4": {
      const [d0, d1, d2, d3, s0, s1] = inputs;
      if (s0 === "X" || s1 === "X" || s0 === undefined || s1 === undefined) return ["X"];
      const sel = (s1 as 0 | 1) * 2 + (s0 as 0 | 1);
      return [[d0, d1, d2, d3][sel] ?? "X"];
    }
    case "DEMUX2": {
      const [d, s] = inputs;
      if (s === "X" || s === undefined) return ["X", "X"];
      if (s === 0) return [d ?? "X", 0];
      return [0, d ?? "X"];
    }
    case "DEC2": {
      const [a, b] = inputs;
      if (a === "X" || b === "X" || a === undefined || b === undefined) {
        return ["X", "X", "X", "X"];
      }
      const i = (b as 0 | 1) * 2 + (a as 0 | 1);
      return [0, 1, 2, 3].map((j) => (j === i ? 1 : 0)) as Signal[];
    }
    case "HALFADDER": {
      const [a, b] = inputs;
      const s = reduceXor([a, b]);
      const c = reduceAnd([a, b]);
      return [s, c];
    }
    case "FULLADDER": {
      const [a, b, cin] = inputs;
      const s = reduceXor([a, b, cin]);
      const ab = reduceAnd([a, b]);
      const acin = reduceAnd([a, cin]);
      const bcin = reduceAnd([b, cin]);
      const cout = reduceOr([ab, acin, bcin]);
      return [s, cout];
    }
    default:
      return [];
  }
}

/* -------------------------------------------------------------------------- */
/*  Display helpers                                                           */
/* -------------------------------------------------------------------------- */

export const KIND_DESCRIPTIONS: Partial<Record<GateKind, string>> & Record<string, string> = new Proxy({
  NOT: "Output is the logical inverse of the input.",
  BUFFER: "Output mirrors the input. Used for signal isolation.",
  TRI: "Tri-state buffer: passes data when EN=1, otherwise floats (X).",
  INPUT: "Toggle input. Click to flip the value.",
  OUTPUT: "Output indicator (LED). Lights when HIGH.",
  CLOCK: "Square-wave generator. Adjustable frequency.",
  CONST0: "Constant LOW (0).",
  CONST1: "Constant HIGH (1).",
  PULLUP: "Pull-up — drives a constant HIGH (1).",
  PULLDOWN: "Pull-down — drives a constant LOW (0).",
  PROBE: "Read-only probe. Shows the value of the connected wire.",
  SRLATCH: "Set-Reset latch. S=1 sets Q, R=1 resets Q. Hold otherwise.",
  DLATCH: "D-latch. While EN=1, Q follows D. When EN=0, Q holds.",
  DFF: "D flip-flop. On the rising CLK edge, Q ← D.",
  JKFF: "JK flip-flop. Edge triggered: 00 hold, 01 reset, 10 set, 11 toggle.",
  TFF: "T flip-flop. On the rising CLK edge, Q toggles when T=1.",
  MUX2: "2-to-1 multiplexer. Y = S=0 ? in0 : in1.",
  MUX4: "4-to-1 multiplexer. Selects one of four inputs by S1S0.",
  DEMUX2: "1-to-2 demultiplexer. Routes D to one of two outputs by S.",
  DEC2: "2-to-4 decoder. Drives a single output corresponding to BA.",
  HALFADDER: "Half adder: A + B → sum (S) and carry (C).",
  FULLADDER: "Full adder: A + B + Cin → sum (S) and carry-out (Cout).",
  COUNTER4: "4-bit synchronous counter. Increments on rising CLK; RST clears.",
  SEG7: "7-segment display. Shows the BCD/hex value of inputs 8/4/2/1.",
  HEX4: "4-bit hex display. Shows hex digit 0–F from inputs I3/I2/I1/I0.",
  RGBLED: "RGB LED. R, G, B inputs control the colour independently.",
  BUZZER: "Piezo buzzer indicator. Activated when input is HIGH.",
  LABEL: "Text annotation — no electrical connections.",
}, {
  get: (target: any, prop: string) => {
    if (target[prop]) return target[prop];
    const def = getComponentDef(prop);
    return def ? def.description : "No description available.";
  }
});

export const IEC_LABEL: Partial<Record<GateKind, string>> & Record<string, string> = {
  AND: "&",
  NAND: "&",
  OR: "≥1",
  NOR: "≥1",
  XOR: "=1",
  XNOR: "=1",
  NOT: "1",
  BUFFER: "1",
  TRI: "1",
  INPUT: "",
  OUTPUT: "",
  CLOCK: "",
  CONST0: "",
  CONST1: "",
  PULLUP: "",
  PULLDOWN: "",
  PROBE: "",
  SRLATCH: "SR",
  DLATCH: "D",
  DFF: "D",
  JKFF: "JK",
  TFF: "T",
  MUX2: "MUX",
  MUX4: "MUX",
  DEMUX2: "DMX",
  DEC2: "DEC",
  HALFADDER: "Σ",
  FULLADDER: "Σ",
  COUNTER4: "CTR4",
  SEG7: "",
  HEX4: "",
  BUTTON: "",
  RGBLED: "",
  BUZZER: "",
  LABEL: "",
};

/** Index of the CLK input pin for each clocked gate, or -1 if none. */
export const CLOCK_PIN_INDEX: Partial<Record<GateKind, number>> & Record<string, number> = {
  DFF: 1,
  TFF: 1,
  JKFF: 2,
  COUNTER4: 0,
};

export function snapToGrid(v: number): number {
  return Math.round(v / GRID) * GRID;
}

/* -------------------------------------------------------------------------- */
/*  7-segment decoding (used by GateBody for SEG7)                            */
/* -------------------------------------------------------------------------- */

/** Standard hex-decoder lookup. Each entry is [a, b, c, d, e, f, g] booleans. */
export const SEGMENTS_HEX: Record<number, [boolean, boolean, boolean, boolean, boolean, boolean, boolean]> = {
  0x0: [true, true, true, true, true, true, false],
  0x1: [false, true, true, false, false, false, false],
  0x2: [true, true, false, true, true, false, true],
  0x3: [true, true, true, true, false, false, true],
  0x4: [false, true, true, false, false, true, true],
  0x5: [true, false, true, true, false, true, true],
  0x6: [true, false, true, true, true, true, true],
  0x7: [true, true, true, false, false, false, false],
  0x8: [true, true, true, true, true, true, true],
  0x9: [true, true, true, true, false, true, true],
  0xa: [true, true, true, false, true, true, true],
  0xb: [false, false, true, true, true, true, true],
  0xc: [true, false, false, true, true, true, false],
  0xd: [false, true, true, true, true, false, true],
  0xe: [true, false, false, true, true, true, true],
  0xf: [true, false, false, false, true, true, true],
};
