import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line, Group, Rect, Circle } from 'react-konva';
import { usePCBStore, PCBTrack, PCBFootprintInstance } from '../store/usePCBStore';
import { PCBFootprint } from './PCBFootprint';
import { PCBTrackView, PCBViaView } from './PCBTrack';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export const PCBCanvas: React.FC = () => {
    const { 
        activeTool, activeLayer, boardOutline, footprints, tracks, vias,
        selectedIds, setSelectedIds, visibleLayers, gridSnap,
        addTrack, updateFootprint, addFootprint, addVia
    } = usePCBStore();

    const stageRef = useRef<any>(null);
    const [view, setView] = useState({ x: 50, y: 50, scale: 1 });
    const MM_TO_PX = 10; // 1mm = 10px

    const [isDrawingTrack, setIsDrawingTrack] = useState(false);
    const [currentTrackPoints, setCurrentTrackPoints] = useState<number[]>([]);

    // Handle Wheel Zoom
    const handleWheel = (e: any) => {
        e.evt.preventDefault();
        const scaleBy = 1.1;
        const stage = e.target.getStage();
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
        
        setView({
            scale: newScale,
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        });
    };

    // Grid snapping helper
    const snap = (val: number) => Math.round(val / gridSnap) * gridSnap;

    const getPointerPosMM = () => {
        const stage = stageRef.current;
        if (!stage) return { x: 0, y: 0 };
        const pos = stage.getPointerPosition();
        if (!pos) return { x: 0, y: 0 };
        const xPx = (pos.x - view.x) / view.scale;
        const yPx = (pos.y - view.y) / view.scale;
        return {
            x: snap(xPx / MM_TO_PX),
            y: snap(yPx / MM_TO_PX)
        };
    };

    const handlePointerDown = (e: any) => {
        const pos = getPointerPosMM();
        
        if (activeTool === 'track') {
            if (activeLayer !== 'top_copper' && activeLayer !== 'bottom_copper') {
                toast.error('Tracks can only be drawn on copper layers.');
                return;
            }
            if (!isDrawingTrack) {
                setIsDrawingTrack(true);
                setCurrentTrackPoints([pos.x, pos.y]);
            } else {
                // Add segment to current track
                setCurrentTrackPoints([...currentTrackPoints, pos.x, pos.y]);
            }
        }
        
        if (activeTool === 'via') {
            addVia({
                id: uuidv4(),
                x: pos.x,
                y: pos.y,
                drill: 0.4, // standard via drill
                diameter: 0.8 // standard via pad
            });
            toast.success('Via placed.');
        }

        // If clicking empty space on select tool
        if (activeTool === 'select' && e.target === e.target.getStage()) {
            setSelectedIds([]);
        }
    };

    const handlePointerMove = () => {
        if (isDrawingTrack && activeTool === 'track') {
            // Re-render handled by currentTrackPoints state updates combined with pos
            // But we actually need to draw the line to the pointer, which we can just do by forcing a render
            // Since getPointerPosMM is dynamic, we'll use local state for the temporary cursor line
        }
    };

    const handlePointerUp = (e: any) => {
        // Double click logic for finishing tracks
        if (activeTool === 'track' && e.evt.detail === 2 && currentTrackPoints.length >= 2) {
            addTrack({
                id: uuidv4(),
                points: currentTrackPoints,
                width: 0.25, // Default 0.25mm trace
                layer: activeLayer as 'top_copper' | 'bottom_copper'
            });
            setIsDrawingTrack(false);
            setCurrentTrackPoints([]);
            toast.success('Track routed.');
        }
    };

    // Keyboard handling for Esc (cancel track)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isDrawingTrack) {
                setIsDrawingTrack(false);
                setCurrentTrackPoints([]);
            }
            if (e.key === 'Delete' || e.key === 'Backspace') {
                usePCBStore.getState().removeSelected();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isDrawingTrack]);

    const handleElementClick = (e: any, id: string) => {
        if (activeTool === 'select') {
            e.cancelBubble = true;
            if (e.evt.shiftKey) {
                setSelectedIds([...selectedIds, id]);
            } else {
                setSelectedIds([id]);
            }
        }
    };

    const handleFootprintDragEnd = (id: string, x: number, y: number) => {
        updateFootprint(id, { x: snap(x / MM_TO_PX) * MM_TO_PX, y: snap(y / MM_TO_PX) * MM_TO_PX });
    };

    // Draw dynamic cursor line for routing
    const [cursorPos, setCursorPos] = useState({x: 0, y: 0});
    const updateCursor = () => {
        if (isDrawingTrack) {
            setCursorPos(getPointerPosMM());
        } else if (activeTool !== 'select') {
            setCursorPos(getPointerPosMM());
        }
    };

    // Generate Grid Dots based on view bounds
    const gridDots = React.useMemo(() => {
        const dots = [];
        // Approximate visible area
        const startX = snap((-view.x / view.scale) / MM_TO_PX) - 20;
        const endX = startX + (window.innerWidth / view.scale / MM_TO_PX) + 40;
        
        const startY = snap((-view.y / view.scale) / MM_TO_PX) - 20;
        const endY = startY + (window.innerHeight / view.scale / MM_TO_PX) + 40;

        for(let x = startX; x <= endX; x += gridSnap) {
            for(let y = startY; y <= endY; y += gridSnap) {
                // Precision floating point issues workaround
                const rx = Math.round(x * 100) / 100;
                const ry = Math.round(y * 100) / 100;
                const isMajor = rx % 10 === 0 && ry % 10 === 0;
                dots.push(
                    <Circle 
                        key={`${rx}-${ry}`} 
                        x={rx * MM_TO_PX} 
                        y={ry * MM_TO_PX} 
                        radius={isMajor ? 0.8 : 0.4} 
                        fill={isMajor ? "#334155" : "#1e293b"} 
                    />
                );
            }
        }
        return dots;
    }, [view.x, view.y, view.scale, gridSnap]);

    return (
        <div className="w-full h-full bg-[#0c1021]" onMouseMove={updateCursor} style={{ cursor: activeTool === 'select' ? 'default' : 'none' }}>
            <Stage
                width={window.innerWidth}
                height={window.innerHeight}
                onWheel={handleWheel}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                scaleX={view.scale}
                scaleY={view.scale}
                x={view.x}
                y={view.y}
                ref={stageRef}
                draggable={activeTool === 'select' && !isDrawingTrack}
            >
                {/* Background Grid Layer */}
                <Layer>
                    {gridDots}
                </Layer>

                {/* Board Outline Layer (Bottom-most) */}
                <Layer>
                    {visibleLayers.board_outline && boardOutline.length >= 4 && (
                        <Line
                            points={boardOutline.map(p => p * MM_TO_PX)}
                            stroke="#fbbf24" // Yellow for Edge Cuts
                            strokeWidth={2 / view.scale}
                            closed
                        />
                    )}
                </Layer>

                {/* Bottom Copper & Silk */}
                <Layer>
                    {tracks.filter(t => t.layer === 'bottom_copper').map(t => (
                        <PCBTrackView key={t.id} track={t} isSelected={selectedIds.includes(t.id)} visibleLayers={visibleLayers} onClick={(e) => handleElementClick(e, t.id)} />
                    ))}
                    {footprints.filter(f => f.layer === 'bottom').map(f => (
                        <PCBFootprint key={f.id} instance={f} isSelected={selectedIds.includes(f.id)} visibleLayers={visibleLayers} onClick={(e) => handleElementClick(e, f.id)} onDragEnd={handleFootprintDragEnd} />
                    ))}
                </Layer>

                {/* Vias (Through all layers) */}
                <Layer>
                    {vias.map(v => (
                        <PCBViaView key={v.id} via={v} isSelected={selectedIds.includes(v.id)} visibleLayers={visibleLayers} onClick={(e) => handleElementClick(e, v.id)} />
                    ))}
                </Layer>

                {/* Top Copper & Silk */}
                <Layer>
                    {tracks.filter(t => t.layer === 'top_copper').map(t => (
                        <PCBTrackView key={t.id} track={t} isSelected={selectedIds.includes(t.id)} visibleLayers={visibleLayers} onClick={(e) => handleElementClick(e, t.id)} />
                    ))}
                    {footprints.filter(f => f.layer === 'top').map(f => (
                        <PCBFootprint key={f.id} instance={f} isSelected={selectedIds.includes(f.id)} visibleLayers={visibleLayers} onClick={(e) => handleElementClick(e, f.id)} onDragEnd={handleFootprintDragEnd} />
                    ))}
                </Layer>

                {/* Active Tool Interaction Layer */}
                <Layer>
                    {isDrawingTrack && currentTrackPoints.length >= 2 && (
                        <Line
                            points={[...currentTrackPoints.map(p => p * MM_TO_PX), cursorPos.x * MM_TO_PX, cursorPos.y * MM_TO_PX]}
                            stroke={activeLayer === 'top_copper' ? '#ef4444' : '#2563eb'}
                            strokeWidth={2.5}
                            opacity={0.5}
                            lineCap="round"
                            lineJoin="round"
                        />
                    )}

                    {/* Crosshairs for precise placing/routing */}
                    {activeTool !== 'select' && cursorPos && (
                        <Group>
                            <Line
                                points={[cursorPos.x * MM_TO_PX, -10000, cursorPos.x * MM_TO_PX, 10000]}
                                stroke="#cbd5e1"
                                strokeWidth={1 / view.scale}
                                opacity={0.3}
                            />
                            <Line
                                points={[-10000, cursorPos.y * MM_TO_PX, 10000, cursorPos.y * MM_TO_PX]}
                                stroke="#cbd5e1"
                                strokeWidth={1 / view.scale}
                                opacity={0.3}
                            />
                        </Group>
                    )}
                </Layer>
            </Stage>
        </div>
    );
};
