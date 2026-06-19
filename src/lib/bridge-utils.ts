/**
 * Cross-Module Bridge Utilities
 * Enables bidirectional flow between Analog ↔ PLC ↔ Digital ↔ Robotics
 */

import type { SimEngineResult } from './analog-sim-engine';
import type { Circuit, GateKind } from './types';

// ── Analog → PLC Bridge ──────────────────────────────────────────────────────────

export interface PLCRungs {
  rungs: {
    nodes: { type: string; address: string; label: string; params?: Record<string, any> }[];
    comment: string;
  }[];
  tags: { address: string; tag: string; type: 'BOOL' | 'REAL' | 'TIMER' }[];
  stCode: string;
}

export function analogToPLC(analogResult: SimEngineResult, componentNames: Map<string, string>): PLCRungs {
  const rungs: PLCRungs['rungs'] = [];
  const tags: PLCRungs['tags'] = [];

  // Build tags from branch results
  for (const br of analogResult.branchResults) {
    const name = componentNames.get(br.componentId) ?? br.componentId;
    if (br.componentType === 'resistor') {
      tags.push({ address: `R_${br.componentId}`, tag: name, type: 'REAL' });
    } else if (br.componentType === 'switch') {
      tags.push({ address: `SW_${br.componentId}`, tag: name, type: 'BOOL' });
    } else if (br.componentType === 'led') {
      tags.push({ address: `LED_${br.componentId}`, tag: name, type: 'BOOL' });
    } else if (br.componentType === 'voltage_source') {
      tags.push({ address: `V_${br.componentId}`, tag: name, type: 'REAL' });
    }
  }

  // Generate ladder rungs from topology
  for (const topo of analogResult.topology) {
    const rungNodes: PLCRungs['rungs'][0]['nodes'] = [];
    const branchComponents = topo.branches
      .map(bid => analogResult.branchResults.find(br => br.branchId === bid))
      .filter(Boolean) as SimEngineResult['branchResults'];

    if (topo.type === 'series') {
      // Series = AND logic: normally-open contacts in series
      for (const br of branchComponents) {
        const addr = br.componentType === 'switch'
          ? `SW_${br.componentId}`
          : br.componentType === 'resistor'
          ? `R_${br.componentId}`
          : `X_${br.componentId}`;
        rungNodes.push({
          type: 'XIC',
          address: addr,
          label: componentNames.get(br.componentId) ?? br.componentId,
        });
      }
      // Add a coil at the end
      rungNodes.push({
        type: 'OTE',
        address: 'O:0/0',
        label: 'Series_Output',
      });
      rungs.push({
        nodes: rungNodes,
        comment: `Series path (AND): ${topo.logic} — ${branchComponents.map(c => componentNames.get(c.componentId) ?? c.componentId).join(' → ')}`,
      });
    } else if (topo.type === 'parallel') {
      // Parallel = OR logic: parallel branches with XIC, then OTE
      // In ladder, parallel paths are stacked on separate rungs or as parallel branches
      for (const br of branchComponents) {
        const addr = br.componentType === 'switch'
          ? `SW_${br.componentId}`
          : br.componentType === 'resistor'
          ? `R_${br.componentId}`
          : `X_${br.componentId}`;
        rungNodes.push({
          type: 'XIC',
          address: addr,
          label: componentNames.get(br.componentId) ?? br.componentId,
          params: { parallel: true },
        });
      }
      rungNodes.push({
        type: 'OTE',
        address: 'O:0/1',
        label: 'Parallel_Output',
      });
      rungs.push({
        nodes: rungNodes,
        comment: `Parallel path (OR): ${topo.logic} — ${branchComponents.map(c => componentNames.get(c.componentId) ?? c.componentId).join(' || ')}`,
      });
    }
  }

  // Generate Structured Text
  const stLines = [
    'PROGRAM AnalogBridge;',
    '  // Auto-generated from analog circuit analysis',
    '  // Topology: ' + analogResult.topology.map(t => t.type).join(', '),
    '  VAR',
  ];
  for (const t of tags) {
    stLines.push(`    ${t.tag} : ${t.type};`);
  }
  stLines.push('  END_VAR;');
  stLines.push('');
  for (let i = 0; i < rungs.length; i++) {
    stLines.push(`  // Rung ${i + 1}: ${rungs[i].comment}`);
    const conditions = rungs[i].nodes
      .filter(n => n.type === 'XIC')
      .map(n => n.label)
      .join(' AND ');
    const coil = rungs[i].nodes.find(n => n.type === 'OTE');
    if (coil) {
      stLines.push(`  ${coil.address} := ${conditions || 'TRUE'};`);
    }
    stLines.push('');
  }
  stLines.push('END_PROGRAM;');

  return { rungs, tags, stCode: stLines.join('\n') };
}

// ── PLC → Digital Bridge ──────────────────────────────────────────────────────────

export interface DigitalBridge {
  circuit: Circuit;
  description: string;
  mapping: { gateId: string; plcAddress: string; logic: string }[];
}

export function plcToDigital(ladderRungs: PLCRungs['rungs']): DigitalBridge {
  const gates: Circuit['gates'] = {};
  const wires: Circuit['wires'] = {};
  let col = 0;
  const mapping: DigitalBridge['mapping'] = [];

  for (const rung of ladderRungs) {
    const xicNodes = rung.nodes.filter(n => n.type === 'XIC');
    const oteNode = rung.nodes.find(n => n.type === 'OTE');
    if (xicNodes.length === 0 || !oteNode) continue;

    const gateId = `gate_${col}`;
    const kind: GateKind = xicNodes.some(n => n.params?.parallel)
      ? 'OR'
      : xicNodes.length > 1
      ? 'AND'
      : 'NOT';

    gates[gateId] = {
      id: gateId,
      kind,
      x: 80 + col * 140,
      y: 80,
      inputs: xicNodes.length,
      label: `${oteNode.label} (${kind})`,
    };

    mapping.push({
      gateId,
      plcAddress: oteNode.address,
      logic: `${xicNodes.map(n => n.label).join(kind === 'OR' ? ' || ' : ' && ')} → ${oteNode.label}`,
    });
    col++;
  }

  return {
    circuit: { gates, wires },
    description: `PLC ladder converted to digital logic: ${mapping.length} gate(s)`,
    mapping,
  };
}

// ── Robotics → PLC Bridge ──────────────────────────────────────────────────────────

export interface RobotPLCBridge {
  tags: { address: string; tag: string; type: string; value: string; description: string }[];
  ladderRungs: PLCRungs['rungs'];
  stCode: string;
}

export function robotToPLC(
  robotState: {
    jointPositions?: number[];
    endEffectorPos?: { x: number; y: number };
    isConnected?: boolean;
    workpieces?: { color: string; position: number; sorted: boolean }[];
    totalProcessed?: number;
    conveyorRunning?: boolean;
  }
): RobotPLCBridge {
  const tags: RobotPLCBridge['tags'] = [];
  const rungs: PLCRungs['rungs'] = [];

  // Robot position tags
  if (robotState.jointPositions) {
    robotState.jointPositions.forEach((pos, i) => {
      tags.push({
        address: `J${i}:0`,
        tag: `Joint${i}_Angle`,
        type: 'REAL',
        value: pos.toFixed(2),
        description: `Robot joint ${i} angle in degrees`,
      });
    });
  }

  if (robotState.endEffectorPos) {
    tags.push({
      address: `J4:0`,
      tag: 'EndEffector_X',
      type: 'REAL',
      value: robotState.endEffectorPos.x.toFixed(2),
      description: 'End effector X coordinate',
    });
    tags.push({
      address: `J4:1`,
      tag: 'EndEffector_Y',
      type: 'REAL',
      value: robotState.endEffectorPos.y.toFixed(2),
      description: 'End effector Y coordinate',
    });
  }

  // Conveyor tags
  tags.push({
    address: `I:0/0`,
    tag: 'Conveyor_Run',
    type: 'BOOL',
    value: robotState.conveyorRunning ? '1' : '0',
    description: 'Conveyor belt running signal',
  });

  tags.push({
    address: `I:0/1`,
    tag: 'Robot_Connected',
    type: 'BOOL',
    value: robotState.isConnected ? '1' : '0',
    description: 'Robot controller online',
  });

  // Vision / color sorting tags
  const colors = robotState.workpieces ?? [];
  const redCount = colors.filter(w => w.color === 'red' && w.sorted).length;
  const greenCount = colors.filter(w => w.color === 'green' && w.sorted).length;
  const blueCount = colors.filter(w => w.color === 'blue' && w.sorted).length;

  tags.push({
    address: `C:0`,
    tag: 'Red_Sorted',
    type: 'COUNTER',
    value: redCount.toString(),
    description: 'Red workpieces sorted',
  });
  tags.push({
    address: `C:1`,
    tag: 'Green_Sorted',
    type: 'COUNTER',
    value: greenCount.toString(),
    description: 'Green workpieces sorted',
  });
  tags.push({
    address: `C:2`,
    tag: 'Blue_Sorted',
    type: 'COUNTER',
    value: blueCount.toString(),
    description: 'Blue workpieces sorted',
  });
  tags.push({
    address: `C:3`,
    tag: 'Total_Processed',
    type: 'COUNTER',
    value: (robotState.totalProcessed ?? 0).toString(),
    description: 'Total workpieces processed',
  });

  // Generate ladder logic for conveyor control
  rungs.push({
    nodes: [
      { type: 'XIC', address: 'I:0/1', label: 'Robot_Connected' },
      { type: 'XIC', address: 'I:0/0', label: 'Conveyor_Run' },
      { type: 'OTE', address: 'O:0/0', label: 'Conveyor_Motor' },
    ],
    comment: 'Conveyor motor: runs when robot connected AND conveyor enabled',
  });

  // Color sorting rungs
  const colorMap = { red: 'I:0/2', green: 'I:0/3', blue: 'I:0/4' };
  for (const [color, addr] of Object.entries(colorMap)) {
    rungs.push({
      nodes: [
        { type: 'XIC', address: 'I:0/0', label: 'Conveyor_Run' },
        { type: 'XIC', address: addr, label: `Vision_${color}` },
        { type: 'CTU', address: `C:${color === 'red' ? 0 : color === 'green' ? 1 : 2}`, label: `${color}_Counter`, params: { preset: 100 } },
      ],
      comment: `${color} sorting: count when vision detects ${color} on running conveyor`,
    });
  }

  // Generate Structured Text
  const stLines = [
    'PROGRAM RobotBridge;',
    '  // Auto-generated from robot workspace state',
    '  VAR',
  ];
  for (const t of tags) {
    stLines.push(`    ${t.tag} : ${t.type};  // ${t.address}`);
  }
  stLines.push('  END_VAR;');
  stLines.push('');
  stLines.push('  // Conveyor motor control');
  stLines.push('  O:0/0 := I:0/1 AND I:0/0;');
  stLines.push('');
  stLines.push('  // Color sorting counters');
  stLines.push('  IF I:0/0 AND I:0/2 THEN C:0 := C:0 + 1; END_IF;');
  stLines.push('  IF I:0/0 AND I:0/3 THEN C:1 := C:1 + 1; END_IF;');
  stLines.push('  IF I:0/0 AND I:0/4 THEN C:2 := C:2 + 1; END_IF;');
  stLines.push('');
  stLines.push('  // Total processed');
  stLines.push('  C:3 := C:0 + C:1 + C:2;');
  stLines.push('END_PROGRAM;');

  return { tags, ladderRungs: rungs, stCode: stLines.join('\n') };
}

// ── Digital → PLC Bridge (74HC logic gates) ────────────────────────────────

export function digitalToPLC(circuit: Circuit): PLCRungs {
  const rungs: PLCRungs['rungs'] = [];
  const tags: PLCRungs['tags'] = [];

  for (const gate of Object.values(circuit.gates)) {
    const gateTag = `GATE_${gate.id}`;
    tags.push({ address: gate.id, tag: gateTag, type: 'BOOL' });

    const rungNodes = [];
    for (let i = 0; i < gate.inputs; i++) {
      rungNodes.push({
        type: 'XIC',
        address: `I:${gate.id}/${i}`,
        label: `Input_${i}`,
      });
    }

    // Map gate kind to PLC logic
    const coilType = gate.kind === 'NOT' ? 'OTN' : 'OTE';
    rungNodes.push({
      type: coilType,
      address: gate.id,
      label: `${gate.kind}_Output`,
    });

    rungs.push({
      nodes: rungNodes,
      comment: `${gate.kind} gate: ${gate.label} — ${gate.inputs} input(s)`,
    });
  }

  const stLines = [
    'PROGRAM DigitalBridge;',
    '  // Auto-generated from digital logic circuit',
    '  VAR',
  ];
  for (const t of tags) {
    stLines.push(`    ${t.tag} : ${t.type};`);
  }
  stLines.push('  END_VAR;');
  stLines.push('');
  for (const rung of rungs) {
    const inputs = rung.nodes.filter(n => n.type === 'XIC');
    const output = rung.nodes.find(n => n.type === 'OTE' || n.type === 'OTN');
    if (output) {
      const conditions = inputs.map(n => n.address).join(' AND ');
      stLines.push(`  ${output.address} := ${conditions || 'TRUE'};  // ${rung.comment}`);
    }
  }
  stLines.push('END_PROGRAM;');

  return { rungs, tags, stCode: stLines.join('\n') };
}
