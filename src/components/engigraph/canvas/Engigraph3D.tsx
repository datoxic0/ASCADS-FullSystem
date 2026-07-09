import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls, Environment, ContactShadows, Sphere,
  AccumulativeShadows, RandomizedLight, Html, Cylinder, RoundedBox,
} from '@react-three/drei';
import { useEngigraphStore, DrawingObject } from '../store/useEngigraphStore';
import * as THREE from 'three';

/* ────────────────────────────────────────────────────────────────
 * KiCad / Altium-style realistic PCB visualization
 * Board: FR-4 core, matte green solder mask, white silkscreen,
 * gold-plated pads and vias. Real component packages.
 * ──────────────────────────────────────────────────────────────── */

const COLORS = {
  soldermask: '#0b3d1e',      // matte green
  soldermaskEdge: '#062915',
  silkscreen: '#f5f5dc',      // off-white
  copper: '#c9a227',          // ENIG gold pad
  copperTrace: '#b8860b',
  copperTraceBottom: '#8b5a1a',
  fr4Edge: '#c8a874',         // exposed fiberglass at board edge
  icBody: '#1a1a1a',          // black epoxy IC
  icPin: '#e0e0e0',           // tinned lead
  ledRed: '#ff2020',
  ledGreen: '#20ff30',
  capBlue: '#1e3a8a',         // electrolytic
  capTop: '#c0c0c0',
  resistorBody: '#e8d4a0',    // beige ceramic
  headerPlastic: '#0a0a0a',
  headerPin: '#d4af37',
};

const BOARD_THICKNESS = 1.6; // real PCB thickness in mm-ish units

/* ─────────────  Board with layered soldermask + silkscreen  ───────────── */
const Board3D: React.FC<{ boardW: number; boardH: number }> = ({ boardW, boardH }) => {
  return (
    <group position={[0, -BOARD_THICKNESS / 2, 0]}>
      {/* FR-4 core (edge) */}
      <mesh receiveShadow castShadow>
        <boxGeometry args={[boardW, BOARD_THICKNESS, boardH]} />
        <meshStandardMaterial color={COLORS.fr4Edge} roughness={0.9} metalness={0} />
      </mesh>
      {/* Top soldermask */}
      <mesh position={[0, BOARD_THICKNESS / 2 + 0.01, 0]} receiveShadow>
        <boxGeometry args={[boardW - 0.4, 0.05, boardH - 0.4]} />
        <meshPhysicalMaterial
          color={COLORS.soldermask}
          roughness={0.55}
          metalness={0.05}
          clearcoat={0.8}
          clearcoatRoughness={0.4}
          sheen={0.2}
          sheenColor={COLORS.soldermaskEdge}
        />
      </mesh>
      {/* Bottom soldermask */}
      <mesh position={[0, -BOARD_THICKNESS / 2 - 0.01, 0]} receiveShadow rotation={[Math.PI, 0, 0]}>
        <boxGeometry args={[boardW - 0.4, 0.05, boardH - 0.4]} />
        <meshPhysicalMaterial color={COLORS.soldermask} roughness={0.6} metalness={0.05} clearcoat={0.6} />
      </mesh>
    </group>
  );
};

/* ─────────────  Realistic Component Packages  ───────────── */

/** DIP-style IC with pins (Arduino / ESP / generic microcontroller) */
const DipIC: React.FC<{
  width: number; depth: number; pins?: number; label?: string;
}> = ({ width, depth, pins = 28, label }) => {
  const bodyH = 3.5;
  const pinSide = Math.max(6, Math.floor(pins / 2));
  const pinSpacing = (depth - 4) / (pinSide - 1);
  return (
    <group position={[0, bodyH / 2, 0]}>
      {/* Epoxy body */}
      <RoundedBox args={[width, bodyH, depth]} radius={0.3} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color={COLORS.icBody} roughness={0.75} metalness={0.1} />
      </RoundedBox>
      {/* Pin-1 indicator dot */}
      <mesh position={[-width / 2 + 2, bodyH / 2 + 0.01, -depth / 2 + 2]}>
        <cylinderGeometry args={[0.8, 0.8, 0.05, 16]} />
        <meshStandardMaterial color="#333" roughness={0.9} />
      </mesh>
      {/* Silkscreen label */}
      {label && (
        <Html position={[0, bodyH / 2 + 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} center transform occlude
              distanceFactor={40} style={{ pointerEvents: 'none' }}>
          <div style={{
            color: COLORS.silkscreen, fontFamily: 'monospace', fontSize: 10,
            fontWeight: 700, letterSpacing: 1, whiteSpace: 'nowrap', textShadow: '0 0 2px #000',
          }}>{label}</div>
        </Html>
      )}
      {/* Pins */}
      {Array.from({ length: pinSide }).map((_, i) => {
        const z = -depth / 2 + 2 + i * pinSpacing;
        return (
          <React.Fragment key={i}>
            <mesh position={[width / 2 + 0.5, -bodyH / 2 + 0.3, z]} castShadow>
              <boxGeometry args={[1, 0.4, 0.6]} />
              <meshStandardMaterial color={COLORS.icPin} roughness={0.35} metalness={0.9} />
            </mesh>
            <mesh position={[-width / 2 - 0.5, -bodyH / 2 + 0.3, z]} castShadow>
              <boxGeometry args={[1, 0.4, 0.6]} />
              <meshStandardMaterial color={COLORS.icPin} roughness={0.35} metalness={0.9} />
            </mesh>
          </React.Fragment>
        );
      })}
    </group>
  );
};

/** SMD Resistor / 1206 package */
const SmdResistor: React.FC<{ width: number; depth: number; value?: string }> = ({ width, depth, value }) => {
  const h = 0.55;
  return (
    <group position={[0, h / 2, 0]}>
      {/* Ceramic body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width * 0.7, h, depth * 0.9]} />
        <meshStandardMaterial color={COLORS.resistorBody} roughness={0.8} metalness={0.02} />
      </mesh>
      {/* Silver end caps */}
      <mesh position={[-width * 0.4, 0, 0]} castShadow>
        <boxGeometry args={[width * 0.2, h * 1.05, depth * 0.95]} />
        <meshStandardMaterial color="#d8d8d8" roughness={0.3} metalness={0.85} />
      </mesh>
      <mesh position={[width * 0.4, 0, 0]} castShadow>
        <boxGeometry args={[width * 0.2, h * 1.05, depth * 0.95]} />
        <meshStandardMaterial color="#d8d8d8" roughness={0.3} metalness={0.85} />
      </mesh>
      {/* Value marking */}
      {value && (
        <Html position={[0, h / 2 + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} center transform
              distanceFactor={30} style={{ pointerEvents: 'none' }}>
          <div style={{ color: '#000', fontFamily: 'monospace', fontSize: 8, fontWeight: 700 }}>{value}</div>
        </Html>
      )}
    </group>
  );
};

/** Through-hole LED with translucent dome */
const ThLed: React.FC<{ size: number; color: string; powered: boolean }> = ({ size, color, powered }) => {
  const r = Math.min(size, 6) / 2;
  return (
    <group>
      {/* Base ring (flange) */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[r * 1.1, r * 1.1, 0.8, 24]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.05} />
      </mesh>
      {/* Dome */}
      <mesh position={[0, 0.8 + r * 0.8, 0]} castShadow>
        <sphereGeometry args={[r, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color={color}
          transmission={0.6}
          transparent
          opacity={0.9}
          roughness={0.15}
          ior={1.55}
          thickness={2}
          emissive={powered ? color : '#000'}
          emissiveIntensity={powered ? 2.5 : 0}
          toneMapped={false}
        />
      </mesh>
      {/* Leads */}
      <mesh position={[-r * 0.4, -0.5, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 2, 8]} />
        <meshStandardMaterial color={COLORS.icPin} metalness={0.9} roughness={0.35} />
      </mesh>
      <mesh position={[r * 0.4, -0.5, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 2, 8]} />
        <meshStandardMaterial color={COLORS.icPin} metalness={0.9} roughness={0.35} />
      </mesh>
      {/* Point light when powered */}
      {powered && <pointLight color={color} intensity={0.6} distance={20} decay={2} position={[0, r + 1, 0]} />}
    </group>
  );
};

/** Cylindrical electrolytic capacitor */
const Electrolytic: React.FC<{ size: number }> = ({ size }) => {
  const r = Math.max(3, Math.min(size, 12) / 2);
  const h = r * 2.2;
  return (
    <group position={[0, h / 2, 0]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[r, r, h, 24]} />
        <meshStandardMaterial color={COLORS.capBlue} roughness={0.6} metalness={0.15} />
      </mesh>
      {/* Aluminum top with cross-cut */}
      <mesh position={[0, h / 2 + 0.05, 0]}>
        <cylinderGeometry args={[r * 0.95, r * 0.95, 0.1, 24]} />
        <meshStandardMaterial color={COLORS.capTop} roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Negative stripe */}
      <mesh position={[-r - 0.01, 0, 0]}>
        <boxGeometry args={[0.05, h * 0.85, r * 0.5]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.7} />
      </mesh>
    </group>
  );
};

/** 9V-style battery block */
const Battery3D: React.FC<{ w: number; d: number }> = ({ w, d }) => {
  const h = 15;
  return (
    <group position={[0, h / 2, 0]}>
      <RoundedBox args={[w, h, d]} radius={1} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color="#8b1a1a" roughness={0.4} metalness={0.2} />
      </RoundedBox>
      <mesh position={[-w * 0.2, h / 2 + 1, 0]}>
        <cylinderGeometry args={[1, 1, 2, 12]} />
        <meshStandardMaterial color={COLORS.headerPin} metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[w * 0.2, h / 2 + 1, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color={COLORS.headerPin} metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
};

/** Pin header strip (2.54mm) */
const PinHeader: React.FC<{ w: number; d: number }> = ({ w, d }) => {
  const rows = Math.max(1, Math.floor(d / 5));
  const cols = Math.max(1, Math.floor(w / 5));
  const h = 8;
  return (
    <group position={[0, h / 2, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, 2.5, d]} />
        <meshStandardMaterial color={COLORS.headerPlastic} roughness={0.7} metalness={0.1} />
      </mesh>
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const x = -w / 2 + 2.5 + c * (w / cols);
          const z = -d / 2 + 2.5 + r * (d / rows);
          return (
            <mesh key={`${r}-${c}`} position={[x, 2, z]} castShadow>
              <boxGeometry args={[0.6, h, 0.6]} />
              <meshStandardMaterial color={COLORS.headerPin} metalness={0.95} roughness={0.2} />
            </mesh>
          );
        })
      )}
    </group>
  );
};

/* ─────────────  Component dispatcher  ───────────── */
const Component3D: React.FC<{ element: DrawingObject; boardOffX: number; boardOffZ: number }> = ({
  element, boardOffX, boardOffZ,
}) => {
  const posX = (element.x || 0) - boardOffX;
  const posZ = (element.y || 0) - boardOffZ;
  const width = element.width || 20;
  const depth = element.height || 20;
  const rot = ((((element as any).rotation) || 0) * Math.PI) / 180;

  const pt = element.partType || '';
  const powered = !!element.isPowered;

  let node: React.ReactNode = null;

  if (pt === 'arduino_uno') node = <DipIC width={width * 0.55} depth={depth * 0.85} pins={28} label="ARDUINO UNO" />;
  else if (pt === 'esp32') node = <DipIC width={width * 0.55} depth={depth * 0.85} pins={38} label="ESP32" />;
  else if (pt === 'pico') node = <DipIC width={width * 0.5} depth={depth * 0.85} pins={40} label="PICO" />;
  else if (pt === 'lcd') node = (
    <group position={[0, 3, 0]}>
      <RoundedBox args={[width, 6, depth]} radius={0.5} castShadow>
        <meshStandardMaterial color="#0a2f4a" roughness={0.5} metalness={0.1} />
      </RoundedBox>
      <mesh position={[0, 3.1, 0]}>
        <boxGeometry args={[width * 0.85, 0.1, depth * 0.7]} />
        <meshStandardMaterial color="#7ab86a" emissive="#7ab86a" emissiveIntensity={powered ? 0.8 : 0.05} />
      </mesh>
    </group>
  );
  else if (pt === 'breadboard') node = (
    <mesh position={[0, 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[width, 4, depth]} />
      <meshStandardMaterial color="#f5f5f0" roughness={0.85} metalness={0.02} />
    </mesh>
  );
  else if (pt === 'resistor') node = <SmdResistor width={width} depth={depth} value={(element as any).label} />;
  else if (pt === 'led' || pt === 'led_red') node = <ThLed size={Math.min(width, depth)} color={COLORS.ledRed} powered={powered} />;
  else if (pt === 'led_blue') node = <ThLed size={Math.min(width, depth)} color="#3080ff" powered={powered} />;
  else if (pt === 'led_green' as any) node = <ThLed size={Math.min(width, depth)} color={COLORS.ledGreen} powered={powered} />;
  else if (pt === 'battery') node = <Battery3D w={width} d={depth} />;
  else if (pt === 'button' || pt === 'switch' || pt === 'switch_spst') node = (
    <group position={[0, 2, 0]}>
      <mesh castShadow><boxGeometry args={[width, 4, depth]} /><meshStandardMaterial color="#0a0a0a" roughness={0.6} /></mesh>
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[Math.min(width, depth) * 0.3, Math.min(width, depth) * 0.3, 1, 16]} />
        <meshStandardMaterial color="#c0392b" roughness={0.4} />
      </mesh>
    </group>
  );
  else if (pt === 'fan' || pt === 'dcmotor' || pt === 'servo') node = (
    <group position={[0, 6, 0]}>
      <mesh castShadow><cylinderGeometry args={[Math.min(width, depth) / 2, Math.min(width, depth) / 2, 12, 24]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.5} metalness={0.4} /></mesh>
      <mesh position={[0, 6.5, 0]} castShadow><cylinderGeometry args={[1, 1, 1, 12]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.2} /></mesh>
    </group>
  );
  else if (pt === 'ground') node = (
    <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[width * 0.4, width * 0.5, 1, 6]} />
      <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.4} /></mesh>
  );
  else if (pt?.startsWith('gate_')) node = <DipIC width={width * 0.6} depth={depth * 0.7} pins={14} label={pt.replace('gate_', '').toUpperCase()} />;
  else if (pt === 'keypad') node = (
    <mesh position={[0, 3, 0]} castShadow><boxGeometry args={[width, 6, depth]} />
      <meshStandardMaterial color="#1a1a1a" roughness={0.6} /></mesh>
  );
  // Fallback: assume electrolytic-ish cap or unknown SMD
  else node = <Electrolytic size={Math.min(width, depth)} />;

  return (
    <group position={[posX, 0, posZ]} rotation={[0, rot, 0]}>
      {node}
      {/* Fault / EMI aura */}
      {(element.isPowerStarved || element.isCorrupted || (element.crosstalkInterference && element.crosstalkInterference > 0)) && (
        <Sphere args={[Math.max(width, depth) * 1.2, 24, 24]} position={[0, 4, 0]}>
          <meshBasicMaterial
            color={element.isPowerStarved ? '#ef4444' : '#f59e0b'}
            transparent opacity={0.18} wireframe={element.isCorrupted}
          />
        </Sphere>
      )}
    </group>
  );
};

/* ─────────────  Vias (plated through-hole)  ───────────── */
const Via3D: React.FC<{ element: DrawingObject; boardOffX: number; boardOffZ: number }> = ({
  element, boardOffX, boardOffZ,
}) => {
  const posX = (element.x || 0) - boardOffX;
  const posZ = (element.y || 0) - boardOffZ;
  return (
    <group position={[posX, 0, posZ]}>
      {/* Copper barrel */}
      <mesh castShadow>
        <cylinderGeometry args={[0.9, 0.9, BOARD_THICKNESS + 0.4, 16]} />
        <meshStandardMaterial color={COLORS.copper} metalness={0.9} roughness={0.25} />
      </mesh>
      {/* Annular ring top */}
      <mesh position={[0, BOARD_THICKNESS / 2 + 0.05, 0]}>
        <cylinderGeometry args={[1.6, 1.6, 0.05, 16]} />
        <meshStandardMaterial color={COLORS.copper} metalness={0.9} roughness={0.25} />
      </mesh>
      {/* Annular ring bottom */}
      <mesh position={[0, -BOARD_THICKNESS / 2 - 0.05, 0]}>
        <cylinderGeometry args={[1.6, 1.6, 0.05, 16]} />
        <meshStandardMaterial color={COLORS.copper} metalness={0.9} roughness={0.25} />
      </mesh>
    </group>
  );
};

/* ─────────────  Copper traces as extruded ribbons  ───────────── */
const Wire3D: React.FC<{ element: DrawingObject; boardOffX: number; boardOffZ: number }> = ({
  element, boardOffX, boardOffZ,
}) => {
  const geometry = useMemo(() => {
    const points = element.points;
    if (!points || points.length < 4) return null;
    const isBottom = element.boardLayer === 'bottom';
    const yPos = isBottom ? -BOARD_THICKNESS / 2 - 0.08 : BOARD_THICKNESS / 2 + 0.08;
    const vec: THREE.Vector3[] = [];
    for (let i = 0; i < points.length; i += 2) {
      vec.push(new THREE.Vector3(points[i] - boardOffX, yPos, points[i + 1] - boardOffZ));
    }
    if (vec.length < 2) return null;
    const curve = new THREE.CatmullRomCurve3(vec, false, 'catmullrom', 0.05);
    return new THREE.TubeGeometry(curve, Math.max(20, vec.length * 4), 0.5, 6, false);
  }, [element.points, element.boardLayer, boardOffX, boardOffZ]);

  if (!geometry) return null;
  const isBottom = element.boardLayer === 'bottom';
  const isEntangled = element.isEntangled;
  const color = isEntangled ? '#a855f7' : (isBottom ? COLORS.copperTraceBottom : COLORS.copperTrace);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color={color}
        roughness={0.35}
        metalness={0.85}
        emissive={isEntangled ? '#a855f7' : '#000'}
        emissiveIntensity={isEntangled ? 0.6 : 0}
      />
    </mesh>
  );
};

/* ─────────────  Main viewer  ───────────── */
export const Engigraph3D: React.FC = () => {
  const { elements, is3DViewOpen, toggle3DView, enclosureMode } = useEngigraphStore();

  // Auto-fit board around content
  const { boardW, boardH, offX, offZ } = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    elements.forEach(el => {
      const x = el.x || 0, y = el.y || 0;
      const w = el.width || 0, h = el.height || 0;
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w); maxY = Math.max(maxY, y + h);
    });
    if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 400; maxY = 300; }
    const padding = 40;
    const cX = (minX + maxX) / 2;
    const cZ = (minY + maxY) / 2;
    return {
      boardW: Math.max(200, maxX - minX + padding * 2),
      boardH: Math.max(150, maxY - minY + padding * 2),
      offX: cX, offZ: cZ,
    };
  }, [elements]);

  if (!is3DViewOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-[#0e0e11] flex flex-col">
      <div className="flex items-center justify-between p-4 bg-[#1f1f23] border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-200">3D PCB Visualization</span>
          <span className="px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-400 text-xs font-mono">
            FR-4 · ENIG · 1.6mm
          </span>
          <span className="text-xs text-slate-500 ml-2">{elements.length} elements</span>
        </div>
        <button
          onClick={toggle3DView}
          className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-sm transition-colors"
        >
          Return to 2D Canvas
        </button>
      </div>

      <div className="flex-1 relative">
        <Canvas
          shadows
          camera={{ position: [0, boardW * 0.9, boardH * 1.1], fov: 40 }}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
          dpr={[1, 2]}
        >
          <color attach="background" args={['#0a0f14']} />
          <fog attach="fog" args={['#0a0f14', boardW * 1.5, boardW * 4]} />

          {/* Studio lighting — 3-point rig */}
          <ambientLight intensity={0.35} />
          <directionalLight
            position={[boardW * 0.6, boardW * 0.9, boardH * 0.4]}
            intensity={2.2}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-boardW}
            shadow-camera-right={boardW}
            shadow-camera-top={boardH}
            shadow-camera-bottom={-boardH}
            shadow-bias={-0.0005}
          />
          <directionalLight position={[-boardW * 0.5, boardW * 0.5, -boardH * 0.5]} intensity={0.6} color="#a8c4ff" />
          <directionalLight position={[0, -boardW * 0.3, boardH * 0.6]} intensity={0.25} color="#ffd8a8" />

          <group>
            <Board3D boardW={boardW} boardH={boardH} />

            {elements.map((el) => {
              if (el.type === 'wire') return <Wire3D key={el.id} element={el} boardOffX={offX} boardOffZ={offZ} />;
              if (el.partType === 'via') return <Via3D key={el.id} element={el} boardOffX={offX} boardOffZ={offZ} />;
              if (el.type === 'component') return <Component3D key={el.id} element={el} boardOffX={offX} boardOffZ={offZ} />;
              return null;
            })}

            {enclosureMode && (
              <mesh position={[0, 25, 0]} castShadow>
                <boxGeometry args={[boardW + 20, 50, boardH + 20]} />
                <meshPhysicalMaterial
                  color="#4a90e2"
                  transmission={0.85} transparent opacity={1}
                  roughness={0.05} thickness={4}
                  ior={1.48} clearcoat={1} clearcoatRoughness={0.05}
                  envMapIntensity={1.5}
                />
              </mesh>
            )}
          </group>

          <ContactShadows
            position={[0, -BOARD_THICKNESS / 2 - 0.1, 0]}
            opacity={0.55}
            scale={boardW * 2}
            blur={2.5}
            far={40}
            resolution={1024}
          />

          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.08}
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 2 - 0.02}
            minDistance={80}
            maxDistance={boardW * 4}
          />
          <Environment preset="warehouse" />
        </Canvas>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur border border-white/10 rounded-lg px-3 py-2 text-[10px] font-mono text-slate-300 space-y-1 pointer-events-none">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded" style={{background: COLORS.soldermask}} />Solder mask (FR-4)</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded" style={{background: COLORS.copperTrace}} />Top copper</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded" style={{background: COLORS.copperTraceBottom}} />Bottom copper</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded" style={{background: COLORS.copper}} />ENIG pads / vias</div>
        </div>
      </div>
    </div>
  );
};
