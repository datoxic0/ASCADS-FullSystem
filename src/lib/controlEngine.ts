import * as math from 'mathjs';

export class ControlEngine {
  /**
   * Generates logarithmically spaced frequency points
   */
  static logspace(startDecade: number, stopDecade: number, pointsPerDecade: number): number[] {
    const totalPoints = (stopDecade - startDecade) * pointsPerDecade;
    const freqs = [];
    for (let i = 0; i <= totalPoints; i++) {
      freqs.push(Math.pow(10, startDecade + i / pointsPerDecade));
    }
    return freqs;
  }

  /**
   * Evaluates a transfer function H(s) over a logarithmic frequency range.
   * Replaces 's' with jω.
   */
  static evaluateBode(
    expr: string, 
    startDecade: number = -1, 
    stopDecade: number = 2, 
    pointsPerDecade: number = 50
  ): { w: number[], mag: number[], phase: number[], error?: string } {
    try {
      const node = math.parse(expr);
      const compiled = node.compile();
      
      const w = this.logspace(startDecade, stopDecade, pointsPerDecade);
      const mag: number[] = [];
      const phase: number[] = [];

      let prevPhase = 0;

      for (let i = 0; i < w.length; i++) {
        // Evaluate at s = j * w
        const s = math.complex(0, w[i]);
        const result = compiled.evaluate({ s });

        // If result is not complex (e.g. real number constant), wrap it
        const resComplex = typeof result === 'number' ? math.complex(result, 0) : result;
        
        // Magnitude in dB: 20 * log10(|H(jω)|)
        const absVal = Math.sqrt(resComplex.re * resComplex.re + resComplex.im * resComplex.im);
        mag.push(20 * Math.log10(absVal || 1e-10));

        // Phase in degrees
        let currentPhase = Math.atan2(resComplex.im, resComplex.re) * (180 / Math.PI);
        
        // Phase unwrapping
        if (i > 0) {
          let diff = currentPhase - prevPhase;
          while (diff > 180) {
            currentPhase -= 360;
            diff = currentPhase - prevPhase;
          }
          while (diff < -180) {
            currentPhase += 360;
            diff = currentPhase - prevPhase;
          }
        }
        
        phase.push(currentPhase);
        prevPhase = currentPhase;
      }

      return { w, mag, phase };
    } catch (e: any) {
      return { w: [], mag: [], phase: [], error: e.message };
    }
  }
}
