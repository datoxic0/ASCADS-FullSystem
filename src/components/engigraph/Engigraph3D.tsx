import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
import { Play, Download, Save, RefreshCw, BookOpen, ChevronRight, Wand2, Loader2, Upload } from 'lucide-react';
import { askAI3D, getActiveEngine } from '@/lib/ai';

const TUTORIALS = [
  {
    name: "CSG Basics (Bracket)",
    code: `// Basic Bracket\nconst base = box(100, 100, 10);\nconst h1 = translate(cylinder(5, 30), 30, 30, 0);\nconst h2 = translate(cylinder(5, 30), -30, 30, 0);\nconst h3 = translate(cylinder(5, 30), 30, -30, 0);\nconst h4 = translate(cylinder(5, 30), -30, -30, 0);\nconst centerHole = cylinder(20, 30);\nconst holes = union(union(h1, h2), union(h3, h4));\nconst allHoles = union(holes, centerHole);\nreturn subtract(base, allHoles);`
  },
  {
    name: "NEMA 17 Faceplate",
    code: `// NEMA 17 Motor Mount Faceplate\nconst plate = box(42.3, 42.3, 5);\nconst centerBore = cylinder(11, 20);\n\n// 31mm hole spacing for M3 screws\nconst m3_1 = translate(cylinder(1.5, 20), 15.5, 15.5, 0);\nconst m3_2 = translate(cylinder(1.5, 20), -15.5, 15.5, 0);\nconst m3_3 = translate(cylinder(1.5, 20), 15.5, -15.5, 0);\nconst m3_4 = translate(cylinder(1.5, 20), -15.5, -15.5, 0);\n\nconst m3_holes = union(union(m3_1, m3_2), union(m3_3, m3_4));\nconst all_holes = union(centerBore, m3_holes);\n\nreturn subtract(plate, all_holes);`
  },
  {
    name: "Parametric Wheel Hub",
    code: `// Parametric Robot Wheel Hub\nconst outerCyl = cylinder(30, 15);\nconst innerCyl = translate(cylinder(20, 25), 0, 0, 5);\nconst hubBase = union(outerCyl, innerCyl);\n\n// 5mm Motor Shaft Hole\nconst shaft = cylinder(2.5, 40);\n\n// Weight reduction cutouts\nconst cut1 = translate(box(10, 15, 30), 0, 20, 0);\nconst cut2 = translate(box(10, 15, 30), 0, -20, 0);\nconst cut3 = translate(box(15, 10, 30), 20, 0, 0);\nconst cut4 = translate(box(15, 10, 30), -20, 0, 0);\n\nconst cutouts = union(union(cut1, cut2), union(cut3, cut4));\nconst subtractions = union(shaft, cutouts);\n\nreturn subtract(hubBase, subtractions);`
  }
];

const DEFAULT_SCRIPT = `// ASCAD - Engigraph 3D (Auto Code CAD)
// Available functions: box(w,d,h), cylinder(r,h), sphere(r)
// union(a,b), subtract(a,b), intersect(a,b)
// translate(obj, x,y,z), rotate(obj, rx,ry,rz)

const base = box(100, 100, 10);
const h1 = translate(cylinder(5, 30), 30, 30, 0);
const h2 = translate(cylinder(5, 30), -30, 30, 0);
const h3 = translate(cylinder(5, 30), 30, -30, 0);
const h4 = translate(cylinder(5, 30), -30, -30, 0);

const centerHole = cylinder(20, 30);

const holes = union(union(h1, h2), union(h3, h4));
const allHoles = union(holes, centerHole);

// The final object must be returned
return subtract(base, allHoles);
`;

export default function Engigraph3D() {
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [externalMeshes, setExternalMeshes] = useState<THREE.Mesh[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [materialType, setMaterialType] = useState('Standard');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Strict WebGL Memory Cleanup
  useEffect(() => {
    return () => {
      if (geometry) geometry.dispose();
    };
  }, [geometry]);

  useEffect(() => {
    return () => {
      externalMeshes.forEach(m => {
        if (m.geometry) m.geometry.dispose();
        if (m.material) {
          if (Array.isArray(m.material)) m.material.forEach(mat => mat.dispose());
          else m.material.dispose();
        }
      });
    };
  }, [externalMeshes]);

  const handleSaveScript = () => {
    const blob = new Blob([script], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ASCAD_part.js';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadScript = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'stl') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        if (buffer) {
          import('three/examples/jsm/loaders/STLLoader.js').then(({ STLLoader }) => {
            const loader = new STLLoader();
            const geo = loader.parse(buffer);
            geo.computeVertexNormals();
            const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#8b5cf6', roughness: 0.3, metalness: 0.6 }));
            mesh.name = file.name;
            setExternalMeshes(prev => [...prev, mesh]);
          }).catch(err => setError("Failed to load STLLoader: " + err.message));
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (extension === 'obj') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          import('three/examples/jsm/loaders/OBJLoader.js').then(({ OBJLoader }) => {
            const loader = new OBJLoader();
            const group = loader.parse(text);
            const meshes: THREE.Mesh[] = [];
            group.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.geometry.computeVertexNormals();
                child.material = new THREE.MeshStandardMaterial({ color: '#06b6d4', roughness: 0.4, metalness: 0.5 });
                child.name = child.name || file.name;
                meshes.push(child);
              }
            });
            setExternalMeshes(prev => [...prev, ...meshes]);
          }).catch(err => setError("Failed to load OBJLoader: " + err.message));
        }
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === 'string') {
          setScript(content);
        }
      };
      reader.readAsText(file);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    try {
      setIsGenerating(true);
      setError(null);
      const newScript = await askAI3D(aiPrompt, script);
      setScript(newScript);
      setTimeout(() => {
        // We trigger a manual compile next tick so the script state is updated.
        // Actually, since setScript is async, we can't reliably read it in the next line.
        // However, we can just compile the newScript directly by temporarily putting it in the fn.
        // But since we rely on the component state for compileScript, let's just let it run 
        // after state updates via a useEffect or a setTimeout.
      }, 50);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-compile when script updates from AI
  useEffect(() => {
    compileScript();
  }, [script]);

  const compileScript = () => {
    try {
      setError(null);
      // API Definitions
      const box = (w: number, d: number, h: number) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, d, h));
        mesh.updateMatrix();
        return CSG.fromMesh(mesh);
      };
      
      const cylinder = (r: number, h: number) => {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 32));
        mesh.rotation.x = Math.PI / 2; // Orient along Z by default
        mesh.updateMatrix();
        return CSG.fromMesh(mesh);
      };

      const sphere = (r: number) => {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 32));
        mesh.updateMatrix();
        return CSG.fromMesh(mesh);
      };

      const translate = (csg: CSG, x: number, y: number, z: number) => {
        const mesh = CSG.toMesh(csg, new THREE.Matrix4());
        mesh.position.set(x, y, z);
        mesh.updateMatrix();
        return CSG.fromMesh(mesh);
      };

      const rotate = (csg: CSG, rx: number, ry: number, rz: number) => {
        const mesh = CSG.toMesh(csg, new THREE.Matrix4());
        mesh.rotation.set(rx, ry, rz);
        mesh.updateMatrix();
        return CSG.fromMesh(mesh);
      };

      const scale = (csg: CSG, sx: number, sy: number, sz: number) => {
        const mesh = CSG.toMesh(csg, new THREE.Matrix4());
        mesh.scale.set(sx, sy, sz);
        mesh.updateMatrix();
        return CSG.fromMesh(mesh);
      };

      const mirror = (csg: CSG, mx: number, my: number, mz: number) => {
        const mesh = CSG.toMesh(csg, new THREE.Matrix4());
        mesh.scale.set(mx ? -1 : 1, my ? -1 : 1, mz ? -1 : 1);
        mesh.updateMatrix();
        return CSG.fromMesh(mesh);
      };

      const union = (a: CSG, b: CSG) => a.union(b);
      const subtract = (a: CSG, b: CSG) => a.subtract(b);
      const intersect = (a: CSG, b: CSG) => a.intersect(b);

      const fn = new Function(
        'box', 'cylinder', 'sphere', 'translate', 'rotate', 'scale', 'mirror', 'union', 'subtract', 'intersect',
        script
      );

      const resultCsg = fn(box, cylinder, sphere, translate, rotate, scale, mirror, union, subtract, intersect);
      
      if (!resultCsg || !resultCsg.clone) {
        throw new Error("Script must return a valid CSG object.");
      }

      const finalMesh = CSG.toMesh(resultCsg, new THREE.Matrix4());
      finalMesh.geometry.computeVertexNormals();
      setGeometry(finalMesh.geometry);
      
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    compileScript();
  }, []); // Initial compile

  const handleExportSTL = () => {
    if (!geometry) return;
    
    let stl = "solid engigraph_export\n";
    const pos = geometry.attributes.position;
    const idx = geometry.index;
    const norm = geometry.attributes.normal;

    if (!pos) {
      alert("Geometry has no position attribute.");
      return;
    }

    const getVert = (i: number) => `${pos.getX(i)} ${pos.getY(i)} ${pos.getZ(i)}`;

    if (idx) {
      for (let i = 0; i < idx.count; i += 3) {
        const a = idx.getX(i);
        const b = idx.getX(i + 1);
        const c = idx.getX(i + 2);
        
        let nx = 0, ny = 0, nz = 0;
        if (norm) {
           nx = (norm.getX(a) + norm.getX(b) + norm.getX(c)) / 3;
           ny = (norm.getY(a) + norm.getY(b) + norm.getY(c)) / 3;
           nz = (norm.getZ(a) + norm.getZ(b) + norm.getZ(c)) / 3;
        }

        stl += `facet normal ${nx} ${ny} ${nz}\n  outer loop\n    vertex ${getVert(a)}\n    vertex ${getVert(b)}\n    vertex ${getVert(c)}\n  endloop\nendfacet\n`;
      }
    } else {
      for (let i = 0; i < pos.count; i += 3) {
        let nx = 0, ny = 0, nz = 0;
        if (norm) {
           nx = (norm.getX(i) + norm.getX(i+1) + norm.getX(i+2)) / 3;
           ny = (norm.getY(i) + norm.getY(i+1) + norm.getY(i+2)) / 3;
           nz = (norm.getZ(i) + norm.getZ(i+1) + norm.getZ(i+2)) / 3;
        }
        stl += `facet normal ${nx} ${ny} ${nz}\n  outer loop\n    vertex ${getVert(i)}\n    vertex ${getVert(i+1)}\n    vertex ${getVert(i+2)}\n  endloop\nendfacet\n`;
      }
    }

    stl += "endsolid engigraph_export\n";

    const blob = new Blob([stl], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'engigraph_model.stl';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full flex bg-[#0a0b0c] text-slate-300 font-sans">
      {/* Component Library Sidebar */}
      <div className="w-[240px] border-r border-[#334155] flex flex-col bg-[#0f1113] overflow-y-auto">
        <div className="p-3 border-b border-[#334155] flex items-center gap-2">
          <BookOpen size={14} className="text-emerald-400" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-200">Library & Tutorials</span>
        </div>
        <div className="p-3 flex flex-col gap-2">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Code Samples</span>
          {TUTORIALS.map((tut, idx) => (
            <button
              key={idx}
              onClick={() => {
                setScript(tut.code);
                // We use a slight delay so the state updates before compiling
                setTimeout(compileScript, 50);
              }}
              className="flex items-center justify-between text-left px-3 py-2 bg-white/5 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 rounded transition-all group"
            >
              <span className="text-xs font-medium text-slate-300 group-hover:text-emerald-400">{tut.name}</span>
              <ChevronRight size={12} className="text-slate-600 group-hover:text-emerald-400" />
            </button>
          ))}
        </div>
        
        <div className="p-3 border-t border-[#334155] mt-auto">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 block">CSG API Reference</span>
          <ul className="text-[10px] font-mono text-slate-400 space-y-1.5 opacity-80">
            <li>box(w, d, h)</li>
            <li>cylinder(r, h)</li>
            <li>sphere(r)</li>
            <li>translate(obj, x, y, z)</li>
            <li>rotate(obj, rx, ry, rz)</li>
            <li>scale(obj, sx, sy, sz)</li>
            <li>mirror(obj, x, y, z)</li>
            <li>union(a, b)</li>
            <li>subtract(a, b)</li>
            <li>intersect(a, b)</li>
          </ul>
        </div>
      </div>

      {/* Code Editor Panel */}
      <div className="w-[450px] border-r border-[#334155] flex flex-col bg-[#141618]">
        <div className="p-3 border-b border-[#334155] flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-400">
            <span className="text-xs font-bold uppercase tracking-widest">Auto Code CAD</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="file" ref={fileInputRef} className="hidden" accept=".js,.txt,.json,.stl,.obj" onChange={handleUploadScript} />
            <button onClick={() => fileInputRef.current?.click()} className="px-2 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-slate-300 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors" title="Upload Script or 3D Model">
              <Upload size={12} />
            </button>
            <button onClick={handleSaveScript} className="px-2 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-slate-300 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors" title="Save Script">
              <Save size={12} />
            </button>
            <button 
              onClick={compileScript}
              className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors"
            >
              <Play size={12} fill="currentColor" /> Compile
            </button>
          </div>
        </div>

        <div className="flex-1 relative p-3 flex flex-col">
          <label className="text-[10px] font-mono text-slate-500 mb-2 uppercase tracking-widest">Script.js</label>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            spellCheck={false}
            className="flex-1 w-full bg-[#0d0f11] border border-[#334155] rounded-lg p-3 text-sm font-mono text-emerald-400 focus:outline-none focus:border-indigo-500 resize-none"
          />
          {error && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs font-mono">
              <strong>Compile Error:</strong><br/>{error}
            </div>
          )}
        </div>

        {/* AI Generator Panel */}
        <div className="p-3 bg-[#0d0f11] border-t border-[#334155]">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1"><Wand2 size={12} /> Auto Code Generation</span>
              <span className="text-[9px] text-slate-500">{getActiveEngine() === 'power' ? 'Power (Gemini)' : 'Economy (OpenRouter)'}</span>
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="e.g. Generate a hex nut for an M8 bolt..."
                className="flex-1 bg-[#141618] border border-[#334155] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                onKeyDown={e => e.key === 'Enter' && handleGenerateAI()}
                disabled={isGenerating}
              />
              <button
                onClick={handleGenerateAI}
                disabled={isGenerating || !aiPrompt.trim()}
                className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                {isGenerating ? "Thinking..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3D Viewport Panel */}
      <div className="flex-1 relative">
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <button onClick={handleExportSTL} className="px-3 py-1.5 bg-black/50 backdrop-blur border border-white/10 hover:border-white/30 rounded text-xs font-medium flex items-center gap-2 transition-all">
            <Download size={14} /> Export STL
          </button>
          {externalMeshes.length > 0 && (
            <button onClick={() => setExternalMeshes([])} className="px-3 py-1.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 rounded text-xs font-medium flex items-center gap-2 transition-all">
              Clear Imported
            </button>
          )}
          <select 
            value={materialType} 
            onChange={e => setMaterialType(e.target.value)}
            className="px-3 py-1.5 bg-black/50 backdrop-blur border border-white/10 hover:border-white/30 rounded text-xs font-medium text-white focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="Standard">Standard Plastic</option>
            <option value="Metallic">Machined Metal</option>
            <option value="Glass">Acrylic Glass</option>
            <option value="Neon">Emissive Neon</option>
          </select>
        </div>

        <Canvas
          camera={{ position: [150, 150, 150], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{
            antialias: false,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: false,
          }}
          shadows={{ type: THREE.PCFShadowMap }}
          onCreated={({ gl }) => {
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFShadowMap;
          }}
        >
          <color attach="background" args={['#0a0b0c']} />
          <ambientLight intensity={0.7} />
          <directionalLight position={[100, 100, 50]} intensity={1} castShadow shadow-mapSize={[512, 512]} />
          <directionalLight position={[-100, -100, -50]} intensity={0.3} />
          
          <Grid infiniteGrid fadeDistance={400} sectionColor="#334155" cellColor="#1e293b" />
          
          <OrbitControls makeDefault />

          {externalMeshes.map((mesh, i) => (
            <mesh key={`ext-${i}`} geometry={mesh.geometry} material={mesh.material} position={mesh.position} rotation={mesh.rotation} scale={mesh.scale} castShadow receiveShadow />
          ))}

          {geometry && (
            <mesh key={geometry.uuid} geometry={geometry} castShadow receiveShadow>
              {materialType === 'Standard' && (
                <meshStandardMaterial color="#3b82f6" roughness={0.4} metalness={0.1} envMapIntensity={1} />
              )}
              {materialType === 'Metallic' && (
                <meshStandardMaterial color="#94a3b8" roughness={0.1} metalness={0.9} envMapIntensity={2} />
              )}
              {materialType === 'Glass' && (
                <meshPhysicalMaterial color="#38bdf8" transmission={0.95} opacity={1} transparent roughness={0.1} ior={1.5} thickness={5} envMapIntensity={1} />
              )}
              {materialType === 'Neon' && (
                <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={2} toneMapped={false} />
              )}
            </mesh>
          )}
        </Canvas>
      </div>
    </div>
  );
}
