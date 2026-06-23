import { CircuitDesign, Component, Connection, ComponentType } from '../types';
import { COMPONENT_DEFINITIONS } from '../constants';

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

    const outputExprs: Record<string, string> = {};
    outputs.forEach(o => {
        outputExprs[o.id] = this.getExpression(design, o.id);
    });

    for (let i = 0; i < rowCount; i++) {
      const inputStates: Record<string, boolean> = {};
      inputs.forEach((input, inputIdx) => {
        inputStates[input.label || input.id] = !!((i >> (inputs.length - 1 - inputIdx)) & 1);
      });

      const outputStates: Record<string, boolean> = {};
      outputs.forEach(output => {
        outputStates[output.label || output.id] = this.evaluateExpression(outputExprs[output.id], inputStates);
      });

      table.push({ inputs: inputStates, outputs: outputStates });
    }

    return table;
  }

  /**
   * Generates an adjacency matrix for the logic graph, tracing through passive nodes.
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

    // Build an undirected adjacency list for the entire graph
    const graph: Record<string, string[]> = {};
    design.connections.forEach(conn => {
      if (!graph[conn.from]) graph[conn.from] = [];
      if (!graph[conn.to]) graph[conn.to] = [];
      graph[conn.from].push(conn.to);
      graph[conn.to].push(conn.from);
    });

    // BFS from each logic node to find reachable logic nodes
    nodes.forEach((startNode, startIdx) => {
      const queue = [startNode.id];
      const visited = new Set<string>([startNode.id]);
      
      while (queue.length > 0) {
        const curr = queue.shift()!;
        
        for (const neighbor of (graph[curr] || [])) {
          if (visited.has(neighbor)) continue;
          visited.add(neighbor);
          
          const neighborIdx = nodes.findIndex(n => n.id === neighbor);
          if (neighborIdx !== -1) {
            matrix[startIdx][neighborIdx] = 1;
            // Stop traversing through logic nodes
          } else {
            // Traverse through passive components (wires, junctions, etc)
            queue.push(neighbor);
          }
        }
      }
    });

    return { labels, matrix };
  }

  static evaluateExpression(expr: string, inputStates: Record<string, boolean>): boolean {
    if (!expr || expr === '0' || expr === '?') return false;
    if (expr === '1') return true;

    let safeExpr = expr
        .replace(/¬/g, '!')
        .replace(/⋅/g, '&')
        .replace(/\+/g, '|')
        .replace(/⊕/g, '^');

    const keys = Object.keys(inputStates).sort((a, b) => b.length - a.length);
    for (const key of keys) {
        const escapedKey = key.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
        const regex = new RegExp(`\\b${escapedKey}\\b`, 'g');
        safeExpr = safeExpr.replace(regex, inputStates[key] ? '1' : '0');
    }

    try {
        return new Function(`return !!(${safeExpr});`)();
    } catch (e) {
        return false;
    }
  }

  static extractTopologicalExpression(design: CircuitDesign, targetId: string): string {
    const paths: string[][] = [];
    
    const findPaths = (currentNodeId: string, currentPath: string[], visited: Set<string>) => {
      if (visited.has(currentNodeId)) return;
      
      const comp = design.components.find(c => c.id === currentNodeId);
      if (!comp) return;

      const isSwitch = ['SWITCH', 'PUSH_BUTTON', 'TOGGLE_SWITCH', 'RELAY', 'REED_RELAY', 'LADDER_CONTACT_NO', 'LADDER_CONTACT_NC'].includes(comp.type);
      
      const newPath = [...currentPath];
      if (isSwitch) {
        let label = comp.label || comp.id.slice(0, 4);
        if (comp.type === 'LADDER_CONTACT_NC') label = `¬${label}`;
        newPath.push(label);
      }

      const connectedIds = design.connections
        .filter(conn => conn.to === currentNodeId || conn.from === currentNodeId)
        .map(conn => conn.from === currentNodeId ? conn.to : conn.from)
        .filter(id => id !== currentNodeId);

      const unvisitedConnected = connectedIds.filter(id => !visited.has(id));
      const newVisited = new Set(visited);
      newVisited.add(currentNodeId);

      let isSource = false;
      if (comp.type === 'BATTERY' || comp.type === 'GROUND') {
          isSource = true;
      } else if (isSwitch && unvisitedConnected.length === 0) {
          isSource = true;
      }

      if (isSource) {
         if (newPath.length > 0) paths.push(newPath);
         return;
      }

      unvisitedConnected.forEach(nextId => {
        findPaths(nextId, newPath, newVisited);
      });
    };

    findPaths(targetId, [], new Set());

    if (paths.length === 0) return '0';

    const terms = paths.map(path => {
       const uniqueSwitches = Array.from(new Set(path));
       if (uniqueSwitches.length === 1) return uniqueSwitches[0];
       return `(${uniqueSwitches.join(' ⋅ ')})`;
    });

    const uniqueTerms = Array.from(new Set(terms));
    if (uniqueTerms.length === 1) return uniqueTerms[0];
    return `(${uniqueTerms.join(' + ')})`;
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

    const isIncomingConnection = (conn: Connection) => {
      // For endpoints, any connection is an input
      if (['LED', 'BUZZER', 'SPEAKER', 'LADDER_COIL'].includes(comp.type)) {
          return conn.to === nodeId || conn.from === nodeId;
      }
      
      // For gates, inputs are all pins except the last one (which is output)
      const def = COMPONENT_DEFINITIONS[comp.type as ComponentType];
      if (!def) return conn.to === nodeId;
      
      const outPin = def.pins.length - 1;
      if (conn.to === nodeId) return conn.toPin !== outPin;
      if (conn.from === nodeId) return conn.fromPin !== outPin;
      return false;
    };

    const incoming = design.connections.filter(isIncomingConnection);

    if (['LED', 'BUZZER', 'SPEAKER', 'LADDER_COIL'].includes(comp.type)) {
        const isAnalogDriven = incoming.some(conn => {
            const connectedId = conn.from === nodeId ? conn.to : conn.from;
            const c = design.components.find(x => x.id === connectedId);
            return c && !c.type.startsWith('LOGIC_') && !c.type.includes('GATE');
        });

        if (isAnalogDriven) {
            return this.extractTopologicalExpression(design, nodeId);
        }
    }

    const inputExprs = incoming.map(conn => {
        const connectedId = conn.from === nodeId ? conn.to : conn.from;
        return this.getExpression(design, connectedId, new Set(visited));
    });

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
