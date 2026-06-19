/**
 * FABRIK Inverse Kinematics Solver
 * Forward And Backward Reaching Inverse Kinematics
 * Solves multi-joint planar robot arm configurations
 */

export interface Joint {
  id: string;
  length: number;   // segment length in canvas units
  angle: number;    // current angle in degrees (cumulative from base)
  minAngle: number; // joint-local min
  maxAngle: number; // joint-local max
  color: string;
  name: string;
}

export interface IKPoint {
  x: number;
  y: number;
}

export interface IKResult {
  jointAngles: number[];   // new absolute angles per joint (radians)
  positions: IKPoint[];    // joint positions including base
  converged: boolean;
  iterations: number;
  endEffectorPos: IKPoint;
}

const MAX_ITER = 50;
const TOLERANCE = 2.0; // pixels

export function solveIK(
  base: IKPoint,
  target: IKPoint,
  joints: Joint[],
): IKResult {
  const n = joints.length;
  if (n === 0) return { jointAngles: [], positions: [base], converged: true, iterations: 0, endEffectorPos: base };

  const lengths = joints.map(j => j.length);
  const totalReach = lengths.reduce((a, b) => a + b, 0);

  // Forward kinematics to get initial positions
  const positions: IKPoint[] = Array(n + 1).fill(null).map(() => ({ x: 0, y: 0 }));
  positions[0] = { ...base };

  // Initialize from current joint angles
  let cumulativeAngle = 0;
  for (let i = 0; i < n; i++) {
    const rad = (joints[i].angle * Math.PI) / 180;
    cumulativeAngle += rad;
    positions[i + 1] = {
      x: positions[i].x + lengths[i] * Math.cos(cumulativeAngle),
      y: positions[i].y + lengths[i] * Math.sin(cumulativeAngle),
    };
  }

  // If target is out of reach, stretch toward it
  const dist = Math.hypot(target.x - base.x, target.y - base.y);
  if (dist >= totalReach) {
    const angle = Math.atan2(target.y - base.y, target.x - base.x);
    let cx = base.x;
    let cy = base.y;
    for (let i = 0; i < n; i++) {
      positions[i + 1] = {
        x: cx + lengths[i] * Math.cos(angle),
        y: cy + lengths[i] * Math.sin(angle),
      };
      cx = positions[i + 1].x;
      cy = positions[i + 1].y;
    }
    return {
      jointAngles: computeJointAngles(positions),
      positions,
      converged: false,
      iterations: 1,
      endEffectorPos: positions[n],
    };
  }

  let iter = 0;
  let converged = false;

  while (iter < MAX_ITER && !converged) {
    // BACKWARD pass: end to base
    positions[n] = { ...target };
    for (let i = n - 1; i >= 0; i--) {
      const dx = positions[i].x - positions[i + 1].x;
      const dy = positions[i].y - positions[i + 1].y;
      const d = Math.hypot(dx, dy);
      const ratio = lengths[i] / d;
      positions[i] = {
        x: positions[i + 1].x + dx * ratio,
        y: positions[i + 1].y + dy * ratio,
      };
    }

    // FORWARD pass: base to end
    positions[0] = { ...base };
    for (let i = 0; i < n; i++) {
      const dx = positions[i + 1].x - positions[i].x;
      const dy = positions[i + 1].y - positions[i].y;
      const d = Math.hypot(dx, dy);
      const ratio = lengths[i] / d;

      // Unconstrained new position
      let nx = positions[i].x + dx * ratio;
      let ny = positions[i].y + dy * ratio;

      // Apply joint angle constraints
      if (i > 0) {
        const parentAngle = Math.atan2(
          positions[i].y - positions[i - 1].y,
          positions[i].x - positions[i - 1].x,
        );
        let localAngle = Math.atan2(ny - positions[i].y, nx - positions[i].x) - parentAngle;

        // Normalize to [-π, π]
        while (localAngle > Math.PI) localAngle -= 2 * Math.PI;
        while (localAngle < -Math.PI) localAngle += 2 * Math.PI;

        const minRad = (joints[i].minAngle * Math.PI) / 180;
        const maxRad = (joints[i].maxAngle * Math.PI) / 180;
        localAngle = Math.max(minRad, Math.min(maxRad, localAngle));

        const constrainedAngle = parentAngle + localAngle;
        nx = positions[i].x + lengths[i] * Math.cos(constrainedAngle);
        ny = positions[i].y + lengths[i] * Math.sin(constrainedAngle);
      }

      positions[i + 1] = { x: nx, y: ny };
    }

    const endDist = Math.hypot(positions[n].x - target.x, positions[n].y - target.y);
    if (endDist < TOLERANCE) converged = true;
    iter++;
  }

  return {
    jointAngles: computeJointAngles(positions),
    positions,
    converged,
    iterations: iter,
    endEffectorPos: positions[n],
  };
}

function computeJointAngles(positions: IKPoint[]): number[] {
  const angles: number[] = [];
  for (let i = 0; i < positions.length - 1; i++) {
    const angle = Math.atan2(
      positions[i + 1].y - positions[i].y,
      positions[i + 1].x - positions[i].x,
    );
    angles.push(angle);
  }
  return angles;
}

export function forwardKinematics(base: IKPoint, joints: Joint[]): IKPoint[] {
  const positions: IKPoint[] = [{ ...base }];
  let cumulativeAngle = 0;
  let cx = base.x;
  let cy = base.y;
  for (const joint of joints) {
    const rad = (joint.angle * Math.PI) / 180;
    cumulativeAngle += rad;
    cx += joint.length * Math.cos(cumulativeAngle);
    cy += joint.length * Math.sin(cumulativeAngle);
    positions.push({ x: cx, y: cy });
  }
  return positions;
}
