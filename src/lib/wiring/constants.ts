/**
 * Engigraphs Color Coding Standard
 * 
 * Standardized color references across all ASCADS logic modes (Analog, Digital, PLC).
 */

export const ENGIGRAPHS_COLORS = {
  // Official Tinkercad-Style Matrix Colors
  DEFAULT: '#6366f1', // 1: Default (Indigo/Slate)
  RED: '#ff3b30',     // 2: Red
  GREEN: '#4cd964',   // 3: Green
  BLUE: '#007aff',    // 4: Blue
  YELLOW: '#ffcc00',  // 5: Yellow
  CYAN: '#5ac8fa',    // 6: Cyan
  ORANGE: '#ff9500',  // 7: Orange
  PURPLE: '#af52de',  // 8: Purple
  STEEL: '#555555',   // 9: Steel
  BLACK: '#000000',   // 0: Black

  // Semantic mappings
  POWER_VCC: '#ff3b30',   // Red
  GROUND_GND: '#4cd964',  // Green
  ANALOG_SIGNAL: '#af52de', // Purple 
  LOGIC_HIGH: '#ffcc00',  // Yellow
  LOGIC_LOW: '#007aff',   // Blue
  PLC_POWER: '#ff9500',   // Orange
  PLC_DEENERGIZED: '#007aff', // Blue
  BASE_WIRE: '#6366f1',   // Default

  // Interactivity
  HOVER: '#5ac8fa',       // Cyan
  SELECTED: '#af52de',    // Purple
};

export const WIRE_DEFAULTS = {
  THICKNESS: 2,
  THICKNESS_ACTIVE: 3,
  THICKNESS_SELECTED: 4,
};
