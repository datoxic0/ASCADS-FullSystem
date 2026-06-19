/**
 * ASCADS Central Component Library
 * Unified registry of all components across Digital, Analog, and Mechatronic engines.
 */

import { COMPONENT_TEMPLATES } from './analog-constants';

export type Domain = 'digital' | 'analog' | 'mechatronic' | 'hybrid';

export interface UnifiedComponentDef {
  id: string;
  name: string;
  domain: Domain;
  description: string;
  defaultState?: string | boolean | number;
  properties?: Record<string, any>;
  interactive?: boolean; // Can it be right-clicked / toggled?
  pins?: any[]; // Schematic routing pins
  symbol?: string; // Rendering hint
}

const baseRegistry: Record<string, UnifiedComponentDef> = {
  // --- Digital Logic ---
  AND: { id: 'AND', name: 'AND Gate', domain: 'digital', description: 'Output is 1 only when all inputs are 1.' },
  OR:  { id: 'OR',  name: 'OR Gate',  domain: 'digital', description: 'Output is 1 when any input is 1.' },
  NOT: { id: 'NOT', name: 'NOT Gate', domain: 'digital', description: 'Logical inverter.' },
  SWITCH_SPST: { id: 'SWITCH_SPST', name: 'SPST Switch', domain: 'hybrid', description: 'Single Pole Single Throw Switch', interactive: true, defaultState: 'open' },
  BUTTON: { id: 'BUTTON', name: 'Push Button', domain: 'hybrid', description: 'Momentary Push Button', interactive: true, defaultState: false },
  LED_RED: { id: 'LED_RED', name: 'Red LED', domain: 'hybrid', description: 'Light Emitting Diode (Red)', interactive: false, defaultState: false },
  
  // --- Analog / Mechatronic ---
  NEMA17: { id: 'NEMA17', name: 'NEMA 17 Stepper', domain: 'mechatronic', description: 'Stepper Motor 42.3mm', interactive: false },
  DC_MOTOR_GENERIC: { id: 'DC_MOTOR_GENERIC', name: 'Generic DC Motor', domain: 'mechatronic', description: 'Standard DC Motor', interactive: false },
  SERVO_SG90: { id: 'SERVO_SG90', name: 'SG90 Micro Servo', domain: 'mechatronic', description: 'TowerPro SG90 Servo', interactive: false }
};

// Auto-merge Analog components
COMPONENT_TEMPLATES.forEach(tpl => {
  if (!baseRegistry[tpl.id.toUpperCase()]) {
    baseRegistry[tpl.id.toUpperCase()] = {
      id: tpl.id.toUpperCase(),
      name: tpl.name,
      domain: 'analog',
      description: tpl.description || tpl.name,
      properties: tpl.defaultValues,
      interactive: tpl.interactive || tpl.category === 'Passive' && tpl.symbol === 'switch',
      pins: tpl.pins,
      symbol: tpl.symbol
    };
  }
});

export const UNIFIED_REGISTRY = baseRegistry;

export function getComponentDef(id: string): UnifiedComponentDef | undefined {
  return UNIFIED_REGISTRY[id.toUpperCase()];
}
