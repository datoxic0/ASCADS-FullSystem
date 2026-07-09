import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import { usePCBStore, PCBFootprintInstance } from '../store/usePCBStore';
import * as THREE from 'three';

const Component3D = ({ footprint }: { footprint: PCBFootprintInstance }) => {
    // Generate simple 3D models based on footprint name/type
    const isSMD = footprint.layer === 'top';
    const zOffset = isSMD ? 0.8 : 0.8;
    const yRotation = (footprint.rotation * Math.PI) / 180;
    
    // Scale down coordinates (PCB is in mm, let's use 1 unit = 1mm)
    const posX = footprint.x;
    const posZ = footprint.y; // Z in 3D is Y in 2D

    if (footprint.footprintId.includes('DIP')) {
        return (
            <group position={[posX, zOffset, posZ]} rotation={[0, -yRotation, 0]}>
                <mesh position={[0, 2, 0]}>
                    <boxGeometry args={[10, 4, 8]} />
                    <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
                </mesh>
                {/* Pins */}
                <mesh position={[-4, 0, 3]}>
                    <boxGeometry args={[0.5, 2, 0.5]} />
                    <meshStandardMaterial color="#d4d4d8" metalness={0.8} roughness={0.2} />
                </mesh>
            </group>
        );
    }
    
    if (footprint.footprintId.includes('E-Cap')) {
        return (
            <group position={[posX, zOffset, posZ]} rotation={[0, -yRotation, 0]}>
                <mesh position={[0, 4, 0]}>
                    <cylinderGeometry args={[4, 4, 8, 32]} />
                    <meshStandardMaterial color="#1d4ed8" roughness={0.6} />
                </mesh>
                <mesh position={[0, 8.1, 0]}>
                    <cylinderGeometry args={[4, 4, 0.2, 32]} />
                    <meshStandardMaterial color="#d4d4d8" metalness={0.8} />
                </mesh>
            </group>
        );
    }
    
    if (footprint.footprintId.includes('TerminalBlock')) {
        return (
            <group position={[posX, zOffset, posZ]} rotation={[0, -yRotation, 0]}>
                <mesh position={[0, 3, 0]}>
                    <boxGeometry args={[10, 6, 8]} />
                    <meshStandardMaterial color="#0284c7" roughness={0.7} />
                </mesh>
            </group>
        );
    }
    
    if (footprint.footprintId.includes('SOIC') || footprint.footprintId.includes('TQFP')) {
        return (
            <group position={[posX, zOffset, posZ]} rotation={[0, -yRotation, 0]}>
                <mesh position={[0, 0.5, 0]}>
                    <boxGeometry args={[6, 1, 6]} />
                    <meshStandardMaterial color="#111111" roughness={0.9} />
                </mesh>
            </group>
        );
    }

    // Default SMD / generic component
    return (
        <group position={[posX, zOffset, posZ]} rotation={[0, -yRotation, 0]}>
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[2, 1, 3]} />
                <meshStandardMaterial color="#27272a" roughness={0.8} />
            </mesh>
        </group>
    );
};

export const PCB3DViewer: React.FC = () => {
    const { boardOutline, footprints, tracks } = usePCBStore();

    // Convert board outline to a 3D shape
    const boardShape = useMemo(() => {
        const shape = new THREE.Shape();
        if (boardOutline.length >= 6) {
            shape.moveTo(boardOutline[0], boardOutline[1]);
            for (let i = 2; i < boardOutline.length; i += 2) {
                shape.lineTo(boardOutline[i], boardOutline[i + 1]);
            }
        } else {
            shape.moveTo(0, 0);
            shape.lineTo(100, 0);
            shape.lineTo(100, 80);
            shape.lineTo(0, 80);
            shape.lineTo(0, 0);
        }
        return shape;
    }, [boardOutline]);

    const extrudeSettings = {
        depth: 1.6, // Standard 1.6mm PCB thickness
        bevelEnabled: false,
    };

    return (
        <div className="w-full h-full bg-[#0a0a0c]">
            <Canvas camera={{ position: [50, 100, 150], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 50, 20]} intensity={1.5} castShadow />
                
                {/* Grid Floor */}
                <Grid 
                    position={[0, -5, 0]} 
                    args={[200, 200]} 
                    cellSize={10} 
                    cellThickness={1} 
                    cellColor="#1e293b" 
                    sectionSize={50} 
                    sectionThickness={1.5} 
                    sectionColor="#334155" 
                    fadeDistance={300} 
                />

                <group position={[-50, 0, -40]}>
                    {/* PCB Substrate */}
                    <mesh rotation={[Math.PI / 2, 0, 0]} receiveShadow castShadow>
                        <extrudeGeometry args={[boardShape, extrudeSettings]} />
                        <meshStandardMaterial color="#0c4a25" roughness={0.4} metalness={0.1} />
                    </mesh>

                    {/* Components */}
                    {footprints.map(fp => (
                        <Component3D key={fp.id} footprint={fp} />
                    ))}
                    
                    {/* Tracks (Visual approximation using lines/boxes) */}
                    {tracks.map(t => {
                        const pts = [];
                        for(let i=0; i<t.points.length; i+=2) {
                            pts.push(new THREE.Vector3(t.points[i], 0.82, t.points[i+1]));
                        }
                        const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0);
                        return (
                            <mesh key={t.id} receiveShadow>
                                <tubeGeometry args={[curve, 64, t.width / 2, 8, false]} />
                                <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.8} />
                            </mesh>
                        );
                    })}
                </group>

                <OrbitControls makeDefault minDistance={10} maxDistance={500} />
                <Environment preset="city" />
            </Canvas>
        </div>
    );
};
