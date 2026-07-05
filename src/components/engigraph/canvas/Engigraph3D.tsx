import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Sphere } from '@react-three/drei';
import { useEngigraphStore, DrawingObject } from '../store/useEngigraphStore';
import * as THREE from 'three';

const Board3D = () => {
    return (
        <mesh position={[0, -2, 0]} receiveShadow>
            <boxGeometry args={[1000, 4, 800]} />
            <meshStandardMaterial color="#0b2c15" roughness={0.7} metalness={0.2} />
        </mesh>
    );
};

const Component3D = ({ element }: { element: DrawingObject }) => {
    // Map 2D coordinates to 3D space
    // 2D (x, y) -> 3D (x, z)
    // Shift center by roughly half board size (just a heuristic for this POC)
    const posX = (element.x || 0) - 400;
    const posZ = (element.y || 0) - 300;
    
    const isSMD = element.partType === 'resistor' || element.partType === 'led';
    const height = isSMD ? 4 : 20;
    const posY = height / 2; // Sit on top of board

    let color = '#222222';
    if (element.partType === 'arduino_uno') color = '#005f73';
    else if (element.partType === 'esp32') color = '#1a1a1a';
    else if (element.partType === 'led') color = element.isPowered ? '#00ff00' : '#440000';
    else if (element.partType === 'battery') color = '#e63946';

    const width = element.width || 40;
    const depth = element.height || 40;

    return (
        <mesh position={[posX, posY, posZ]} castShadow receiveShadow>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color={color} roughness={0.5} metalness={0.5} />
            
            {/* Draw a small identifier or chip on top */}
            {!isSMD && (
                <mesh position={[0, height/2 + 1, 0]}>
                    <boxGeometry args={[width * 0.6, 2, depth * 0.6]} />
                    <meshStandardMaterial color="#111" roughness={0.8} />
                </mesh>
            )}

            {/* Phase 17: Volumetric EMI / Starvation Radiator */}
            {(element.isPowerStarved || element.isCorrupted || (element.crosstalkInterference && element.crosstalkInterference > 0)) && (
                <Sphere args={[Math.max(width, depth) * 1.5, 32, 32]} position={[0, height/2, 0]}>
                    <meshStandardMaterial 
                        color={element.isPowerStarved ? "#ef4444" : "#f59e0b"} 
                        transparent 
                        opacity={0.3} 
                        emissive={element.isPowerStarved ? "#ef4444" : "#f59e0b"} 
                        emissiveIntensity={0.5} 
                        wireframe={element.isCorrupted}
                    />
                </Sphere>
            )}

            {/* Wear/Smoke Effect (Phase 20) */}
            {(element.wearLevel && element.wearLevel > 0.5 && !element.isBurnedOut) && (
                <Sphere args={[width * 0.8, 16, 16]} position={[0, height * 1.5, 0]}>
                    <meshStandardMaterial color="#333" transparent opacity={0.4} roughness={1} />
                </Sphere>
            )}
        </mesh>
    );
};

// Phase 21: Vias as physical through-hole cylinders
const Via3D = ({ element }: { element: DrawingObject }) => {
    const posX = (element.x || 0) - 400;
    const posZ = (element.y || 0) - 300;
    
    return (
        <mesh position={[posX, -2, posZ]} castShadow>
            <cylinderGeometry args={[2, 2, 5, 16]} />
            <meshStandardMaterial color="#eab308" roughness={0.3} metalness={0.8} />
        </mesh>
    );
};

const Wire3D = ({ element }: { element: DrawingObject }) => {
    const points = element.points;
    if (!points || points.length < 4) return null;

    const linePoints = [];
    const isBottom = element.boardLayer === 'bottom';
    const isEntangled = element.isEntangled;
    
    // Top layer at y=0.5, bottom layer at y=-4.5 (board is y=0 to y=-4)
    const yPos = isBottom ? -4.5 : 0.5;
    
    for (let i = 0; i < points.length; i += 2) {
        const x = points[i] - 400;
        const z = points[i+1] - 300;
        linePoints.push(new THREE.Vector3(x, yPos, z));
    }

    const curve = new THREE.CatmullRomCurve3(linePoints, false, 'catmullrom', 0.1);
    const geometry = new THREE.TubeGeometry(curve, 20, 1.5, 8, false);

    // Entangled traces glow purple
    const color = isEntangled ? '#a855f7' : (isBottom ? '#2563eb' : '#dc2626');
    const emissive = isEntangled ? '#a855f7' : '#000000';
    const emissiveInt = isEntangled ? 1 : 0;

    return (
        <mesh geometry={geometry}>
            <meshStandardMaterial color={color} roughness={0.4} metalness={0.6} emissive={emissive} emissiveIntensity={emissiveInt} />
        </mesh>
    );
};

export const Engigraph3D: React.FC = () => {
    const { elements, is3DViewOpen, toggle3DView, enclosureMode } = useEngigraphStore();

    if (!is3DViewOpen) return null;

    return (
        <div className="absolute inset-0 z-50 bg-[#0e0e11] flex flex-col">
            <div className="flex items-center justify-between p-4 bg-[#1f1f23] border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">3D Visualization Engine</span>
                    <span className="px-2 py-0.5 rounded bg-cyan-900/50 text-cyan-400 text-xs">Live Extrusion</span>
                </div>
                <button 
                    onClick={toggle3DView}
                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-sm transition-colors"
                >
                    Return to 2D Canvas
                </button>
            </div>
            
            <div className="flex-1 relative">
                <Canvas shadows camera={{ position: [0, 600, 800], fov: 45 }}>
                    <color attach="background" args={['#0e0e11']} />
                    
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[100, 200, 50]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
                    <spotLight position={[-100, 200, -100]} intensity={1} penumbra={1} />
                    
                    <group>
                        <Board3D />
                        
                        {elements.map((el) => {
                            if (el.type === 'wire') return <Wire3D key={el.id} element={el} />;
                            if (el.partType === 'via') return <Via3D key={el.id} element={el} />;
                            if (el.type === 'component') return <Component3D key={el.id} element={el} />;
                            return null;
                        })}

                        {enclosureMode && (
                            <mesh position={[0, 40, 0]} castShadow>
                                {/* A transparent blueish plastic enclosure over the entire board */}
                                <boxGeometry args={[1020, 80, 820]} />
                                <meshPhysicalMaterial color="#3b82f6" transmission={0.7} opacity={1} transparent roughness={0.1} thickness={5} envMapIntensity={2} clearcoat={1} clearcoatRoughness={0.1} />
                            </mesh>
                        )}
                    </group>
                    <ContactShadows position={[0, -2.1, 0]} opacity={0.4} scale={1200} blur={2} far={100} />
                    <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2 - 0.05} />
                    <Environment preset="city" />
                </Canvas>
            </div>
        </div>
    );
};
