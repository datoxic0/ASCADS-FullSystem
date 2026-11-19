/**
 * Engigraph 3D Sketch Studio — Industrial-grade parametric modeler
 * Real mm units · CSG booleans · TransformControls · STL/OBJ export for 3D printing
 */
import React, {
  useRef, useState, useCallback, useMemo, useEffect, forwardRef,
} from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import {
  OrbitControls, Grid, ContactShadows, Environment,
  GizmoHelper, GizmoViewport, TransformControls,
  PerspectiveCamera, OrthographicCamera, Html,
} from '@react-three/drei';
import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import {
  Trash2, RotateCcw, Move, RotateCw, Scaling as ScaleIcon,
  Download, Layers, Eye, EyeOff, Lock, Unlock, Copy,
  Plus, Minus, Box, Circle, Triangle, Hexagon,
  Printer, Ruler, Grid3X3, ChevronDown, ZapOff, Merge,
} from 'lucide-react';

/* ─── Types ─── */
export type PrimKind = 'box' | 'cylinder' | 'sphere' | 'cone' | 'torus' | 'wedge' | 'tube' | 'csg';

export interface ObjParams {
  width?: number; height?: number; depth?: number;       // box/wedge mm
  radiusTop?: number; radiusBottom?: number;              // cylinder/tube mm
  radius?: number;                                        // sphere/cone mm
  innerRadius?: number; outerRadius?: number;             // torus mm
  tubeRadius?: number;                                    // torus tube
  segments?: number;
  hollow?: boolean; wallThickness?: number;               // tube hollow
}

export interface SceneObj {
  id: string;
  name: string;
  kind: PrimKind;
  params: ObjParams;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  opacity: number;
  visible: boolean;
  locked: boolean;
  csgGeom?: string;  // JSON serialised BufferGeometry attributes (for CSG results)
}

type TransformMode = 'translate' | 'rotate' | 'scale';
type ViewMode = 'solid' | 'wireframe' | 'xray';
type CamMode = 'perspective' | 'top' | 'front' | 'right';

/* ─── Geometry builders ─── */
function buildGeometry(obj: SceneObj): THREE.BufferGeometry | null {
  const p = obj.params;
  const segs = Math.max(6, p.segments ?? 32);
  switch (obj.kind) {
    case 'box':
      return new THREE.BoxGeometry(p.width ?? 20, p.height ?? 20, p.depth ?? 20);
    case 'cylinder':
      return new THREE.CylinderGeometry(
        p.radiusTop ?? 10, p.radiusBottom ?? 10, p.height ?? 30, segs,
      );
    case 'sphere':
      return new THREE.SphereGeometry(p.radius ?? 10, segs, segs);
    case 'cone':
      return new THREE.ConeGeometry(p.radius ?? 10, p.height ?? 25, segs);
    case 'torus':
      return new THREE.TorusGeometry(
        p.outerRadius ?? 15, p.tubeRadius ?? 4, Math.max(6, segs >> 1), segs,
      );
    case 'wedge': {
      // Right-angle wedge (triangular prism)
      const w = p.width ?? 20, h = p.height ?? 20, d = p.depth ?? 20;
      const g = new THREE.BufferGeometry();
      const verts = new Float32Array([
        // Bottom face (CW from above)
        -w/2, -h/2,  d/2,   w/2, -h/2,  d/2,   w/2, -h/2, -d/2,
        -w/2, -h/2,  d/2,   w/2, -h/2, -d/2,  -w/2, -h/2, -d/2,
        // Top vertex (apex)
        -w/2,  h/2,  d/2,   w/2,  h/2,  d/2,   w/2,  h/2,  d/2,
        // Sloped face
        -w/2, -h/2,  d/2,  -w/2,  h/2,  d/2,   w/2,  h/2,  d/2,
        -w/2, -h/2,  d/2,   w/2,  h/2,  d/2,   w/2, -h/2,  d/2,
        // Back vertical face
        -w/2, -h/2, -d/2,   w/2, -h/2, -d/2,  -w/2,  h/2,  d/2,
        // Left triangle
        -w/2, -h/2,  d/2,  -w/2, -h/2, -d/2,  -w/2,  h/2,  d/2,
        // Right triangle
         w/2, -h/2, -d/2,   w/2, -h/2,  d/2,   w/2,  h/2,  d/2,
      ]);
      g.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      g.computeVertexNormals();
      return g;
    }
    case 'tube': {
      const outerR = p.radiusTop ?? 12;
      const innerR = p.hollow ? (p.innerRadius ?? outerR * 0.7) : 0;
      const h = p.height ?? 40;
      if (innerR <= 0) {
        return new THREE.CylinderGeometry(outerR, outerR, h, segs);
      }
      // Hollow tube via CSG
      const outer = new THREE.Mesh(new THREE.CylinderGeometry(outerR, outerR, h + 0.1, segs));
      const inner = new THREE.Mesh(new THREE.CylinderGeometry(innerR, innerR, h + 0.2, segs));
      outer.updateMatrix(); inner.updateMatrix();
      try {
        return CSG.subtract(outer, inner).geometry;
      } catch {
        return new THREE.CylinderGeometry(outerR, outerR, h, segs);
      }
    }
    default:
      return null;
  }
}

function computeVolume(obj: SceneObj): number {
  // Approximate volume in mm³
  const p = obj.params;
  const [sx, sy, sz] = obj.scale;
  switch (obj.kind) {
    case 'box': return (p.width ?? 20) * (p.height ?? 20) * (p.depth ?? 20) * sx * sy * sz;
    case 'cylinder': {
      const r = ((p.radiusTop ?? 10) + (p.radiusBottom ?? 10)) / 2;
      return Math.PI * r * r * (p.height ?? 30) * sx * sy * sz;
    }
    case 'sphere': return (4 / 3) * Math.PI * Math.pow(p.radius ?? 10, 3) * sx * sy * sz;
    case 'cone': return (1 / 3) * Math.PI * Math.pow(p.radius ?? 10, 2) * (p.height ?? 25) * sx * sy * sz;
    default: return 0;
  }
}

/* ─── Preset Object Library ─── */
interface ObjPreset { name: string; kind: PrimKind; params: ObjParams; color: string; category: string; }
const PRESETS: ObjPreset[] = [
  // Basic Solids
  { name: 'Box (20mm)',     kind: 'box',       params: { width: 20, height: 20, depth: 20 },                        color: '#64748b', category: 'Solid' },
  { name: 'Plate (2mm)',    kind: 'box',       params: { width: 80, height: 2, depth: 60 },                         color: '#475569', category: 'Solid' },
  { name: 'Beam 100mm',     kind: 'box',       params: { width: 10, height: 100, depth: 10 },                       color: '#334155', category: 'Solid' },
  { name: 'Cylinder',       kind: 'cylinder',  params: { radiusTop: 10, radiusBottom: 10, height: 30 },              color: '#4b5563', category: 'Solid' },
  { name: 'Sphere',         kind: 'sphere',    params: { radius: 15 },                                              color: '#6b7280', category: 'Solid' },
  { name: 'Cone',           kind: 'cone',      params: { radius: 12, height: 24 },                                  color: '#52525b', category: 'Solid' },
  { name: 'Wedge',          kind: 'wedge',     params: { width: 30, height: 20, depth: 40 },                        color: '#44403c', category: 'Solid' },
  { name: 'Torus (ring)',   kind: 'torus',     params: { outerRadius: 20, tubeRadius: 4 },                           color: '#57534e', category: 'Solid' },
  // Hollow / Tubes
  { name: 'Hollow Tube',    kind: 'tube',      params: { radiusTop: 15, innerRadius: 11, height: 50, hollow: true }, color: '#475569', category: 'Hollow' },
  { name: 'Thin Pipe',      kind: 'tube',      params: { radiusTop: 8,  innerRadius: 6.5, height: 80, hollow: true }, color: '#374151', category: 'Hollow' },
  { name: 'Bushing',        kind: 'tube',      params: { radiusTop: 12, innerRadius: 8,  height: 15, hollow: true }, color: '#64748b', category: 'Hollow' },
  { name: 'Conduit',        kind: 'tube',      params: { radiusTop: 20, innerRadius: 17, height: 120, hollow: true }, color: '#3f3f46', category: 'Hollow' },
  // Engineering Parts
  { name: 'M3 Bolt Head',   kind: 'cylinder',  params: { radiusTop: 2.85, radiusBottom: 2.85, height: 12, segments: 6 }, color: '#94a3b8', category: 'Parts' },
  { name: 'M5 Bolt Head',   kind: 'cylinder',  params: { radiusTop: 4,    radiusBottom: 4,    height: 20, segments: 6 }, color: '#94a3b8', category: 'Parts' },
  { name: 'Bearing Ring',   kind: 'torus',     params: { outerRadius: 22, tubeRadius: 5 },                           color: '#cbd5e1', category: 'Parts' },
  { name: 'Washer',         kind: 'tube',      params: { radiusTop: 10, innerRadius: 5.5, height: 2, hollow: true },  color: '#a1a1aa', category: 'Parts' },
  { name: 'PCB Board',      kind: 'box',       params: { width: 100, height: 1.6, depth: 80 },                       color: '#166534', category: 'Electronics' },
  { name: 'Enclosure Base', kind: 'box',       params: { width: 120, height: 40, depth: 80 },                        color: '#1e3a5f', category: 'Electronics' },
  { name: 'DIN Rail Clip',  kind: 'box',       params: { width: 35, height: 7.5, depth: 15 },                        color: '#71717a', category: 'Electronics' },
  { name: 'Heatsink Fin',   kind: 'box',       params: { width: 50, height: 40, depth: 2 },                          color: '#9ca3af', category: 'Electronics' },
  // Architecture / Environment
  { name: 'Wall Panel',     kind: 'box',       params: { width: 200, height: 250, depth: 15 },                       color: '#d1d5db', category: 'Architecture' },
  { name: 'Floor Tile',     kind: 'box',       params: { width: 300, height: 10, depth: 300 },                       color: '#6b7280', category: 'Architecture' },
  { name: 'Column',         kind: 'cylinder',  params: { radiusTop: 30, radiusBottom: 30, height: 300 },              color: '#9ca3af', category: 'Architecture' },
  { name: 'I-Beam',         kind: 'box',       params: { width: 100, height: 8, depth: 50 },                         color: '#475569', category: 'Architecture' },
];
const PRESET_CATS = [...new Set(PRESETS.map(p => p.category))];

/* ─── ObjectMesh (rendered inside R3F Canvas) ─── */
interface ObjMeshProps {
  obj: SceneObj;
  selected: boolean;
  viewMode: ViewMode;
  onSelect: (mesh: THREE.Mesh, id: string) => void;
  onTransformEnd: (id: string, pos: [n,n,n], rot: [n,n,n], scl: [n,n,n]) => void;
}
type n = number;

const ObjectMesh = forwardRef<THREE.Mesh, ObjMeshProps>(
  function ObjectMesh({ obj, selected, viewMode, onSelect }, ref) {
    if (!obj.visible) return null;

    const geom = useMemo(() => {
      if (obj.kind === 'csg' && obj.csgGeom) {
        // Rehydrate stored CSG geometry
        try {
          const data = JSON.parse(obj.csgGeom);
          const g = new THREE.BufferGeometry();
          g.setAttribute('position', new THREE.Float32BufferAttribute(data.position, 3));
          if (data.normal) g.setAttribute('normal', new THREE.Float32BufferAttribute(data.normal, 3));
          g.setIndex(data.index ? new THREE.BufferAttribute(new Uint32Array(data.index), 1) : null);
          g.computeVertexNormals();
          return g;
        } catch { return new THREE.BoxGeometry(10, 10, 10); }
      }
      return buildGeometry(obj) ?? new THREE.BoxGeometry(10, 10, 10);
    }, [obj.kind, obj.params, obj.csgGeom]);

    const mat = useMemo(() => {
      if (viewMode === 'wireframe') {
        return new THREE.MeshBasicMaterial({ color: selected ? '#60a5fa' : obj.color, wireframe: true });
      }
      if (viewMode === 'xray') {
        return new THREE.MeshStandardMaterial({
          color: obj.color, roughness: 0.4, metalness: 0.3,
          transparent: true, opacity: selected ? 0.5 : 0.25,
          depthWrite: false,
        });
      }
      return new THREE.MeshStandardMaterial({
        color: obj.color, roughness: 0.3, metalness: 0.6,
        emissive: selected ? '#1e3a5f' : '#000000', emissiveIntensity: selected ? 0.3 : 0,
        transparent: obj.opacity < 1, opacity: obj.opacity,
      });
    }, [obj.color, obj.opacity, selected, viewMode]);

    return (
      <mesh
        ref={ref}
        geometry={geom}
        material={mat}
        position={obj.position}
        rotation={obj.rotation.map(r => r * Math.PI / 180) as [n, n, n]}
        scale={obj.scale}
        castShadow
        receiveShadow
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (obj.locked) return;
          e.stopPropagation();
          onSelect(e.object as THREE.Mesh, obj.id);
        }}
        userData={{ objId: obj.id }}
      >
        {/* Bounding box outline on selection */}
        {selected && viewMode !== 'wireframe' && (
          <lineSegments>
            <edgesGeometry args={[geom]} />
            <lineBasicMaterial color="#3b82f6" />
          </lineSegments>
        )}
      </mesh>
    );
  }
);

/* ─── Transform Controls + Orbit bridge ─── */
function TransformBridge({
  target, mode, snapValue, orbitRef, onEnd,
}: {
  target: THREE.Mesh; mode: TransformMode; snapValue: number | null;
  orbitRef: React.RefObject<any>; onEnd: (t: [n,n,n], r: [n,n,n], s: [n,n,n]) => void;
}) {
  const controlsRef = useRef<any>(null);

  // 'dragging-changed' is a THREE.js event — attach via addEventListener on the controls instance
  useEffect(() => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;
    const handler = (e: any) => {
      if (orbitRef.current) orbitRef.current.enabled = !e.value;
      if (!e.value) {
        const p = target.position;
        const r = target.rotation;
        const s = target.scale;
        onEnd(
          [p.x, p.y, p.z],
          [r.x * 180 / Math.PI, r.y * 180 / Math.PI, r.z * 180 / Math.PI],
          [s.x, s.y, s.z],
        );
      }
    };
    ctrl.addEventListener('dragging-changed', handler);
    return () => ctrl.removeEventListener('dragging-changed', handler);
  }, [target, orbitRef, onEnd]);

  const snap = snapValue ?? undefined;
  const rotSnap = snapValue ? Math.PI / (180 / snapValue) : undefined;
  return (
    <TransformControls
      ref={controlsRef}
      object={target}
      mode={mode}
      translationSnap={snap}
      rotationSnap={rotSnap}
      scaleSnap={snapValue ? snapValue / 100 : undefined}
    />
  );
}

/* ─── Print Bed Overlay ─── */
function PrintBed({ size, show }: { size: [number, number]; show: boolean }) {
  if (!show) return null;
  const [w, d] = size;
  return (
    <group position={[0, -0.5, 0]}>
      <mesh rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshBasicMaterial color="#1a2a3a" transparent opacity={0.5} />
      </mesh>
      <lineLoop>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([
              -w/2, 0.5, -d/2,  w/2, 0.5, -d/2,  w/2, 0.5, d/2,  -w/2, 0.5, d/2,
            ]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#22c55e" />
      </lineLoop>
      <Html position={[w/2 + 4, 1, -d/2]} center>
        <div className="text-[9px] text-emerald-500 font-mono whitespace-nowrap">{w}×{d}mm</div>
      </Html>
    </group>
  );
}

/* ─── 3D Scene ─── */
function Scene3D({
  objects, selectedId, viewMode, camMode, snapValue, showBed, bedSize, transformMode,
  onSelectObj, onTransformEnd, orbitRef,
}: {
  objects: SceneObj[]; selectedId: string | null; viewMode: ViewMode;
  camMode: CamMode; snapValue: number | null; showBed: boolean; bedSize: [number, number];
  transformMode: TransformMode; onSelectObj: (mesh: THREE.Mesh, id: string) => void;
  onTransformEnd: (id: string, p: [n,n,n], r: [n,n,n], s: [n,n,n]) => void;
  orbitRef: React.RefObject<any>;
}) {
  const meshRefs = useRef<Map<string, THREE.Mesh>>(new Map());
  const selectedMesh = selectedId ? (meshRefs.current.get(selectedId) ?? null) : null;

  // Camera positioning
  const camConfig = useMemo(() => {
    switch (camMode) {
      case 'top':   return { position: [0, 600, 0.001] as [n,n,n], up: [0, 0, -1] as [n,n,n] };
      case 'front': return { position: [0, 0, 600]     as [n,n,n], up: [0, 1, 0]  as [n,n,n] };
      case 'right': return { position: [600, 0, 0]     as [n,n,n], up: [0, 1, 0]  as [n,n,n] };
      default:      return { position: [120, 180, 250] as [n,n,n], up: [0, 1, 0]  as [n,n,n] };
    }
  }, [camMode]);

  return (
    <>
      {camMode === 'perspective' ? (
        <PerspectiveCamera makeDefault position={camConfig.position} fov={45} near={0.1} far={10000} />
      ) : (
        <OrthographicCamera makeDefault position={camConfig.position} zoom={1.5} near={-5000} far={10000} />
      )}

      <ambientLight intensity={0.4} color="#d0e8ff" />
      <hemisphereLight args={['#2a4a70', '#050810', 0.6]} />
      <directionalLight
        position={[150, 400, 200]} intensity={2.4} castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1} shadow-camera-far={3000}
        shadow-camera-left={-500} shadow-camera-right={500}
        shadow-camera-top={500} shadow-camera-bottom={-500}
        shadow-bias={-0.0003}
      />
      <directionalLight position={[-120, 200, -100]} intensity={0.55} color="#8ab4ff" />
      <directionalLight position={[0, -50, 250]} intensity={0.2} color="#ffd8a8" />
      <Environment preset="warehouse" />

      {/* Floor — brushed workbench */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -1, 0]} receiveShadow onClick={() => onSelectObj(null as any, '')}>
        <planeGeometry args={[5000, 5000]} />
        <meshStandardMaterial color="#0c1218" roughness={0.85} metalness={0.15} />
      </mesh>

      {/* Print bed */}
      <PrintBed size={bedSize} show={showBed} />

      {/* World grid (1mm cells, 10mm sections) */}
      <Grid
        infiniteGrid fadeDistance={2000}
        sectionColor="#1e3a5f" cellColor="#0d1a2d"
        sectionSize={10} cellSize={1}
        position={[0, -0.5, 0]}
      />
      <ContactShadows position={[0, -0.8, 0]} opacity={0.4} scale={1500} blur={3} far={200} />

      {/* Axis Origin */}
      <axesHelper args={[20]} />

      {/* Scene Objects */}
      {objects.map(obj => {
        const setRef = (mesh: THREE.Mesh | null) => {
          if (mesh) meshRefs.current.set(obj.id, mesh);
          else meshRefs.current.delete(obj.id);
        };
        return (
          <ObjectMesh
            key={obj.id}
            ref={setRef}
            obj={obj}
            selected={obj.id === selectedId}
            viewMode={viewMode}
            onSelect={onSelectObj}
            onTransformEnd={onTransformEnd}
          />
        );
      })}

      {/* Transform Controls */}
      {selectedMesh && selectedId && (
        <TransformBridge
          target={selectedMesh}
          mode={transformMode}
          snapValue={snapValue}
          orbitRef={orbitRef}
          onEnd={(p, r, s) => onTransformEnd(selectedId, p, r, s)}
        />
      )}

      <OrbitControls ref={orbitRef} makeDefault enableDamping dampingFactor={0.07} minDistance={1} maxDistance={5000} />
      <GizmoHelper alignment="bottom-right" margin={[56, 56]}>
        <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="white" />
      </GizmoHelper>
    </>
  );
}

/* ─── Utility ─── */
let _id = 1;
const uid = () => `o${_id++}`;

function fmtVol(mm3: number): string {
  if (mm3 === 0) return '—';
  const cm3 = mm3 / 1000;
  if (cm3 >= 1000) return `${(cm3 / 1000).toFixed(2)} L`;
  return `${cm3.toFixed(3)} cm³`;
}

function vecDisplay([x,y,z]: [n,n,n]) {
  return `${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)}`;
}

function makeObj(preset: ObjPreset): SceneObj {
  return {
    id: uid(), name: preset.name, kind: preset.kind,
    params: { ...preset.params, segments: 32 },
    position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1],
    color: preset.color, opacity: 1, visible: true, locked: false,
  };
}

/* ─── CSG Engine ─── */
function applyCSG(
  op: 'union' | 'subtract' | 'intersect',
  a: SceneObj, b: SceneObj,
): SceneObj | null {
  try {
    const meshA = new THREE.Mesh(buildGeometry(a) ?? new THREE.BoxGeometry(1,1,1));
    const meshB = new THREE.Mesh(buildGeometry(b) ?? new THREE.BoxGeometry(1,1,1));
    meshA.position.set(...a.position); meshA.rotation.set(...a.rotation.map(r => r * Math.PI/180) as [n,n,n]);
    meshA.scale.set(...a.scale); meshA.updateMatrix();
    meshB.position.set(...b.position); meshB.rotation.set(...b.rotation.map(r => r * Math.PI/180) as [n,n,n]);
    meshB.scale.set(...b.scale); meshB.updateMatrix();

    let result: THREE.Mesh;
    if (op === 'union')     result = CSG.union(meshA, meshB);
    else if (op === 'subtract') result = CSG.subtract(meshA, meshB);
    else                    result = CSG.intersect(meshA, meshB);

    result.geometry.computeVertexNormals();
    const pos = result.geometry.attributes.position;
    const nor = result.geometry.attributes.normal;
    const idx = result.geometry.index;
    const geomData = JSON.stringify({
      position: Array.from(pos.array),
      normal: nor ? Array.from(nor.array) : null,
      index: idx ? Array.from(idx.array) : null,
    });
    return {
      id: uid(), name: `${op}(${a.name}, ${b.name})`,
      kind: 'csg', params: {}, position: [0,0,0], rotation: [0,0,0], scale: [1,1,1],
      color: a.color, opacity: 1, visible: true, locked: false, csgGeom: geomData,
    };
  } catch (e) {
    console.error('CSG failed', e);
    return null;
  }
}

/* ─── STL/OBJ Export ─── */
function exportScene(objects: SceneObj[], format: 'stl' | 'stl-bin' | 'obj') {
  const scene = new THREE.Scene();
  objects.forEach(obj => {
    if (!obj.visible) return;
    const g = (() => {
      if (obj.kind === 'csg' && obj.csgGeom) {
        try {
          const d = JSON.parse(obj.csgGeom);
          const geom = new THREE.BufferGeometry();
          geom.setAttribute('position', new THREE.Float32BufferAttribute(d.position, 3));
          if (d.normal) geom.setAttribute('normal', new THREE.Float32BufferAttribute(d.normal, 3));
          if (d.index) geom.setIndex(new THREE.BufferAttribute(new Uint32Array(d.index), 1));
          geom.computeVertexNormals();
          return geom;
        } catch { return null; }
      }
      return buildGeometry(obj);
    })();
    if (!g) return;
    const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: obj.color }));
    mesh.position.set(...obj.position);
    mesh.rotation.set(...obj.rotation.map(r => r * Math.PI/180) as [n,n,n]);
    mesh.scale.set(...obj.scale);
    mesh.name = obj.name;
    scene.add(mesh);
  });

  let data: string | ArrayBuffer;
  let mime: string;
  let ext: string;

  if (format === 'obj') {
    const exp = new OBJExporter();
    data = exp.parse(scene);
    mime = 'text/plain'; ext = 'obj';
  } else {
    const exp = new STLExporter();
    if (format === 'stl-bin') {
      data = exp.parse(scene, { binary: true }) as unknown as ArrayBuffer;
      mime = 'model/stl'; ext = 'stl';
    } else {
      data = exp.parse(scene, { binary: false }) as string;
      mime = 'text/plain'; ext = 'stl';
    }
  }

  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `engigraph_model.${ext}`;
  a.click(); URL.revokeObjectURL(url);
}

/* ─── NumInput helper ─── */
function Num({ label, value, onChange, onCommit, unit = 'mm', step = 1, min = 0.01 }: {
  label: string; value: number; onChange: (v: number) => void; onCommit?: () => void;
  unit?: string; step?: number; min?: number;
}) {
  return (
    <div className="flex items-center gap-1 min-w-0">
      <span className="text-[9px] text-slate-600 w-5 shrink-0 text-center font-mono font-bold">{label}</span>
      <input
        type="number" step={step} min={min} value={+value.toFixed(3)}
        onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= min) onChange(v); }}
        onBlur={onCommit}
        onKeyDown={e => { if (e.key === 'Enter' && onCommit) onCommit(); }}
        className="flex-1 min-w-0 px-1 py-0.5 text-[10px] font-mono text-right bg-black/50 border border-white/10 rounded focus:outline-none focus:border-blue-500/60 text-white"
      />
      <span className="text-[9px] text-slate-600 font-mono">{unit}</span>
    </div>
  );
}

/* ─── Main Component ─── */
const BED_SIZES: Record<string, [number,number]> = {
  'Ender 3 (220×220)': [220, 220],
  'Voron 2.4 (350×350)': [350, 350],
  'Bambu X1C (256×256)': [256, 256],
  'Prusa MK4 (250×210)': [250, 210],
  'Custom': [200, 200],
};

export default function Engigraph3DSketch() {
  const [objects, setObjects]     = useState<SceneObj[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedMeshRef, setSelectedMeshRef] = useState<THREE.Mesh | null>(null);
  const [history, setHistory]     = useState<SceneObj[][]>([[]]);
  const [histIdx, setHistIdx]     = useState(0);
  const [tMode, setTMode]         = useState<TransformMode>('translate');
  const [viewMode, setViewMode]   = useState<ViewMode>('solid');
  const [camMode, setCamMode]     = useState<CamMode>('perspective');
  const [snapValue, setSnapValue] = useState<number | null>(1);
  const [showBed, setShowBed]     = useState(true);
  const [bedName, setBedName]     = useState('Ender 3 (220×220)');
  const [customBed, setCustomBed] = useState<[number,number]>([200,200]);
  const [activeCategory, setCategory] = useState('Solid');
  const [csgA, setCsgA]           = useState<string | null>(null);
  const [csgB, setCsgB]           = useState<string | null>(null);
  const [propOpen, setPropOpen]   = useState(true);
  const [leftOpen, setLeftOpen]   = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const orbitRef = useRef<any>(null);

  const bedSize = bedName === 'Custom' ? customBed : BED_SIZES[bedName];
  const selectedObj = objects.find(o => o.id === selectedId) ?? null;

  /* Save / Load Project */
  function saveProject() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(objects, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `Engigraph3D_Project_${Date.now()}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function importProject(jsonStr: string) {
    try {
      const parsed = JSON.parse(jsonStr) as SceneObj[];
      if (!Array.isArray(parsed)) throw new Error('Invalid project file');
      setObjects(parsed);
      setHistory([parsed]);
      setHistIdx(0);
      setSelectedId(null);
    } catch (e) {
      console.error(e);
      alert('Import failed: invalid file format');
    }
  }

  /* History helpers */
  function pushHistory(objs: SceneObj[]) {
    const newHist = history.slice(0, histIdx + 1);
    newHist.push(objs.map(o => ({ ...o, params: { ...o.params } })));
    setHistory(newHist);
    setHistIdx(newHist.length - 1);
  }
  function undo() {
    if (histIdx === 0) return;
    const i = histIdx - 1;
    setObjects(history[i].map(o => ({ ...o })));
    setHistIdx(i);
    setSelectedId(null);
  }
  function redo() {
    if (histIdx >= history.length - 1) return;
    const i = histIdx + 1;
    setObjects(history[i].map(o => ({ ...o })));
    setHistIdx(i);
  }

  function setObjsAndPush(objs: SceneObj[]) {
    setObjects(objs);
    pushHistory(objs);
  }

  /* Add object from preset */
  function addObject(preset: ObjPreset) {
    const obj = makeObj(preset);
    const newObjs = [...objects, obj];
    setObjsAndPush(newObjs);
    setSelectedId(obj.id);
  }

  /* Patch selected object */
  function patchSelected(patch: Partial<SceneObj>) {
    if (!selectedId) return;
    const newObjs = objects.map(o => o.id === selectedId ? { ...o, ...patch } : o);
    setObjects(newObjs);  // don't push history on every keystroke
  }
  function commitPatch() {
    pushHistory(objects);
  }

  /* Delete */
  function deleteSelected() {
    if (!selectedId) return;
    const newObjs = objects.filter(o => o.id !== selectedId);
    setSelectedId(null); setSelectedMeshRef(null);
    setObjsAndPush(newObjs);
  }

  /* Duplicate */
  function duplicateSelected() {
    if (!selectedObj) return;
    const copy: SceneObj = {
      ...selectedObj,
      id: uid(),
      name: `${selectedObj.name} (copy)`,
      position: [selectedObj.position[0] + 25, selectedObj.position[1], selectedObj.position[2] + 25],
      params: { ...selectedObj.params },
    };
    const newObjs = [...objects, copy];
    setObjsAndPush(newObjs);
    setSelectedId(copy.id);
  }

  /* Keyboard Shortcuts */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelected();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) deleteSelected();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [histIdx, history, selectedId, selectedObj, objects]);

  /* Transform sync from TransformControls */
  function onTransformEnd(id: string, p: [n,n,n], r: [n,n,n], s: [n,n,n]) {
    const newObjs = objects.map(o => o.id === id
      ? { ...o, position: p, rotation: r, scale: s }
      : o
    );
    setObjsAndPush(newObjs);
  }

  /* CSG apply */
  function applyCsg(op: 'union' | 'subtract' | 'intersect') {
    if (!csgA || !csgB) return;
    const a = objects.find(o => o.id === csgA);
    const b = objects.find(o => o.id === csgB);
    if (!a || !b) return;
    const result = applyCSG(op, a, b);
    if (!result) { alert('CSG operation failed — check geometries overlap.'); return; }
    const newObjs = [
      ...objects.map(o => o.id === a.id || o.id === b.id ? { ...o, visible: false } : o),
      result,
    ];
    setCsgA(null); setCsgB(null);
    setSelectedId(result.id);
    setObjsAndPush(newObjs);
  }

  /* Select object handler (from 3D click) */
  function onSelectObj(mesh: THREE.Mesh, id: string) {
    if (!id) { setSelectedId(null); setSelectedMeshRef(null); return; }
    const obj = objects.find(o => o.id === id);
    if (!obj || obj.locked) return;
    setSelectedId(id); setSelectedMeshRef(mesh);
  }

  /* Print stats for selected */
  const printStats = useMemo(() => {
    if (!selectedObj) return null;
    const vol = computeVolume(selectedObj);
    const bb = new THREE.Box3();
    const g = buildGeometry(selectedObj);
    if (g) {
      const mesh = new THREE.Mesh(g);
      mesh.position.set(...selectedObj.position);
      mesh.scale.set(...selectedObj.scale);
      bb.setFromObject(mesh);
    }
    const size = new THREE.Vector3();
    bb.getSize(size);
    return {
      volume: vol,
      bounding: [size.x.toFixed(1), size.y.toFixed(1), size.z.toFixed(1)] as [string, string, string],
      fitsInBed: size.x <= bedSize[0] && size.z <= bedSize[1],
    };
  }, [selectedObj, bedSize]);

  const presetsInCat = PRESETS.filter(p => p.category === activeCategory);

  /* Param editor for selected */
  function ParamEditor() {
    if (!selectedObj || selectedObj.kind === 'csg') return null;
    const p = selectedObj.params;
    const up = (patch: Partial<ObjParams>) => {
      patchSelected({ params: { ...selectedObj.params, ...patch } });
    };
    return (
      <div className="flex flex-col gap-1.5 mt-2">
        {(selectedObj.kind === 'box' || selectedObj.kind === 'wedge') && <>
          <Num label="W" value={p.width ?? 20} onChange={v => up({ width: v })} onCommit={commitPatch} />
          <Num label="H" value={p.height ?? 20} onChange={v => up({ height: v })} onCommit={commitPatch} />
          <Num label="D" value={p.depth ?? 20} onChange={v => up({ depth: v })} onCommit={commitPatch} />
        </>}
        {(selectedObj.kind === 'cylinder' || selectedObj.kind === 'tube') && <>
          <Num label="R↑" value={p.radiusTop ?? 10} onChange={v => up({ radiusTop: v })} onCommit={commitPatch} />
          <Num label="R↓" value={p.radiusBottom ?? 10} onChange={v => up({ radiusBottom: v })} onCommit={commitPatch} />
          <Num label="H"  value={p.height ?? 30} onChange={v => up({ height: v })} onCommit={commitPatch} />
          {selectedObj.kind === 'tube' && (
            <Num label="Ri" value={p.innerRadius ?? 7} onChange={v => up({ innerRadius: v, hollow: true })} onCommit={commitPatch} />
          )}
        </>}
        {selectedObj.kind === 'sphere' && (
          <Num label="R" value={p.radius ?? 15} onChange={v => up({ radius: v })} onCommit={commitPatch} />
        )}
        {selectedObj.kind === 'cone' && <>
          <Num label="R" value={p.radius ?? 10} onChange={v => up({ radius: v })} onCommit={commitPatch} />
          <Num label="H" value={p.height ?? 25} onChange={v => up({ height: v })} onCommit={commitPatch} />
        </>}
        {selectedObj.kind === 'torus' && <>
          <Num label="OR" value={p.outerRadius ?? 20} onChange={v => up({ outerRadius: v })} onCommit={commitPatch} />
          <Num label="TR" value={p.tubeRadius ?? 4} onChange={v => up({ tubeRadius: v })} onCommit={commitPatch} />
        </>}
        <Num label="Seg" value={p.segments ?? 32} onChange={v => up({ segments: Math.max(3, Math.round(v)) })} onCommit={commitPatch} unit="" step={1} />
        <button
          onClick={commitPatch}
          className="mt-1 w-full py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-600/25 hover:bg-blue-600/40 text-blue-300 border border-blue-500/25 transition-colors"
        >
          Apply Dims
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex bg-[#0a0c10] overflow-hidden select-none">
      {/* ─── Left: Object Library ─── */}
      {leftOpen && (
      <div className="w-48 bg-[#0d1117] border-r border-white/5 flex flex-col shrink-0 overflow-hidden">
        <div className="px-3 py-2 border-b border-white/5 bg-[#111620]">
          <div className="text-[10px] font-black uppercase tracking-widest text-blue-400">Insert Object</div>
          <div className="text-[9px] text-slate-600 mt-0.5">Real mm dimensions</div>
        </div>

        {/* Category pills */}
        <div className="flex flex-col gap-px p-1.5 border-b border-white/5 overflow-y-auto">
          {PRESET_CATS.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`text-left px-2 py-1 rounded text-[10px] font-bold transition-colors ${activeCategory === cat ? 'bg-blue-500/20 text-blue-300' : 'text-slate-500 hover:text-slate-200 hover:bg-white/4'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Object tiles */}
        <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-0.5">
          {presetsInCat.map(preset => (
            <button
              key={preset.name}
              onClick={() => addObject(preset)}
              className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded border border-white/4 bg-white/2 hover:bg-white/7 hover:border-blue-500/30 transition-all group"
            >
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: preset.color }} />
              <div className="min-w-0">
                <div className="text-[10px] text-slate-300 group-hover:text-white truncate font-medium">{preset.name}</div>
                <div className="text-[9px] text-slate-600 font-mono">
                  {preset.params.width ? `${preset.params.width}×${preset.params.height}×${preset.params.depth}mm`
                    : preset.params.radius ? `r${preset.params.radius}mm`
                    : preset.params.radiusTop ? `r${preset.params.radiusTop}×h${preset.params.height}mm`
                    : ''}
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="px-3 py-1.5 border-t border-white/5 text-[9px] text-slate-700 font-mono">
          {objects.length} obj · {objects.filter(o=>o.visible).length} visible
        </div>
      </div>
      )}

      {/* ─── Center: Viewport ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-1 px-2 py-1.5 bg-[#0d1117] border-b border-white/5 shrink-0 overflow-visible z-50 flex-wrap relative">
          {/* Transform modes */}
          <div className="flex items-center bg-black/40 rounded border border-white/8 p-0.5">
            {([['translate','Move',Move],['rotate','Rot',RotateCcw],['scale','Scale',Scaling]] as const).map(([m, l, Ic]) => (
              <button key={m} onClick={() => setTMode(m as TransformMode)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${tMode === m ? 'bg-blue-500/30 text-blue-300' : 'text-slate-500 hover:text-slate-200'}`}
              >
                <Ic size={10} />{l}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-white/8" />

          {/* View modes */}
          <div className="flex items-center bg-black/40 rounded border border-white/8 p-0.5">
            {(['solid','wireframe','xray'] as ViewMode[]).map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors capitalize ${viewMode === v ? 'bg-violet-500/25 text-violet-300' : 'text-slate-500 hover:text-slate-200'}`}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-white/8" />

          {/* Camera views */}
          <div className="flex items-center bg-black/40 rounded border border-white/8 p-0.5">
            {(['perspective','top','front','right'] as CamMode[]).map(c => (
              <button key={c} onClick={() => setCamMode(c)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors capitalize ${camMode === c ? 'bg-emerald-500/25 text-emerald-300' : 'text-slate-500 hover:text-slate-200'}`}
              >
                {c === 'perspective' ? 'Persp' : c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-white/8" />

          {/* Snap */}
          <div className="flex items-center gap-1">
            <Grid3X3 size={11} className="text-slate-600" />
            <select
              value={snapValue ?? 'none'}
              onChange={e => setSnapValue(e.target.value === 'none' ? null : parseFloat(e.target.value))}
              className="bg-black/40 border border-white/10 rounded px-1 py-0.5 text-[10px] text-slate-300 font-mono focus:outline-none"
            >
              <option value="none">No Snap</option>
              <option value="0.5">0.5mm</option>
              <option value="1">1mm</option>
              <option value="5">5mm</option>
              <option value="10">10mm</option>
            </select>
          </div>

          <div className="w-px h-4 bg-white/8" />

          {/* Object ops */}
          <button onClick={duplicateSelected} disabled={!selectedId} title="Duplicate (D)"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-25 transition-colors">
            <Copy size={10} /> Copy
          </button>
          <button onClick={deleteSelected} disabled={!selectedId} title="Delete (Del)"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-red-400 hover:text-red-200 hover:bg-red-900/20 disabled:opacity-25 transition-colors">
            <Trash2 size={10} /> Del
          </button>

          <div className="w-px h-4 bg-white/8" />

          {/* Undo / Redo */}
          <button onClick={undo} disabled={histIdx === 0}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-slate-500 hover:text-slate-200 disabled:opacity-25 transition-colors">
            <RotateCcw size={10} /> Undo
          </button>
          <button onClick={redo} disabled={histIdx >= history.length - 1}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-slate-500 hover:text-slate-200 disabled:opacity-25 transition-colors">
            <RotateCw size={10} /> Redo
          </button>

          <div className="flex-1" />

          {/* Print bed */}
          <button onClick={() => setShowBed(s => !s)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border transition-colors ${showBed ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : 'text-slate-600 border-white/8 hover:text-slate-300'}`}>
            <Printer size={10} /> Bed
          </button>

          <div className="w-px h-4 bg-white/8" />

          {/* Save / Open */}
          <button onClick={saveProject} title="Save Project"
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-800/40 hover:bg-slate-700 border border-slate-600 text-slate-300 transition-colors">
            <Download size={10} /> Save
          </button>
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            className="hidden"
            onChange={(e: any) => {
              const file = e.target?.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => importProject(ev.target?.result as string);
              reader.readAsText(file);
              e.target.value = '';
            }}
          />
          <button onClick={() => fileInputRef.current?.click()} title="Open Project"
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-800/40 hover:bg-slate-700 border border-slate-600 text-slate-300 transition-colors">
            <Copy size={10} /> Import
          </button>

          <div className="w-px h-4 bg-white/8" />

          {/* Panel Toggles */}
          <button onClick={() => setLeftOpen(s => !s)} title="Toggle Library Panel"
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border transition-colors ${leftOpen ? 'bg-slate-500/15 text-slate-300 border-slate-500/25' : 'text-slate-600 border-white/8 hover:text-slate-300'}`}>
            <Layers size={10} /> Library
          </button>
          <button onClick={() => setPropOpen(s => !s)} title="Toggle Properties Panel"
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border transition-colors ${propOpen ? 'bg-slate-500/15 text-slate-300 border-slate-500/25' : 'text-slate-600 border-white/8 hover:text-slate-300'}`}>
            <Box size={10} /> Props
          </button>

          {/* Export */}
          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600/25 hover:bg-blue-600/40 text-blue-300 border border-blue-500/25 transition-colors">
              <Download size={10} /> Export {exportOpen ? '▴' : '▾'}
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-1 bg-[#111620] border border-white/10 rounded-lg shadow-2xl overflow-hidden z-[100] flex flex-col w-44">
                <div className="px-3 py-1.5 text-[9px] text-slate-500 font-bold uppercase border-b border-white/5">3D Print Ready</div>
                <button onClick={() => { exportScene(objects, 'stl'); setExportOpen(false); }}
                  className="px-3 py-2 text-left text-[11px] text-white hover:bg-white/8 transition-colors flex items-center gap-2">
                  <span className="text-emerald-400 font-mono text-[9px]">STL</span> ASCII STL
                </button>
                <button onClick={() => { exportScene(objects, 'stl-bin'); setExportOpen(false); }}
                  className="px-3 py-2 text-left text-[11px] text-white hover:bg-white/8 transition-colors flex items-center gap-2">
                  <span className="text-emerald-400 font-mono text-[9px]">STL</span> Binary STL (smaller)
                </button>
                <button onClick={() => { exportScene(objects, 'obj'); setExportOpen(false); }}
                  className="px-3 py-2 text-left text-[11px] text-white hover:bg-white/8 transition-colors flex items-center gap-2">
                  <span className="text-blue-400 font-mono text-[9px]">OBJ</span> Wavefront OBJ
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3D Canvas */}
        <div className="flex-1 relative bg-[#080b0f]">
          <Canvas
            shadows={{ type: THREE.PCFShadowMap }}
            dpr={[1, 2]}
            gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
          >
            <Scene3D
              objects={objects}
              selectedId={selectedId}
              viewMode={viewMode}
              camMode={camMode}
              snapValue={snapValue}
              showBed={showBed}
              bedSize={bedSize}
              transformMode={tMode}
              onSelectObj={onSelectObj}
              onTransformEnd={onTransformEnd}
              orbitRef={orbitRef}
            />
          </Canvas>

          {/* Empty state */}
          {objects.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-6xl mb-3 opacity-10">⬡</div>
                <div className="text-slate-500 font-medium">Click any object in the library to insert it</div>
                <div className="text-slate-700 text-xs mt-1">
                  All dimensions are in real millimetres · Export STL for 3D printing
                </div>
              </div>
            </div>
          )}

          {/* Coord overlay */}
          {selectedObj && (
            <div className="absolute bottom-3 left-3 font-mono text-[10px] text-slate-600 pointer-events-none">
              <span className="text-slate-500">POS</span> {vecDisplay(selectedObj.position)} ·{' '}
              <span className="text-slate-500">ROT</span> {vecDisplay(selectedObj.rotation)}°
            </div>
          )}
        </div>
      </div>

      {/* ─── Right: Properties + Scene + CSG ─── */}
      {propOpen && (
      <div className="w-56 bg-[#0d1117] border-l border-white/5 flex flex-col shrink-0 overflow-y-auto">
        {/* Scene tree */}
        <div className="shrink-0">
          <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 bg-[#0f1318]">
            Scene Objects ({objects.length})
          </div>
          <div className="max-h-40 overflow-y-auto">
            {objects.length === 0 && (
              <div className="px-3 py-3 text-[10px] text-slate-700">Empty — add objects from the library.</div>
            )}
            {objects.map(obj => (
              <div
                key={obj.id}
                onClick={() => { if (!obj.locked) { setSelectedId(obj.id); setSelectedMeshRef(null); } }}
                className={`flex items-center gap-1.5 px-2 py-1 cursor-pointer border-b border-white/3 transition-colors text-[10px] ${obj.id === selectedId ? 'bg-blue-500/15 text-blue-300' : 'text-slate-400 hover:bg-white/4 hover:text-slate-200'}`}
              >
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: obj.color }} />
                <span className="flex-1 truncate font-medium">{obj.name}</span>
                <button onClick={e => { e.stopPropagation(); const n = objects.map(o => o.id === obj.id ? {...o, visible: !o.visible} : o); setObjects(n); pushHistory(n); }}
                  className="opacity-40 hover:opacity-100 shrink-0">
                  {obj.visible ? <Eye size={10} /> : <EyeOff size={10} className="text-slate-600" />}
                </button>
                <button onClick={e => { e.stopPropagation(); const n = objects.map(o => o.id === obj.id ? {...o, locked: !o.locked} : o); setObjects(n); }}
                  className="opacity-40 hover:opacity-100 shrink-0">
                  {obj.locked ? <Lock size={10} className="text-yellow-500" /> : <Unlock size={10} />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Properties */}
        {selectedObj && (
          <div className="border-t border-white/5 shrink-0">
            <button
              onClick={() => setPropOpen(p => !p)}
              className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-white/5 bg-[#0f1318] hover:text-white transition-colors"
            >
              Properties — {selectedObj.name}
              <ChevronDown size={12} className={`transition-transform ${propOpen ? '' : '-rotate-90'}`} />
            </button>
            {propOpen && (
              <div className="p-3 flex flex-col gap-2">
                {/* Name */}
                <div>
                  <label className="block text-[9px] text-slate-600 mb-0.5">Name</label>
                  <input value={selectedObj.name}
                    onChange={e => patchSelected({ name: e.target.value })}
                    onBlur={commitPatch}
                    className="w-full bg-black/40 border border-white/8 rounded px-2 py-0.5 text-[10px] text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                {/* Color */}
                <div className="flex items-center gap-2">
                  <label className="text-[9px] text-slate-600 flex-1">Material Color</label>
                  <input type="color" value={selectedObj.color}
                    onChange={e => patchSelected({ color: e.target.value })}
                    onBlur={commitPatch}
                    className="w-7 h-5 rounded border border-white/10 cursor-pointer bg-transparent" />
                </div>
                {/* Opacity */}
                <div>
                  <label className="block text-[9px] text-slate-600 mb-0.5">Opacity {(selectedObj.opacity * 100).toFixed(0)}%</label>
                  <input type="range" min={0.05} max={1} step={0.05} value={selectedObj.opacity}
                    onChange={e => patchSelected({ opacity: parseFloat(e.target.value) })}
                    onMouseUp={commitPatch}
                    className="w-full h-1 accent-blue-500" />
                </div>

                {/* Position */}
                <div>
                  <label className="block text-[9px] text-slate-600 mb-1">Position</label>
                  <div className="flex flex-col gap-1">
                    {['X','Y','Z'].map((axis, i) => (
                      <Num key={axis} label={axis} step={snapValue ?? 1}
                        min={-99999}
                        value={selectedObj.position[i]}
                        onChange={v => {
                          const p = [...selectedObj.position] as [n,n,n]; p[i] = v;
                          patchSelected({ position: p });
                        }}
                        onCommit={commitPatch}
                      />
                    ))}
                  </div>
                </div>

                {/* Rotation */}
                <div>
                  <label className="block text-[9px] text-slate-600 mb-1">Rotation</label>
                  <div className="flex flex-col gap-1">
                    {['X','Y','Z'].map((axis, i) => (
                      <Num key={axis} label={axis} step={15} min={-360} unit="°"
                        value={selectedObj.rotation[i]}
                        onChange={v => {
                          const r = [...selectedObj.rotation] as [n,n,n]; r[i] = v;
                          patchSelected({ rotation: r });
                        }}
                        onCommit={commitPatch}
                      />
                    ))}
                  </div>
                </div>

                {/* Scale */}
                <div>
                  <label className="block text-[9px] text-slate-600 mb-1">Scale</label>
                  <div className="flex flex-col gap-1">
                    {['X','Y','Z'].map((axis, i) => (
                      <Num key={axis} label={axis} step={0.1} min={0.01} unit="×"
                        value={selectedObj.scale[i]}
                        onChange={v => {
                          const s = [...selectedObj.scale] as [n,n,n]; s[i] = v;
                          patchSelected({ scale: s });
                        }}
                        onCommit={commitPatch}
                      />
                    ))}
                  </div>
                </div>
                <button onClick={commitPatch} className="w-full py-0.5 text-[10px] rounded bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/20 transition-colors font-bold">
                  Commit Transform
                </button>

                {/* Dimensions */}
                {selectedObj.kind !== 'csg' && (
                  <div>
                    <label className="block text-[9px] text-slate-600 mb-1 mt-1 border-t border-white/5 pt-2">Dimensions (mm)</label>
                    <ParamEditor />
                  </div>
                )}

                {/* Print stats */}
                {printStats && (
                  <div className="mt-2 p-2 bg-black/30 rounded border border-white/5 border-t-emerald-500/20">
                    <div className="text-[9px] font-black uppercase text-emerald-500 mb-1.5 flex items-center gap-1">
                      <Printer size={9} /> Print Info
                    </div>
                    <div className="flex flex-col gap-0.5 font-mono text-[9px]">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Bounding Box</span>
                        <span className="text-slate-300">{printStats.bounding.join('×')}mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Volume</span>
                        <span className="text-slate-300">{fmtVol(printStats.volume)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Fits Bed</span>
                        <span className={printStats.fitsInBed ? 'text-emerald-400' : 'text-red-400'}>
                          {printStats.fitsInBed ? '✓ Yes' : '✗ No'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* CSG Boolean Operations */}
        <div className="border-t border-white/5 shrink-0">
          <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-[#0f1318] border-b border-white/5">
            CSG Booleans
          </div>
          <div className="p-3 flex flex-col gap-2">
            <div className="text-[9px] text-slate-600 leading-snug">
              Select two objects as A and B, then apply a boolean operation.
            </div>
            {['A','B'].map((lbl, idx) => {
              const val = idx === 0 ? csgA : csgB;
              const setVal = idx === 0 ? setCsgA : setCsgB;
              const name = objects.find(o => o.id === val)?.name ?? 'None';
              return (
                <div key={lbl} className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black text-slate-400 w-4">{lbl}:</span>
                  <div className="flex-1 flex gap-1">
                    <div className="flex-1 px-2 py-0.5 bg-black/30 border border-white/8 rounded text-[9px] text-slate-400 font-mono truncate">{name}</div>
                    <button
                      onClick={() => selectedId ? setVal(selectedId) : undefined}
                      disabled={!selectedId}
                      className="px-1.5 py-0.5 bg-blue-500/20 hover:bg-blue-500/35 border border-blue-500/20 rounded text-[9px] text-blue-400 disabled:opacity-30 transition-colors font-bold"
                    >
                      Set
                    </button>
                  </div>
                </div>
              );
            })}
            <div className="flex gap-1.5 mt-1">
              {(['union','subtract','intersect'] as const).map(op => (
                <button key={op} onClick={() => applyCsg(op)}
                  disabled={!csgA || !csgB}
                  className="flex-1 py-1 rounded text-[9px] font-bold uppercase bg-white/4 hover:bg-white/10 border border-white/8 text-slate-400 hover:text-white disabled:opacity-25 transition-colors"
                >
                  {op === 'union' ? '∪' : op === 'subtract' ? '−' : '∩'} {op.slice(0, 4)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Print Bed Config */}
        <div className="border-t border-white/5 shrink-0 p-3">
          <div className="text-[9px] font-black uppercase text-slate-600 mb-2">Print Bed</div>
          <select value={bedName} onChange={e => setBedName(e.target.value)}
            className="w-full bg-black/40 border border-white/8 rounded px-2 py-1 text-[10px] text-slate-300 focus:outline-none mb-2">
            {Object.keys(BED_SIZES).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          {bedName === 'Custom' && (
            <div className="flex gap-1">
              <Num label="W" value={customBed[0]} onChange={v => setCustomBed([v, customBed[1]])} step={10} />
              <Num label="D" value={customBed[1]} onChange={v => setCustomBed([customBed[0], v])} step={10} />
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}

// Temporary alias to avoid TS complaint about unused Scaling import
const Scaling = ScaleIcon;
