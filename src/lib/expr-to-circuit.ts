/**
 * Boolean expression → Circuit converter.
 *
 * Supported syntax:
 *   Variables : A  B  C  (uppercase)
 *   AND       : A AND B  |  A & B  |  A · B  |  A * B  |  AB (juxtaposition)
 *   OR        : A OR B   |  A | B  |  A + B
 *   NOT       : NOT A    |  !A     |  ~A     |  A' (postfix)
 *   XOR       : A XOR B  |  A ^ B
 *   NAND      : A NAND B
 *   NOR       : A NOR B
 *   XNOR      : A XNOR B
 *   Parens    : (A + B) · C
 */

import { pinsFor } from "./component-defs";
import type { Circuit, Gate, GateKind, Wire } from "./types";

// ── Tokeniser ────────────────────────────────────────────────────────────────

type TokenKind =
  | "VAR" | "LPAREN" | "RPAREN"
  | "AND" | "OR" | "NOT" | "XOR" | "NAND" | "NOR" | "XNOR"
  | "PRIME" | "EOF";

interface Token { kind: TokenKind; value: string }

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === "(") { tokens.push({ kind: "LPAREN", value: "(" }); i++; continue; }
    if (ch === ")") { tokens.push({ kind: "RPAREN", value: ")" }); i++; continue; }
    if (ch === "'") { tokens.push({ kind: "PRIME", value: "'" }); i++; continue; }
    if (ch === "!") { tokens.push({ kind: "NOT", value: "NOT" }); i++; continue; }
    if (ch === "~") { tokens.push({ kind: "NOT", value: "NOT" }); i++; continue; }
    if (ch === "&") { tokens.push({ kind: "AND", value: "AND" }); i++; continue; }
    if (ch === "|") { tokens.push({ kind: "OR", value: "OR" }); i++; continue; }
    if (ch === "+") { tokens.push({ kind: "OR", value: "OR" }); i++; continue; }
    if (ch === "\u00b7" || ch === "*") { tokens.push({ kind: "AND", value: "AND" }); i++; continue; }
    if (ch === "^") { tokens.push({ kind: "XOR", value: "XOR" }); i++; continue; }
    if (/[A-Za-z_]/.test(ch)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
      const word = src.slice(i, j).toUpperCase();
      if (word === "AND")       tokens.push({ kind: "AND",  value: "AND"  });
      else if (word === "OR")   tokens.push({ kind: "OR",   value: "OR"   });
      else if (word === "NOT")  tokens.push({ kind: "NOT",  value: "NOT"  });
      else if (word === "XOR")  tokens.push({ kind: "XOR",  value: "XOR"  });
      else if (word === "NAND") tokens.push({ kind: "NAND", value: "NAND" });
      else if (word === "NOR")  tokens.push({ kind: "NOR",  value: "NOR"  });
      else if (word === "XNOR") tokens.push({ kind: "XNOR", value: "XNOR" });
      else tokens.push({ kind: "VAR", value: src.slice(i, j).toUpperCase() });
      i = j;
      continue;
    }
    i++;
  }
  tokens.push({ kind: "EOF", value: "" });
  return tokens;
}

// ── AST ─────────────────────────────────────────────────────────────────────

type AstNode =
  | { type: "VAR"; name: string }
  | { type: "NOT"; child: AstNode }
  | { type: "AND" | "OR" | "XOR" | "NAND" | "NOR" | "XNOR"; left: AstNode; right: AstNode };

// ── Parser (recursive descent) ───────────────────────────────────────────────

class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}
  private peek(): Token { return this.tokens[this.pos]; }
  private consume(): Token { return this.tokens[this.pos++]; }
  private match(...kinds: TokenKind[]): boolean { return kinds.includes(this.peek().kind); }

  parse(): AstNode { return this.parseXnor(); }

  private parseXnor(): AstNode {
    let left = this.parseNor();
    while (this.match("XNOR")) { this.consume(); left = { type: "XNOR", left, right: this.parseNor() }; }
    return left;
  }
  private parseNor(): AstNode {
    let left = this.parseOr();
    while (this.match("NOR")) { this.consume(); left = { type: "NOR", left, right: this.parseOr() }; }
    return left;
  }
  private parseOr(): AstNode {
    let left = this.parseNand();
    while (this.match("OR")) { this.consume(); left = { type: "OR", left, right: this.parseNand() }; }
    return left;
  }
  private parseNand(): AstNode {
    let left = this.parseXor();
    while (this.match("NAND")) { this.consume(); left = { type: "NAND", left, right: this.parseXor() }; }
    return left;
  }
  private parseXor(): AstNode {
    let left = this.parseAnd();
    while (this.match("XOR")) { this.consume(); left = { type: "XOR", left, right: this.parseAnd() }; }
    return left;
  }
  private parseAnd(): AstNode {
    let left = this.parseNot();
    while (this.match("AND") || this.isImplicitAnd()) {
      if (this.match("AND")) this.consume();
      left = { type: "AND", left, right: this.parseNot() };
    }
    return left;
  }
  private isImplicitAnd(): boolean {
    const t = this.peek();
    return t.kind === "VAR" || t.kind === "LPAREN" || t.kind === "NOT";
  }
  private parseNot(): AstNode {
    if (this.match("NOT")) { this.consume(); return { type: "NOT", child: this.parseNot() }; }
    return this.parsePostfix();
  }
  private parsePostfix(): AstNode {
    let node = this.parseAtom();
    while (this.match("PRIME")) { this.consume(); node = { type: "NOT", child: node }; }
    return node;
  }
  private parseAtom(): AstNode {
    const t = this.peek();
    if (t.kind === "VAR") { this.consume(); return { type: "VAR", name: t.value }; }
    if (t.kind === "LPAREN") {
      this.consume();
      const inner = this.parse();
      if (this.peek().kind === "RPAREN") this.consume();
      return inner;
    }
    this.consume();
    return { type: "VAR", name: "?" };
  }
}

// ── Circuit builder ──────────────────────────────────────────────────────────

let _idCounter = 0;
function newId(prefix: string): string { return `${prefix}_${(++_idCounter).toString(36)}`; }

function computeDepths(node: AstNode, depths: Map<AstNode, number>): number {
  if (depths.has(node)) return depths.get(node)!;
  let d = 0;
  if (node.type === "VAR") d = 0;
  else if (node.type === "NOT") d = computeDepths(node.child, depths) + 1;
  else d = Math.max(computeDepths(node.left, depths), computeDepths(node.right, depths)) + 1;
  depths.set(node, d);
  return d;
}

function collectVars(node: AstNode, vars: Set<string>): void {
  if (node.type === "VAR") vars.add(node.name);
  else if (node.type === "NOT") collectVars(node.child, vars);
  else { collectVars(node.left, vars); collectVars(node.right, vars); }
}

function getOutPinIdx(gate: Gate): number {
  const pins = pinsFor(gate);
  const idx = pins.findIndex(p => p.type === "out");
  return idx >= 0 ? idx : 0;
}

function getInPinIdx(gate: Gate, nth: number): number {
  const pins = pinsFor(gate);
  let n = 0;
  for (let i = 0; i < pins.length; i++) {
    if (pins[i].type === "in") { if (n === nth) return i; n++; }
  }
  return 0;
}

type BuildCtx = {
  gates: Record<string, Gate>;
  wires: Record<string, Wire>;
  varInputs: Record<string, string>;
  nodeIds: Map<AstNode, string>;
  depthOf: Map<AstNode, number>;
  levelCounters: Map<number, number>;
};

function buildGate(node: AstNode, ctx: BuildCtx): string {
  if (ctx.nodeIds.has(node)) return ctx.nodeIds.get(node)!;

  if (node.type === "VAR") {
    const id = ctx.varInputs[node.name] ?? ctx.varInputs["?"] ?? Object.keys(ctx.varInputs)[0];
    ctx.nodeIds.set(node, id);
    return id;
  }

  const depth = ctx.depthOf.get(node) ?? 0;
  const levelIdx = ctx.levelCounters.get(depth) ?? 0;
  ctx.levelCounters.set(depth, levelIdx + 1);
  const levelX = 160 + depth * 170;
  const levelY = levelIdx * 90;

  if (node.type === "NOT") {
    const childId = buildGate(node.child, ctx);
    const id = newId("not");
    const gate: Gate = { id, kind: "NOT", x: levelX, y: levelY, inputs: 1 };
    ctx.gates[id] = gate;
    const w = newId("w");
    ctx.wires[w] = { id: w, from: { gateId: childId, pinIndex: getOutPinIdx(ctx.gates[childId]) }, to: { gateId: id, pinIndex: getInPinIdx(gate, 0) } };
    ctx.nodeIds.set(node, id);
    return id;
  }

  const leftId = buildGate(node.left, ctx);
  const rightId = buildGate(node.right, ctx);

  const kind: GateKind = node.type === "AND" ? "AND"
    : node.type === "OR" ? "OR"
    : node.type === "XOR" ? "XOR"
    : node.type === "NAND" ? "NAND"
    : node.type === "NOR" ? "NOR"
    : "XNOR";

  const id = newId("g");
  const gate: Gate = { id, kind, x: levelX, y: levelY, inputs: 2 };
  ctx.gates[id] = gate;

  const w1 = newId("w"); const w2 = newId("w");
  ctx.wires[w1] = { id: w1, from: { gateId: leftId, pinIndex: getOutPinIdx(ctx.gates[leftId]) }, to: { gateId: id, pinIndex: getInPinIdx(gate, 0) } };
  ctx.wires[w2] = { id: w2, from: { gateId: rightId, pinIndex: getOutPinIdx(ctx.gates[rightId]) }, to: { gateId: id, pinIndex: getInPinIdx(gate, 1) } };

  ctx.nodeIds.set(node, id);
  return id;
}

/** Spread nodes vertically within each level for readable layout */
function spreadLevels(gates: Record<string, Gate>, baseX: number, baseY: number): void {
  const byLevel = new Map<number, Gate[]>();
  for (const g of Object.values(gates)) {
    const lvl = Math.round((g.x - 160) / 170);
    if (!byLevel.has(lvl)) byLevel.set(lvl, []);
    byLevel.get(lvl)!.push(g);
  }
  const maxCount = Math.max(...Array.from(byLevel.values()).map(a => a.length), 1);
  const totalH = maxCount * 90;
  for (const gates of byLevel.values()) {
    const count = gates.length;
    const spacing = totalH / (count + 1);
    gates.forEach((g, i) => { g.y = baseY + spacing * (i + 1); });
  }
}

/** Parse expression and build a Circuit ready to merge into the editor. */
export function exprToCircuit(
  expression: string,
  baseX = 60,
  baseY = 60
): { circuit: Circuit; vars: string[]; error?: string } {
  _idCounter = Math.floor(Math.random() * 9999);
  try {
    const tokens = tokenize(expression.trim());
    const ast = new Parser(tokens).parse();

    const varSet = new Set<string>();
    collectVars(ast, varSet);
    const vars = Array.from(varSet).sort();

    const depthOf = new Map<AstNode, number>();
    computeDepths(ast, depthOf);

    const ctx: BuildCtx = {
      gates: {}, wires: {},
      varInputs: {}, nodeIds: new Map(),
      depthOf, levelCounters: new Map(),
    };

    // Place INPUT gates
    vars.forEach((name, i) => {
      const id = newId("inp");
      const gate: Gate = { id, kind: "INPUT", x: baseX, y: baseY + i * 80, inputs: 0, label: name, on: false };
      ctx.gates[id] = gate;
      ctx.varInputs[name] = id;
    });

    // Build logic tree
    const rootId = buildGate(ast, ctx);

    // Add OUTPUT gate
    const maxX = Math.max(...Object.values(ctx.gates).map(g => g.x));
    const outId = newId("out");
    const outGate: Gate = { id: outId, kind: "OUTPUT", x: maxX + 170, y: 0, inputs: 0, label: "OUT" };
    ctx.gates[outId] = outGate;
    const ow = newId("w");
    ctx.wires[ow] = { id: ow, from: { gateId: rootId, pinIndex: getOutPinIdx(ctx.gates[rootId]) }, to: { gateId: outId, pinIndex: 0 } };

    // Auto-layout
    spreadLevels(ctx.gates, baseX, baseY);
    // Put OUTPUT at midpoint Y
    const ys = Object.values(ctx.gates).filter(g => g.id !== outId).map(g => g.y);
    if (ys.length) outGate.y = ys.reduce((a, b) => a + b, 0) / ys.length;

    return { circuit: { gates: ctx.gates, wires: ctx.wires }, vars };
  } catch (e) {
    return { circuit: { gates: {}, wires: {} }, vars: [], error: e instanceof Error ? e.message : "Parse error" };
  }
}
