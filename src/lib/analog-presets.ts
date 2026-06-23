import type { AnalogProject, Sheet } from './analog-types';
import type { CircuitDesign } from '../analog-proto/types';

function generateId() {
  return Math.random().toString(36).substring(2, 12);
}

function generateHash() {
  return Math.random().toString(16).substring(2, 8);
}

const motorStarterDesign: CircuitDesign = {
  components: [
    { id: 'bat1', type: 'BATTERY', x: 100, y: 100, rotation: 0, properties: { voltage: 24 } },
    { id: 'pb_stop', type: 'PUSH_BUTTON', x: 200, y: 100, rotation: 0, label: 'PB-STOP', properties: { state: 'NC' } },
    { id: 'pb_fwd', type: 'PUSH_BUTTON', x: 300, y: 200, rotation: 0, label: 'PB-FWD', properties: { state: 'NO' } },
    { id: 'pb_rev', type: 'PUSH_BUTTON', x: 300, y: 350, rotation: 0, label: 'PB-REV', properties: { state: 'NO' } },
    { id: 'r1', type: 'RELAY', x: 500, y: 200, rotation: 0, label: 'R1 (FWD Main)', properties: {} },
    { id: 'r2', type: 'RELAY', x: 650, y: 200, rotation: 0, label: 'R2 (FWD Latch)', properties: {} },
    { id: 'r3', type: 'RELAY', x: 500, y: 350, rotation: 0, label: 'R3 (REV Main)', properties: {} },
    { id: 'r4', type: 'RELAY', x: 650, y: 350, rotation: 0, label: 'R4 (REV Latch)', properties: {} },
    { id: 'motor', type: 'MOTOR', x: 800, y: 275, rotation: 0, label: 'DC Motor', properties: {} },
    { id: 'gnd', type: 'GROUND', x: 800, y: 450, rotation: 0, properties: {} }
  ],
  connections: [
    { id: 'c1', from: 'bat1', fromPin: 0, to: 'pb_stop', toPin: 0 },
    { id: 'c2', from: 'pb_stop', fromPin: 1, to: 'pb_fwd', toPin: 0 },
    { id: 'c3', from: 'pb_fwd', fromPin: 1, to: 'r1', toPin: 0 },
    { id: 'c4', from: 'r1', fromPin: 1, to: 'gnd', toPin: 0 },
    { id: 'c5', from: 'pb_stop', fromPin: 1, to: 'r2', toPin: 2 },
    { id: 'c6', from: 'r2', fromPin: 3, to: 'r1', toPin: 0 },
    { id: 'c7', from: 'pb_fwd', fromPin: 1, to: 'r2', toPin: 0 },
    { id: 'c8', from: 'r2', fromPin: 1, to: 'gnd', toPin: 0 },
    { id: 'c9', from: 'bat1', fromPin: 0, to: 'r1', toPin: 2 },
    { id: 'c10', from: 'r1', fromPin: 3, to: 'motor', toPin: 0 },
    { id: 'c11', from: 'motor', fromPin: 1, to: 'gnd', toPin: 0 },
    { id: 'c12', from: 'pb_stop', fromPin: 1, to: 'pb_rev', toPin: 0 },
    { id: 'c13', from: 'pb_rev', fromPin: 1, to: 'r3', toPin: 0 },
    { id: 'c14', from: 'r3', fromPin: 1, to: 'gnd', toPin: 0 },
    { id: 'c15', from: 'pb_stop', fromPin: 1, to: 'r4', toPin: 2 },
    { id: 'c16', from: 'r4', fromPin: 3, to: 'r3', toPin: 0 },
    { id: 'c17', from: 'pb_rev', fromPin: 1, to: 'r4', toPin: 0 },
    { id: 'c18', from: 'r4', fromPin: 1, to: 'gnd', toPin: 0 },
    { id: 'c19', from: 'bat1', fromPin: 0, to: 'r3', toPin: 2 },
    { id: 'c20', from: 'r3', fromPin: 3, to: 'motor', toPin: 1 },
    { id: 'c21', from: 'motor', fromPin: 0, to: 'gnd', toPin: 0 }
  ]
};

const pneumaticDesign: CircuitDesign = {
  components: [
    { id: 'bat1', type: 'BATTERY', x: 100, y: 100, rotation: 0, properties: { voltage: 24 } },
    { id: 'pb1', type: 'PUSH_BUTTON', x: 200, y: 150, rotation: 0, label: 'START', properties: { state: 'NO' } },
    { id: 's1', type: 'TOGGLE_SWITCH', x: 200, y: 250, rotation: 0, label: 'S1 (Home)', properties: {} },
    { id: 's2', type: 'TOGGLE_SWITCH', x: 200, y: 350, rotation: 0, label: 'S2 (End)', properties: {} },
    { id: 'k1', type: 'RELAY', x: 400, y: 150, rotation: 0, label: 'K1 (Ext Relay)', properties: {} },
    { id: 'k2', type: 'RELAY', x: 400, y: 350, rotation: 0, label: 'K2 (Ret Relay)', properties: {} },
    { id: 'sol1', type: 'SOLENOID', x: 600, y: 150, rotation: 0, label: '1M1 (Extend)', properties: {} },
    { id: 'sol2', type: 'SOLENOID', x: 600, y: 350, rotation: 0, label: '1M2 (Retract)', properties: {} },
    { id: 'timer', type: 'INTEGRATED_CIRCUIT', x: 500, y: 250, rotation: 0, label: 'T1 (1s Dwell)', properties: {} },
    { id: 'gnd', type: 'GROUND', x: 600, y: 450, rotation: 0, properties: {} }
  ],
  connections: [
    { id: 'p1', from: 'bat1', fromPin: 0, to: 'pb1', toPin: 0 },
    { id: 'p2', from: 'pb1', fromPin: 1, to: 'k1', toPin: 0 },
    { id: 'p3', from: 'k1', fromPin: 1, to: 'gnd', toPin: 0 },
    { id: 'p4', from: 'bat1', fromPin: 0, to: 'k1', toPin: 2 },
    { id: 'p5', from: 'k1', fromPin: 3, to: 'sol1', toPin: 0 },
    { id: 'p6', from: 'sol1', fromPin: 1, to: 'gnd', toPin: 0 },
    { id: 'p7', from: 'bat1', fromPin: 0, to: 's2', toPin: 0 },
    { id: 'p8', from: 's2', fromPin: 1, to: 'timer', toPin: 0 },
    { id: 'p9', from: 'timer', fromPin: 1, to: 'gnd', toPin: 0 },
    { id: 'p10', from: 'timer', fromPin: 2, to: 'k2', toPin: 0 },
    { id: 'p11', from: 'k2', fromPin: 1, to: 'gnd', toPin: 0 },
    { id: 'p12', from: 'bat1', fromPin: 0, to: 'k2', toPin: 2 },
    { id: 'p13', from: 'k2', fromPin: 3, to: 'sol2', toPin: 0 },
    { id: 'p14', from: 'sol2', fromPin: 1, to: 'gnd', toPin: 0 }
  ]
};

export function getCaseStudyProjects(): AnalogProject[] {
  const motorSheet: Sheet = {
    id: generateId(),
    name: 'Motor Control Scheme',
    nodes: [],
    edges: [],
    design: motorStarterDesign
  };

  const pneuSheet: Sheet = {
    id: generateId(),
    name: 'Pneumatic Control Scheme',
    nodes: [],
    edges: [],
    design: pneumaticDesign
  };

  return [
    {
      id: 'cs-motor-fwd-rev',
      name: 'Case Study: Motor FWD/REV Control',
      type: 'analog',
      sheets: [motorSheet],
      activeSheetId: motorSheet.id,
      history: [{ id: generateId(), hash: generateHash(), author: 'system', message: 'Initial commit', timestamp: Date.now() }],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'cs-pneumatic-cycle',
      name: 'Case Study: Pneumatic Cylinder Cycle',
      type: 'analog',
      sheets: [pneuSheet],
      activeSheetId: pneuSheet.id,
      history: [{ id: generateId(), hash: generateHash(), author: 'system', message: 'Initial commit', timestamp: Date.now() }],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ];
}
