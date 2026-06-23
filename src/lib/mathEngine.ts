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
      ik2: (x: number, y: number, l1: number, l2: number) => {
        const c2 = (x*x + y*y - l1*l1 - l2*l2) / (2 * l1 * l2);
        if (c2 < -1 || c2 > 1) return [NaN, NaN]; // Unreachable
        const s2 = Math.sqrt(1 - c2*c2);
        const th2 = Math.atan2(s2, c2);
        const th1 = Math.atan2(y, x) - Math.atan2(l2 * s2, l1 + l2 * c2);
        return [th1 * 180 / Math.PI, th2 * 180 / Math.PI];
      },
      
      // Energy & Power Dynamics
      elec_power: (v: number, i: number, pf: number = 1) => v * i * pf,
      elec_3phase: (v: number, i: number, pf: number = 1) => Math.sqrt(3) * v * i * pf,
      mech_power: (torque: number, rpm: number) => torque * (rpm * 2 * Math.PI / 60),
      kinetic_e: (m: number, v: number) => 0.5 * m * v * v,
      potential_e: (m: number, h: number) => m * 9.81 * h,

      // Fluid Power & Pneumatics
      fluid_power: (p_bar: number, flow_Lmin: number) => (p_bar * flow_Lmin) / 600, // Returns kW
      cylinder_force: (p_bar: number, d_mm: number) => p_bar * Math.PI * (d_mm * d_mm) / 40, // Returns Newtons
      flow_vel: (flow_Lmin: number, d_mm: number) => (400 * flow_Lmin) / (6 * Math.PI * d_mm * d_mm), // Returns m/s
      ...initialGlobals
    };
  }

  private normalize(expr: string): string {
    let normalized = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/√\(([^)]+)\)/g, 'sqrt($1)')
      .replace(/√(\d*\.?\d+)/g, 'sqrt($1)')
      .replace(/π/g, 'pi')
      .replace(/τ/g, 'tau')
      .replace(/cbrt\(([^)]+)\)/g, 'nthRoot($1, 3)')
      .replace(/root\(([^,]+),\s*([^)]+)\)/g, 'nthRoot($1, $2)');

    // Matlab matrix support: [1, 2; 3, 4] -> [[1, 2], [3, 4]]
    if (normalized.includes('[') && normalized.includes(';')) {
       normalized = normalized.replace(/\[(.*?)\]/g, (match, inner) => {
          if (inner.includes(';')) {
             const rows = inner.split(';').map((r: string) => `[${r.trim()}]`).join(', ');
             return `[${rows}]`;
          }
          return match;
       });
    }
    return normalized;
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
           valueStr = math.format(value, { precision: 14 });
           try {
             valueTex = math.parse(valueStr).toTex();
           } catch {
             valueTex = '';
           }
        }
      } catch (err: any) {
        // If it's a symbolic expression (like 3x^2) numeric evaluation will fail.
        // We should NOT treat this as a fatal error if parsing succeeded.
        if (!err.message.includes('Undefined symbol')) {
            // We might still log or handle other errors, but let's be forgiving.
            // For now, we just leave value as undefined, which means it's treated as a pure symbolic expression.
        }
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

  evaluateChaos(dxExpr: string, dyExpr: string, dzExpr: string, steps: number, dt: number, initialXYZ: [number, number, number]): { x: number[], y: number[], z: number[] } {
    try {
      const cDx = math.compile(this.normalize(dxExpr));
      const cDy = math.compile(this.normalize(dyExpr));
      const cDz = math.compile(this.normalize(dzExpr));
      
      const px: number[] = [initialXYZ[0]];
      const py: number[] = [initialXYZ[1]];
      const pz: number[] = [initialXYZ[2]];

      let [cx, cy, cz] = initialXYZ;

      // Runge-Kutta 4th Order (RK4) Integrator for better stability
      for (let i = 0; i < steps; i++) {
        let localScope = { ...this.scope, x: cx, y: cy, z: cz };
        const k1x = cDx.evaluate(localScope) as number;
        const k1y = cDy.evaluate(localScope) as number;
        const k1z = cDz.evaluate(localScope) as number;

        localScope = { ...this.scope, x: cx + 0.5*dt*k1x, y: cy + 0.5*dt*k1y, z: cz + 0.5*dt*k1z };
        const k2x = cDx.evaluate(localScope) as number;
        const k2y = cDy.evaluate(localScope) as number;
        const k2z = cDz.evaluate(localScope) as number;

        localScope = { ...this.scope, x: cx + 0.5*dt*k2x, y: cy + 0.5*dt*k2y, z: cz + 0.5*dt*k2z };
        const k3x = cDx.evaluate(localScope) as number;
        const k3y = cDy.evaluate(localScope) as number;
        const k3z = cDz.evaluate(localScope) as number;

        localScope = { ...this.scope, x: cx + dt*k3x, y: cy + dt*k3y, z: cz + dt*k3z };
        const k4x = cDx.evaluate(localScope) as number;
        const k4y = cDy.evaluate(localScope) as number;
        const k4z = cDz.evaluate(localScope) as number;
        
        cx += (dt/6) * (k1x + 2*k2x + 2*k3x + k4x);
        cy += (dt/6) * (k1y + 2*k2y + 2*k3y + k4y);
        cz += (dt/6) * (k1z + 2*k2z + 2*k3z + k4z);

        px.push(cx);
        py.push(cy);
        pz.push(cz);
      }
      return { x: px, y: py, z: pz };
    } catch {
      return { x: [], y: [], z: [] };
    }
  }

  evaluateAstrodynamics(G: number, M: number, x0: number, y0: number, vx0: number, vy0: number, steps: number, dt: number): { x: number[], y: number[] } {
    try {
      const px: number[] = [x0];
      const py: number[] = [y0];

      let cx = x0;
      let cy = y0;
      let cvx = vx0;
      let cvy = vy0;

      // Simple Verlet or Symplectic Euler for orbital mechanics
      for (let i = 0; i < steps; i++) {
        const r2 = cx * cx + cy * cy;
        const r = Math.sqrt(r2);
        const r3 = r * r2;
        
        const ax = - (G * M * cx) / r3;
        const ay = - (G * M * cy) / r3;

        cvx += ax * dt;
        cvy += ay * dt;

        cx += cvx * dt;
        cy += cvy * dt;

        px.push(cx);
        py.push(cy);
      }
      return { x: px, y: py };
    } catch {
      return { x: [], y: [] };
    }
  }

  evaluatePDE(alpha: number, size: number, steps: number): { z: number[][] } {
    try {
      let grid: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
      
      // Initialize a heat source in the center
      const center = Math.floor(size / 2);
      grid[center][center] = 100;
      grid[center+1][center] = 100;
      grid[center-1][center] = 100;
      grid[center][center+1] = 100;
      grid[center][center-1] = 100;

      const dt = 0.1;
      const dx = 1.0;
      const coeff = (alpha * dt) / (dx * dx);

      // Stability check for explicit FDM
      if (coeff > 0.25) return { z: grid };

      for (let s = 0; s < steps; s++) {
        let newGrid: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
        for (let i = 1; i < size - 1; i++) {
          for (let j = 1; j < size - 1; j++) {
            newGrid[i][j] = grid[i][j] + coeff * (
              grid[i+1][j] + grid[i-1][j] + grid[i][j+1] + grid[i][j-1] - 4 * grid[i][j]
            );
          }
        }
        // Keep the center hot (constant heat source)
        newGrid[center][center] = 100;
        grid = newGrid;
      }
      return { z: grid };
    } catch {
      return { z: [[]] };
    }
  }
}
