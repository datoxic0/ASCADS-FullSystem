import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, ContactShadows, Box, Cylinder, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';
import { RobotJoint, RobotDesignConfig, CIMWorkpiece } from './types';

interface Robot3DCanvasProps {
  joints?: RobotJoint[];
  robotDesign?: RobotDesignConfig;
  workpieces?: CIMWorkpiece[];
}

// 3D Material Library
const materials = {
  base: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.2, metalness: 0.8 }),
  joint: new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.4, metalness: 0.6 }),
  link: new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.3, metalness: 0.4 }),
  toolBase: new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.6, metalness: 0.5 }),
  gripper: new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.5, metalness: 0.2 }),
  suction: new THREE.MeshStandardMaterial({ color: '#3b82f6', roughness: 0.7, metalness: 0.1 }),
  welder: new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.4, metalness: 0.8 }),
  conveyorBelt: new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.9, metalness: 0.1 }),
  conveyorFrame: new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.5, metalness: 0.7 }),
  cncMachine: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.5, metalness: 0.6 }),
};

// Represents a single segment in the kinematic chain
function RobotSegment({ 
  length, 
  angleDeg, 
  color, 
  name, 
  endEffectorType,
  children 
}: { 
  length: number; 
  angleDeg: number; 
  color: string; 
  name: string; 
  endEffectorType?: "gripper" | "suction" | "welder";
  children?: React.ReactNode; 
}) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Smoothly interpolate rotation to match target angle
  useFrame((state, delta) => {
    if (groupRef.current) {
      const targetRad = (angleDeg * Math.PI) / 180;
      // Simple exponential smoothing
      groupRef.current.rotation.z += (targetRad - groupRef.current.rotation.z) * (10 * delta);
    }
  });

  return (
    <group ref={groupRef}>
      {/* The Joint Motor Sphere */}
      <Sphere args={[12, 32, 32]} material={materials.joint} />
      
      {/* The Link Cylinder (extends along X axis) */}
      <group position={[length / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        {endEffectorType ? (
          <group>
            {/* Base Tool Mount */}
            <Box args={[16, length, 16]} material={materials.toolBase} />
            
            {/* Specific Toolhead */}
            {endEffectorType === "gripper" && (
              <group position={[0, length / 2 + 10, 0]}>
                <Box args={[4, 20, 8]} position={[-6, 0, 0]} material={materials.gripper} />
                <Box args={[4, 20, 8]} position={[6, 0, 0]} material={materials.gripper} />
                <Box args={[16, 4, 16]} position={[0, -10, 0]} material={materials.toolBase} />
              </group>
            )}
            {endEffectorType === "suction" && (
              <group position={[0, length / 2 + 5, 0]}>
                <Cylinder args={[10, 10, 10, 32]} material={materials.suction} />
                <Cylinder args={[14, 14, 2, 32]} position={[0, 6, 0]} material={materials.suction} />
              </group>
            )}
            {endEffectorType === "welder" && (
              <group position={[0, length / 2 + 8, 0]}>
                <Cylinder args={[2, 6, 16, 32]} material={materials.welder} />
                {/* Glowing Laser/Welding tip */}
                <Sphere args={[2, 16, 16]} position={[0, 9, 0]}>
                  <meshBasicMaterial color="#fcd34d" />
                </Sphere>
              </group>
            )}
          </group>
        ) : (
          <Cylinder args={[8, 8, length, 32]} material={materials.link} />
        )}
      </group>

      {/* Attach children to the end of this link */}
      <group position={[length, 0, 0]}>
        {children}
      </group>
    </group>
  );
}

// 3D Environment Additions
function ConveyorBelt3D() {
  // In the 2D layout, the conveyor goes from x=50 to x=600, y=110.
  // In our 3D space, the robot base is at 0,0,0. Let's map it visually.
  return (
    <group position={[150, -25, 100]}>
      {/* Frame */}
      <Box args={[400, 20, 50]} material={materials.conveyorFrame} />
      {/* Belt */}
      <Box args={[398, 22, 48]} material={materials.conveyorBelt} />
      {/* Legs */}
      <Cylinder args={[4, 4, 40]} position={[-180, -30, -20]} material={materials.conveyorFrame} />
      <Cylinder args={[4, 4, 40]} position={[-180, -30, 20]} material={materials.conveyorFrame} />
      <Cylinder args={[4, 4, 40]} position={[180, -30, -20]} material={materials.conveyorFrame} />
      <Cylinder args={[4, 4, 40]} position={[180, -30, 20]} material={materials.conveyorFrame} />
    </group>
  );
}

function CNCMachine3D() {
  return (
    <group position={[-100, -5, 150]}>
      {/* CNC Base */}
      <Box args={[120, 40, 100]} material={materials.cncMachine} />
      {/* CNC Enclosure Back */}
      <Box args={[120, 80, 10]} position={[0, 60, -45]} material={materials.cncMachine} />
      {/* CNC Spindle Mount */}
      <Box args={[40, 60, 40]} position={[0, 50, -20]} material={materials.link} />
      <Cylinder args={[4, 4, 20]} position={[0, 10, -20]} material={materials.toolBase} />
      {/* Drop Zone Target */}
      <Box args={[60, 2, 60]} position={[0, 21, 0]}>
        <meshStandardMaterial color="#22c55e" opacity={0.3} transparent />
      </Box>
    </group>
  );
}

function Workpieces3D({ workpieces }: { workpieces?: CIMWorkpiece[] }) {
  if (!workpieces) return null;

  const colorMap: Record<string, string> = {
    red: '#ef4444',
    green: '#22c55e',
    blue: '#3b82f6',
    yellow: '#eab308'
  };

  return (
    <>
      {workpieces.map((wp) => {
        // Map 2D coordinates to 3D space
        const posX = wp.positionX - 300;
        const posZ = 100; // Conveyor depth offset
        let posY = -12; // on top of conveyor

        if (wp.status === 'picked') {
          posY = 100; // Up in the air with the effector
        } else if (wp.status === 'placed') {
          posY = 16; // On CNC machine
        }

        return (
          <group key={wp.id} position={[posX, posY, posZ]}>
            <Box args={[16, 16, 16]}>
              <meshStandardMaterial color={colorMap[wp.color] || '#ffffff'} roughness={0.4} />
            </Box>
          </group>
        );
      })}
    </>
  );
}

export default function Robot3DCanvas({ joints, robotDesign, workpieces }: Robot3DCanvasProps) {
  const activeJoints = useMemo(() => {
    if (joints && joints.length > 0) return joints;
    
    const shoulder = robotDesign?.shoulderLength || 150;
    const elbow = robotDesign?.elbowLength || 120;
    const wrist = robotDesign?.wristLength || 80;

    return [
      { id: "j1", name: "Base", angle: 90, length: 0, minAngle: 0, maxAngle: 180, color: "blue" },
      { id: "j2", name: "Shoulder", angle: 45, length: shoulder, minAngle: -90, maxAngle: 180, color: "green" },
      { id: "j3", name: "Elbow", angle: -90, length: elbow, minAngle: -150, maxAngle: 150, color: "red" },
      { id: "j4", name: "Wrist", angle: 45, length: wrist, minAngle: -180, maxAngle: 180, color: "yellow" },
    ] as RobotJoint[];
  }, [joints, robotDesign]);

  const endEffectorType = robotDesign?.endEffectorType || "gripper";

  return (
    <div className="w-full h-full relative bg-[#0a0a0c]">
      <Canvas camera={{ position: [0, 200, 500], fov: 50 }}>
        <color attach="background" args={['#0a0a0c']} />
        
        {/* Cinematic Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
        <spotLight position={[-20, 50, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
        
        <Environment preset="city" />

        {/* The Floor / Grid */}
        <Grid 
          infiniteGrid 
          fadeDistance={1000} 
          sectionColor="#334155" 
          cellColor="#1e293b" 
          position={[0, -50, 0]} 
        />
        <ContactShadows position={[0, -49.9, 0]} opacity={0.4} scale={500} blur={2} far={100} />

        {/* Environment Set Pieces */}
        <ConveyorBelt3D />
        <CNCMachine3D />
        <Workpieces3D workpieces={workpieces} />

        {/* The Base Pedestal */}
        <group position={[0, -25, 0]}>
          <Cylinder args={[40, 50, 50, 32]} material={materials.base} />
        </group>

        {/* Render Kinematic Chain Recursively */}
        <group position={[0, 0, 0]}>
          {activeJoints.length > 0 && (
            <RobotSegment 
              length={activeJoints[0].length} 
              angleDeg={activeJoints[0].angle} 
              color={activeJoints[0].color} 
              name={activeJoints[0].name}
            >
              {activeJoints.length > 1 && (
                <RobotSegment 
                  length={activeJoints[1].length} 
                  angleDeg={activeJoints[1].angle} 
                  color={activeJoints[1].color} 
                  name={activeJoints[1].name}
                >
                  {activeJoints.length > 2 && (
                    <RobotSegment 
                      length={activeJoints[2].length} 
                      angleDeg={activeJoints[2].angle} 
                      color={activeJoints[2].color} 
                      name={activeJoints[2].name}
                    >
                      {activeJoints.length > 3 && (
                        <RobotSegment 
                          length={activeJoints[3].length} 
                          angleDeg={activeJoints[3].angle} 
                          color={activeJoints[3].color} 
                          name={activeJoints[3].name}
                          endEffectorType={endEffectorType}
                        />
                      )}
                    </RobotSegment>
                  )}
                </RobotSegment>
              )}
              
              {/* HUD / Holographic UI (Attached to the base or shoulder link) */}
              <Html position={[-150, 150, 0]} center transform sprite zIndexRange={[100, 0]}>
                <div className="bg-black/80 backdrop-blur border border-blue-500/30 rounded p-3 font-mono text-[10px] text-blue-400 w-48 shadow-[0_0_15px_rgba(59,130,246,0.3)] pointer-events-none select-none">
                  <div className="text-white border-b border-white/10 pb-1 mb-1 font-bold">DIGITAL TWIN HUD</div>
                  {activeJoints.map(j => (
                    <div key={j.id} className="flex justify-between">
                      <span>{j.name.substring(0,3).toUpperCase()}:</span>
                      <span className="text-emerald-400">{j.angle.toFixed(1)}°</span>
                    </div>
                  ))}
                  <div className="mt-2 pt-1 border-t border-white/10 text-slate-500 flex justify-between">
                    <span>TOOL:</span>
                    <span className="text-white">{endEffectorType.toUpperCase()}</span>
                  </div>
                </div>
              </Html>

            </RobotSegment>
          )}
        </group>

        <OrbitControls makeDefault minDistance={100} maxDistance={1000} maxPolarAngle={Math.PI / 2 + 0.1} />
      </Canvas>
    </div>
  );
}
