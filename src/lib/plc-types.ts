/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type NodeType = 
  | 'contact-no' 
  | 'contact-nc' 
  | 'coil' 
  | 'coil-latch'
  | 'coil-unlatch'
  | 'one-shot'
  | 'timer-on' 
  | 'timer-off'
  | 'retentive-timer'
  | 'counter-up'
  | 'counter-down'
  | 'reset'
  | 'compare-eq'
  | 'compare-ne'
  | 'compare-lt'
  | 'compare-gt'
  | 'math-add'
  | 'math-sub'
  | 'math-mul'
  | 'math-div'
  | 'math-mov'
  | 'math-sin'
  | 'math-cos'
  | 'math-tan'
  | 'pid-controller'
  | 'scale-param'
  | 'limit-test'
  | 'alarm-block'
  | 'branch-start'
  | 'branch-end'
  | 'wire-vertical'
  | 'wire-junction';

export interface LadderNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  tag: string;       // Name of component
  address: string;   // PLC address (e.g., I:0/1, O:0/1, B3:0/0)
  description?: string; // Optional description
  params?: {
    preset?: number;
    accum?: number;
    sourceA?: string | number;
    sourceB?: string | number;
    dest?: string;
    // Limit Test (LIM)
    lowLimit?: string | number;
    highLimit?: string | number;
    testVal?: string | number;
    // Scale with Parameters (SCP)
    inMin?: string | number;
    inMax?: string | number;
    outMin?: string | number;
    outMax?: string | number;
    // PID Controller
    kp?: number;
    ki?: number;
    kd?: number;
    sp?: string | number;
    pv?: string | number;
    cv?: string;
    // Internal state caching
    lastError?: number;
    integral?: number;
    lastTime?: number;
  };
  deviceProfile?: {
    deviceType: 'none' | 'motor' | 'piston' | 'valve' | 'light' | 'siren' | 'heater';
    feedbackAddr1?: string; // Feedback address e.g. Aux contact or retracted sensor
    feedbackAddr2?: string; // Secondary feedback address e.g. Extended sensor
    transitTimeMs?: number; // Transit duration
    currentPercent?: number; // Dynamic state value (0-100)
  };
}

export interface Wire {
  id: string;
  fromId: string;
  fromSide: 'left' | 'right';
  toId: string;
  toSide: 'left' | 'right';
  points: number[];
}

export interface LadderState {
  nodes: LadderNode[];
  wires: Wire[];
  rungComments?: Record<number, string>;
  simulation: {
    isRunning: boolean;
    forcesEnabled: boolean;
    forces: Record<string, boolean | number>;
    values: Record<string, boolean | number>;
    history: Record<string, number[]>;
    logs: { id: string; timestamp: number; message: string; type: 'info' | 'warning' | 'error' }[];
  };
}

export const GRID_SIZE = 32;
export const RUNG_HEIGHT = 96; 
export const NODE_WIDTH = 80;
export const NODE_HEIGHT = 40;
export const LEFT_RAIL_X = 64; 
export const RIGHT_RAIL_X = 1120;
