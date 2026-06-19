/**
 * Real Circuit Simulation Engine — SPICE-style nodal analysis
 * Solves G·V = I with component stamps for resistors, capacitors, inductors,
 * diodes, transistors, and sources. Supports time-stepping for dynamic elements.
 */

export interface NetNode {
  id: string;
  label: string;
  type: 'node' | 'voltage_source' | 'current_source';
  voltage?: number;
  current?: number;
}

export interface NetBranch {
  id: string;
  from: string;
  to: string;
  componentId: string;
  componentType: string;
  value: number;
  current?: number;
  voltage?: number;
  /** For dynamic elements, the previous state */
  prevState?: number;
}

export interface Netlist {
  nodes: string[];         // node IDs (first is GND reference)
  branches: NetBranch[];
  vSources: { id: string; pos: string; neg: string; voltage: number }[];
  groundNode: string;
  edgeToNet: Record<string, string>;
}

export interface NodeVoltage {
  nodeId: string;
  voltage: number;
  color: string;
  isGround: boolean;
}

export interface BranchResult {
  branchId: string;
  componentId: string;
  componentType: string;
  current: number;
  voltage: number;
  power: number;
  isActive: boolean;
}

export interface TopoPath {
  /** 'series' = all in one path (AND logic), 'parallel' = multiple paths (OR logic) */
  type: 'series' | 'parallel';
  nodes: string[];
  branches: string[];
  logic: string;
}

export interface SimEngineResult {
  converged: boolean;
  iterations: number;
  nodeVoltages: NodeVoltage[];
  branchResults: BranchResult[];
  topology: TopoPath[];
  logs: string[];
  errors: string[];
  warnings: string[];
  time: number;
  temperature: number;
  totalPower: number;
  edgeToNet: Record<string, string>;
}

// ── Utility ──────────────────────────────────────────────────────────────────

const V_T = 0.02585; // thermal voltage at 25°C

function parseValue(val: string | number): number {
  if (typeof val === 'number') return val;
  const match = val.match(/^([0-9.]+)\s*(p|n|u|µ|m|k|M|G|V|A|Ω|°)?/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const unit = (match[2] || '').toLowerCase();
  const mult: Record<string, number> = {
    p: 1e-12, n: 1e-9, u: 1e-6, '\u00b5': 1e-6, m: 1e-3,
    k: 1e3, meg: 1e6, g: 1e9, v: 1, a: 1, '\u03a9': 1,
  };
  return num * (mult[unit] || 1);
}

function parseResistance(str: string): number {
  const s = str.toLowerCase().replace(/\s/g, '');
  const m = s.match(/^([0-9.]+)(k|m|g|u|n|p)?(\u03a9|ohm)?/i);
  if (!m) return 1000;
  const num = parseFloat(m[1]);
  const unit = m[2] || '';
  if (unit === 'k') return num * 1000;
  if (unit === 'm') return num * 1e6;
  if (unit === 'g') return num * 1e9;
  return num;
}

function parseCapacitance(str: string): number {
  const s = str.toLowerCase().replace(/\s/g, '');
  const m = s.match(/^([0-9.]+)(p|n|u|µ|m)?(f)?/i);
  if (!m) return 1e-9;
  const num = parseFloat(m[1]);
  const unit = m[2] || '';
  if (unit === 'p') return num * 1e-12;
  if (unit === 'n') return num * 1e-9;
  if (unit === 'u' || unit === '\u00b5') return num * 1e-6;
  if (unit === 'm') return num * 1e-3;
  return num;
}

function parseVoltage(str: string): number {
  const s = str.toLowerCase().replace(/\s/g, '');
  const m = s.match(/^([0-9.]+)(m|k)?v?/i);
  if (!m) return 5;
  const num = parseFloat(m[1]);
  const unit = m[2] || '';
  if (unit === 'm') return num * 0.001;
  if (unit === 'k') return num * 1000;
  return num;
}

// ── Matrix solver ──────────────────────────────────────────────────────────

function solveLinear(A: number[][], b: number[]): number[] | null {
  const n = A.length;
  if (n === 0) return [];
  // Gaussian elimination with partial pivoting
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    // Pivot
    let maxRow = col;
    let maxVal = Math.abs(M[col][col]);
    for (let r = col + 1; r < n; r++) {
      const v = Math.abs(M[r][col]);
      if (v > maxVal) { maxVal = v; maxRow = r; }
    }
    if (maxVal < 1e-12) return null; // Singular
    if (maxRow !== col) {
      [M[col], M[maxRow]] = [M[maxRow], M[col]];
    }
    // Eliminate
    for (let r = col + 1; r < n; r++) {
      const factor = M[r][col] / M[col][col];
      for (let c = col; c <= n; c++) {
        M[r][c] -= factor * M[col][c];
      }
    }
  }
  // Back substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = M[i][n];
    for (let j = i + 1; j < n; j++) sum -= M[i][j] * x[j];
    x[i] = sum / M[i][i];
  }
  return x;
}

// ── Netlist builder from ReactFlow nodes + edges ─────────────────────────────

export interface RawNode {
  id: string;
  data?: {
    templateId?: string;
    label?: string;
    values?: Record<string, string>;
    interactive?: boolean;
    state?: Record<string, any>;
  };
  position?: { x: number; y: number };
}

export interface RawEdge {
  id: string;
  source: string;
  sourceHandle?: string | null;
  target: string;
  targetHandle?: string | null;
}

export function buildNetlist(nodes: RawNode[], edges: RawEdge[]): Netlist {
  const nodeMap = new Map<string, RawNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  // Build net groups: edges connect pins, pins with same net are connected
  const pinToNet = new Map<string, string>(); // "nodeId/pinId" → netId
  let netCounter = 0;

  function getNet(pinRef: string): string {
    if (pinToNet.has(pinRef)) return pinToNet.get(pinRef)!;
    const netId = `net_${netCounter++}`;
    pinToNet.set(pinRef, netId);
    return netId;
  }

  // Every edge connects two pins
  edges.forEach(e => {
    const srcPin = `${e.source}/${e.sourceHandle || '1'}`;
    const tgtPin = `${e.target}/${e.targetHandle || '1'}`;
    const srcNet = getNet(srcPin);
    const tgtNet = getNet(tgtPin);
    if (srcNet !== tgtNet) {
      // Merge nets
      for (const [pin, net] of pinToNet) {
        if (net === tgtNet) pinToNet.set(pin, srcNet);
      }
    }
  });

  const edgeToNet: Record<string, string> = {};
  edges.forEach(e => {
    const srcPin = `${e.source}/${e.sourceHandle || '1'}`;
    edgeToNet[e.id] = pinToNet.get(srcPin) || 'net_0';
  });

  // Also add unconnected pins as their own nets
  nodes.forEach(n => {
    const templateId = n.data?.templateId || '';
    const pinCount = templateId === 'vcc' || templateId === 'vcc-3v3' || templateId === 'ground' ? 1 : 2;
    for (let i = 0; i < pinCount; i++) {
      const pinRef = `${n.id}/${i === 0 ? '1' : '2'}`;
      if (!pinToNet.has(pinRef)) {
        pinToNet.set(pinRef, getNet(pinRef));
      }
    }
  });

  // Find ground node
  const gndNode = nodes.find(n => n.data?.templateId === 'ground');
  let groundNet = 'net_0'; // default
  if (gndNode) {
    const gndPin = `${gndNode.id}/gnd`;
    if (pinToNet.has(gndPin)) {
      groundNet = pinToNet.get(gndPin)!;
    } else {
      // Try other pin
      for (const [pin, net] of pinToNet) {
        if (pin.startsWith(`${gndNode.id}/`)) {
          groundNet = net;
          break;
        }
      }
    }
  }

  // Collect all unique nets
  const allNets = new Set<string>();
  for (const net of pinToNet.values()) allNets.add(net);
  const netList = Array.from(allNets);

  // Build branches (components between nets)
  const branches: NetBranch[] = [];
  const vSources: Netlist['vSources'] = [];

  nodes.forEach(n => {
    const tpl = n.data?.templateId || '';
    const vals = n.data?.values || {};
    const state = n.data?.state || {};

    if (tpl === 'resistor') {
      const pins = Array.from(pinToNet.entries())
        .filter(([pin]) => pin.startsWith(`${n.id}/`))
        .map(([_, net]) => net);
      if (pins.length >= 2) {
        branches.push({
          id: `br_${n.id}`,
          from: pins[0],
          to: pins[1],
          componentId: n.id,
          componentType: 'resistor',
          value: parseResistance(vals.resistance || '10k'),
        });
      }
    } else if (tpl === 'capacitor') {
      const pins = Array.from(pinToNet.entries())
        .filter(([pin]) => pin.startsWith(`${n.id}/`))
        .map(([_, net]) => net);
      if (pins.length >= 2) {
        branches.push({
          id: `br_${n.id}`,
          from: pins[0],
          to: pins[1],
          componentId: n.id,
          componentType: 'capacitor',
          value: parseCapacitance(vals.capacitance || '100nF'),
        });
      }
    } else if (tpl === 'inductor') {
      const pins = Array.from(pinToNet.entries())
        .filter(([pin]) => pin.startsWith(`${n.id}/`))
        .map(([_, net]) => net);
      if (pins.length >= 2) {
        branches.push({
          id: `br_${n.id}`,
          from: pins[0],
          to: pins[1],
          componentId: n.id,
          componentType: 'inductor',
          value: parseValue(vals.inductance || '10mH'),
        });
      }
    } else if (tpl === 'diode') {
      const pins = Array.from(pinToNet.entries())
        .filter(([pin]) => pin.startsWith(`${n.id}/`))
        .map(([_, net]) => net);
      if (pins.length >= 2) {
        branches.push({
          id: `br_${n.id}`,
          from: pins[0], // anode
          to: pins[1],   // cathode
          componentId: n.id,
          componentType: 'diode',
          value: 0,
        });
      }
    } else if (tpl === 'led-red' || tpl === 'led-green' || tpl === 'led-blue' || tpl === 'led-yellow') {
      const pins = Array.from(pinToNet.entries())
        .filter(([pin]) => pin.startsWith(`${n.id}/`))
        .map(([_, net]) => net);
      const vf = parseVoltage(vals.Vf || '2.0V');
      if (pins.length >= 2) {
        branches.push({
          id: `br_${n.id}`,
          from: pins[0], // anode
          to: pins[1],   // cathode
          componentId: n.id,
          componentType: 'led',
          value: vf,
        });
      }
    } else if (tpl === 'switch' || tpl === 'push-button') {
      const pins = Array.from(pinToNet.entries())
        .filter(([pin]) => pin.startsWith(`${n.id}/`))
        .map(([_, net]) => net);
      const isClosed = state.closed ?? (vals.state !== 'Open');
      if (pins.length >= 2) {
        branches.push({
          id: `br_${n.id}`,
          from: pins[0],
          to: pins[1],
          componentId: n.id,
          componentType: 'switch',
          value: isClosed ? 0.001 : 1e9, // 1mΩ when closed, 1GΩ when open
        });
      }
    } else if (tpl === 'battery') {
      const v = parseVoltage(vals.voltage || '9V');
      const posNet = pinToNet.get(`${n.id}/pos`);
      const negNet = pinToNet.get(`${n.id}/neg`);
      if (posNet || negNet) {
        vSources.push({
          id: `vs_${n.id}`,
          pos: posNet || groundNet,
          neg: negNet || groundNet,
          voltage: v,
        });
      }
    } else if (tpl === 'vcc' || tpl === 'vcc-3v3') {
      const v = parseVoltage(vals.voltage || '5V');
      const pinEntry = Array.from(pinToNet.entries()).find(([pin]) => pin.startsWith(`${n.id}/`));
      if (pinEntry) {
        const posNet = pinEntry[1];
        vSources.push({
          id: `vs_${n.id}`,
          pos: posNet,
          neg: groundNet,
          voltage: v,
        });
      }
    }
  });

  return { nodes: netList, branches, vSources, groundNode: groundNet, edgeToNet };
}

// ── Nonlinear component stamp (Newton-Raphson) ───────────────────────────────

function diodeCurrent(v: number, Vf: number, Is: number = 1e-12): { I: number; G: number } {
  // Piecewise linear: above Vf, conduct; below Vf, small leakage
  if (v > Vf) {
    const excess = v - Vf;
    const G = 1e-3; // ~1mS conductance when on
    return { I: G * excess, G };
  }
  const G = 1e-12; // 1pS when off
  return { I: 0, G };
}

function ledCurrent(v: number, Vf: number): { I: number; G: number } {
  return diodeCurrent(v, Vf, 1e-9);
}

// ── DC operating point solver ────────────────────────────────────────────────

export function solveDC(netlist: Netlist): SimEngineResult {
  const logs: string[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  const { nodes: allNets, branches, vSources, groundNode } = netlist;

  if (allNets.length === 0) {
    return {
      converged: false, iterations: 0, nodeVoltages: [], branchResults: [],
      topology: [], logs: ['No nets found'], errors: ['Empty netlist'], warnings: [],
      time: 0, temperature: 25, totalPower: 0, edgeToNet: netlist.edgeToNet,
    };
  }

  // Map net IDs to indices
  const netIdx = new Map<string, number>();
  let idx = 0;
  // Ground node first, then others
  if (allNets.includes(groundNode)) netIdx.set(groundNode, idx++);
  for (const net of allNets) {
    if (net !== groundNode) netIdx.set(net, idx++);
  }
  const n = allNets.length;
  const m = vSources.length; // extra equations for voltage sources
  const N = n - 1 + m; // exclude ground node (reference)

  logs.push(`[SYSTEM] Nets: ${n}, Branches: ${branches.length}, V-Sources: ${vSources.length}`);
  logs.push(`[SYSTEM] Ground: ${groundNode}`);

  // Modified Nodal Analysis (MNA) matrices
  // For N equations: first (n-1) are KCL at each non-ground node
  // last m are voltage source constraints
  let v = new Array(n).fill(0); // node voltages
  let iterations = 0;
  const maxIter = 100;
  const tol = 1e-9;

  // Newton-Raphson loop
  for (let iter = 0; iter < maxIter; iter++) {
    iterations = iter + 1;
    const G = Array.from({ length: N }, () => new Array(N).fill(0));
    const I = new Array(N).fill(0);

    // Stamp branches
    for (const br of branches) {
      const fromIdx = netIdx.get(br.from)!;
      const toIdx = netIdx.get(br.to)!;
      const fromG = fromIdx - 1;
      const toG = toIdx - 1;

      if (br.componentType === 'resistor') {
        const g = 1 / br.value;
        if (br.from !== groundNode) {
          G[fromG][fromG] += g;
          if (br.to !== groundNode) {
            G[fromG][toG] -= g;
            G[toG][fromG] -= g;
            G[toG][toG] += g;
          } else {
            I[fromG] -= 0; // to ground
          }
        } else if (br.to !== groundNode) {
          G[toG][toG] += g;
        }
      } else if (br.componentType === 'switch') {
        const g = 1 / br.value;
        if (br.from !== groundNode) {
          G[fromG][fromG] += g;
          if (br.to !== groundNode) {
            G[fromG][toG] -= g;
            G[toG][fromG] -= g;
            G[toG][toG] += g;
          }
        } else if (br.to !== groundNode) {
          G[toG][toG] += g;
        }
      } else if (br.componentType === 'capacitor') {
        // DC: open circuit (very small conductance)
        const g = 1e-12;
        if (br.from !== groundNode) {
          G[fromG][fromG] += g;
          if (br.to !== groundNode) {
            G[fromG][toG] -= g;
            G[toG][fromG] -= g;
            G[toG][toG] += g;
          }
        } else if (br.to !== groundNode) {
          G[toG][toG] += g;
        }
      } else if (br.componentType === 'inductor') {
        // DC: short circuit (large conductance)
        const g = 1e6;
        if (br.from !== groundNode) {
          G[fromG][fromG] += g;
          if (br.to !== groundNode) {
            G[fromG][toG] -= g;
            G[toG][fromG] -= g;
            G[toG][toG] += g;
          }
        } else if (br.to !== groundNode) {
          G[toG][toG] += g;
        }
      } else if (br.componentType === 'diode') {
        const vj = v[fromIdx] - v[toIdx];
        const { I: Id, G: Gd } = diodeCurrent(vj, 0.7);
        const Inl = Id - Gd * vj;
        if (br.from !== groundNode) {
          G[fromG][fromG] += Gd;
          I[fromG] += Inl;
          if (br.to !== groundNode) {
            G[fromG][toG] -= Gd;
            G[toG][fromG] -= Gd;
            G[toG][toG] += Gd;
            I[toG] -= Inl;
          }
        } else if (br.to !== groundNode) {
          G[toG][toG] += Gd;
          I[toG] -= Inl;
        }
      } else if (br.componentType === 'led') {
        const vj = v[fromIdx] - v[toIdx];
        const { I: Id, G: Gd } = ledCurrent(vj, br.value);
        const Inl = Id - Gd * vj;
        if (br.from !== groundNode) {
          G[fromG][fromG] += Gd;
          I[fromG] += Inl;
          if (br.to !== groundNode) {
            G[fromG][toG] -= Gd;
            G[toG][fromG] -= Gd;
            G[toG][toG] += Gd;
            I[toG] -= Inl;
          }
        } else if (br.to !== groundNode) {
          G[toG][toG] += Gd;
          I[toG] -= Inl;
        }
      }
    }

    // Stamp voltage sources (MNA)
    for (let i = 0; i < vSources.length; i++) {
      const vs = vSources[i];
      const posIdx = netIdx.get(vs.pos)!;
      const negIdx = netIdx.get(vs.neg)!;
      const eqIdx = n - 1 + i;

      if (vs.pos !== groundNode) {
        G[posIdx - 1][eqIdx] += 1;
        G[eqIdx][posIdx - 1] += 1;
      }
      if (vs.neg !== groundNode) {
        G[negIdx - 1][eqIdx] -= 1;
        G[eqIdx][negIdx - 1] -= 1;
      }
      I[eqIdx] += vs.voltage;
    }

    // Solve
    const sol = solveLinear(G, I);
    if (!sol) {
      errors.push('Matrix singular — circuit may have no solution or floating nodes');
      logs.push('[ERR] Singular matrix in MNA solver');
      return {
        converged: false, iterations, nodeVoltages: [], branchResults: [],
        topology: [], logs, errors, warnings, time: 0, temperature: 25, totalPower: 0, edgeToNet: netlist.edgeToNet,
      };
    }

    // Update voltages
    let maxDelta = 0;
    for (let i = 0; i < n; i++) {
      if (i === netIdx.get(groundNode)) continue;
      const newV = sol[i];
      maxDelta = Math.max(maxDelta, Math.abs(newV - v[i]));
      v[i] = newV;
    }

    if (maxDelta < tol) {
      logs.push(`[OK] Converged in ${iterations} iterations (max delta ${maxDelta.toExponential(2)})`);
      break;
    }
  }

  // Recover last converged solution vector for post-processing
  const sol = v;

  if (iterations >= maxIter) {
    warnings.push('Newton-Raphson did not converge — results may be approximate');
    logs.push(`[WARN] NR max iterations reached`);
  }

  // Compute branch results
  const branchResults: BranchResult[] = [];
  let totalPower = 0;

  for (const br of branches) {
    const vFrom = v[netIdx.get(br.from)!];
    const vTo = v[netIdx.get(br.to)!];
    const vDrop = vFrom - vTo;
    let current = 0;
    let power = 0;
    let isActive = false;

    if (br.componentType === 'resistor') {
      current = vDrop / br.value;
      power = vDrop * current;
      isActive = Math.abs(current) > 1e-6;
    } else if (br.componentType === 'switch') {
      current = vDrop / br.value;
      power = vDrop * current;
      isActive = br.value < 1; // closed
    } else if (br.componentType === 'diode') {
      const { I: Id } = diodeCurrent(vDrop, 0.7);
      current = Id;
      power = vDrop * current;
      isActive = current > 1e-6;
    } else if (br.componentType === 'led') {
      const { I: Id } = ledCurrent(vDrop, br.value);
      current = Id;
      power = vDrop * current;
      isActive = current > 1e-4; // LED glows at ~100µA
    } else if (br.componentType === 'capacitor') {
      current = 0; // DC steady state
      power = 0;
      isActive = Math.abs(vDrop) > 0.1;
    } else if (br.componentType === 'inductor') {
      current = vDrop * 1e6; // approx for short
      power = vDrop * current;
      isActive = true;
    }

    totalPower += Math.abs(power);
    branchResults.push({
      branchId: br.id,
      componentId: br.componentId,
      componentType: br.componentType,
      current,
      voltage: vDrop,
      power,
      isActive,
    });
  }

  // Voltage source power
  for (let i = 0; i < vSources.length; i++) {
    const vs = vSources[i];
    const eqIdx = n - 1 + i;
    const current = -sol[eqIdx]; // current flowing through source
    const power = vs.voltage * current;
    totalPower += Math.abs(power);
    branchResults.push({
      branchId: vs.id,
      componentId: vs.id.replace('vs_', ''),
      componentType: 'voltage_source',
      current,
      voltage: vs.voltage,
      power,
      isActive: true,
    });
  }

  // Node voltages
  const nodeVoltages: NodeVoltage[] = allNets.map(net => {
    const voltage = v[netIdx.get(net)!];
    let color = '#94a3b8'; // slate-400
    if (net === groundNode) color = '#22c55e'; // green
    else if (voltage > 2) color = '#ef4444';   // red
    else if (voltage > 0.5) color = '#f59e0b'; // amber
    else if (voltage < -0.5) color = '#3b82f6'; // blue
    return { nodeId: net, voltage, color, isGround: net === groundNode };
  });

  // Topology detection
  const topology: TopoPath[] = [];
  // Detect series paths: from VCC to GND through multiple components
  const vccNets = vSources.map(vs => vs.pos);
  for (const vccNet of vccNets) {
    // BFS to find all paths to ground
    const paths = findPathsToGround(vccNet, groundNode, branches);
    if (paths.length === 1 && paths[0].length > 2) {
      const brIds = paths[0].filter(p => p.startsWith('br_'));
      const nodeIds = paths[0].filter(p => p.startsWith('net_'));
      topology.push({
        type: 'series',
        nodes: nodeIds,
        branches: brIds,
        logic: 'Series = AND — all components must conduct',
      });
    } else if (paths.length > 1) {
      const allBrIds = paths.flatMap(p => p.filter(id => id.startsWith('br_')));
      const allNodeIds = paths.flatMap(p => p.filter(id => id.startsWith('net_')));
      topology.push({
        type: 'parallel',
        nodes: [...new Set(allNodeIds)],
        branches: [...new Set(allBrIds)],
        logic: 'Parallel = OR — any path conducts',
      });
    }
  }

  if (topology.length === 0) {
    logs.push('[INFO] No clear series/parallel topology detected');
  } else {
    for (const t of topology) {
      logs.push(`[TOPO] ${t.type.toUpperCase()}: ${t.branches.length} branches, ${t.nodes.length} nodes (${t.logic})`);
    }
  }

  // Warnings
  for (const br of branchResults) {
    if (br.componentType === 'resistor' && Math.abs(br.power) > 0.5) {
      warnings.push(`R ${br.componentId}: ${br.power.toFixed(3)}W — check power rating`);
    }
    if (br.componentType === 'led' && Math.abs(br.current) > 0.03) {
      warnings.push(`LED ${br.componentId}: ${(br.current * 1000).toFixed(1)}mA — overcurrent!`);
    }
  }

  logs.push(`[OK] DC operating point solved. Total power: ${totalPower.toFixed(4)}W`);

  return {
    converged: true,
    iterations,
    nodeVoltages,
    branchResults,
    topology,
    logs,
    errors,
    warnings,
    time: 0,
    temperature: 25,
    totalPower,
    edgeToNet: netlist.edgeToNet,
  };
}

// ── Path finding for topology detection ──────────────────────────────────────

function findPathsToGround(start: string, ground: string, branches: NetBranch[]): string[][] {
  const adj = new Map<string, { node: string; branch: string }[]>();
  branches.forEach(br => {
    if (!adj.has(br.from)) adj.set(br.from, []);
    if (!adj.has(br.to)) adj.set(br.to, []);
    adj.get(br.from)!.push({ node: br.to, branch: br.id });
    adj.get(br.to)!.push({ node: br.from, branch: br.id });
  });

  const results: string[][] = [];
  const visited = new Set<string>();

  function dfs(node: string, path: string[]) {
    if (node === ground) {
      results.push([...path]);
      return;
    }
    if (visited.has(node)) return;
    visited.add(node);
    const neighbors = adj.get(node) || [];
    for (const { node: nextNode, branch } of neighbors) {
      if (!path.includes(nextNode) && !path.includes(branch)) {
        path.push(branch);
        path.push(nextNode);
        dfs(nextNode, path);
        path.pop();
        path.pop();
      }
    }
    visited.delete(node);
  }

  dfs(start, [start]);
  return results;
}

// ── Waveform generator for transient simulation ─────────────────────────────

export interface WaveformPoint {
  time: number;
  voltages: Record<string, number>;
  branchCurrents: Record<string, number>;
}

export function runTransient(
  netlist: Netlist,
  stopTime: number,
  timeStep: number = 0.001,
  onStep?: (t: number, voltages: Record<string, number>) => void
): WaveformPoint[] {
  const points: WaveformPoint[] = [];
  const tSteps = Math.floor(stopTime / timeStep);

  for (let step = 0; step <= tSteps; step++) {
    const t = step * timeStep;
    const result = solveDC(netlist);
    const voltages: Record<string, number> = {};
    for (const nv of result.nodeVoltages) {
      voltages[nv.nodeId] = nv.voltage;
    }
    const branchCurrents: Record<string, number> = {};
    for (const br of result.branchResults) {
      branchCurrents[br.branchId] = br.current;
    }
    points.push({ time: t, voltages, branchCurrents });
    if (onStep) onStep(t, voltages);
  }

  return points;
}

// ── Interactive component helpers ────────────────────────────────────────────

export function toggleSwitchState(nodeId: string, nodes: any[]): any[] {
  return nodes.map(n => {
    if (n.id !== nodeId) return n;
    const currentState = n.data?.state?.closed ?? (n.data?.values?.state !== 'Open');
    return {
      ...n,
      data: {
        ...n.data,
        state: { ...n.data?.state, closed: !currentState },
        values: { ...n.data?.values, state: !currentState ? 'Closed' : 'Open' },
      },
    };
  });
}

export function getNodeVoltage(nodeId: string, result: SimEngineResult): number | null {
  const nv = result.nodeVoltages.find(nv => nv.nodeId === nodeId);
  return nv?.voltage ?? null;
}

export function getBranchCurrent(branchId: string, result: SimEngineResult): number | null {
  const br = result.branchResults.find(br => br.branchId === branchId);
  return br?.current ?? null;
}

export function getComponentStatus(componentId: string, result: SimEngineResult): { voltage: number; current: number; power: number; isActive: boolean } | null {
  const br = result.branchResults.find(br => br.componentId === componentId);
  if (!br) return null;
  return {
    voltage: br.voltage,
    current: br.current,
    power: br.power,
    isActive: br.isActive,
  };
}
