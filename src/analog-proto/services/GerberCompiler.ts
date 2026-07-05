import { CircuitDesign, Component, Connection } from '../types';
import { COMPONENT_DEFINITIONS } from '../constants';

export class GerberCompiler {
  private static formatCoord(val: number): string {
    // RS-274X commonly uses 2.4 format (2 integer, 4 decimal) without decimals
    const mm = val * 0.1; // roughly scale screen pixels to mm
    let str = Math.round(mm * 10000).toString();
    while (str.length < 6) str = '0' + str;
    return str;
  }

  static compileGTL(design: CircuitDesign): string {
    let out = `%FSLAX24Y24*%\n%MOIN*%\n%SFA1.0B1.0*%\n`;
    out += `%ADD10C,1.5000*%\n`; // Aperture 10: 1.5mm Circle Pad
    out += `%ADD11R,1.5000X2.0000*%\n`; // Aperture 11: Rect Pad
    out += `%ADD20C,0.5000*%\n`; // Aperture 20: 0.5mm Trace
    
    // Draw Pads
    design.components.forEach(comp => {
      const x = comp.layoutX || 0;
      const y = comp.layoutY || 0;
      
      const isSMD = ['LOGIC_AND', 'LOGIC_OR', 'XOR_GATE', 'XNOR_GATE', 'NAND_GATE', 'NOR_GATE', 'LOGIC_NOT', 'OP_AMP', 'INTEGRATED_CIRCUIT'].includes(comp.type);
      
      if (isSMD) {
        out += `D11*\n`; // Select Rect Pad
        // Generic 8-pin / 14-pin simulation
        [20, 33, 46, 59].forEach(px => {
          out += `X${this.formatCoord(x + px)}Y${this.formatCoord(y + 8)}D03*\n`;
          out += `X${this.formatCoord(x + px)}Y${this.formatCoord(y + 52)}D03*\n`;
        });
      } else {
        out += `D10*\n`; // Select Circle Pad
        out += `X${this.formatCoord(x + 10)}Y${this.formatCoord(y + 20)}D03*\n`;
        out += `X${this.formatCoord(x + 70)}Y${this.formatCoord(y + 20)}D03*\n`;
      }
    });

    // Draw Traces
    out += `D20*\n`; // Select Trace Aperture
    design.connections.forEach(conn => {
      const fromC = design.components.find(c => c.id === conn.from);
      const toC = design.components.find(c => c.id === conn.to);
      if (!fromC || !toC) return;
      
      const x1 = (fromC.layoutX || 0) + 20;
      const y1 = (fromC.layoutY || 0) + 20;
      const x2 = (toC.layoutX || 0) + 20;
      const y2 = (toC.layoutY || 0) + 20;
      const midX = x1 + (x2 - x1)/2;

      out += `X${this.formatCoord(x1)}Y${this.formatCoord(y1)}D02*\n`; // Move to Start
      out += `X${this.formatCoord(midX)}Y${this.formatCoord(y1)}D01*\n`; // Draw to Mid
      out += `X${this.formatCoord(midX)}Y${this.formatCoord(y2)}D01*\n`; // Draw down
      out += `X${this.formatCoord(x2)}Y${this.formatCoord(y2)}D01*\n`; // Draw to End
    });

    out += `M02*\n`;
    return out;
  }

  static compileGTO(design: CircuitDesign): string {
    let out = `%FSLAX24Y24*%\n%MOIN*%\n`;
    out += `%ADD20C,0.2000*%\n`; // 0.2mm silkscreen pen
    out += `D20*\n`;

    design.components.forEach(comp => {
      const x = comp.layoutX || 0;
      const y = comp.layoutY || 0;
      
      // Draw Box Outline
      const w = 80; const h = 40;
      out += `X${this.formatCoord(x)}Y${this.formatCoord(y)}D02*\n`;
      out += `X${this.formatCoord(x+w)}Y${this.formatCoord(y)}D01*\n`;
      out += `X${this.formatCoord(x+w)}Y${this.formatCoord(y+h)}D01*\n`;
      out += `X${this.formatCoord(x)}Y${this.formatCoord(y+h)}D01*\n`;
      out += `X${this.formatCoord(x)}Y${this.formatCoord(y)}D01*\n`;
    });

    out += `M02*\n`;
    return out;
  }

  static compileDRL(design: CircuitDesign): string {
    let out = `M48\nMETRIC,TZ\nT01C0.800\n%\nT01\n`;
    
    design.components.forEach(comp => {
      const x = comp.layoutX || 0;
      const y = comp.layoutY || 0;
      
      const isSMD = ['LOGIC_AND', 'LOGIC_OR', 'XOR_GATE', 'XNOR_GATE', 'NAND_GATE', 'NOR_GATE', 'LOGIC_NOT', 'OP_AMP', 'INTEGRATED_CIRCUIT'].includes(comp.type);
      
      if (!isSMD) {
        // Through hole components
        out += `X${this.formatCoord(x + 10)}Y${this.formatCoord(y + 20)}\n`;
        out += `X${this.formatCoord(x + 70)}Y${this.formatCoord(y + 20)}\n`;
      }
    });

    out += `M30\n`;
    return out;
  }
}
