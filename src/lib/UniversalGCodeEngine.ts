export interface Waypoint {
  x: number;
  y: number;
  z?: number;
  feedrate?: number;
}

export interface CircularArc extends Waypoint {
  i: number;
  j: number;
  isClockwise: boolean;
}

export class UniversalGCodeEngine {
  private static format(val: number, decimals: number = 3): string {
    return val.toFixed(decimals);
  }

  /**
   * Generates a standard G-Code preamble for CNC and Robotics.
   */
  static generatePreamble(name: string = "ASCAD_JOB", useMetric: boolean = true): string {
    let gcode = `(${name})\n`;
    gcode += useMetric ? `G21 (Metric)\n` : `G20 (Imperial)\n`;
    gcode += `G90 (Absolute Positioning)\n`;
    gcode += `G00 Z5.000 (Safe Height)\n`;
    return gcode;
  }

  /**
   * Generates an epilogue to safely home and stop the machine.
   */
  static generateEpilogue(): string {
    let gcode = `G00 Z5.000 (Retract)\n`;
    gcode += `M05 (Spindle/Tool Off)\n`;
    gcode += `G00 X0.000 Y0.000 (Return to Home)\n`;
    gcode += `M30 (End Program)\n`;
    return gcode;
  }

  /**
   * Universal method for generating a sequence of waypoints for Robotic Arms or EngiGraph Splines.
   */
  static generateKinematicPath(waypoints: Waypoint[] | CircularArc[], toolCommand: string = 'M03 S10000'): string {
    if (waypoints.length === 0) return '';
    let gcode = `${toolCommand} (Tool On)\n`;
    gcode += `G04 P1 (Dwell)\n`;

    waypoints.forEach((wp, idx) => {
      const isArc = 'i' in wp && 'j' in wp;
      
      if (idx === 0) {
        // Rapid to first point
        gcode += `G00 X${this.format(wp.x)} Y${this.format(wp.y)}\n`;
        if (wp.z !== undefined) {
          gcode += `G01 Z${this.format(wp.z)} F50.0 (Plunge)\n`;
        }
      } else {
        if (isArc) {
          const arc = wp as CircularArc;
          const cmd = arc.isClockwise ? 'G02' : 'G03';
          gcode += `${cmd} X${this.format(arc.x)} Y${this.format(arc.y)} I${this.format(arc.i)} J${this.format(arc.j)}${arc.feedrate ? ' F' + this.format(arc.feedrate) : ''}\n`;
        } else {
          gcode += `G01 X${this.format(wp.x)} Y${this.format(wp.y)}${wp.z !== undefined ? ' Z' + this.format(wp.z) : ''}${wp.feedrate ? ' F' + this.format(wp.feedrate) : ''}\n`;
        }
      }
    });

    return gcode;
  }

  /**
   * Specifically tuned for the PCB Analog Lab to generate isolation routing paths from Circuit connections.
   */
  static generateIsolationRouting(design: any): string {
    let gcode = this.generatePreamble('ASCAD PCB ISOLATION ROUTING');
    gcode += `M03 S10000 (Spindle On)\n`;
    gcode += `G04 P2 (Dwell)\n\n`;

    // Extract connections and components directly
    const connections = design.connections || [];
    const components = design.components || [];

    connections.forEach((conn: any, idx: number) => {
      const fromC = components.find((c: any) => c.id === conn.from);
      const toC = components.find((c: any) => c.id === conn.to);
      if (!fromC || !toC) return;

      // Center approximations (scale from screen pixels to mm approx)
      const x1 = ((fromC.layoutX || 0) + 20) * 0.1;
      const y1 = ((fromC.layoutY || 0) + 20) * 0.1;
      const x2 = ((toC.layoutX || 0) + 20) * 0.1;
      const y2 = ((toC.layoutY || 0) + 20) * 0.1;
      const midX = x1 + (x2 - x1) / 2;

      gcode += `(Trace ${idx})\n`;
      gcode += `G00 X${this.format(x1)} Y${this.format(y1)}\n`; // Rapid
      gcode += `G01 Z-0.100 F50.0 (Plunge)\n`;
      gcode += `G01 X${this.format(midX)} Y${this.format(y1)} F150.0\n`;
      gcode += `G01 X${this.format(midX)} Y${this.format(y2)}\n`;
      gcode += `G01 X${this.format(x2)} Y${this.format(y2)}\n`;
      gcode += `G00 Z5.000\n\n`; // Retract
    });

    gcode += this.generateEpilogue();
    return gcode;
  }
}
