export type ComponentCategory =
  | 'Passive'
  | 'Active'
  | 'Integrated'
  | 'Connector'
  | 'Power'
  | 'Logic'
  | 'Sensor'
  | 'Module'
  | 'Other';

export interface PinTemplate {
  id: string;
  name: string;
  position: { x: number; y: number };
  /** Electrical direction: 'in' = input/sink, 'out' = output/source, 'bidir' = both */
  direction?: 'in' | 'out' | 'bidir';
}

export interface ComponentTemplate {
  id: string;
  name: string;
  category: ComponentCategory;
  symbol: string;
  pins: PinTemplate[];
  defaultValues: Record<string, string>;
  specs?: Record<string, string>;
  description?: string;
  interactive?: boolean;
}

export interface AnalogNode {
  id: string;
  templateId: string;
  label: string;
  values: Record<string, string>;
  x: number;
  y: number;
}

export interface AnalogEdge {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
}

export interface SchematicSheet {
  id: string;
  name: string;
  nodes: any[];
  edges: any[];
  design?: any; // New Advanced Prototype CircuitDesign
}

export interface Sheet {
  id: string;
  name: string;
  nodes: any[];
  edges: any[];
  design?: any;
}

export interface Commit {
  id: string;
  hash: string;
  author: string;
  message: string;
  timestamp: number;
}

export interface AnalogProject {
  id: string;
  name: string;
  type?: 'analog' | 'plc' | 'digital' | 'robot';
  data?: any;
  sheets: Sheet[];
  activeSheetId: string;
  history: Commit[];
  createdAt: number;
  updatedAt: number;
}

export interface DRCIssue {
  type: 'SHORT_CIRCUIT' | 'FLOATING_PIN' | 'NO_GROUND' | 'NO_POWER' | 'ORPHAN' | 'OK';
  message: string;
  nodeId?: string;
  severity: 'error' | 'warning' | 'info';
}

export interface SimWavePoint {
  time: number;
  vcc: number;
  io1: number;
  io2: number;
  noise: number;
}
