import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, ContactShadows, Box, Cylinder, Sphere, Html, GizmoHelper, GizmoViewport, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { RobotJoint, RobotDesignConfig, CIMWorkpiece } from './types';

interface Robot3DCanvasProps {
  joints?: RobotJoint[];
  robotDesign?: RobotDesignConfig;
  workpieces?: CIMWorkpiece[];
}

/* ─── PBR Material Library (shared, stable refs) ─── */
const MAT = {
  base:          new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.15, metalness: 0.92, envMapIntensity: 1.2 }),
  joint:         new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.3,  metalness: 0.7,  envMapIntensity: 1.0 }),
  jointActive:   new THREE.MeshStandardMaterial({ color: '#fbbf24', roughness: 0.2,  metalness: 0.8,  envMapIntensity: 1.5, emissive: '#f59e0b', emissiveIntensity: 0.2 }),
  link:          new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.25, metalness: 0.55, envMapIntensity: 0.9 }),
  toolBase:      new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.55, metalness: 0.5  }),
  gripper:       new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.4,  metalness: 0.3,  emissive: '#7f1d1d', emissiveIntensity: 0.05 }),
  suction:       new THREE.MeshStandardMaterial({ color: '#3b82f6', roughness: 0.65, metalness: 0.1  }),
  welder:        new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.3,  metalness: 0.85, envMapIntensity: 1.2 }),
  conveyorBelt:  new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.92, metalness: 0.08 }),
  conveyorFrame: new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.45, metalness: 0.75, envMapIntensity: 0.8 }),
  cncMachine:    new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.5,  metalness: 0.65 }),
  floor:         new THREE.MeshStandardMaterial({ color: '#1a1e24', roughness: 0.85, metalness: 0.05 }),
  safetyYellow:  new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.7,  metalness: 0.0  }),
  safetyBlack:   new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.7,  metalness: 0.0  }),
  barrier:       new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.55, metalness: 0.2,  emissive: '#450a0a', emissiveIntensity: 0.1 }),
  glass:         new THREE.MeshPhysicalMaterial({ color: '#38bdf8', transmission: 0.65, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.7, thickness: 2, clearcoat: 1 }),
};

/* ─── Single Kinematic Segment ─── */
function RobotSegment({
  length, angleDeg, name, endEffectorType, children,
}: {
  length: number; angleDeg: number; name: string;
  endEffectorType?: 'gripper' | 'suction' | 'welder'; children?: React.ReactNode;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const targetRad = (angleDeg * Math.PI) / 180;
    groupRef.current.rotation.z += (targetRad - groupRef.current.rotation.z) * Math.min(1, 12 * delta);
  });

  return (
    <group ref={groupRef}>
      {/* Joint sphere */}
      <mesh material={MAT.joint} castShadow receiveShadow>
        <sphereGeometry args={[13, 32, 32]} />
      </mesh>
      {/* Joint ring detail */}
      <mesh rotation={[Math.PI/2, 0, 0]} material={MAT.base}>
        <torusGeometry args={[13, 2.5, 12, 32]} />
      </mesh>

      {/* Link */}
      <group position={[length / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        {endEffectorType ? (
          <group>
            <mesh material={MAT.toolBase} castShadow>
              <boxGeometry args={[16, length, 16]} />
            </mesh>
            {/* Chamfer ring at mount */}
            <mesh position={[0, length / 2, 0]} material={MAT.joint}>
              <cylinderGeometry args={[9, 9, 4, 16]} />
            </mesh>
            {endEffectorType === 'gripper' && (
              <group position={[0, length / 2 + 12, 0]}>
                <mesh material={MAT.gripper} castShadow>
                  <boxGeometry args={[4, 22, 8]} />
                </mesh>
                <mesh position={[-7, 0, 0]} material={MAT.gripper} castShadow>
                  <boxGeometry args={[4, 22, 8]} />
                </mesh>
                <mesh position={[7, 0, 0]} material={MAT.gripper} castShadow>
                  <boxGeometry args={[4, 22, 8]} />
                </mesh>
                <mesh position={[0, -12, 0]} material={MAT.toolBase}>
                  <boxGeometry args={[18, 4, 18]} />
                </mesh>
              </group>
            )}
            {endEffectorType === 'suction' && (
              <group position={[0, length / 2 + 6, 0]}>
                <mesh material={MAT.suction} castShadow>
                  <cylinderGeometry args={[10, 10, 12, 32]} />
                </mesh>
                <mesh position={[0, 7, 0]} material={MAT.suction}>
                  <cylinderGeometry args={[15, 10, 3, 32]} />
                </mesh>
              </group>
            )}
            {endEffectorType === 'welder' && (
              <group position={[0, length / 2 + 10, 0]}>
                <mesh material={MAT.welder} castShadow>
                  <cylinderGeometry args={[2.5, 6, 18, 16]} />
                </mesh>
                <mesh position={[0, 10, 0]}>
                  <sphereGeometry args={[2.5, 16, 16]} />
                  <meshBasicMaterial color={[3, 3, 0.5]} toneMapped={false} />
                </mesh>
                {/* Spark glow */}
                <mesh position={[0, 10, 0]}>
                  <sphereGeometry args={[6, 8, 8]} />
                  <meshBasicMaterial color={[1.5, 1.0, 0]} toneMapped={false} transparent opacity={0.15} />
                </mesh>
              </group>
            )}
          </group>
        ) : (
          <mesh material={MAT.link} castShadow receiveShadow>
            <cylinderGeometry args={[9, 9, length, 24]} />
          </mesh>
        )}
      </group>

      {/* Recurse children to end of link */}
      <group position={[length, 0, 0]}>{children}</group>
    </group>
  );
}

/* ─── Conveyor Belt ─── */
function ConveyorBelt3D() {
  return (
    <group position={[160, -28, 110]}>
      <mesh material={MAT.conveyorFrame} castShadow receiveShadow>
        <boxGeometry args={[420, 18, 55]} />
      </mesh>
      <mesh material={MAT.conveyorBelt} receiveShadow>
        <boxGeometry args={[415, 20, 52]} />
      </mesh>
      {/* Rollers */}
      {[-190, -60, 60, 190].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[Math.PI/2, 0, 0]} material={MAT.conveyorFrame}>
          <cylinderGeometry args={[10, 10, 55, 12]} />
        </mesh>
      ))}
      {/* Legs */}
      {[[-185, -20], [-185, 20], [185, -20], [185, 20]].map(([px, pz], i) => (
        <mesh key={i} position={[px, -24, pz]} material={MAT.conveyorFrame} castShadow>
          <cylinderGeometry args={[3.5, 3.5, 36, 8]} />
        </mesh>
      ))}
      {/* Foot pads */}
      {[[-185, -20], [-185, 20], [185, -20], [185, 20]].map(([px, pz], i) => (
        <mesh key={`fp-${i}`} position={[px, -44, pz]} material={MAT.safetyYellow}>
          <boxGeometry args={[14, 3, 14]} />
        </mesh>
      ))}
    </group>
  );
}

/* ─── CNC Machine ─── */
function CNCMachine3D() {
  return (
    <group position={[-120, -8, 160]}>
      <mesh material={MAT.cncMachine} castShadow receiveShadow>
        <boxGeometry args={[130, 44, 110]} />
      </mesh>
      <mesh position={[0, 42, -48]} material={MAT.cncMachine} castShadow>
        <boxGeometry args={[130, 88, 12]} />
      </mesh>
      <mesh position={[0, 60, -22]} material={MAT.link} castShadow>
        <boxGeometry args={[44, 66, 42]} />
      </mesh>
      <mesh position={[0, 18, -22]} material={MAT.toolBase} castShadow>
        <cylinderGeometry args={[4.5, 4.5, 24, 12]} />
      </mesh>
      {/* Drop zone */}
      <mesh position={[0, 23, 2]}>
        <boxGeometry args={[65, 2, 65]} />
        <meshStandardMaterial color="#22c55e" opacity={0.25} transparent />
      </mesh>
      {/* Status light */}
      <mesh position={[50, 80, -48]}>
        <sphereGeometry args={[5, 12, 12]} />
        <meshBasicMaterial color={[0, 3, 0]} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ─── Safety Barrier ─── */
function SafetyBarrier3D({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Posts */}
      {[-60, 60].map((x, i) => (
        <mesh key={i} position={[x, 25, 0]} material={MAT.barrier} castShadow>
          <cylinderGeometry args={[3, 3, 50, 8]} />
        </mesh>
      ))}
      {/* Rail */}
      <mesh material={MAT.barrier} castShadow>
        <boxGeometry args={[130, 5, 5]} />
      </mesh>
      <mesh position={[0, 25, 0]} material={MAT.barrier} castShadow>
        <boxGeometry args={[130, 5, 5]} />
      </mesh>
    </group>
  );
}

/* ─── Safety Cell Floor Markings ─── */
function FloorMarkings() {
  return (
    <group position={[0, -49.8, 0]}>
      {/* Yellow safety zone stripes */}
      {[-200, -100, 0, 100, 200].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <planeGeometry args={[8, 600]} />
          <meshStandardMaterial color="#facc15" roughness={0.95} opacity={0.6} transparent />
        </mesh>
      ))}
    </group>
  );
}

/* ─── Workpieces ─── */
function Workpieces3D({ workpieces }: { workpieces?: CIMWorkpiece[] }) {
  if (!workpieces) return null;
  const colorMap: Record<string, string> = {
    red: '#ef4444', green: '#22c55e', blue: '#3b82f6', yellow: '#eab308',
  };
  return (
    <>
      {workpieces.map((wp) => {
        const posX = wp.positionX - 300;
        const posZ = 110;
        const posY = wp.status === 'picked' ? 100 : wp.status === 'placed' ? 18 : -12;
        const col = colorMap[wp.color] || '#ffffff';
        return (
          <group key={wp.id} position={[posX, posY, posZ]}>
            <mesh castShadow>
              <boxGeometry args={[17, 17, 17]} />
              <meshStandardMaterial color={col} roughness={0.4} metalness={0.2} />
            </mesh>
            {/* Logo mark on top */}
            <mesh position={[0, 9, 0]}>
              <boxGeometry args={[10, 1, 10]} />
              <meshStandardMaterial color="#000" roughness={0.9} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

/* ─── Industrial Environment ─── */
function IndustrialEnvironment3D({ workpieces }: { workpieces?: CIMWorkpiece[] }) {
  return (
    <>
      <ConveyorBelt3D />
      <CNCMachine3D />
      <Workpieces3D workpieces={workpieces} />
      <SafetyBarrier3D position={[0, -25, -180]} />
      <SafetyBarrier3D position={[280, -25, 0]} />
      <FloorMarkings />
      {/* Power junction box */}
      <group position={[250, -15, -100]}>
        <mesh material={MAT.cncMachine} castShadow>
          <boxGeometry args={[30, 40, 20]} />
        </mesh>
        <mesh position={[0, 22, 0]}>
          <cylinderGeometry args={[4, 4, 8, 8]} />
          <meshBasicMaterial color={[0, 2, 0]} toneMapped={false} />
        </mesh>
      </group>
    </>
  );
}

/* ─── Domestic Environment ─── */
function DomesticEnvironment3D() {
  return (
    <group position={[120, -20, 120]}>
      {/* Sofa body */}
      <mesh material={MAT.base} castShadow receiveShadow><boxGeometry args={[130, 32, 65]} /></mesh>
      {/* Back */}
      <mesh position={[0, 12, -33]} material={MAT.base} castShadow><boxGeometry args={[150, 44, 20]} /></mesh>
      {/* Arms */}
      <mesh position={[-65, 12, 0]} material={MAT.base}><boxGeometry args={[22, 44, 65]} /></mesh>
      <mesh position={[65, 12, 0]} material={MAT.base}><boxGeometry args={[22, 44, 65]} /></mesh>
      {/* Cushions */}
      {[-35, 35].map((x, i) => (
        <mesh key={i} position={[x, 20, 5]} material={MAT.link}>
          <boxGeometry args={[55, 10, 50]} />
        </mesh>
      ))}
      {/* Coffee Table */}
      <mesh position={[-60, -8, 90]} material={MAT.link} castShadow>
        <cylinderGeometry args={[32, 32, 6, 32]} />
      </mesh>
      <mesh position={[-60, -22, 90]} material={MAT.link}>
        <cylinderGeometry args={[4, 4, 18, 8]} />
      </mesh>
      {/* Rug */}
      <mesh position={[0, -25, 70]} receiveShadow>
        <cylinderGeometry args={[110, 110, 2, 48]} />
        <meshStandardMaterial color="#fef3c7" roughness={1} />
      </mesh>
      {/* Smart TV */}
      <mesh position={[-150, 20, -60]} material={MAT.cncMachine} castShadow>
        <boxGeometry args={[80, 50, 5]} />
      </mesh>
      <mesh position={[-150, 20, -57]}>
        <boxGeometry args={[76, 46, 1]} />
        <meshBasicMaterial color={[0.05, 0.1, 0.4]} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ─── Corporate Environment ─── */
function CorporateEnvironment3D() {
  return (
    <group position={[120, -8, 120]}>
      {/* Desk */}
      <mesh material={MAT.conveyorFrame} castShadow receiveShadow><boxGeometry args={[110, 5, 55]} /></mesh>
      <mesh position={[-48, -22, 0]} material={MAT.conveyorFrame}><boxGeometry args={[5, 44, 44]} /></mesh>
      <mesh position={[48, -22, 0]} material={MAT.conveyorFrame}><boxGeometry args={[5, 44, 44]} /></mesh>
      {/* Monitor */}
      <mesh position={[0, 30, -18]} material={MAT.cncMachine} castShadow><boxGeometry args={[44, 28, 4]} /></mesh>
      <mesh position={[0, 30, -16]}><boxGeometry args={[40, 24, 1]} /><meshBasicMaterial color={[0.1, 0.2, 0.5]} toneMapped={false} /></mesh>
      <mesh position={[0, 16, -18]} material={MAT.link}><cylinderGeometry args={[2, 2, 12, 8]} /></mesh>
      {/* Keyboard */}
      <mesh position={[0, 3, 12]} material={MAT.base}><boxGeometry args={[36, 2, 12]} /></mesh>
      {/* Filing cabinet */}
      <mesh position={[130, -10, -15]} material={MAT.conveyorFrame} castShadow><boxGeometry args={[30, 50, 36]} /></mesh>
      {/* Water cooler */}
      <mesh position={[140, -10, -80]} material={MAT.cncMachine} castShadow><boxGeometry args={[22, 44, 22]} /></mesh>
      <mesh position={[140, 20, -80]}>
        <cylinderGeometry args={[9, 9, 22, 16]} />
        <meshPhysicalMaterial color="#38bdf8" transmission={0.6} transparent opacity={0.75} roughness={0.05} thickness={2} />
      </mesh>
    </group>
  );
}

/* ─── Main Canvas Export ─── */
export default function Robot3DCanvas({ joints, robotDesign, workpieces }: Robot3DCanvasProps) {
  const activeJoints = useMemo(() => {
    if (joints && joints.length > 0) return joints;
    const shoulder = robotDesign?.shoulderLength || 150;
    const elbow    = robotDesign?.elbowLength   || 120;
    const wrist    = robotDesign?.wristLength   || 80;
    return [
      { id: 'j1', name: 'Base',     angle: 90,  length: 0,       minAngle: 0,    maxAngle: 180, color: 'blue'   },
      { id: 'j2', name: 'Shoulder', angle: 45,  length: shoulder, minAngle: -90,  maxAngle: 180, color: 'green'  },
      { id: 'j3', name: 'Elbow',    angle: -90, length: elbow,    minAngle: -150, maxAngle: 150, color: 'red'    },
      { id: 'j4', name: 'Wrist',    angle: 45,  length: wrist,    minAngle: -180, maxAngle: 180, color: 'yellow' },
    ] as import('./types').RobotJoint[];
  }, [joints, robotDesign]);

  const endEffectorType = robotDesign?.endEffectorType || 'gripper';

  return (
    <div className="w-full h-full relative bg-[#080a0c]">
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        camera={{ position: [0, 220, 550], fov: 48 }}
        dpr={[1, Math.min(window.devicePixelRatio, 1.5)]}
        gl={{ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFShadowMap;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2;
        }}
      >
        <color attach="background" args={['#080a0c']} />
        <fog attach="fog" args={['#080a0c', 800, 2400]} />

        {/* 3-Point Lighting Rig */}
        <ambientLight intensity={0.45} color="#d4e4ff" />
        <hemisphereLight args={['#203050', '#0a0c10', 0.6]} />
        <directionalLight
          position={[200, 400, 200]} intensity={2.2} castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-near={10} shadow-camera-far={1200}
          shadow-camera-left={-400} shadow-camera-right={400}
          shadow-camera-top={400} shadow-camera-bottom={-400}
          shadow-bias={-0.0005}
        />
        <directionalLight position={[-150, 200, -100]} intensity={0.6} color="#80aaff" />
        <pointLight position={[0, 80, 0]} intensity={0.5} color="#f59e0b" distance={400} />

        {/* Environment IBL */}
        <Environment preset="warehouse" />

        {/* Floor */}
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -50, 0]} receiveShadow>
          <planeGeometry args={[3000, 3000]} />
          <meshStandardMaterial color="#111418" roughness={0.88} metalness={0.04} />
        </mesh>

        {/* Grid overlay */}
        <Grid
          infiniteGrid
          fadeDistance={1200}
          sectionColor="#1e3a5f"
          cellColor="#0f1c2d"
          position={[0, -49.5, 0]}
          sectionSize={100}
          cellSize={20}
        />
        <ContactShadows position={[0, -49.8, 0]} opacity={0.55} scale={700} blur={2.5} far={120} />

        {/* Environment objects */}
        {robotDesign?.category === 'domestic'  && <DomesticEnvironment3D />}
        {robotDesign?.category === 'corporate' && <CorporateEnvironment3D />}
        {(!robotDesign?.category || robotDesign.category === 'industrial') && (
          <IndustrialEnvironment3D workpieces={workpieces} />
        )}

        {/* Base Pedestal */}
        <group position={[0, -25, 0]}>
          <mesh material={MAT.base} castShadow receiveShadow>
            <cylinderGeometry args={[44, 55, 52, 24]} />
          </mesh>
          {/* Base ring detail */}
          <mesh position={[0, 28, 0]} material={MAT.joint}>
            <cylinderGeometry args={[46, 46, 4, 24]} />
          </mesh>
        </group>

        {/* Robot Arm Kinematic Chain */}
        <group position={[0, 2, 0]}>
          {activeJoints.length > 0 && (
            <RobotSegment length={activeJoints[0].length} angleDeg={activeJoints[0].angle} name={activeJoints[0].name}>
              {activeJoints.length > 1 && (
                <RobotSegment length={activeJoints[1].length} angleDeg={activeJoints[1].angle} name={activeJoints[1].name}>
                  {activeJoints.length > 2 && (
                    <RobotSegment length={activeJoints[2].length} angleDeg={activeJoints[2].angle} name={activeJoints[2].name}>
                      {activeJoints.length > 3 && (
                        <RobotSegment
                          length={activeJoints[3].length} angleDeg={activeJoints[3].angle}
                          name={activeJoints[3].name} endEffectorType={endEffectorType}
                        />
                      )}
                    </RobotSegment>
                  )}
                </RobotSegment>
              )}

              {/* HUD Panel */}
              <Html position={[-160, 160, 0]} center transform sprite zIndexRange={[100, 0]}>
                <div className="bg-black/85 backdrop-blur border border-cyan-500/25 rounded-lg p-3 font-mono text-[10px] text-cyan-400 w-52 shadow-[0_0_20px_rgba(6,182,212,0.25)] pointer-events-none select-none">
                  <div className="text-white border-b border-cyan-400/30 pb-1 mb-2 font-black text-[11px] tracking-widest uppercase">DIGITAL TWIN HUD</div>
                  {activeJoints.map(j => (
                    <div key={j.id} className="flex justify-between py-0.5">
                      <span className="text-slate-400">{j.name.substring(0, 4).toUpperCase()}</span>
                      <span className="text-emerald-400 font-bold">{j.angle.toFixed(1)}°</span>
                    </div>
                  ))}
                  <div className="mt-2 pt-1.5 border-t border-cyan-400/20 flex justify-between">
                    <span className="text-slate-500">EFFECTOR</span>
                    <span className="text-white font-bold">{endEffectorType.toUpperCase()}</span>
                  </div>
                </div>
              </Html>
            </RobotSegment>
          )}
        </group>

        <OrbitControls makeDefault minDistance={80} maxDistance={1200} maxPolarAngle={Math.PI / 2 + 0.05} enableDamping dampingFactor={0.08} />
        <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
          <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="white" />
        </GizmoHelper>
      </Canvas>
    </div>
  );
}
