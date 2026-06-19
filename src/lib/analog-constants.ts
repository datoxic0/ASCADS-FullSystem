import type { ComponentTemplate } from './analog-types';

const RAW_TEMPLATES: ComponentTemplate[] = [
  /* ── Passive ───────────────────────────────────────────────────────────── */
  {
    id: 'resistor', name: 'Resistor', category: 'Passive', symbol: 'resistor',
    pins: [
      { id: '1', name: 'Pin 1', position: { x: -1, y: 0 }, direction: 'bidir' },
      { id: '2', name: 'Pin 2', position: { x: 1, y: 0 },  direction: 'bidir' },
    ],
    defaultValues: { resistance: '10kΩ' },
  },
  {
    id: 'capacitor', name: 'Capacitor', category: 'Passive', symbol: 'capacitor',
    pins: [
      { id: '1', name: '+', position: { x: -1, y: 0 }, direction: 'bidir' },
      { id: '2', name: '-', position: { x: 1, y: 0 },  direction: 'bidir' },
    ],
    defaultValues: { capacitance: '100nF' },
  },
  {
    id: 'inductor', name: 'Inductor', category: 'Passive', symbol: 'inductor',
    pins: [
      { id: '1', name: 'Pin 1', position: { x: -1, y: 0 }, direction: 'bidir' },
      { id: '2', name: 'Pin 2', position: { x: 1, y: 0 },  direction: 'bidir' },
    ],
    defaultValues: { inductance: '10mH' },
  },
  {
    id: 'switch', name: 'SPST Switch', category: 'Passive', symbol: 'switch',
    pins: [
      { id: '1', name: 'Pin 1', position: { x: -1, y: 0 }, direction: 'bidir' },
      { id: '2', name: 'Pin 2', position: { x: 1, y: 0 },  direction: 'bidir' },
    ],
    defaultValues: { state: 'Open' },
    interactive: true
  },
  {
    id: 'push-button', name: 'Push Button', category: 'Passive', symbol: 'switch',
    pins: [
      { id: '1', name: 'Pin 1', position: { x: -1, y: 0 }, direction: 'bidir' },
      { id: '2', name: 'Pin 2', position: { x: 1, y: 0 },  direction: 'bidir' },
    ],
    defaultValues: { state: 'Open' },
    interactive: true
  },
  {
    id: 'potentiometer', name: 'Potentiometer', category: 'Passive', symbol: 'potentiometer',
    pins: [
      { id: 'cw',  name: 'CW',    position: { x: -1, y: -0.5 }, direction: 'in' },
      { id: 'ccw', name: 'CCW',   position: { x: -1, y: 0.5 },  direction: 'in' },
      { id: 'w',   name: 'Wiper', position: { x: 1, y: 0 },     direction: 'out' },
    ],
    defaultValues: { resistance: '10kΩ', value: '50%' },
  },
  {
    id: 'crystal', name: 'Crystal', category: 'Passive', symbol: 'crystal',
    pins: [
      { id: '1', name: 'Pin 1', position: { x: -1, y: 0 }, direction: 'bidir' },
      { id: '2', name: 'Pin 2', position: { x: 1, y: 0 },  direction: 'bidir' },
    ],
    defaultValues: { frequency: '16MHz' },
  },
  /* ── Active ────────────────────────────────────────────────────────────── */
  {
    id: 'led-red', name: 'LED (Red)', category: 'Active', symbol: 'led',
    pins: [
      { id: 'a', name: 'A', position: { x: -1, y: 0 }, direction: 'in' },
      { id: 'k', name: 'K', position: { x: 1, y: 0 },  direction: 'in' },
    ],
    defaultValues: { color: 'Red', Vf: '1.8V', If: '20mA' },
  },
  {
    id: 'led-green', name: 'LED (Green)', category: 'Active', symbol: 'led-green',
    pins: [
      { id: 'a', name: 'A', position: { x: -1, y: 0 }, direction: 'in' },
      { id: 'k', name: 'K', position: { x: 1, y: 0 },  direction: 'in' },
    ],
    defaultValues: { color: 'Green', Vf: '2.2V', If: '20mA' },
  },
  {
    id: 'led-blue', name: 'LED (Blue)', category: 'Active', symbol: 'led-blue',
    pins: [
      { id: 'a', name: 'A', position: { x: -1, y: 0 }, direction: 'in' },
      { id: 'k', name: 'K', position: { x: 1, y: 0 },  direction: 'in' },
    ],
    defaultValues: { color: 'Blue', Vf: '3.0V', If: '20mA' },
  },
  {
    id: 'led-yellow', name: 'LED (Yellow)', category: 'Active', symbol: 'led-yellow',
    pins: [
      { id: 'a', name: 'A', position: { x: -1, y: 0 }, direction: 'in' },
      { id: 'k', name: 'K', position: { x: 1, y: 0 },  direction: 'in' },
    ],
    defaultValues: { color: 'Yellow', Vf: '2.1V', If: '20mA' },
  },
  {
    id: 'rgb-led', name: 'RGB LED', category: 'Active', symbol: 'rgb-led',
    pins: [
      { id: 'r',   name: 'R',   position: { x: -1, y: -0.6 }, direction: 'in' },
      { id: 'g',   name: 'G',   position: { x: -1, y: 0 },    direction: 'in' },
      { id: 'b',   name: 'B',   position: { x: -1, y: 0.6 },  direction: 'in' },
      { id: 'gnd', name: 'GND', position: { x: 1, y: 0 },     direction: 'in' },
    ],
    defaultValues: { type: 'Common Cathode' },
  },
  {
    id: 'diode', name: 'Diode', category: 'Active', symbol: 'diode',
    pins: [
      { id: 'a', name: 'A', position: { x: -1, y: 0 }, direction: 'in' },
      { id: 'k', name: 'K', position: { x: 1, y: 0 },  direction: 'out' },
    ],
    defaultValues: { model: '1N4148' },
  },
  {
    id: 'zener', name: 'Zener Diode', category: 'Active', symbol: 'zener',
    pins: [
      { id: 'a', name: 'A', position: { x: -1, y: 0 }, direction: 'in' },
      { id: 'k', name: 'K', position: { x: 1, y: 0 },  direction: 'out' },
    ],
    defaultValues: { model: '1N4733A', Vz: '5.1V' },
  },
  {
    id: 'schottky', name: 'Schottky Diode', category: 'Active', symbol: 'schottky',
    pins: [
      { id: 'a', name: 'A', position: { x: -1, y: 0 }, direction: 'in' },
      { id: 'k', name: 'K', position: { x: 1, y: 0 },  direction: 'out' },
    ],
    defaultValues: { model: '1N5819', Vf: '0.3V' },
  },
  {
    id: 'mosfet-n', name: 'N-Ch MOSFET', category: 'Active', symbol: 'mosfet',
    pins: [
      { id: 'g', name: 'G', position: { x: -1, y: 0 },  direction: 'in' },
      { id: 'd', name: 'D', position: { x: 0, y: -1 },  direction: 'in' },
      { id: 's', name: 'S', position: { x: 0, y: 1 },   direction: 'out' },
    ],
    defaultValues: { model: 'IRFZ44N', type: 'N-Channel' },
  },
  {
    id: 'transistor-npn', name: 'NPN Transistor', category: 'Active', symbol: 'transistor',
    pins: [
      { id: 'b', name: 'B', position: { x: -1, y: 0 },  direction: 'in' },
      { id: 'c', name: 'C', position: { x: 0, y: -1 },  direction: 'in' },
      { id: 'e', name: 'E', position: { x: 0, y: 1 },   direction: 'out' },
    ],
    defaultValues: { model: '2N2222', type: 'NPN' },
  },
  {
    id: 'opamp', name: 'Op-Amp', category: 'Active', symbol: 'opamp',
    pins: [
      { id: 'in+', name: 'IN+', position: { x: -1, y: -0.5 }, direction: 'in' },
      { id: 'in-', name: 'IN-', position: { x: -1, y: 0.5 },  direction: 'in' },
      { id: 'out', name: 'OUT', position: { x: 1, y: 0 },      direction: 'out' },
      { id: 'v+',  name: 'V+',  position: { x: 0, y: -1 },     direction: 'in' },
      { id: 'v-',  name: 'V-',  position: { x: 0, y: 1 },      direction: 'in' },
    ],
    defaultValues: { part: 'TL072' },
  },
  /* ── Power ─────────────────────────────────────────────────────────────── */
  {
    id: 'battery', name: 'Battery', category: 'Power', symbol: 'battery',
    pins: [
      { id: 'pos', name: '+', position: { x: 0, y: -1 }, direction: 'out' },
      { id: 'neg', name: '-', position: { x: 0, y: 1 },  direction: 'in' },
    ],
    defaultValues: { voltage: '9V' },
  },
  {
    id: 'vcc', name: 'VCC (+5V)', category: 'Power', symbol: 'power',
    pins: [{ id: 'vcc', name: 'VCC', position: { x: 0, y: 1 }, direction: 'out' }],
    defaultValues: { voltage: '5V' },
  },
  {
    id: 'vcc-3v3', name: 'VCC (+3.3V)', category: 'Power', symbol: 'power',
    pins: [{ id: 'vcc', name: 'VCC', position: { x: 0, y: 1 }, direction: 'out' }],
    defaultValues: { voltage: '3.3V' },
  },
  {
    id: 'ground', name: 'Ground', category: 'Power', symbol: 'ground',
    pins: [{ id: 'gnd', name: 'GND', position: { x: 0, y: -1 }, direction: 'in' }],
    defaultValues: {},
  },
  {
    id: 'reg-7805', name: 'Reg. +5V (7805)', category: 'Power', symbol: 'regulator',
    pins: [
      { id: 'in',  name: 'VIN',  position: { x: -1, y: 0 },  direction: 'in' },
      { id: 'gnd', name: 'GND',  position: { x: 0, y: 1 },   direction: 'in' },
      { id: 'out', name: 'VOUT', position: { x: 1, y: 0 },   direction: 'out' },
    ],
    defaultValues: { part: 'L7805', Vout: '5V' },
  },
  {
    id: 'reg-3v3', name: 'Reg. +3.3V (AMS1117)', category: 'Power', symbol: 'regulator',
    pins: [
      { id: 'in',  name: 'VIN',  position: { x: -1, y: 0 },  direction: 'in' },
      { id: 'gnd', name: 'GND',  position: { x: 0, y: 1 },   direction: 'in' },
      { id: 'out', name: 'VOUT', position: { x: 1, y: 0 },   direction: 'out' },
    ],
    defaultValues: { part: 'AMS1117-3.3', Vout: '3.3V' },
  },
  /* ── Integrated ─────────────────────────────────────────────────────────── */
  {
    id: 'ic-ne555', name: 'NE555 Timer', category: 'Integrated', symbol: 'ic-8',
    pins: [
      { id: '1', name: 'GND', position: { x: -1, y: -0.6 }, direction: 'in' },
      { id: '2', name: 'TRG', position: { x: -1, y: -0.2 }, direction: 'in' },
      { id: '3', name: 'OUT', position: { x: -1, y: 0.2 },  direction: 'out' },
      { id: '4', name: 'RST', position: { x: -1, y: 0.6 },  direction: 'in' },
      { id: '5', name: 'CV',  position: { x: 1, y: 0.6 },   direction: 'bidir' },
      { id: '6', name: 'THR', position: { x: 1, y: 0.2 },   direction: 'in' },
      { id: '7', name: 'DIS', position: { x: 1, y: -0.2 },  direction: 'out' },
      { id: '8', name: 'VCC', position: { x: 1, y: -0.6 },  direction: 'in' },
    ],
    defaultValues: { part: 'NE555', mode: 'Astable' },
  },
  {
    id: 'opamp-lm741', name: 'LM741 Op-Amp', category: 'Integrated', symbol: 'ic-8',
    pins: [
      { id: '1', name: 'OFF1', position: { x: -1, y: -0.6 }, direction: 'bidir' },
      { id: '2', name: 'IN-',  position: { x: -1, y: -0.2 }, direction: 'in' },
      { id: '3', name: 'IN+',  position: { x: -1, y: 0.2 },  direction: 'in' },
      { id: '4', name: 'V-',   position: { x: -1, y: 0.6 },  direction: 'in' },
      { id: '5', name: 'OFF2', position: { x: 1, y: 0.6 },   direction: 'bidir' },
      { id: '6', name: 'OUT',  position: { x: 1, y: 0.2 },   direction: 'out' },
      { id: '7', name: 'V+',   position: { x: 1, y: -0.2 },  direction: 'in' },
      { id: '8', name: 'NC',   position: { x: 1, y: -0.6 },  direction: 'bidir' },
    ],
    defaultValues: { part: 'LM741' },
  },
  {
    id: 'atmega328p', name: 'ATmega328P', category: 'Integrated', symbol: 'microcontroller',
    pins: [
      { id: 'rst',  name: 'RESET', position: { x: -1, y: -0.8 }, direction: 'in' },
      { id: 'rxd',  name: 'RXD',   position: { x: -1, y: -0.6 }, direction: 'in' },
      { id: 'txd',  name: 'TXD',   position: { x: -1, y: -0.4 }, direction: 'out' },
      { id: 'int0', name: 'INT0',  position: { x: -1, y: -0.2 }, direction: 'in' },
      { id: 'vcc',  name: 'VCC',   position: { x: -1, y: 0.2 },  direction: 'in' },
      { id: 'gnd',  name: 'GND',   position: { x: -1, y: 0.4 },  direction: 'in' },
      { id: 'mosi', name: 'MOSI',  position: { x: 1, y: -0.8 },  direction: 'bidir' },
      { id: 'miso', name: 'MISO',  position: { x: 1, y: -0.6 },  direction: 'bidir' },
      { id: 'sck',  name: 'SCK',   position: { x: 1, y: -0.4 },  direction: 'in' },
      { id: 'adc0', name: 'ADC0',  position: { x: 1, y: 0.0 },   direction: 'bidir' },
      { id: 'adc1', name: 'ADC1',  position: { x: 1, y: 0.2 },   direction: 'bidir' },
      { id: 'avcc', name: 'AVCC',  position: { x: 1, y: 0.6 },   direction: 'in' },
    ],
    defaultValues: { clock: '16MHz', package: 'DIP-28' },
  },
  /* ── Logic ICs (74HC series — for analog↔digital bridge) ─────────────── */
  {
    id: '74hc00', name: '74HC00 NAND', category: 'Logic', symbol: 'logic-nand',
    pins: [
      { id: 'a', name: 'A',  position: { x: -1, y: -0.4 }, direction: 'in' },
      { id: 'b', name: 'B',  position: { x: -1, y: 0.4 },  direction: 'in' },
      { id: 'y', name: 'Y',  position: { x: 1, y: 0 },     direction: 'out' },
      { id: 'vcc', name: 'VCC', position: { x: 0, y: -1 }, direction: 'in' },
      { id: 'gnd', name: 'GND', position: { x: 0, y: 1 },  direction: 'in' },
    ],
    defaultValues: { part: '74HC00', package: 'DIP-14' },
  },
  {
    id: '74hc02', name: '74HC02 NOR', category: 'Logic', symbol: 'logic-nor',
    pins: [
      { id: 'a', name: 'A',  position: { x: -1, y: -0.4 }, direction: 'in' },
      { id: 'b', name: 'B',  position: { x: -1, y: 0.4 },  direction: 'in' },
      { id: 'y', name: 'Y',  position: { x: 1, y: 0 },     direction: 'out' },
      { id: 'vcc', name: 'VCC', position: { x: 0, y: -1 }, direction: 'in' },
      { id: 'gnd', name: 'GND', position: { x: 0, y: 1 },  direction: 'in' },
    ],
    defaultValues: { part: '74HC02', package: 'DIP-14' },
  },
  {
    id: '74hc04', name: '74HC04 NOT/Inv', category: 'Logic', symbol: 'logic-not',
    pins: [
      { id: 'a', name: 'A',  position: { x: -1, y: 0 },    direction: 'in' },
      { id: 'y', name: 'Y',  position: { x: 1, y: 0 },     direction: 'out' },
      { id: 'vcc', name: 'VCC', position: { x: 0, y: -1 }, direction: 'in' },
      { id: 'gnd', name: 'GND', position: { x: 0, y: 1 },  direction: 'in' },
    ],
    defaultValues: { part: '74HC04', package: 'DIP-14' },
  },
  {
    id: '74hc08', name: '74HC08 AND', category: 'Logic', symbol: 'logic-and',
    pins: [
      { id: 'a', name: 'A',  position: { x: -1, y: -0.4 }, direction: 'in' },
      { id: 'b', name: 'B',  position: { x: -1, y: 0.4 },  direction: 'in' },
      { id: 'y', name: 'Y',  position: { x: 1, y: 0 },     direction: 'out' },
      { id: 'vcc', name: 'VCC', position: { x: 0, y: -1 }, direction: 'in' },
      { id: 'gnd', name: 'GND', position: { x: 0, y: 1 },  direction: 'in' },
    ],
    defaultValues: { part: '74HC08', package: 'DIP-14' },
  },
  {
    id: '74hc32', name: '74HC32 OR', category: 'Logic', symbol: 'logic-or',
    pins: [
      { id: 'a', name: 'A',  position: { x: -1, y: -0.4 }, direction: 'in' },
      { id: 'b', name: 'B',  position: { x: -1, y: 0.4 },  direction: 'in' },
      { id: 'y', name: 'Y',  position: { x: 1, y: 0 },     direction: 'out' },
      { id: 'vcc', name: 'VCC', position: { x: 0, y: -1 }, direction: 'in' },
      { id: 'gnd', name: 'GND', position: { x: 0, y: 1 },  direction: 'in' },
    ],
    defaultValues: { part: '74HC32', package: 'DIP-14' },
  },
  {
    id: '74hc86', name: '74HC86 XOR', category: 'Logic', symbol: 'logic-xor',
    pins: [
      { id: 'a', name: 'A',  position: { x: -1, y: -0.4 }, direction: 'in' },
      { id: 'b', name: 'B',  position: { x: -1, y: 0.4 },  direction: 'in' },
      { id: 'y', name: 'Y',  position: { x: 1, y: 0 },     direction: 'out' },
      { id: 'vcc', name: 'VCC', position: { x: 0, y: -1 }, direction: 'in' },
      { id: 'gnd', name: 'GND', position: { x: 0, y: 1 },  direction: 'in' },
    ],
    defaultValues: { part: '74HC86', package: 'DIP-14' },
  },
  /* ── Module ─────────────────────────────────────────────────────────────── */
  {
    id: 'esp32-wroom', name: 'ESP32-WROOM', category: 'Module', symbol: 'microcontroller',
    pins: [
      { id: '3v3',  name: '3V3',  position: { x: -1, y: -0.8 }, direction: 'in' },
      { id: 'en',   name: 'EN',   position: { x: -1, y: -0.6 }, direction: 'in' },
      { id: 'io0',  name: 'IO0',  position: { x: -1, y: -0.4 }, direction: 'bidir' },
      { id: 'io2',  name: 'IO2',  position: { x: -1, y: -0.2 }, direction: 'bidir' },
      { id: 'gnd',  name: 'GND',  position: { x: -1, y: 0.0 },  direction: 'in' },
      { id: 'tx',   name: 'TXD',  position: { x: -1, y: 0.4 },  direction: 'out' },
      { id: 'rx',   name: 'RXD',  position: { x: -1, y: 0.6 },  direction: 'in' },
      { id: 'io5',  name: 'IO5',  position: { x: 1, y: -0.8 },  direction: 'bidir' },
      { id: 'io18', name: 'IO18', position: { x: 1, y: -0.6 },  direction: 'bidir' },
      { id: 'io19', name: 'IO19', position: { x: 1, y: -0.4 },  direction: 'bidir' },
      { id: 'io21', name: 'IO21', position: { x: 1, y: -0.2 },  direction: 'bidir' },
      { id: 'io22', name: 'IO22', position: { x: 1, y: 0.0 },   direction: 'bidir' },
      { id: 'io23', name: 'IO23', position: { x: 1, y: 0.2 },   direction: 'bidir' },
    ],
    defaultValues: { flash: '4MB', wifi: '2.4GHz', bt: 'BLE 4.2' },
  },
  /* ── Sensor ─────────────────────────────────────────────────────────────── */
  {
    id: 'dht22', name: 'DHT22 (Temp/Hum)', category: 'Sensor', symbol: 'sensor-dht',
    pins: [
      { id: 'vcc', name: 'VCC',  position: { x: -1, y: -0.5 }, direction: 'in' },
      { id: 'dat', name: 'DATA', position: { x: -1, y: 0 },    direction: 'bidir' },
      { id: 'gnd', name: 'GND',  position: { x: -1, y: 0.5 },  direction: 'in' },
    ],
    defaultValues: { range: '-40 to +80°C', accuracy: '±0.5°C' },
  },
  {
    id: 'mpu6050', name: 'MPU-6050 IMU', category: 'Sensor', symbol: 'module-i2c',
    pins: [
      { id: 'vcc', name: 'VCC', position: { x: -1, y: -0.6 }, direction: 'in' },
      { id: 'gnd', name: 'GND', position: { x: -1, y: -0.2 }, direction: 'in' },
      { id: 'scl', name: 'SCL', position: { x: 1, y: -0.6 },  direction: 'in' },
      { id: 'sda', name: 'SDA', position: { x: 1, y: -0.2 },  direction: 'bidir' },
      { id: 'int', name: 'INT', position: { x: 1, y: 0.2 },   direction: 'out' },
    ],
    defaultValues: { range: '±2g / ±250°/s', interface: 'I2C' },
  },
  {
    id: 'ldr', name: 'LDR Photocell', category: 'Sensor', symbol: 'ldr',
    pins: [
      { id: '1', name: '1', position: { x: -1, y: 0 }, direction: 'bidir' },
      { id: '2', name: '2', position: { x: 1, y: 0 },  direction: 'bidir' },
    ],
    defaultValues: { type: 'GL55', darkR: '1MΩ', lightR: '1kΩ' },
  },
  {
    id: 'thermistor', name: 'Thermistor (NTC)', category: 'Sensor', symbol: 'thermistor',
    pins: [
      { id: '1', name: '1', position: { x: -1, y: 0 }, direction: 'bidir' },
      { id: '2', name: '2', position: { x: 1, y: 0 },  direction: 'bidir' },
    ],
    defaultValues: { resistance: '10kΩ@25°C', B: '3950K' },
  },
  {
    id: 'photodiode', name: 'Photodiode', category: 'Sensor', symbol: 'diode',
    pins: [
      { id: 'a', name: 'A', position: { x: -1, y: 0 }, direction: 'in' },
      { id: 'k', name: 'K', position: { x: 1, y: 0 },  direction: 'out' },
    ],
    defaultValues: { model: 'BPW34', wavelength: '850nm' },
  },
  /* ── Other ──────────────────────────────────────────────────────────────── */
  {
    id: 'buzzer', name: 'Piezo Buzzer', category: 'Other', symbol: 'buzzer',
    pins: [
      { id: '+', name: '+', position: { x: -1, y: 0 }, direction: 'in' },
      { id: '-', name: '-', position: { x: 1, y: 0 },  direction: 'in' },
    ],
    defaultValues: { frequency: '2kHz', voltage: '5V' },
  },
  {
    id: 'speaker', name: 'Speaker', category: 'Other', symbol: 'speaker',
    pins: [
      { id: '+', name: '+', position: { x: -1, y: 0 }, direction: 'in' },
      { id: '-', name: '-', position: { x: 1, y: 0 },  direction: 'in' },
    ],
    defaultValues: { impedance: '8Ω', power: '0.5W' },
  },
  {
    id: 'relay-spdt', name: 'SPDT Relay', category: 'Other', symbol: 'relay',
    pins: [
      { id: 'coil+', name: 'COIL+', position: { x: -1, y: -0.4 }, direction: 'in' },
      { id: 'coil-', name: 'COIL-', position: { x: -1, y: 0.4 },  direction: 'in' },
      { id: 'com',   name: 'COM',   position: { x: 1, y: 0 },     direction: 'bidir' },
      { id: 'no',    name: 'NO',    position: { x: 1, y: -0.4 },  direction: 'bidir' },
      { id: 'nc',    name: 'NC',    position: { x: 1, y: 0.4 },   direction: 'bidir' },
    ],
    defaultValues: { voltage: '5V', current: '10A' },
  },
  {
    id: 'motor-dc', name: 'DC Motor', category: 'Other', symbol: 'motor',
    pins: [
      { id: '+', name: '+', position: { x: -1, y: 0 }, direction: 'in' },
      { id: '-', name: '-', position: { x: 1, y: 0 },  direction: 'in' },
    ],
    defaultValues: { voltage: '6V', rpm: '100', type: 'Geared' },
  },
  {
    id: 'servo', name: 'Servo Motor', category: 'Other', symbol: 'servo',
    pins: [
      { id: 'vcc',    name: 'VCC',    position: { x: -1, y: -0.5 }, direction: 'in' },
      { id: 'gnd',    name: 'GND',    position: { x: -1, y: 0.5 },  direction: 'in' },
      { id: 'signal', name: 'SIGNAL', position: { x: 1, y: 0 },     direction: 'in' },
    ],
    defaultValues: { type: 'SG90', angle: '0-180°', voltage: '5V' },
  },
  {
    id: 'oled-128x64', name: 'OLED 128×64 (I2C)', category: 'Other', symbol: 'oled',
    pins: [
      { id: 'vcc', name: 'VCC', position: { x: -1, y: -0.4 }, direction: 'in' },
      { id: 'gnd', name: 'GND', position: { x: -1, y: 0 },    direction: 'in' },
      { id: 'scl', name: 'SCL', position: { x: -1, y: 0.4 },  direction: 'in' },
      { id: 'sda', name: 'SDA', position: { x: 1, y: 0 },     direction: 'bidir' },
    ],
    defaultValues: { address: '0x3C', interface: 'I2C', size: '128×64' },
  },
  {
    id: 'lcd-16x2', name: 'LCD 16×2 (I2C)', category: 'Other', symbol: 'lcd',
    pins: [
      { id: 'vcc', name: 'VCC', position: { x: -1, y: -0.5 }, direction: 'in' },
      { id: 'gnd', name: 'GND', position: { x: -1, y: 0 },    direction: 'in' },
      { id: 'sda', name: 'SDA', position: { x: -1, y: 0.5 },  direction: 'bidir' },
      { id: 'scl', name: 'SCL', position: { x: 1, y: 0 },     direction: 'in' },
    ],
    defaultValues: { address: '0x27', interface: 'I2C', size: '16×2' },
  },
  {
    id: 'seg7-display', name: '7-Seg Display', category: 'Other', symbol: 'seg7-display',
    pins: [
      { id: 'a',   name: 'A',   position: { x: -1, y: -0.8 }, direction: 'in' },
      { id: 'b',   name: 'B',   position: { x: -1, y: -0.5 }, direction: 'in' },
      { id: 'c',   name: 'C',   position: { x: -1, y: -0.2 }, direction: 'in' },
      { id: 'd',   name: 'D',   position: { x: -1, y: 0.1 },  direction: 'in' },
      { id: 'e',   name: 'E',   position: { x: -1, y: 0.4 },  direction: 'in' },
      { id: 'f',   name: 'F',   position: { x: 1, y: -0.5 },  direction: 'in' },
      { id: 'g',   name: 'G',   position: { x: 1, y: 0 },     direction: 'in' },
      { id: 'dp',  name: 'DP',  position: { x: 1, y: 0.5 },   direction: 'in' },
      { id: 'vcc', name: 'VCC', position: { x: 0, y: -1 },    direction: 'in' },
    ],
    defaultValues: { type: 'Common Cathode', color: 'Red' },
  },
];

export const CATEGORY_ORDER: string[] = [
  'Power', 'Passive', 'Active', 'Integrated', 'Module', 'Sensor', 'Logic', 'Other',
];

export const COMPONENT_TEMPLATES: ComponentTemplate[] = RAW_TEMPLATES;
