import { ComponentType } from './types';

export const GRID_SIZE = 20;

export interface ComponentDefinition {
  type: ComponentType;
  name: string;
  pins: { x: number; y: number }[];
  defaultProperties: Record<string, string | number>;
  width: number;
  height: number;
}

export const COMPONENT_DEFINITIONS: Record<ComponentType, ComponentDefinition> = {
  RESISTOR: {
    type: 'RESISTOR',
    name: 'Resistor',
    pins: [{ x: 0, y: 0 }, { x: 80, y: 0 }],
    defaultProperties: { resistance: '1k', unit: 'Ω' },
    width: 80,
    height: 20
  },
  CAPACITOR: {
    type: 'CAPACITOR',
    name: 'Capacitor',
    pins: [{ x: 0, y: 0 }, { x: 40, y: 0 }],
    defaultProperties: { capacitance: '100u', unit: 'F' },
    width: 40,
    height: 30
  },
  BATTERY: {
    type: 'BATTERY',
    name: 'Battery',
    pins: [{ x: 0, y: 0 }, { x: 40, y: 0 }],
    defaultProperties: { voltage: '9', unit: 'V' },
    width: 40,
    height: 40
  },
  LED: {
    type: 'LED',
    name: 'LED',
    pins: [{ x: 0, y: 0 }, { x: 40, y: 0 }],
    defaultProperties: { color: 'Red' },
    width: 40,
    height: 40
  },
  GROUND: {
    type: 'GROUND',
    name: 'Ground',
    pins: [{ x: 0, y: 0 }],
    defaultProperties: {},
    width: 30,
    height: 20
  },
  SWITCH: {
    type: 'SWITCH',
    name: 'Switch',
    pins: [{ x: 0, y: 0 }, { x: 60, y: 0 }],
    defaultProperties: { state: 'Open' },
    width: 60,
    height: 20
  },
  INDUCTOR: {
    type: 'INDUCTOR',
    name: 'Inductor',
    pins: [{ x: 0, y: 0 }, { x: 60, y: 0 }],
    defaultProperties: { inductance: '10m', unit: 'H' },
    width: 60,
    height: 20
  },
  INTEGRATED_CIRCUIT: {
    type: 'INTEGRATED_CIRCUIT',
    name: 'IC (8-pin)',
    pins: [
      { x: 0, y: 0 }, { x: 0, y: 20 }, { x: 0, y: 40 }, { x: 0, y: 60 },
      { x: 60, y: 0 }, { x: 60, y: 20 }, { x: 60, y: 40 }, { x: 60, y: 60 }
    ],
    defaultProperties: { model: '555 Timer' },
    width: 60,
    height: 80
  },
  DIODE: {
    type: 'DIODE',
    name: 'Diode',
    pins: [{ x: 0, y: 0 }, { x: 40, y: 0 }],
    defaultProperties: { model: '1N4148' },
    width: 40,
    height: 20
  },
  TRANSISTOR: {
    type: 'TRANSISTOR',
    name: 'Transistor (NPN)',
    pins: [{ x: 0, y: 20 }, { x: 40, y: 0 }, { x: 40, y: 40 }], // Base, Collector, Emitter ideally
    defaultProperties: { model: '2N2222' },
    width: 40,
    height: 40
  },
  OP_AMP: {
    type: 'OP_AMP',
    name: 'Operational Amplifier',
    pins: [{ x: 0, y: 10 }, { x: 0, y: 30 }, { x: 60, y: 20 }, { x: 30, y: 0 }, { x: 30, y: 40 }],
    defaultProperties: { model: 'LM741' },
    width: 60,
    height: 40
  },
  VOLTAGE_REGULATOR: {
    type: 'VOLTAGE_REGULATOR',
    name: 'Voltage Regulator',
    pins: [{ x: 0, y: 20 }, { x: 30, y: 40 }, { x: 60, y: 20 }],
    defaultProperties: { model: '7805' },
    width: 60,
    height: 40
  },
  LOGIC_AND: {
    type: 'LOGIC_AND',
    name: 'AND Gate',
    pins: [{ x: 0, y: 10 }, { x: 0, y: 30 }, { x: 60, y: 20 }],
    defaultProperties: { model: '74LS08' },
    width: 60,
    height: 40
  },
  MOSFET: {
    type: 'MOSFET',
    name: 'N-Channel MOSFET',
    pins: [{ x: 0, y: 20 }, { x: 40, y: 0 }, { x: 40, y: 40 }],
    defaultProperties: { model: 'IRFZ44N' },
    width: 40,
    height: 40
  },
  LOGIC_OR: {
    type: 'LOGIC_OR',
    name: 'OR Gate',
    pins: [{ x: 0, y: 10 }, { x: 0, y: 30 }, { x: 60, y: 20 }],
    defaultProperties: { model: '74LS32' },
    width: 60,
    height: 40
  },
  LOGIC_NOT: {
    type: 'LOGIC_NOT',
    name: 'NOT Gate',
    pins: [{ x: 0, y: 20 }, { x: 60, y: 20 }],
    defaultProperties: { model: '74LS04' },
    width: 60,
    height: 40
  },
  BUZZER: {
    type: 'BUZZER',
    name: 'Piezo Buzzer',
    pins: [{ x: 0, y: 0 }, { x: 40, y: 0 }],
    defaultProperties: { frequency: '2kHz' },
    width: 40,
    height: 40
  },
  REED_RELAY: {
    type: 'REED_RELAY',
    name: 'Reed Relay',
    pins: [{ x: 0, y: 0 }, { x: 0, y: 40 }, { x: 60, y: 20 }],
    defaultProperties: { voltage: '5V' },
    width: 60,
    height: 40
  },
  SPEAKER: {
    type: 'SPEAKER',
    name: 'Dynamic Speaker',
    pins: [{ x: 0, y: 10 }, { x: 0, y: 30 }],
    defaultProperties: { impedance: '8Ω', power: '0.5W' },
    width: 40,
    height: 40
  },
  MICROPHONE: {
    type: 'MICROPHONE',
    name: 'Electret Mic',
    pins: [{ x: 0, y: 10 }, { x: 0, y: 30 }],
    defaultProperties: { sensitivity: '-42dB' },
    width: 40,
    height: 40
  },
  OLED_DISPLAY: {
    type: 'OLED_DISPLAY',
    name: 'I2C OLED 128x64',
    pins: [{ x: 0, y: 5 }, { x: 0, y: 15 }, { x: 0, y: 25 }, { x: 0, y: 35 }],
    defaultProperties: { interface: 'I2C', address: '0x3C' },
    width: 80,
    height: 60
  },
  SEVEN_SEGMENT: {
    type: 'SEVEN_SEGMENT',
    name: '7-Segment Display',
    pins: [{ x: 5, y: 60 }, { x: 15, y: 60 }, { x: 25, y: 60 }, { x: 35, y: 60 }, { x: 45, y: 60 }],
    defaultProperties: { type: 'Common Cathode', color: 'Red' },
    width: 50,
    height: 60
  },
  MOTOR: {
    type: 'MOTOR',
    name: 'DC Motor',
    pins: [{ x: 0, y: 20 }, { x: 60, y: 20 }],
    defaultProperties: { voltage: '6V', type: 'Geared' },
    width: 60,
    height: 40
  },
  SOLENOID: {
    type: 'SOLENOID',
    name: 'Push Solenoid',
    pins: [{ x: 0, y: 10 }, { x: 0, y: 30 }],
    defaultProperties: { voltage: '12V', force: '5N' },
    width: 60,
    height: 40
  },
  RELAY: {
    type: 'RELAY',
    name: 'SPDT Relay',
    pins: [{ x: 0, y: 10 }, { x: 0, y: 30 }, { x: 60, y: 0 }, { x: 60, y: 20 }, { x: 60, y: 40 }],
    defaultProperties: { voltage: '5V', current: '10A' },
    width: 60,
    height: 40
  },
  OSCILLOSCOPE: {
    type: 'OSCILLOSCOPE',
    name: 'Dual Trace Scope',
    pins: [{ x: 0, y: 10 }, { x: 0, y: 30 }, { x: 60, y: 40 }], // CH1, CH2, GND
    defaultProperties: { timebase: '1ms/div', voltsDiv: '1V/div' },
    width: 60,
    height: 40
  },
  MULTIMETER: {
    type: 'MULTIMETER',
    name: 'Digital Multimeter',
    pins: [{ x: 0, y: 20 }, { x: 40, y: 20 }],
    defaultProperties: { mode: 'Voltage', range: 'Auto' },
    width: 40,
    height: 40
  },
  SIGNAL_GENERATOR: {
    type: 'SIGNAL_GENERATOR',
    name: 'Freq Generator',
    pins: [{ x: 60, y: 20 }, { x: 0, y: 40 }], // OUT, GND
    defaultProperties: { frequency: '1kHz', wave: 'Sine', amplitude: '5V' },
    width: 60,
    height: 40
  },
  SPECTRUM_ANALYZER: {
    type: 'SPECTRUM_ANALYZER',
    name: 'RF Analyzer',
    pins: [{ x: 0, y: 20 }, { x: 30, y: 40 }], // RF IN, GND
    defaultProperties: { startFreq: '0Hz', endFreq: '1MHz' },
    width: 60,
    height: 40
  },
  PUSH_BUTTON: {
    type: 'PUSH_BUTTON',
    name: 'Push Button',
    pins: [{ x: 0, y: 20 }, { x: 40, y: 20 }],
    defaultProperties: { state: 'Open', color: 'Red' },
    width: 40,
    height: 40
  },
  TOGGLE_SWITCH: {
    type: 'TOGGLE_SWITCH',
    name: 'Toggle Switch',
    pins: [{ x: 0, y: 20 }, { x: 40, y: 20 }],
    defaultProperties: { state: 'Open' },
    width: 40,
    height: 40
  },
  XOR_GATE: {
    type: 'XOR_GATE',
    name: 'XOR Gate',
    pins: [{ x: 0, y: 10 }, { x: 0, y: 30 }, { x: 60, y: 20 }],
    defaultProperties: { delay: '5ns' },
    width: 60,
    height: 40
  },
  XNOR_GATE: {
    type: 'XNOR_GATE',
    name: 'XNOR Gate',
    pins: [{ x: 0, y: 10 }, { x: 0, y: 30 }, { x: 65, y: 20 }],
    defaultProperties: { delay: '5ns' },
    width: 65,
    height: 40
  },
  NAND_GATE: {
    type: 'NAND_GATE',
    name: 'NAND Gate',
    pins: [{ x: 0, y: 10 }, { x: 0, y: 30 }, { x: 65, y: 20 }],
    defaultProperties: { delay: '5ns' },
    width: 65,
    height: 40
  },
  NOR_GATE: {
    type: 'NOR_GATE',
    name: 'NOR Gate',
    pins: [{ x: 0, y: 10 }, { x: 0, y: 30 }, { x: 65, y: 20 }],
    defaultProperties: { delay: '5ns' },
    width: 65,
    height: 40
  },
  LADDER_CONTACT_NO: {
    type: 'LADDER_CONTACT_NO',
    name: 'NO Contact',
    pins: [{ x: 0, y: 20 }, { x: 40, y: 20 }],
    defaultProperties: { tag: 'I0.0' },
    width: 40,
    height: 40
  },
  LADDER_CONTACT_NC: {
    type: 'LADDER_CONTACT_NC',
    name: 'NC Contact',
    pins: [{ x: 0, y: 20 }, { x: 40, y: 20 }],
    defaultProperties: { tag: 'I0.1' },
    width: 40,
    height: 40
  },
  LADDER_COIL: {
    type: 'LADDER_COIL',
    name: 'Coil',
    pins: [{ x: 0, y: 20 }, { x: 40, y: 20 }],
    defaultProperties: { tag: 'Q0.0' },
    width: 40,
    height: 40
  },
  LADDER_TIMER: {
    type: 'LADDER_TIMER',
    name: 'Timer',
    pins: [{ x: 0, y: 20 }, { x: 40, y: 20 }],
    defaultProperties: { tag: 'T4:0', preset: 1000, timeBase: 'ms' },
    width: 60,
    height: 40
  }
};
