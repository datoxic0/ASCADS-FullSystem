import { create, all } from 'mathjs';

const math = create(all);

export interface MathBlockResult {
  expr: string;
  simplified: string;
  latex: string;
  error?: string;
  value?: any;
  valueTex?: string;
  valueStr?: string;
  analysis?: any;
}

export class MathWorkspace {
  scope: Record<string, any>;

  constructor(initialGlobals: Record<string, number> = {}) {
    this.scope = {
      pi: Math.PI,
      tau: 2 * Math.PI,
      e: Math.E,
      // Robotics Kinematics
      dh: (theta: number, d: number, a: number, alpha: number) => {
        const th = theta * Math.PI / 180;
        const al = alpha * Math.PI / 180;
        const ct = Math.cos(th);
        const st = Math.sin(th);
        const ca = Math.cos(al);
        const sa = Math.sin(al);
        return [
          [ct, -st*ca,  st*sa, a*ct],
          [st,  ct*ca, -ct*sa, a*st],
          [ 0,     sa,     ca,    d],
          [ 0,      0,      0,    1]
        ];
      },
      fk: (...matrices: any[]) => {
        if (matrices.length === 0) return [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
        const list = Array.isArray(matrices[0]) && matrices[0].length > 0 && Array.isArray(matrices[0][0]) && Array.isArray(matrices[0][0][0]) 
          ? matrices[0] 
          : matrices;
        let result = list[0];
        for (let i = 1; i < list.length; i++) {
          result = math.multiply(result, list[i]);
        }
        return result;
      },
      ...initialGlobals
    };
  }

  private normalize(expr: string): string {
    return expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/√\(([^)]+)\)/g, 'sqrt($1)')
      .replace(/√(\d*\.?\d+)/g, 'sqrt($1)')
      .replace(/π/g, 'pi')
      .replace(/τ/g, 'tau')
      .replace(/cbrt\(([^)]+)\)/g, 'nthRoot($1, 3)')
      .replace(/root\(([^,]+),\s*([^)]+)\)/g, 'nthRoot($1, $2)');
  }

  evaluateBlock(expr: string, defaultAnalysisVar: string = 'x'): MathBlockResult {
    let simplified = '';
    let latex = '';
    let value: any = undefined;
    let valueTex = '';
    let valueStr = '';
    let analysis: any = {};
    let error: string | undefined = undefined;

    try {
      const normalized = this.normalize(expr);
      if (!normalized) throw new Error("Empty expression");

      // If it looks like parametric/vector (has a comma and no assignment), don't symbolic analysis as a whole
      if (normalized.includes(',') && !normalized.includes('=')) {
        return { expr, simplified: 'Vector / Parametric', latex: expr, value: 'Vector' };
      }

      const node = math.parse(normalized);
      
      try {
        if (!normalized.includes('=')) {
          simplified = math.simplify(node).toString();
        } else {
          simplified = 'Assignment';
        }
      } catch {
        simplified = '';
      }

      latex = node.toTex();
      
      // Attempt numeric evaluation
      try {
        const compiled = node.compile();
        value = compiled.evaluate(this.scope);
        
        if (value !== undefined && typeof value !== 'function') {
           valueStr = String(value);
           try {
             valueTex = math.parse(valueStr).toTex();
           } catch {
             valueTex = '';
           }
        }
      } catch (err: any) {
        error = err.message;
      }

      // Symbolic analysis (derivatives)
      try {
        if (!normalized.includes('=') && normalized.includes(defaultAnalysisVar)) {
           const deriv = math.derivative(node, defaultAnalysisVar);
           analysis.derivativeTex = deriv.toTex();
        }
      } catch {}

      return {
        expr,
        simplified,
        latex,
        value,
        valueTex,
        valueStr,
        error,
        analysis
      };
    } catch (err: any) {
      return {
        expr,
        simplified: '',
        latex: '',
        error: err.message,
      };
    }
  }

  evaluate2D(expr: string, xRange: number[]): { x: number[], y: number[] } {
    try {
      const compiled = math.compile(this.normalize(expr));
      const y = xRange.map(x => {
        try {
          const localScope = { ...this.scope, x, t: x };
          const val = compiled.evaluate(localScope);
          // If val is a function (e.g. from f(x)=x^2), we can't plot it directly.
          if (typeof val === 'function') return NaN;
          return typeof val === 'number' ? val : NaN;
        } catch {
          return NaN;
        }
      });
      return { x: xRange, y };
    } catch {
      return { x: [], y: [] };
    }
  }

  evaluate3D(expr: string, xRange: number[], yRange: number[]): { x: number[], y: number[], z: number[][] } {
    try {
      const compiled = math.compile(this.normalize(expr));
      const z: number[][] = [];
      
      for (let i = 0; i < yRange.length; i++) {
        const row: number[] = [];
        for (let j = 0; j < xRange.length; j++) {
          try {
            const localScope = { ...this.scope, x: xRange[j], y: yRange[i], t: xRange[j] };
            const val = compiled.evaluate(localScope);
            row.push(typeof val === 'number' ? val : NaN);
          } catch {
            row.push(NaN);
          }
        }
        z.push(row);
      }
      return { x: xRange, y: yRange, z };
    } catch {
      return { x: [], y: [], z: [[]] };
    }
  }

  evaluatePolar(expr: string, tRange: number[]): { r: number[], t: number[] } {
    try {
      const compiled = math.compile(this.normalize(expr));
      const r = tRange.map(t => {
        try {
          const localScope = { ...this.scope, t, x: t, theta: t };
          const val = compiled.evaluate(localScope);
          return typeof val === 'number' ? val : NaN;
        } catch {
          return NaN;
        }
      });
      return { r, t: tRange };
    } catch {
      return { r: [], t: [] };
    }
  }

  evaluateParametric(exprs: string, tRange: number[]): { x: number[], y: number[] } {
    try {
      const parts = this.normalize(exprs).split(',').map(s => s.trim());
      if (parts.length < 2) return { x: [], y: [] };

      const compiledX = math.compile(parts[0]);
      const compiledY = math.compile(parts[1]);

      const x = tRange.map(t => {
        try {
          const localScope = { ...this.scope, t, x: t };
          const val = compiledX.evaluate(localScope);
          return typeof val === 'number' ? val : NaN;
        } catch {
          return NaN;
        }
      });

      const y = tRange.map(t => {
        try {
          const localScope = { ...this.scope, t, x: t };
          const val = compiledY.evaluate(localScope);
          return typeof val === 'number' ? val : NaN;
        } catch {
          return NaN;
        }
      });

      return { x, y };
    } catch {
      return { x: [], y: [] };
    }
  }

  evaluateVectorField(exprs: string, xRange: number[], yRange: number[]): { x: number[], y: number[], u: number[], v: number[] } {
    try {
      const parts = this.normalize(exprs).split(',').map(s => s.trim());
      if (parts.length < 2) return { x: [], y: [], u: [], v: [] };

      const compiledU = math.compile(parts[0]);
      const compiledV = math.compile(parts[1]);

      const px: number[] = [];
      const py: number[] = [];
      const u: number[] = [];
      const v: number[] = [];

      for (let i = 0; i < yRange.length; i++) {
        for (let j = 0; j < xRange.length; j++) {
          const _x = xRange[j];
          const _y = yRange[i];
          try {
            const localScope = { ...this.scope, x: _x, y: _y };
            const uVal = compiledU.evaluate(localScope);
            const vVal = compiledV.evaluate(localScope);
            px.push(_x);
            py.push(_y);
            u.push(typeof uVal === 'number' ? uVal : 0);
            v.push(typeof vVal === 'number' ? vVal : 0);
          } catch {
            px.push(_x); py.push(_y); u.push(0); v.push(0);
          }
        }
      }
      return { x: px, y: py, u, v };
    } catch {
      return { x: [], y: [], u: [], v: [] };
    }
  }
}
