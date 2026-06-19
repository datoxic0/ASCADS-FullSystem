export class DSPEngine {
  /**
   * Radix-2 Cooley-Tukey FFT
   * Array length must be a power of 2.
   */
  static fft(real: number[], imag: number[]): { real: number[], imag: number[] } {
    const n = real.length;
    if (n <= 1) return { real, imag };
    
    // Check if power of 2
    if ((n & (n - 1)) !== 0) {
      throw new Error("FFT length must be a power of 2");
    }

    // Bit-reversed addressing permutation
    const resultR = [...real];
    const resultI = [...imag];
    
    let j = 0;
    for (let i = 0; i < n - 1; i++) {
      if (i < j) {
        const tr = resultR[i];
        const ti = resultI[i];
        resultR[i] = resultR[j];
        resultI[i] = resultI[j];
        resultR[j] = tr;
        resultI[j] = ti;
      }
      let k = n >> 1;
      while (k <= j) {
        j -= k;
        k >>= 1;
      }
      j += k;
    }

    // Cooley-Tukey decimation-in-time
    for (let size = 2; size <= n; size *= 2) {
      const halfSize = size / 2;
      const step = -2 * Math.PI / size;
      for (let i = 0; i < n; i += size) {
        for (let k = 0; k < halfSize; k++) {
          const angle = k * step;
          const wr = Math.cos(angle);
          const wi = Math.sin(angle);
          
          const tr = wr * resultR[i + k + halfSize] - wi * resultI[i + k + halfSize];
          const ti = wr * resultI[i + k + halfSize] + wi * resultR[i + k + halfSize];
          
          resultR[i + k + halfSize] = resultR[i + k] - tr;
          resultI[i + k + halfSize] = resultI[i + k] - ti;
          
          resultR[i + k] += tr;
          resultI[i + k] += ti;
        }
      }
    }
    
    return { real: resultR, imag: resultI };
  }

  /**
   * Zero-pads an array to the next power of 2
   */
  static padToPowerOfTwo(arr: number[]): number[] {
    const nextPow2 = Math.pow(2, Math.ceil(Math.log2(arr.length)));
    if (arr.length === nextPow2) return arr;
    const padded = new Array(nextPow2).fill(0);
    for (let i = 0; i < arr.length; i++) padded[i] = arr[i];
    return padded;
  }

  /**
   * Computes magnitude spectrum
   */
  static magnitudeSpectrum(data: number[], sampleRate: number = 1): { frequencies: number[], magnitudes: number[] } {
    const padded = this.padToPowerOfTwo(data);
    const n = padded.length;
    const imag = new Array(n).fill(0);
    
    const { real: fftR, imag: fftI } = this.fft(padded, imag);
    
    // Only return first half (Nyquist limit)
    const halfN = Math.floor(n / 2);
    const magnitudes = new Array(halfN);
    const frequencies = new Array(halfN);
    
    for (let i = 0; i < halfN; i++) {
      // Normalize magnitude by N
      magnitudes[i] = Math.sqrt(fftR[i] * fftR[i] + fftI[i] * fftI[i]) / n;
      // Double the amplitude (except for DC bin) because we discarded the negative frequencies
      if (i > 0) magnitudes[i] *= 2; 
      frequencies[i] = (i * sampleRate) / n;
    }
    
    return { frequencies, magnitudes };
  }

  /**
   * Computes Linear Regression (Line of best fit)
   * Returns slope (m) and intercept (b) for y = mx + b
   */
  static linearRegression(xData: number[], yData: number[]): { m: number, b: number, r2: number } {
    const n = Math.min(xData.length, yData.length);
    if (n === 0) return { m: 0, b: 0, r2: 0 };

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (let i = 0; i < n; i++) {
      const x = xData[i];
      const y = yData[i];
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
      sumY2 += y * y;
    }

    const meanX = sumX / n;
    const meanY = sumY / n;
    
    const denominator = (sumX2 - sumX * sumX / n);
    const m = denominator === 0 ? 0 : (sumXY - sumX * sumY / n) / denominator;
    const b = meanY - m * meanX;

    // Calculate R-squared
    let ssTot = 0, ssRes = 0;
    for (let i = 0; i < n; i++) {
      const yFit = m * xData[i] + b;
      ssTot += Math.pow(yData[i] - meanY, 2);
      ssRes += Math.pow(yData[i] - yFit, 2);
    }
    const r2 = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);

    return { m, b, r2 };
  }
}
