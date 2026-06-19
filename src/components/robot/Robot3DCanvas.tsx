import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, ContactShadows, Box, Cylinder, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { RobotJoint, RobotDesignConfig } from './types';

interface Robot3DCanvasProps {
  joints?: RobotJoint[];
  robotDesign?: RobotDesignConfig;
}

// 3D Material Library
const materials = {
  base: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.2, metalness: 0.8 }),
  joint: new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.4, metalness: 0.6 }),
  link: new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.3, metalness: 0.4 }),
  tool: new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.5, metalness: 0.2 }),
};

// Represents a single segment in the kinematic chain
function RobotSegment({ 
  length, 
  angleDeg, 
  color, 
  name, 
  isEndEffector,
  children 
}: { 
  length: number; 
  angleDeg: number; 
  color: string; 
  name: string; 
  isEndEffector?: boolean;
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

  // Since Three.js standard is Y-up, and our kinematics assumed X-right Y-up,
  // rotating around Z will move the arm in the XY plane.
  return (
    <group ref={groupRef}>
      {/* The Joint Motor Sphere */}
      <Sphere args={[12, 32, 32]} material={materials.joint} />
      
      {/* The Link Cylinder (extends along X axis) */}
      <group position={[length / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        {isEndEffector ? (
          <Box args={[16, length, 16]} material={materials.tool} />
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

export default function Robot3DCanvas({ joints, robotDesign }: Robot3DCanvasProps) {
  // If we don't have active dynamic joints, we construct them from robotDesign for the builder
  const activeJoints = useMemo(() => {
    if (joints && joints.length > 0) return joints;
    
    // Fallback default structure from design config
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
                          isEndEffector
                        />
                      )}
                    </RobotSegment>
                  )}
                </RobotSegment>
              )}
            </RobotSegment>
          )}
        </group>

        <OrbitControls makeDefault minDistance={100} maxDistance={1000} maxPolarAngle={Math.PI / 2 + 0.1} />
      </Canvas>
    </div>
  );
}
