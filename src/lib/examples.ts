import type { Circuit } from "./types";

function build(
  g: Array<Partial<Circuit["gates"][string]> & { id: string }>,
  w: Circuit["wires"][string][],
): Circuit {
  const gates: Circuit["gates"] = {};
  for (const gate of g) {
    gates[gate.id] = {
      id: gate.id,
      kind: gate.kind!,
      x: gate.x ?? 0,
      y: gate.y ?? 0,
      inputs: gate.inputs ?? 0,
      label: gate.label,
      on: gate.on,
      hz: gate.hz,
    };
  }
  const wires: Circuit["wires"] = {};
  for (const wire of w) {
    wires[wire.id] = wire;
  }
  return { gates, wires };
}

export type Example = {
  name: string;
  description: string;
  category: "Basics" | "Memory" | "Arithmetic" | "Sequential" | "Case Studies";
  build: () => Circuit;
};

export const EXAMPLES: Example[] = [
  /* ──────────────────────── Basics ──────────────────────── */
  {
    name: "Half Adder",
    category: "Basics",
    description: "Two-bit addition with sum and carry, built from XOR + AND.",
    build: () =>
      build(
        [
          { id: "a", kind: "INPUT", x: 80, y: 120, inputs: 0, label: "A", on: false },
          { id: "b", kind: "INPUT", x: 80, y: 200, inputs: 0, label: "B", on: false },
          { id: "x1", kind: "XOR", x: 260, y: 120, inputs: 2 },
          { id: "a1", kind: "AND", x: 260, y: 220, inputs: 2 },
          { id: "s", kind: "OUTPUT", x: 440, y: 130, inputs: 0, label: "Sum" },
          { id: "c", kind: "OUTPUT", x: 440, y: 230, inputs: 0, label: "Carry" },
        ],
        [
          { id: "w1", from: { gateId: "a", pinIndex: 0 }, to: { gateId: "x1", pinIndex: 0 } },
          { id: "w2", from: { gateId: "b", pinIndex: 0 }, to: { gateId: "x1", pinIndex: 1 } },
          { id: "w3", from: { gateId: "a", pinIndex: 0 }, to: { gateId: "a1", pinIndex: 0 } },
          { id: "w4", from: { gateId: "b", pinIndex: 0 }, to: { gateId: "a1", pinIndex: 1 } },
          { id: "w5", from: { gateId: "x1", pinIndex: 2 }, to: { gateId: "s", pinIndex: 0 } },
          { id: "w6", from: { gateId: "a1", pinIndex: 2 }, to: { gateId: "c", pinIndex: 0 } },
        ],
      ),
  },
  {
    name: "2:1 Multiplexer",
    category: "Basics",
    description: "Selects one of two inputs based on the select line.",
    build: () =>
      build(
        [
          { id: "a", kind: "INPUT", x: 80, y: 80, inputs: 0, label: "A", on: false },
          { id: "b", kind: "INPUT", x: 80, y: 180, inputs: 0, label: "B", on: false },
          { id: "sel", kind: "INPUT", x: 80, y: 280, inputs: 0, label: "Sel", on: false },
          { id: "ns", kind: "NOT", x: 240, y: 290, inputs: 0 },
          { id: "a1", kind: "AND", x: 380, y: 80, inputs: 2 },
          { id: "a2", kind: "AND", x: 380, y: 180, inputs: 2 },
          { id: "or1", kind: "OR", x: 540, y: 130, inputs: 2 },
          { id: "out", kind: "OUTPUT", x: 700, y: 140, inputs: 0, label: "Out" },
        ],
        [
          { id: "w1", from: { gateId: "a", pinIndex: 0 }, to: { gateId: "a1", pinIndex: 0 } },
          { id: "w2", from: { gateId: "sel", pinIndex: 0 }, to: { gateId: "ns", pinIndex: 0 } },
          { id: "w3", from: { gateId: "ns", pinIndex: 1 }, to: { gateId: "a1", pinIndex: 1 } },
          { id: "w4", from: { gateId: "b", pinIndex: 0 }, to: { gateId: "a2", pinIndex: 0 } },
          { id: "w5", from: { gateId: "sel", pinIndex: 0 }, to: { gateId: "a2", pinIndex: 1 } },
          { id: "w6", from: { gateId: "a1", pinIndex: 2 }, to: { gateId: "or1", pinIndex: 0 } },
          { id: "w7", from: { gateId: "a2", pinIndex: 2 }, to: { gateId: "or1", pinIndex: 1 } },
          { id: "w8", from: { gateId: "or1", pinIndex: 2 }, to: { gateId: "out", pinIndex: 0 } },
        ],
      ),
  },
  {
    name: "Tri-State Bus",
    category: "Basics",
    description: "Two tri-state drivers contesting a shared wire.",
    build: () =>
      build(
        [
          { id: "a", kind: "INPUT", x: 80, y: 80, inputs: 0, label: "A", on: false },
          { id: "b", kind: "INPUT", x: 80, y: 180, inputs: 0, label: "B", on: true },
          { id: "ena", kind: "INPUT", x: 80, y: 140, inputs: 0, label: "ENa", on: true },
          { id: "enb", kind: "INPUT", x: 80, y: 240, inputs: 0, label: "ENb", on: false },
          { id: "ta", kind: "TRI", x: 240, y: 90, inputs: 0 },
          { id: "tb", kind: "TRI", x: 240, y: 200, inputs: 0 },
          { id: "out", kind: "OUTPUT", x: 460, y: 145, inputs: 0, label: "BUS" },
        ],
        [
          { id: "w1", from: { gateId: "a", pinIndex: 0 }, to: { gateId: "ta", pinIndex: 0 } },
          { id: "w2", from: { gateId: "ena", pinIndex: 0 }, to: { gateId: "ta", pinIndex: 1 } },
          { id: "w3", from: { gateId: "b", pinIndex: 0 }, to: { gateId: "tb", pinIndex: 0 } },
          { id: "w4", from: { gateId: "enb", pinIndex: 0 }, to: { gateId: "tb", pinIndex: 1 } },
          { id: "w5", from: { gateId: "ta", pinIndex: 2 }, to: { gateId: "out", pinIndex: 0 } },
        ],
      ),
  },

  /* ─────────────────────── Memory ──────────────────────── */
  {
    name: "SR Latch (NOR)",
    category: "Memory",
    description: "Cross-coupled NOR gates form a basic memory cell.",
    build: () =>
      build(
        [
          { id: "s", kind: "INPUT", x: 80, y: 110, inputs: 0, label: "S", on: false },
          { id: "r", kind: "INPUT", x: 80, y: 240, inputs: 0, label: "R", on: false },
          { id: "n1", kind: "NOR", x: 260, y: 100, inputs: 2 },
          { id: "n2", kind: "NOR", x: 260, y: 220, inputs: 2 },
          { id: "q", kind: "OUTPUT", x: 460, y: 110, inputs: 0, label: "Q" },
          { id: "qbar", kind: "OUTPUT", x: 460, y: 240, inputs: 0, label: "Q\u0305" },
        ],
        [
          { id: "wsa", from: { gateId: "s", pinIndex: 0 }, to: { gateId: "n1", pinIndex: 0 } },
          { id: "wrb", from: { gateId: "r", pinIndex: 0 }, to: { gateId: "n2", pinIndex: 1 } },
          { id: "wfb1", from: { gateId: "n2", pinIndex: 2 }, to: { gateId: "n1", pinIndex: 1 } },
          { id: "wfb2", from: { gateId: "n1", pinIndex: 2 }, to: { gateId: "n2", pinIndex: 0 } },
          { id: "wq", from: { gateId: "n1", pinIndex: 2 }, to: { gateId: "q", pinIndex: 0 } },
          { id: "wqb", from: { gateId: "n2", pinIndex: 2 }, to: { gateId: "qbar", pinIndex: 0 } },
        ],
      ),
  },
  {
    name: "D Flip-Flop Demo",
    category: "Memory",
    description: "Edge-triggered D flip-flop sampled by a clock.",
    build: () =>
      build(
        [
          { id: "d", kind: "INPUT", x: 80, y: 100, inputs: 0, label: "D", on: false },
          { id: "clk", kind: "CLOCK", x: 80, y: 200, inputs: 0, label: "CLK", hz: 1 },
          { id: "ff", kind: "DFF", x: 240, y: 110, inputs: 0 },
          { id: "q", kind: "OUTPUT", x: 410, y: 110, inputs: 0, label: "Q" },
          { id: "qb", kind: "OUTPUT", x: 410, y: 170, inputs: 0, label: "Q\u0305" },
          { id: "pd", kind: "PROBE", x: 320, y: 30, inputs: 0 },
          { id: "pclk", kind: "PROBE", x: 200, y: 280, inputs: 0 },
        ],
        [
          { id: "w1", from: { gateId: "d", pinIndex: 0 }, to: { gateId: "ff", pinIndex: 0 } },
          { id: "w2", from: { gateId: "clk", pinIndex: 0 }, to: { gateId: "ff", pinIndex: 1 } },
          { id: "w3", from: { gateId: "ff", pinIndex: 2 }, to: { gateId: "q", pinIndex: 0 } },
          { id: "w4", from: { gateId: "ff", pinIndex: 3 }, to: { gateId: "qb", pinIndex: 0 } },
          { id: "w5", from: { gateId: "d", pinIndex: 0 }, to: { gateId: "pd", pinIndex: 0 } },
          { id: "w6", from: { gateId: "clk", pinIndex: 0 }, to: { gateId: "pclk", pinIndex: 0 } },
        ],
      ),
  },
  {
    name: "JK Toggle",
    category: "Memory",
    description: "JK flip-flop in toggle mode (J=K=1) — divides clock by two.",
    build: () =>
      build(
        [
          { id: "v1", kind: "CONST1", x: 80, y: 80, inputs: 0 },
          { id: "v2", kind: "CONST1", x: 80, y: 130, inputs: 0 },
          { id: "clk", kind: "CLOCK", x: 80, y: 200, inputs: 0, label: "CLK", hz: 2 },
          { id: "ff", kind: "JKFF", x: 240, y: 95, inputs: 0 },
          { id: "q", kind: "OUTPUT", x: 410, y: 110, inputs: 0, label: "Q" },
        ],
        [
          { id: "w1", from: { gateId: "v1", pinIndex: 0 }, to: { gateId: "ff", pinIndex: 0 } },
          { id: "w2", from: { gateId: "v2", pinIndex: 0 }, to: { gateId: "ff", pinIndex: 1 } },
          { id: "w3", from: { gateId: "clk", pinIndex: 0 }, to: { gateId: "ff", pinIndex: 2 } },
          { id: "w4", from: { gateId: "ff", pinIndex: 3 }, to: { gateId: "q", pinIndex: 0 } },
        ],
      ),
  },

  /* ─────────────────────── Arithmetic ──────────────────────── */
  {
    name: "Full Adder",
    category: "Arithmetic",
    description: "Three-input adder with carry-in and carry-out.",
    build: () =>
      build(
        [
          { id: "a", kind: "INPUT", x: 80, y: 80, inputs: 0, label: "A", on: false },
          { id: "b", kind: "INPUT", x: 80, y: 160, inputs: 0, label: "B", on: false },
          { id: "ci", kind: "INPUT", x: 80, y: 240, inputs: 0, label: "Cin", on: false },
          { id: "fa", kind: "FULLADDER", x: 260, y: 100, inputs: 0 },
          { id: "s", kind: "OUTPUT", x: 430, y: 110, inputs: 0, label: "S" },
          { id: "co", kind: "OUTPUT", x: 430, y: 170, inputs: 0, label: "Cout" },
        ],
        [
          { id: "w1", from: { gateId: "a", pinIndex: 0 }, to: { gateId: "fa", pinIndex: 0 } },
          { id: "w2", from: { gateId: "b", pinIndex: 0 }, to: { gateId: "fa", pinIndex: 1 } },
          { id: "w3", from: { gateId: "ci", pinIndex: 0 }, to: { gateId: "fa", pinIndex: 2 } },
          { id: "w4", from: { gateId: "fa", pinIndex: 3 }, to: { gateId: "s", pinIndex: 0 } },
          { id: "w5", from: { gateId: "fa", pinIndex: 4 }, to: { gateId: "co", pinIndex: 0 } },
        ],
      ),
  },
  {
    name: "2-bit Ripple Adder",
    category: "Arithmetic",
    description: "Two full adders cascaded — A1A0 + B1B0 with carry-out.",
    build: () =>
      build(
        [
          { id: "a0", kind: "INPUT", x: 80, y: 80, inputs: 0, label: "A0", on: false },
          { id: "b0", kind: "INPUT", x: 80, y: 140, inputs: 0, label: "B0", on: false },
          { id: "a1", kind: "INPUT", x: 80, y: 240, inputs: 0, label: "A1", on: false },
          { id: "b1", kind: "INPUT", x: 80, y: 300, inputs: 0, label: "B1", on: false },
          { id: "z", kind: "CONST0", x: 80, y: 200, inputs: 0 },
          { id: "fa0", kind: "FULLADDER", x: 250, y: 100, inputs: 0 },
          { id: "fa1", kind: "FULLADDER", x: 250, y: 250, inputs: 0 },
          { id: "s0", kind: "OUTPUT", x: 430, y: 100, inputs: 0, label: "S0" },
          { id: "s1", kind: "OUTPUT", x: 430, y: 250, inputs: 0, label: "S1" },
          { id: "co", kind: "OUTPUT", x: 430, y: 310, inputs: 0, label: "Cout" },
        ],
        [
          { id: "w1", from: { gateId: "a0", pinIndex: 0 }, to: { gateId: "fa0", pinIndex: 0 } },
          { id: "w2", from: { gateId: "b0", pinIndex: 0 }, to: { gateId: "fa0", pinIndex: 1 } },
          { id: "w3", from: { gateId: "z", pinIndex: 0 }, to: { gateId: "fa0", pinIndex: 2 } },
          { id: "w4", from: { gateId: "fa0", pinIndex: 3 }, to: { gateId: "s0", pinIndex: 0 } },
          { id: "w5", from: { gateId: "a1", pinIndex: 0 }, to: { gateId: "fa1", pinIndex: 0 } },
          { id: "w6", from: { gateId: "b1", pinIndex: 0 }, to: { gateId: "fa1", pinIndex: 1 } },
          { id: "w7", from: { gateId: "fa0", pinIndex: 4 }, to: { gateId: "fa1", pinIndex: 2 } },
          { id: "w8", from: { gateId: "fa1", pinIndex: 3 }, to: { gateId: "s1", pinIndex: 0 } },
          { id: "w9", from: { gateId: "fa1", pinIndex: 4 }, to: { gateId: "co", pinIndex: 0 } },
        ],
      ),
  },
  {
    name: "2-to-4 Decoder",
    category: "Arithmetic",
    description: "Drives one of four LEDs based on the binary input BA.",
    build: () =>
      build(
        [
          { id: "a", kind: "INPUT", x: 80, y: 120, inputs: 0, label: "A", on: false },
          { id: "b", kind: "INPUT", x: 80, y: 200, inputs: 0, label: "B", on: false },
          { id: "dec", kind: "DEC2", x: 240, y: 90, inputs: 0 },
          { id: "y0", kind: "OUTPUT", x: 410, y: 100, inputs: 0, label: "Y0" },
          { id: "y1", kind: "OUTPUT", x: 410, y: 140, inputs: 0, label: "Y1" },
          { id: "y2", kind: "OUTPUT", x: 410, y: 180, inputs: 0, label: "Y2" },
          { id: "y3", kind: "OUTPUT", x: 410, y: 220, inputs: 0, label: "Y3" },
        ],
        [
          { id: "w1", from: { gateId: "a", pinIndex: 0 }, to: { gateId: "dec", pinIndex: 0 } },
          { id: "w2", from: { gateId: "b", pinIndex: 0 }, to: { gateId: "dec", pinIndex: 1 } },
          { id: "w3", from: { gateId: "dec", pinIndex: 2 }, to: { gateId: "y0", pinIndex: 0 } },
          { id: "w4", from: { gateId: "dec", pinIndex: 3 }, to: { gateId: "y1", pinIndex: 0 } },
          { id: "w5", from: { gateId: "dec", pinIndex: 4 }, to: { gateId: "y2", pinIndex: 0 } },
          { id: "w6", from: { gateId: "dec", pinIndex: 5 }, to: { gateId: "y3", pinIndex: 0 } },
        ],
      ),
  },

  /* ─────────────────────── Sequential ──────────────────────── */
  {
    name: "Hex Counter on 7-Seg",
    category: "Sequential",
    description: "Free-running 4-bit counter wired to a hex 7-segment display.",
    build: () =>
      build(
        [
          { id: "clk", kind: "CLOCK", x: 80, y: 130, inputs: 0, label: "CLK", hz: 4 },
          { id: "rst", kind: "INPUT", x: 80, y: 220, inputs: 0, label: "RST", on: false },
          { id: "ctr", kind: "COUNTER4", x: 230, y: 80, inputs: 0 },
          { id: "seg", kind: "SEG7", x: 420, y: 70, inputs: 0 },
          { id: "p0", kind: "PROBE", x: 350, y: 240, inputs: 0 },
          { id: "p1", kind: "PROBE", x: 350, y: 280, inputs: 0 },
          { id: "p2", kind: "PROBE", x: 350, y: 320, inputs: 0 },
          { id: "p3", kind: "PROBE", x: 350, y: 360, inputs: 0 },
        ],
        [
          { id: "w1", from: { gateId: "clk", pinIndex: 0 }, to: { gateId: "ctr", pinIndex: 0 } },
          { id: "w2", from: { gateId: "rst", pinIndex: 0 }, to: { gateId: "ctr", pinIndex: 1 } },
          { id: "w3", from: { gateId: "ctr", pinIndex: 5 }, to: { gateId: "seg", pinIndex: 0 } },
          { id: "w4", from: { gateId: "ctr", pinIndex: 4 }, to: { gateId: "seg", pinIndex: 1 } },
          { id: "w5", from: { gateId: "ctr", pinIndex: 3 }, to: { gateId: "seg", pinIndex: 2 } },
          { id: "w6", from: { gateId: "ctr", pinIndex: 2 }, to: { gateId: "seg", pinIndex: 3 } },
          { id: "w7", from: { gateId: "ctr", pinIndex: 2 }, to: { gateId: "p0", pinIndex: 0 } },
          { id: "w8", from: { gateId: "ctr", pinIndex: 3 }, to: { gateId: "p1", pinIndex: 0 } },
          { id: "w9", from: { gateId: "ctr", pinIndex: 4 }, to: { gateId: "p2", pinIndex: 0 } },
          { id: "w10", from: { gateId: "ctr", pinIndex: 5 }, to: { gateId: "p3", pinIndex: 0 } },
        ],
      ),
  },
  {
    name: "Clock Divider",
    category: "Sequential",
    description: "A clock drives buffer / inverter — useful as a starting timing tutorial.",
    build: () =>
      build(
        [
          { id: "clk", kind: "CLOCK", x: 80, y: 160, inputs: 0, label: "CLK", hz: 2 },
          { id: "buf", kind: "BUFFER", x: 240, y: 160, inputs: 0 },
          { id: "n1", kind: "NOT", x: 400, y: 160, inputs: 0 },
          { id: "p1", kind: "PROBE", x: 240, y: 70, inputs: 0 },
          { id: "p2", kind: "PROBE", x: 400, y: 70, inputs: 0 },
          { id: "p3", kind: "PROBE", x: 560, y: 70, inputs: 0 },
        ],
        [
          { id: "w1", from: { gateId: "clk", pinIndex: 0 }, to: { gateId: "buf", pinIndex: 0 } },
          { id: "w2", from: { gateId: "buf", pinIndex: 1 }, to: { gateId: "n1", pinIndex: 0 } },
          { id: "w3", from: { gateId: "clk", pinIndex: 0 }, to: { gateId: "p1", pinIndex: 0 } },
          { id: "w4", from: { gateId: "buf", pinIndex: 1 }, to: { gateId: "p2", pinIndex: 0 } },
          { id: "w5", from: { gateId: "n1", pinIndex: 1 }, to: { gateId: "p3", pinIndex: 0 } },
        ],
      ),
  },
  /* ─────────────────────── Case Studies ──────────────────────── */
  {
    name: "Industrial Motor Interlock (FBD Case Study)",
    category: "Case Studies",
    description: "Function Block Diagram representing a safety interlock logic. Uses AND/OR/NOT blocks equivalent to a real PLC FBD. Documentation link: /engigraph/ui-documentation-content.ts",
    build: () =>
      build(
        [
          { id: "start", kind: "INPUT", x: 80, y: 100, inputs: 0, label: "START_PB", on: false },
          { id: "stop", kind: "INPUT", x: 80, y: 180, inputs: 0, label: "STOP_PB", on: true },
          { id: "overload", kind: "INPUT", x: 80, y: 260, inputs: 0, label: "THERMAL_OL", on: false },
          { id: "not_stop", kind: "NOT", x: 220, y: 180, inputs: 1 },
          { id: "not_ol", kind: "NOT", x: 220, y: 260, inputs: 1 },
          { id: "or_latch", kind: "OR", x: 260, y: 120, inputs: 2 },
          { id: "and_safety", kind: "AND", x: 420, y: 150, inputs: 3 },
          { id: "motor_run", kind: "OUTPUT", x: 600, y: 160, inputs: 0, label: "MOTOR_COIL" },
        ],
        [
          { id: "w1", from: { gateId: "stop", pinIndex: 0 }, to: { gateId: "not_stop", pinIndex: 0 } },
          { id: "w2", from: { gateId: "overload", pinIndex: 0 }, to: { gateId: "not_ol", pinIndex: 0 } },
          { id: "w3", from: { gateId: "start", pinIndex: 0 }, to: { gateId: "or_latch", pinIndex: 0 } },
          { id: "w4", from: { gateId: "motor_run", pinIndex: 0 }, to: { gateId: "or_latch", pinIndex: 1 } }, // Feedback loop for latch
          { id: "w5", from: { gateId: "or_latch", pinIndex: 2 }, to: { gateId: "and_safety", pinIndex: 0 } },
          { id: "w6", from: { gateId: "not_stop", pinIndex: 1 }, to: { gateId: "and_safety", pinIndex: 1 } },
          { id: "w7", from: { gateId: "not_ol", pinIndex: 1 }, to: { gateId: "and_safety", pinIndex: 2 } },
          { id: "w8", from: { gateId: "and_safety", pinIndex: 3 }, to: { gateId: "motor_run", pinIndex: 0 } },
        ],
      ),
  },
  {
    name: "Pneumatic Clamp Logic (FBD Case Study)",
    category: "Case Studies",
    description: "Function Block Diagram for a pneumatic clamping fixture. Requires two-hand safety activation (AND gate) to trigger the cylinder extension. Documentation link: /engigraph/ui-documentation-content.ts",
    build: () =>
      build(
        [
          { id: "sw1", kind: "INPUT", x: 80, y: 100, inputs: 0, label: "LEFT_HAND_PB", on: false },
          { id: "sw2", kind: "INPUT", x: 80, y: 180, inputs: 0, label: "RIGHT_HAND_PB", on: false },
          { id: "guard", kind: "INPUT", x: 80, y: 260, inputs: 0, label: "GUARD_CLOSED", on: true },
          { id: "and_two_hand", kind: "AND", x: 260, y: 130, inputs: 2 },
          { id: "and_final", kind: "AND", x: 440, y: 190, inputs: 2 },
          { id: "solenoid", kind: "OUTPUT", x: 620, y: 200, inputs: 0, label: "SOL_EXTEND" },
        ],
        [
          { id: "w1", from: { gateId: "sw1", pinIndex: 0 }, to: { gateId: "and_two_hand", pinIndex: 0 } },
          { id: "w2", from: { gateId: "sw2", pinIndex: 0 }, to: { gateId: "and_two_hand", pinIndex: 1 } },
          { id: "w3", from: { gateId: "and_two_hand", pinIndex: 2 }, to: { gateId: "and_final", pinIndex: 0 } },
          { id: "w4", from: { gateId: "guard", pinIndex: 0 }, to: { gateId: "and_final", pinIndex: 1 } },
          { id: "w5", from: { gateId: "and_final", pinIndex: 2 }, to: { gateId: "solenoid", pinIndex: 0 } },
        ],
      ),
  }
];
