import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle, Transformer, Text, Group } from 'react-konva';
import { useEngigraphStore, DrawingObject } from '../store/useEngigraphStore';
import { ComponentShape } from './EngigraphPartsFactory';
import { ProtractorOverlay } from './instruments/ProtractorOverlay';
import { RulerOverlay } from './instruments/RulerOverlay';

export const EngigraphCanvas: React.FC = () => {
    const { 
        activeTool, view, setView, elements, setElements, pushHistory, 
        undo, redo, removeSelected, activePartType, selectedIds, setSelectedIds
    } = useEngigraphStore();
    
    const [currentObj, setCurrentObj] = useState<DrawingObject | null>(null);
    const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
    const selectionStart = useRef<{ x: number, y: number } | null>(null);
    const stageRef = useRef<any>(null);
    const trRef = useRef<any>(null);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent shortcuts if typing in an input/textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            // Deletion
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedIds.length > 0) {
                    selectedIds.forEach(id => removeSelected(id));
                    setSelectedIds([]);
                }
            }
            // Copy / Paste
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
                const store = useEngigraphStore.getState();
                const toCopy = store.elements.filter(el => selectedIds.includes(el.id));
                if (toCopy.length > 0) {
                    localStorage.setItem('engigraph_clipboard', JSON.stringify(toCopy));
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
                const clipboard = localStorage.getItem('engigraph_clipboard');
                if (clipboard) {
                    const parsed: DrawingObject[] = JSON.parse(clipboard);
                    const newIds: string[] = [];
                    const store = useEngigraphStore.getState();
                    const newElements = parsed.map(el => {
                        const newId = `obj-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                        newIds.push(newId);
                        return { ...el, id: newId, x: (el.x || 0) + 20, y: (el.y || 0) + 20 };
                    });
                    store.pushHistory([...store.elements, ...newElements]);
                    setSelectedIds(newIds);
                }
            }
            // Rotate component
            if (e.key.toLowerCase() === 'r' && selectedIds.length > 0) {
                const store = useEngigraphStore.getState();
                selectedIds.forEach(id => {
                    const el = store.elements.find(e => e.id === id);
                    if (el && el.type === 'component') {
                        store.updateElement(id, { currentAngle: ((el.currentAngle || 0) + 90) % 360 });
                    }
                });
            }

            // Undo / Redo
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                if (e.shiftKey) redo();
                else undo();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                redo();
                return;
            }

            // Escape
            if (e.key === 'Escape') {
                useEngigraphStore.getState().setActiveTool('select');
                setSelectedIds([]);
                setCurrentObj(null);
            }

            // Tools (Single Key)
            const key = e.key.toLowerCase();
            const store = useEngigraphStore.getState();
            if (key === 'v') store.setActiveTool('select');
            if (key === 'h') store.setActiveTool('pan');
            if (key === 'l') store.setActiveTool('line');
            if (key === 'c') store.setActiveTool('circle');
            if (key === 'r' && selectedIds.length === 0) store.setActiveTool('rect');
            if (key === 'a') store.setActiveTool('spline');
            if (key === 't') store.setActiveTool('text');
            if (key === 'd') store.setActiveTool('dimension');
            if (key === 'f') store.setView({ x: 0, y: 0, zoom: 1 }); // Fit View roughly
            if (key === 'g') store.toggleSnap('snapToGrid'); // Assuming toggle grid
            if (key === 'o') store.toggleSnap('orthoMode');
            if (key === 's') store.toggleSnap('snapToObject');
            if (key === 'i') store.toggleSnap('snapToAngle'); // Isometric
            if (key === 'q') store.toggleTheme();
            if (key === 'p') store.toggleRightSidebar();
            
            // Tinkercad Style Color Shortcuts (1-0)
            if (selectedIds.length > 0 && /^[0-9]$/.test(e.key)) {
                const colorMap: Record<string, string> = {
                    '1': '#00f2ff', // Default
                    '2': '#ff0000', // Red
                    '3': '#00ff00', // Green
                    '4': '#0000ff', // Blue
                    '5': '#ffff00', // Yellow
                    '6': '#00ffff', // Cyan
                    '7': '#ffa500', // Orange
                    '8': '#800080', // Purple
                    '9': '#71797E', // Steel
                    '0': '#000000'  // Black
                };
                selectedIds.forEach(id => store.updateElement(id, { stroke: colorMap[e.key] }));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIds, removeSelected, undo, redo]);

    useEffect(() => {
        if (selectedIds.length > 0) {
            const nodes = selectedIds.map(id => stageRef.current.findOne(`#${id}`)).filter(Boolean);
            if (nodes.length > 0) {
                trRef.current.nodes(nodes);
                trRef.current.getLayer().batchDraw();
            } else if (trRef.current) {
                trRef.current.nodes([]);
                trRef.current.getLayer().batchDraw();
            }
        } else if (trRef.current) {
            trRef.current.nodes([]);
            trRef.current.getLayer().batchDraw();
        }
    }, [selectedIds, elements]);

    const handleMouseDown = (e: any) => {
        const stage = e.target.getStage();
        const pointer = stage.getPointerPosition();
        
        // Adjust for pan and zoom
        let x = (pointer.x - view.x) / view.zoom;
        let y = (pointer.y - view.y) / view.zoom;

        const storeState = useEngigraphStore.getState();
        if (storeState.grid?.snapToGrid) {
            x = Math.round(x / 10) * 10;
            y = Math.round(y / 10) * 10;
        }

        if (activeTool === 'pan') return;

        // Selection Logic
        if (activeTool === 'select') {
            const clickedOnEmpty = e.target === stage || e.target.parent?.className === 'GridPattern';
            if (clickedOnEmpty) {
                selectionStart.current = { x: (pointer.x - view.x) / view.zoom, y: (pointer.y - view.y) / view.zoom };
                setSelectionBox({ x: selectionStart.current.x, y: selectionStart.current.y, width: 0, height: 0 });
                setSelectedIds([]);
            } else {
                let id = e.target.id() || e.target.parent?.id();
                // Transformer handles
                if (e.target.getParent().className === 'Transformer') {
                    return;
                }
                if (id) {
                    if (e.evt.shiftKey) {
                        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
                    } else {
                        setSelectedIds([id]);
                    }
                }
            }
            return;
        }

        const newId = `obj-${Date.now()}`;
        
        // Handle Wire specifically
        if (activeTool === 'wire') {
            setCurrentObj({ id: newId, type: 'wire', points: [x, y, x, y, x, y], stroke: '#3b82f6', strokeWidth: 3 });
        } else if (activeTool === 'place-component' && activePartType) {
            // Drop component immediately
            const newComp: DrawingObject = {
                id: newId,
                type: 'component',
                partType: activePartType,
                x, y,
                state: 'open' // Default state
            };
            pushHistory([...elements, newComp]);
            // Auto-select the newly dropped component
            setTimeout(() => setSelectedId(newId), 50);
            return;
        } else if (activeTool === 'line') {
            setCurrentObj({ id: newId, type: 'line', points: [x, y, x, y], stroke: '#00f2ff', strokeWidth: 2 });
        } else if (activeTool === 'spline') {
            setCurrentObj({ id: newId, type: 'spline', points: [x, y], stroke: '#00f2ff', strokeWidth: 2 });
        } else if (activeTool === 'rect') {
            setCurrentObj({ id: newId, type: 'rect', x, y, width: 0, height: 0, stroke: '#00f2ff', strokeWidth: 2 });
        } else if (activeTool === 'circle') {
            setCurrentObj({ id: newId, type: 'circle', x, y, radius: 0, stroke: '#00f2ff', strokeWidth: 2 });
        } else if (activeTool === 'text') {
            const newComp: DrawingObject = { id: newId, type: 'text', x, y, text: 'Text', stroke: '#00f2ff', strokeWidth: 1 };
            pushHistory([...elements, newComp]);
            setTimeout(() => setSelectedIds([newId]), 50);
            return;
        } else if (activeTool === 'dimension') {
            setCurrentObj({ id: newId, type: 'dimension', points: [x, y, x, y], stroke: '#ff00ff', strokeWidth: 1 });
        }
    };

    const handleMouseMove = (e: any) => {
        const stage = e.target.getStage();
        const pointer = stage.getPointerPosition();
        let x = (pointer.x - view.x) / view.zoom;
        let y = (pointer.y - view.y) / view.zoom;

        const storeState = useEngigraphStore.getState();
        if (storeState.grid?.snapToGrid) {
            x = Math.round(x / 10) * 10;
            y = Math.round(y / 10) * 10;
        }

        if (activeTool === 'select' && selectionStart.current && selectionBox) {
            setSelectionBox({
                x: Math.min(selectionStart.current.x, x),
                y: Math.min(selectionStart.current.y, y),
                width: Math.abs(x - selectionStart.current.x),
                height: Math.abs(y - selectionStart.current.y),
            });
            return;
        }

        if (!currentObj) return;

        if (currentObj.type === 'line' && currentObj.points) {
            setCurrentObj({
                ...currentObj,
                points: [currentObj.points[0], currentObj.points[1], x, y]
            });
        } else if (currentObj.type === 'dimension' && currentObj.points) {
            setCurrentObj({
                ...currentObj,
                points: [currentObj.points[0], currentObj.points[1], x, y]
            });
        } else if (currentObj.type === 'spline' && currentObj.points) {
            // Freehand smooth line appending points
            setCurrentObj({
                ...currentObj,
                points: [...currentObj.points, x, y]
            });
        } else if (currentObj.type === 'wire' && currentObj.points) {
            // Manhattan Routing (Orthogonal)
            const p1x = currentObj.points[0];
            const p1y = currentObj.points[1];
            const dx = Math.abs(x - p1x);
            const dy = Math.abs(y - p1y);
            
            if (dx > dy) {
                // Horizontal first, then vertical
                setCurrentObj({
                    ...currentObj,
                    points: [p1x, p1y, x, p1y, x, y]
                });
            } else {
                // Vertical first, then horizontal
                setCurrentObj({
                    ...currentObj,
                    points: [p1x, p1y, p1x, y, x, y]
                });
            }
        } else if (currentObj.type === 'rect' && currentObj.x !== undefined && currentObj.y !== undefined) {
            setCurrentObj({
                ...currentObj,
                width: x - currentObj.x,
                height: y - currentObj.y
            });
        } else if (currentObj.type === 'circle' && currentObj.x !== undefined && currentObj.y !== undefined) {
            const dx = x - currentObj.x;
            const dy = y - currentObj.y;
            setCurrentObj({
                ...currentObj,
                radius: Math.sqrt(dx * dx + dy * dy)
            });
        }
    };

    const handleMouseUp = (e: any) => {
        if (currentObj) {
            pushHistory([...elements, currentObj]);
            setCurrentObj(null);
        }
        if (activeTool === 'select' && selectionBox) {
            const stage = e.target.getStage();
            const boxNode = stage.findOne('.selection-box');
            if (boxNode) {
                const box = boxNode.getClientRect();
                const shapes = stage.find('.element-group, Line, Rect, Circle');
                const newSelections = shapes.filter((shape: any) => {
                    if (shape.className === 'Transformer' || shape.className === 'GridPattern' || shape.id() === 'selection-box') return false;
                    if (!shape.id()) return false;
                    return Konva.Util.haveIntersection(box, shape.getClientRect());
                }).map((shape: any) => shape.id());
                
                const uniqueSelections = Array.from(new Set(newSelections)).filter(Boolean) as string[];
                setSelectedIds(uniqueSelections);
            }
            setSelectionBox(null);
            selectionStart.current = null;
        }
    };

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

        const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
        
        setView({
            zoom: newScale,
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        });
    };

    return (
        <div className="w-full h-full bg-[#0a0b0c] cursor-crosshair">
            <Stage 
                width={window.innerWidth} 
                height={window.innerHeight}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
                scaleX={view.zoom}
                scaleY={view.zoom}
                x={view.x}
                y={view.y}
                draggable={activeTool === 'pan'}
                onDragEnd={(e) => {
                    if(activeTool === 'pan') {
                        setView({ x: e.target.x(), y: e.target.y() });
                    }
                }}
                ref={stageRef}
            >
                {/* Grid Layer */}
                <Layer>
                    <GridPattern />
                </Layer>

                <Layer>
                    {elements.map((obj) => (
                        <Shape key={obj.id} obj={obj} />
                    ))}
                    {currentObj && <Shape obj={currentObj} />}
                    {activeTool === 'protractor' && <ProtractorOverlay x={view.x * -1 / view.zoom + window.innerWidth / (2 * view.zoom)} y={view.y * -1 / view.zoom + window.innerHeight / (2 * view.zoom)} />}
                    {activeTool === 'ruler' && <RulerOverlay x={view.x * -1 / view.zoom + window.innerWidth / (2 * view.zoom) - 150} y={view.y * -1 / view.zoom + window.innerHeight / (2 * view.zoom)} />}
                    {selectionBox && (
                        <Rect
                            id="selection-box"
                            name="selection-box"
                            className="selection-box"
                            x={selectionBox.x}
                            y={selectionBox.y}
                            width={selectionBox.width}
                            height={selectionBox.height}
                            fill="rgba(59, 130, 246, 0.2)"
                            stroke="#3b82f6"
                            strokeWidth={1}
                            listening={false}
                        />
                    )}
                    {selectedIds.length > 0 && (
                        <Transformer
                            ref={trRef}
                            boundBoxFunc={(oldBox, newBox) => {
                                if (newBox.width < 5 || newBox.height < 5) {
                                    return oldBox;
                                }
                                return newBox;
                            }}
                            dragBoundFunc={(pos) => {
                                const storeState = useEngigraphStore.getState();
                                if (storeState.grid?.snapToGrid) {
                                    return {
                                        x: Math.round(pos.x / 10) * 10,
                                        y: Math.round(pos.y / 10) * 10,
                                    };
                                }
                                return pos;
                            }}
                        />
                    )}
                </Layer>
            </Stage>
        </div>
    );
};

const Shape = ({ obj }: { obj: DrawingObject }) => {
    // Snap drag func for shapes
    const dragBoundFunc = (pos: any) => {
        const storeState = useEngigraphStore.getState();
        if (storeState.grid?.snapToGrid) {
            return {
                x: Math.round(pos.x / 10) * 10,
                y: Math.round(pos.y / 10) * 10,
            };
        }
        return pos;
    };

    // Basic shapes
    if (obj.type === 'line' || obj.type === 'wire' || obj.type === 'spline') {
        return <Line id={obj.id} name="element-group" points={obj.points || []} stroke={obj.stroke} strokeWidth={obj.strokeWidth} dash={obj.dash} tension={obj.type === 'spline' ? 0.5 : 0} draggable dragBoundFunc={dragBoundFunc} />;
    }
    if (obj.type === 'rect') {
        return <Rect id={obj.id} name="element-group" x={obj.x} y={obj.y} width={obj.width} height={obj.height} stroke={obj.stroke} strokeWidth={obj.strokeWidth} draggable dragBoundFunc={dragBoundFunc} />;
    }
    if (obj.type === 'circle') {
        return <Circle id={obj.id} name="element-group" x={obj.x} y={obj.y} radius={obj.radius} stroke={obj.stroke} strokeWidth={obj.strokeWidth} draggable dragBoundFunc={dragBoundFunc} />;
    }
    if (obj.type === 'text') {
        return <Text id={obj.id} name="element-group" x={obj.x} y={obj.y} text={obj.text || 'Text'} fill={obj.stroke} fontSize={16} draggable dragBoundFunc={dragBoundFunc} />;
    }
    if (obj.type === 'dimension' && obj.points) {
        const p1x = obj.points[0];
        const p1y = obj.points[1];
        const p2x = obj.points[2];
        const p2y = obj.points[3];
        const distance = Math.sqrt(Math.pow(p2x - p1x, 2) + Math.pow(p2y - p1y, 2)).toFixed(2);
        return (
            <Group id={obj.id} name="element-group" draggable dragBoundFunc={dragBoundFunc}>
                <Line points={obj.points} stroke={obj.stroke} strokeWidth={obj.strokeWidth} />
                <Circle x={p1x} y={p1y} radius={3} fill={obj.stroke} />
                <Circle x={p2x} y={p2y} radius={3} fill={obj.stroke} />
                <Text x={(p1x + p2x) / 2} y={(p1y + p2y) / 2 - 15} text={`${distance}`} fill={obj.stroke} fontSize={12} />
            </Group>
        );
    }
    // Logic/Mechatronic Components
    if (obj.type === 'component') {
        // Assume ComponentShape handles its own dragBoundFunc or doesn't need it if we wrap it, but it's a complex group
        return <ComponentShape obj={obj} />;
    }
    return null;
};

const GridPattern = () => {
    const lines = [];
    const step = 10;
    const size = 5000;
    for (let i = -size; i < size; i += step) {
        const isMajor = i % 50 === 0;
        lines.push(<Line key={`h${i}`} points={[-size, i, size, i]} stroke={isMajor ? "#334155" : "#1e293b"} strokeWidth={isMajor ? 1 : 0.5} listening={false} />);
        lines.push(<Line key={`v${i}`} points={[i, -size, i, size]} stroke={isMajor ? "#334155" : "#1e293b"} strokeWidth={isMajor ? 1 : 0.5} listening={false} />);
    }
    return <Group name="GridPattern" listening={false}>{lines}</Group>;
};
