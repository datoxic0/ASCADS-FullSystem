import { PCBState } from '../store/usePCBStore';
import { FootprintLibrary } from '../lib/FootprintLibrary';

export class PCBGerberCompiler {
    private static formatCoord(val: number): string {
        // RS-274X: 2.4 format without decimal point
        let str = Math.round(val * 10000).toString();
        while (str.length < 6) str = '0' + str;
        return str;
    }

    private static getApertureMap(state: PCBState) {
        // Simple mapping: 
        // 10 = trace (e.g. 0.5mm)
        // 11 = circular pad (e.g. 1.5mm)
        // 12 = rect pad (e.g. 1.5x2.0mm)
        // In a real system, we'd dynamically assign D-codes based on sizes.
        return `
%ADD10C,0.5000*%
%ADD11C,1.5000*%
%ADD12R,1.5000X2.0000*%
`;
    }

    static compileGTL(state: PCBState): string {
        let out = `%FSLAX24Y24*%\n%MOIN*%\n%SFA1.0B1.0*%\n`;
        out += this.getApertureMap(state);
        
        // Draw footprints (Top layer only for simplicity)
        state.footprints.forEach(fp => {
            if (fp.layer !== 'top') return;
            const def = FootprintLibrary[fp.footprintId as keyof typeof FootprintLibrary];
            if (!def) return;
            
            def.pads.forEach((pad: any) => {
                // Adjust for rotation and position
                const rad = (fp.rotation * Math.PI) / 180;
                const px = pad.x * Math.cos(rad) - pad.y * Math.sin(rad) + fp.x;
                const py = pad.x * Math.sin(rad) + pad.y * Math.cos(rad) + fp.y;
                
                if (pad.shape === 'rect') {
                    out += `D12*\n`; // Rect pad
                } else {
                    out += `D11*\n`; // Circular pad
                }
                out += `X${this.formatCoord(px)}Y${this.formatCoord(py)}D03*\n`;
            });
        });

        // Draw traces
        out += `D10*\n`; // Select trace aperture
        state.tracks.forEach(track => {
            if (track.layer !== 'top_copper') return;
            const pts = track.points;
            if (pts.length < 4) return;
            out += `X${this.formatCoord(pts[0])}Y${this.formatCoord(pts[1])}D02*\n`; // Move to
            for (let i = 2; i < pts.length; i += 2) {
                out += `X${this.formatCoord(pts[i])}Y${this.formatCoord(pts[i+1])}D01*\n`; // Draw to
            }
        });

        out += `M02*\n`; // End of file
        return out;
    }

    static compileGTO(state: PCBState): string {
        let out = `%FSLAX24Y24*%\n%MOIN*%\n%SFA1.0B1.0*%\n`;
        out += `%ADD10C,0.2000*%\n`; // 0.2mm silkscreen trace
        
        // Draw silkscreen outlines
        out += `D10*\n`;
        state.footprints.forEach(fp => {
            if (fp.layer !== 'top') return;
            // Draw a simple bounding box
            const sx = fp.x - 5;
            const sy = fp.y - 5;
            const ex = fp.x + 5;
            const ey = fp.y + 5;
            
            out += `X${this.formatCoord(sx)}Y${this.formatCoord(sy)}D02*\n`;
            out += `X${this.formatCoord(ex)}Y${this.formatCoord(sy)}D01*\n`;
            out += `X${this.formatCoord(ex)}Y${this.formatCoord(ey)}D01*\n`;
            out += `X${this.formatCoord(sx)}Y${this.formatCoord(ey)}D01*\n`;
            out += `X${this.formatCoord(sx)}Y${this.formatCoord(sy)}D01*\n`;
        });

        out += `M02*\n`;
        return out;
    }

    static compileDRL(state: PCBState): string {
        let out = `M48\nMETRIC,TZ\nT01C0.8\nT02C1.0\n%\n`;
        out += `T01\n`; // Select 0.8mm drill
        
        // Vias
        state.vias.forEach(via => {
            out += `X${this.formatCoord(via.x)}Y${this.formatCoord(via.y)}\n`;
        });

        // Through-hole pads
        out += `T02\n`; // Select 1.0mm drill
        state.footprints.forEach(fp => {
            const def = FootprintLibrary[fp.footprintId as keyof typeof FootprintLibrary];
            if (!def) return;
            
            def.pads.forEach((pad: any) => {
                if (pad.shape === 'circle') { // Assumed TH pad
                    const rad = (fp.rotation * Math.PI) / 180;
                    const px = pad.x * Math.cos(rad) - pad.y * Math.sin(rad) + fp.x;
                    const py = pad.x * Math.sin(rad) + pad.y * Math.cos(rad) + fp.y;
                    out += `X${this.formatCoord(px)}Y${this.formatCoord(py)}\n`;
                }
            });
        });

        out += `M30\n`;
        return out;
    }

    static generateGCode(state: PCBState): string {
        let gcode = `(ASCAD PCB ISOLATION ROUTING - GENERATED)\n`;
        gcode += `G21 (Metric)\nG90 (Absolute Positioning)\nG00 Z5.000 (Safe Height)\n`;
        gcode += `M03 S10000 (Spindle On)\nG04 P2 (Dwell)\n\n`;

        state.tracks.forEach((track, idx) => {
            if (track.layer !== 'top_copper') return;
            const pts = track.points;
            if (pts.length < 4) return;

            gcode += `(Trace ${idx})\n`;
            gcode += `G00 X${pts[0].toFixed(3)} Y${pts[1].toFixed(3)}\n`; // Rapid
            gcode += `G01 Z-0.100 F50.0 (Plunge)\n`;
            
            for (let i = 2; i < pts.length; i += 2) {
                gcode += `G01 X${pts[i].toFixed(3)} Y${pts[i+1].toFixed(3)} F150.0\n`;
            }
            gcode += `G00 Z5.000 (Retract)\n\n`;
        });

        gcode += `G00 X0.000 Y0.000 (Return to Home)\nM05 (Spindle Off)\nM30 (End Program)\n`;
        return gcode;
    }
}
