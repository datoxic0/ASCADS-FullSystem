import { CircuitDesign, Component, Connection, ComponentType } from './types';
import { COMPONENT_DEFINITIONS } from './constants';

export interface TruthTableRow {
  inputs: Record<string, boolean>;
  outputs: Record<string, boolean>;
}

export class LogicAnalyzer {
  /**
   * Generates a truth table for the given logic circuit.
   */
  static generateTruthTable(design: CircuitDesign): TruthTableRow[] {
    const inputs = design.components.filter(c => 
      c.type === 'SWITCH' || c.type === 'PUSH_BUTTON' || c.type === 'TOGGLE_SWITCH'
    );
    const outputs = design.components.filter(c => 
      c.type === 'LED' || c.type === 'BUZZER' || c.type === 'SPEAKER'
    );

    if (inputs.length === 0 || inputs.length > 8) return []; // Limit to 8 inputs for performance

    const rowCount = Math.pow(2, inputs.length);
    const table: TruthTableRow[] = [];

    for (let i = 0; i < rowCount; i++) {
      const inputStates: Record<string, boolean> = {};
      inputs.forEach((input, inputIdx) => {
        inputStates[input.label || input.id] = !!((i >> (inputs.length - 1 - inputIdx)) & 1);
      });

      const outputStates: Record<string, boolean> = {};
      outputs.forEach(output => {
        outputStates[output.label || output.id] = this.evaluateNode(design, output.id, inputStates);
      });

      table.push({ inputs: inputStates, outputs: outputStates });
    }

    return table;
  }

  /**
   * Generates an adjacency matrix for the logic graph.
   */
  static generateAdjacencyMatrix(design: CircuitDesign): { labels: string[], matrix: number[][] } {
    const nodes = design.components.filter(c => 
      c.type.startsWith('LOGIC_') || 
      c.type.includes('GATE') || 
      ['SWITCH', 'PUSH_BUTTON', 'TOGGLE_SWITCH', 'LED', 'BUZZER', 'SPEAKER'].includes(c.type)
    );
    const labels = nodes.map(n => n.label || n.id.slice(0, 4));
    const size = nodes.length;
    const matrix = Array.from({ length: size }, () => Array(size).fill(0));

    design.connections.forEach(conn => {
      const fromIdx = nodes.findIndex(n => n.id === conn.from);
      const toIdx = nodes.findIndex(n => n.id === conn.to);
      if (fromIdx !== -1 && toIdx !== -1) {
        matrix[fromIdx][toIdx] = 1;
      }
    });

    return { labels, matrix };
  }

  private static evaluateNode(design: CircuitDesign, nodeId: string, inputStates: Record<string, boolean>, visited = new Set<string>()): boolean {
    if (visited.has(nodeId)) return false; // Cycle detection
    visited.add(nodeId);

    const comp = design.components.find(c => c.id === nodeId);
    if (!comp) return false;

    // Check if it's an input we already have a state for
    const label = comp.label || comp.id;
    if (inputStates.hasOwnProperty(label)) {
      return inputStates[label];
    }

    // Trace connections back
    const incoming = design.connections.filter(conn => conn.to === nodeId);
    const inputValues = incoming.map(conn => this.evaluateNode(design, conn.from, inputStates, new Set(visited)));

    switch (comp.type) {
      case 'LOGIC_AND': return inputValues.length >= 2 && inputValues.every(v => v);
      case 'LOGIC_OR': return inputValues.some(v => v);
      case 'LOGIC_NOT': return inputValues.length > 0 && !inputValues[0];
      case 'NAND_GATE': return !(inputValues.length >= 2 && inputValues.every(v => v));
      case 'NOR_GATE': return !(inputValues.some(v => v));
      case 'XOR_GATE': return inputValues.filter(v => v).length % 2 !== 0;
      case 'XNOR_GATE': return inputValues.filter(v => v).length % 2 === 0;
      case 'LED':
      case 'BUZZER':
      case 'SPEAKER':
        return inputValues.some(v => v);
      default: return false;
    }
  }

  /**
   * Generates a Boolean expression string for a given output node.
   */
  static getExpression(design: CircuitDesign, nodeId: string, visited = new Set<string>()): string {
    if (visited.has(nodeId)) return '?';
    visited.add(nodeId);

    const comp = design.components.find(c => c.id === nodeId);
    if (!comp) return '';

    if (comp.type === 'SWITCH' || comp.type === 'PUSH_BUTTON' || comp.type === 'TOGGLE_SWITCH') {
      return comp.label || comp.id.slice(0, 4);
    }

    const incoming = design.connections.filter(conn => conn.to === nodeId);
    const inputExprs = incoming.map(conn => this.getExpression(design, conn.from, new Set(visited)));

    if (inputExprs.length === 0) return '0';

    switch (comp.type) {
      case 'LOGIC_AND': return `(${inputExprs.join(' ⋅ ')})`;
      case 'LOGIC_OR': return `(${inputExprs.join(' + ')})`;
      case 'LOGIC_NOT': return `¬(${inputExprs[0]})`;
      case 'NAND_GATE': return `¬(${inputExprs.join(' ⋅ ')})`;
      case 'NOR_GATE': return `¬(${inputExprs.join(' + ')})`;
      case 'XOR_GATE': return `(${inputExprs.join(' ⊕ ')})`;
      case 'XNOR_GATE': return `¬(${inputExprs.join(' ⊕ ')})`;
      default: return inputExprs[0] || '0';
    }
  }

  /**
   * Analyzes the circuit for complexity metrics.
   */
  static analyzeCircuit(design: CircuitDesign) {
    const components = design.components;
    const gates = components.filter(c => c.type.startsWith('LOGIC_') || c.type.includes('GATE'));
    const inputs = components.filter(c => ['SWITCH', 'PUSH_BUTTON', 'TOGGLE_SWITCH'].includes(c.type));
    const outputs = components.filter(c => ['LED', 'BUZZER', 'SPEAKER'].includes(c.type));
    
    // Simple depth calculation (max path from input to output)
    const getDepth = (nodeId: string, visited = new Set<string>()): number => {
        if (visited.has(nodeId)) return 0;
        visited.add(nodeId);
        const incoming = design.connections.filter(c => c.to === nodeId);
        if (incoming.length === 0) return 0;
        return 1 + Math.max(...incoming.map(c => getDepth(c.from, new Set(visited))));
    };

    const maxDepth = outputs.length > 0 ? Math.max(...outputs.map(o => getDepth(o.id))) : 0;

    return {
        gateCount: gates.length,
        inputCount: inputs.length,
        outputCount: outputs.length,
        maxDepth,
        connectionCount: design.connections.length
    };
  }

  /**
   * Generates Sum of Products (SOP) canonical form.
   */
  static generateSOP(table: TruthTableRow[], outputName: string): string {
    const activeRows = table.filter(row => row.outputs[outputName]);
    if (activeRows.length === 0) return '0';
    if (activeRows.length === table.length) return '1';

    return activeRows.map(row => {
      const terms = Object.entries(row.inputs).map(([name, val]) => val ? name : `¬${name}`);
      return terms.length > 1 ? `(${terms.join(' ⋅ ')})` : terms[0];
    }).join(' + ');
  }

  /**
   * Generates Product of Sums (POS) canonical form.
   */
  static generatePOS(table: TruthTableRow[], outputName: string): string {
    const inactiveRows = table.filter(row => !row.outputs[outputName]);
    if (inactiveRows.length === 0) return '1';
    if (inactiveRows.length === table.length) return '0';

    return inactiveRows.map(row => {
      const terms = Object.entries(row.inputs).map(([name, val]) => val ? `¬${name}` : name);
      return terms.length > 1 ? `(${terms.join(' + ')})` : terms[0];
    }).join(' ⋅ ');
  }

  /**
   * Basic simplification using Boolean identities.
   */
  static simplify(expr: string): string {
      let simplified = expr;
      const rules = [
        { pattern: /¬\(¬\((.*?)\)\)/g, replacement: '$1' }, // Double negative
        { pattern: /\((.*?) ⋅ 1\)/g, replacement: '$1' },   // Identity AND
        { pattern: /\(1 ⋅ (.*?)\)/g, replacement: '$1' },   // Identity AND
        { pattern: /\((.*?) \+ 0\)/g, replacement: '$1' },  // Identity OR
        { pattern: /\(0 \+ (.*?)\)/g, replacement: '$1' },  // Identity OR
        { pattern: /\((.*?) ⋅ 0\)/g, replacement: '0' },    // Null AND
        { pattern: /\(0 ⋅ (.*?)\)/g, replacement: '0' },    // Null AND
        { pattern: /\((.*?) \+ 1\)/g, replacement: '1' },   // Null OR
        { pattern: /\(1 \+ (.*?)\)/g, replacement: '1' },   // Null OR
        { pattern: /\((.*?) \+ \1\)/g, replacement: '$1' },  // Idempotent OR
        { pattern: /\((.*?) ⋅ \1\)/g, replacement: '$1' },  // Idempotent AND
      ];

      // Apply rules repeatedly until no more changes
      let last = '';
      let iterations = 0;
      while (simplified !== last && iterations < 5) {
          last = simplified;
          rules.forEach(rule => {
              simplified = simplified.replace(rule.pattern, rule.replacement);
          });
          iterations++;
      }
      return simplified;
  }

  /**
   * Compiles a Boolean expression into a CircuitDesign.
   * Format example: (A + B) . ¬C
   */
  static compileToDesign(expression: string): CircuitDesign {
    const design: CircuitDesign = { components: [], connections: [] };
    
    // Helper to add component and return its ID
    const addComp = (type: ComponentType, label: string, x: number, y: number) => {
        const id = Math.random().toString(36).substr(2, 9);
        design.components.push({
            id, type, label, x, y, rotation: 0, 
            properties: type === 'SWITCH' ? { state: 'Open', label } : {}
        });
        return id;
    };

    // Helper to get output pin for a component type
    const getOutPin = (compId: string) => {
        const comp = design.components.find(c => c.id === compId);
        if (!comp) return 1;
        const def = COMPONENT_DEFINITIONS[comp.type];
        return def.pins.length - 1; // Last pin is usually output
    };

    const parse = (expr: string, x: number, y: number, height: number): string => {
        expr = expr.trim();

        // Unwrap unnecessary parentheses
        while (expr.startsWith('(') && expr.endsWith(')')) {
            let level = 0;
            let isWrapping = true;
            for (let i = 0; i < expr.length - 1; i++) {
                if (expr[i] === '(') level++;
                else if (expr[i] === ')') level--;
                if (level === 0 && i < expr.length - 1) {
                    isWrapping = false;
                    break;
                }
            }
            if (isWrapping) expr = expr.slice(1, -1).trim();
            else break;
        }

        // Check for OR (+)
        let level = 0;
        for (let i = expr.length - 1; i >= 0; i--) {
            if (expr[i] === ')') level++;
            else if (expr[i] === '(') level--;
            else if (level === 0 && expr[i] === '+') {
                const left = expr.slice(0, i);
                const right = expr.slice(i + 1);
                const orId = addComp('LOGIC_OR', 'OR', x, y);
                const lId = parse(left, x - 150, y - height/4, height/2);
                const rId = parse(right, x - 150, y + height/4, height/2);
                design.connections.push({ id: Math.random().toString(36), from: lId, fromPin: getOutPin(lId), to: orId, toPin: 0 });
                design.connections.push({ id: Math.random().toString(36), from: rId, fromPin: getOutPin(rId), to: orId, toPin: 1 });
                return orId;
            }
        }

        // Check for XOR (⊕, ^)
        level = 0;
        for (let i = expr.length - 1; i >= 0; i--) {
            if (expr[i] === ')') level++;
            else if (expr[i] === '(') level--;
            else if (level === 0 && (expr[i] === '⊕' || expr[i] === '^')) {
                const left = expr.slice(0, i);
                const right = expr.slice(i + 1);
                const xorId = addComp('XOR_GATE', 'XOR', x, y);
                const lId = parse(left, x - 150, y - height/4, height/2);
                const rId = parse(right, x - 150, y + height/4, height/2);
                design.connections.push({ id: Math.random().toString(36), from: lId, fromPin: getOutPin(lId), to: xorId, toPin: 0 });
                design.connections.push({ id: Math.random().toString(36), from: rId, fromPin: getOutPin(rId), to: xorId, toPin: 1 });
                return xorId;
            }
        }

        // Check for AND (., ⋅)
        level = 0;
        for (let i = expr.length - 1; i >= 0; i--) {
            if (expr[i] === ')') level++;
            else if (expr[i] === '(') level--;
            else if (level === 0 && (expr[i] === '.' || expr[i] === '⋅')) {
                const left = expr.slice(0, i);
                const right = expr.slice(i + 1);
                const andId = addComp('LOGIC_AND', 'AND', x, y);
                const lId = parse(left, x - 150, y - height/4, height/2);
                const rId = parse(right, x - 150, y + height/4, height/2);
                design.connections.push({ id: Math.random().toString(36), from: lId, fromPin: getOutPin(lId), to: andId, toPin: 0 });
                design.connections.push({ id: Math.random().toString(36), from: rId, fromPin: getOutPin(rId), to: andId, toPin: 1 });
                return andId;
            }
        }

        // Check for NOT (¬, !)
        if (expr.startsWith('¬') || expr.startsWith('!')) {
            const notId = addComp('LOGIC_NOT', 'NOT', x, y);
            const subId = parse(expr.slice(1).trim(), x - 100, y, height);
            design.connections.push({ id: Math.random().toString(36), from: subId, fromPin: getOutPin(subId), to: notId, toPin: 0 });
            return notId;
        }

        // Leaf Node: Switch
        // Clean up labels (variables like A, B, C)
        const label = expr.replace(/[^a-zA-Z0-9_]/g, '');
        return addComp('SWITCH', label || 'IN', x, y);
    };

    try {
        const rootId = parse(expression, 600, 400, 600);
        const ledId = addComp('LED', 'OUT', 800, 400);
        design.connections.push({ id: Math.random().toString(36), from: rootId, fromPin: getOutPin(rootId), to: ledId, toPin: 0 });
    } catch (e) {
        console.error("Compilation failed:", e);
    }

    return design;
  }

  private static tokenize(expr: string): string[] {
      return expr.match(/\(|\)|¬|\+|⋅|\.|\w+/g) || [];
  }
}
