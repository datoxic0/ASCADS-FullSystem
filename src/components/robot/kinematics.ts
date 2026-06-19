import { RobotJoint, TargetPosition } from "./types";

/**
 * Calculates Forward Kinematics for a 4-Joint 2D Arm model.
 * Inputs joint angles in degrees and segment lengths, returns absolute coordinate values.
 */
export function calculateForwardKinematics(
  baseX: number,
  baseY: number,
  joints: RobotJoint[]
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [{ x: baseX, y: baseY }];
  
  let currentX = baseX;
  let currentY = baseY;
  let absoluteAngleRad = 0; 

  for (let i = 1; i < joints.length; i++) {
    const joint = joints[i];
    const relativeRad = (joint.angle * Math.PI) / 180;
    
    if (i === 1) {
      absoluteAngleRad = relativeRad;
    } else {
      absoluteAngleRad += relativeRad;
    }

    currentX += joint.length * Math.cos(absoluteAngleRad);
    currentY += joint.length * Math.sin(absoluteAngleRad);
    
    points.push({ x: currentX, y: currentY });
  }

  return points;
}

/**
 * Solves Inverse Kinematics using CCD (Cyclic Coordinate Descent) Algorithm.
 * Robust, handles any segment lengths and joint constraints elegantly in milliseconds.
 */
export function solveInverseKinematics(
  baseX: number,
  baseY: number,
  joints: RobotJoint[],
  target: { x: number; y: number },
  maxIterations = 50,
  tolerance = 0.5
): RobotJoint[] {
  if (
    !target ||
    isNaN(target.x) ||
    !isFinite(target.x) ||
    isNaN(target.y) ||
    !isFinite(target.y)
  ) {
    return joints;
  }

  const resultJoints = joints.map(j => ({ ...j }));
  
  // Guard 1: Reachability check to prevent geometric singularity curling
  const distToTargetInitial = Math.hypot(target.x - baseX, target.y - baseY);
  const totalMaxReach = resultJoints.slice(1).reduce((sum, j) => sum + j.length, 0);
  
  let safeTarget = { ...target };
  if (distToTargetInitial > totalMaxReach) {
    const ratio = totalMaxReach / distToTargetInitial;
    safeTarget.x = baseX + (target.x - baseX) * ratio * 0.999; // 0.999 to avoid straight-line locking
    safeTarget.y = baseY + (target.y - baseY) * ratio * 0.999;
  }

  const getFkCoords = () => calculateForwardKinematics(baseX, baseY, resultJoints);

  for (let iter = 0; iter < maxIterations; iter++) {
    const coords = getFkCoords();
    const endEffector = coords[coords.length - 1];

    const distToTarget = Math.hypot(safeTarget.x - endEffector.x, safeTarget.y - endEffector.y);
    if (distToTarget < tolerance) {
      break;
    }

    for (let i = resultJoints.length - 2; i >= 1; i--) {
      const freshCoords = getFkCoords();
      const jointCoord = freshCoords[i - 1]; 
      const currentEffector = freshCoords[freshCoords.length - 1]; 

      const eX = currentEffector.x - jointCoord.x;
      const eY = currentEffector.y - jointCoord.y;
      const jToEffectorAngle = Math.atan2(eY, eX);

      const tX = safeTarget.x - jointCoord.x;
      const tY = safeTarget.y - jointCoord.y;
      const jToTargetAngle = Math.atan2(tY, tX);

      let diffAngle = jToTargetAngle - jToEffectorAngle;
      diffAngle = Math.atan2(Math.sin(diffAngle), Math.cos(diffAngle));

      const diffDeg = (diffAngle * 180) / Math.PI;

      if (isNaN(diffDeg) || !isFinite(diffDeg)) continue;

      // Strict Geometric Angle Limits instead of static damping.
      // Clamping rotation step prevents snapping, allowing fast, organic convergence.
      const maxStepDeg = 45; 
      const clampedDiff = Math.max(-maxStepDeg, Math.min(diffDeg, maxStepDeg));
      
      let newAngle = resultJoints[i].angle + clampedDiff;
      newAngle = Math.max(resultJoints[i].minAngle, Math.min(newAngle, resultJoints[i].maxAngle));
      
      if (!isNaN(newAngle) && isFinite(newAngle)) {
        resultJoints[i].angle = Math.round(newAngle * 10) / 10;
      }
    }
  }

  return resultJoints;
}

/**
 * G-Code / Instruction Parser.
 * Translates standard industrial manufacturing instructions into target kinematics coordinates or robotic system commands.
 */
export interface ParsedGcode {
  command: string;
  params: {
    X?: number;
    Y?: number;
    Z?: number;
    A?: number; 
    B?: number;
    P?: number; 
    S?: number; 
  };
  comment?: string;
  originalText: string;
}

export function parseGcodeLine(line: string): ParsedGcode | null {
  const cleanLine = line.trim();
  if (!cleanLine || cleanLine.startsWith(";")) {
    return {
      command: "COMMENT",
      params: {},
      comment: cleanLine.replace(/^;/, "").trim(),
      originalText: line
    };
  }

  const parts = cleanLine.split(";");
  const actionPart = parts[0].replace(/\([^)]*\)/g, " ").trim();
  const comment = parts[1] ? parts[1].trim() : undefined;

  if (!actionPart) {
    return {
      command: "COMMENT",
      params: {},
      comment: comment,
      originalText: line
    };
  }

  const tokenRegex = /([A-Z])\s*([-+]?(?:\d+(?:\.\d*)?|\.\d+))?/gi;
  const matches: { letter: string; val: number }[] = [];

  let match;
  while ((match = tokenRegex.exec(actionPart)) !== null) {
    const letter = match[1].toUpperCase();
    const valStr = match[2];
    const val = valStr ? parseFloat(valStr) : 0;
    matches.push({ letter, val });
  }

  if (matches.length === 0) {
    return null;
  }

  let command = "";
  let startIndex = 0;

  const firstToken = matches[0];
  if (firstToken.letter === "G" || firstToken.letter === "M") {
    command = firstToken.letter + firstToken.val.toString();
    if (/^[GM]\d$/.test(command)) {
      command = command.charAt(0) + "0" + command.slice(1);
    }
    startIndex = 1;
  } else {
    // If the line consists only of coordinates without an explicit command, inherit modal state.
    command = "MODAL_CONTINUE";
    startIndex = 0;
  }

  const params: Record<string, number> = {};
  for (let i = startIndex; i < matches.length; i++) {
    params[matches[i].letter] = matches[i].val;
  }

  return {
    command,
    params,
    comment,
    originalText: line
  };
}
