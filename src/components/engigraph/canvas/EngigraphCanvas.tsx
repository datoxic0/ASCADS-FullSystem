import React, { useRef, useState, useEffect } from 'react';
import Konva from 'konva';
import { Stage, Layer, Line, Rect, Circle, Ellipse, RegularPolygon, Arc, Transformer, Text, Group } from 'react-konva';
import { useEngigraphStore, DrawingObject } from '../store/useEngigraphStore';
import { ComponentShape } from './EngigraphPartsFactory';
import { EcosystemAdapter } from '../solvers/EcosystemAdapter';
import { ProtractorOverlay } from './instruments/ProtractorOverlay';
import { RulerOverlay } from './instruments/RulerOverlay';
import { CFDOverlay } from './overlays/CFDOverlay';
import { AcousticOverlay } from './overlays/AcousticOverlay';

export const EngigraphCanvas: React.FC = () => {
    const { 
        activeTool, view, setView, elements, setElements, pushHistory, 
        undo, redo, removeSelected, activePartType, selectedIds, setSelectedIds,
        pdnMode, cfdMode, acousticMode, sheetLayout
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
                    removeSelected();
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

    const handlePointerDown = (e: any) => {
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

        // Selection & Sculpt Selection Logic
        if (activeTool === 'select' || activeTool === 'sculpt') {
            const clickedOnEmpty = e.target === stage || e.target.parent?.className === 'GridPattern';
            if (clickedOnEmpty) {
                selectionStart.current = { x: (pointer.x - view.x) / view.zoom, y: (pointer.y - view.y) / view.zoom };
                setSelectionBox({ x: selectionStart.current.x, y: selectionStart.current.y, width: 0, height: 0 });
                setSelectedIds([]);
            } else {
                let id = e.target.id() || e.target.parent?.id();
                // Transformer handles
                if (e.target.getParent()?.className === 'Transformer') {
                    return;
                }
                // Sculpt nodes
                if (e.target.name() === 'sculpt-node') {
                    return;
                }
                if (id) {
                    if (e.evt.shiftKey) {
                        setSelectedIds(selectedIds.includes(id) ? selectedIds.filter((i: string) => i !== id) : [...selectedIds, id]);
                    } else {
                        setSelectedIds([id]);
                    }
                }
            }
            if (activeTool === 'sculpt') return; // Don't fall through to selection box for sculpt
        }

        // Subdivide Logic (Divide)
        if (activeTool === 'subdivide') {
            let id = e.target.id() || e.target.parent?.id();
            if (id) {
                const el = storeState.elements.find(el => el.id === id);
                if (el && el.points && (el.type === 'wire' || el.type === 'line' || el.type === 'spline' || el.type === 'polygon')) {
                    // Find the segment closest to (x, y)
                    let minDistance = Infinity;
                    let insertIndex = 2; // after first point
                    
                    for (let i = 0; i < el.points.length - 2; i += 2) {
                        const px1 = el.points[i];
                        const py1 = el.points[i+1];
                        const px2 = el.points[i+2];
                        const py2 = el.points[i+3];
                        
                        const l2 = (px2-px1)*(px2-px1) + (py2-py1)*(py2-py1);
                        let t = ((x - px1) * (px2 - px1) + (y - py1) * (py2 - py1)) / (l2 === 0 ? 1 : l2);
                        t = Math.max(0, Math.min(1, t));
                        const projX = px1 + t * (px2 - px1);
                        const projY = py1 + t * (py2 - py1);
                        const dist = Math.sqrt((x - projX)*(x - projX) + (y - projY)*(y - projY));
                        
                        if (dist < minDistance) {
                            minDistance = dist;
                            insertIndex = i + 2;
                        }
                    }
                    
                    if (minDistance < 20) {
                        // Split into two objects:
                        const p1 = el.points.slice(0, insertIndex);
                        p1.push(x, y);
                        const p2 = [x, y];
                        p2.push(...el.points.slice(insertIndex));
                        
                        const newEl1 = { ...el, points: p1 };
                        const newEl2 = { ...el, id: `obj-${Date.now()}-2`, points: p2 };
                        
                        pushHistory([...storeState.elements.filter(e => e.id !== el.id), newEl1, newEl2]);
                    }
                }
            }
            return;
        }
        
        // Probe Logic
        if (activeTool === 'probe') {
            let id = e.target.id() || e.target.parent?.id();
            if (id) {
                const el = storeState.elements.find(el => el.id === id);
                if (el && el.type === 'wire') {
                    useEngigraphStore.getState().setProbedWire(id);
                } else {
                    useEngigraphStore.getState().setProbedWire(null);
                }
            } else {
                useEngigraphStore.getState().setProbedWire(null);
            }
            return;
        }

        const newId = `obj-${Date.now()}`;
        
        // Handle Wire and Entangle specifically
        if (activeTool === 'wire' || activeTool === 'entangle') {
            let snappedX = x;
            let snappedY = y;
            const SNAP_RADIUS = 15;
            for (const el of storeState.elements) {
                const pins = EcosystemAdapter.getPins(el);
                for (const p of pins) {
                    const dx = x - p.pos.x;
                    const dy = y - p.pos.y;
                    if (Math.sqrt(dx*dx + dy*dy) < SNAP_RADIUS) {
                        snappedX = p.pos.x;
                        snappedY = p.pos.y;
                        break;
                    }
                }
            }
            
            if (activeTool === 'entangle') {
                setCurrentObj({ id: newId, type: 'wire', points: [snappedX, snappedY, snappedX, snappedY, snappedX, snappedY], stroke: '#a855f7', strokeWidth: 3, dash: [4, 4], isEntangled: true, boardLayer: storeState.activeLayer as 'top' | 'bottom' | 'silkscreen' });
            } else {
                setCurrentObj({ id: newId, type: 'wire', points: [snappedX, snappedY, snappedX, snappedY, snappedX, snappedY], stroke: storeState.activeLayer === 'top' ? '#ef4444' : '#3b82f6', strokeWidth: 3, boardLayer: storeState.activeLayer as 'top' | 'bottom' | 'silkscreen' });
            }
        } else if (activeTool === 'component' && activePartType) {
            // Drop component immediately
            const newComp: DrawingObject = {
                id: newId,
                type: 'component',
                partType: activePartType,
                x, y,
                state: 'open', // Default state
                boardLayer: storeState.activeLayer as 'top' | 'bottom' | 'silkscreen'
            };
            pushHistory([...elements, newComp]);
            // Auto-select the newly dropped component
            setTimeout(() => setSelectedIds([newId]), 50);
            return;
        } else if (activeTool === 'line') {
            setCurrentObj({ id: newId, type: 'line', points: [x, y, x, y], stroke: '#00f2ff', strokeWidth: 2 });
        } else if (activeTool === 'spline') {
            setCurrentObj({ id: newId, type: 'spline', points: [x, y], stroke: '#00f2ff', strokeWidth: 2 });
        } else if (activeTool === 'rect') {
            setCurrentObj({ id: newId, type: 'rect', x, y, width: 0, height: 0, stroke: '#00f2ff', strokeWidth: 2 });
        } else if (activeTool === 'circle') {
            setCurrentObj({ id: newId, type: 'circle', x, y, radius: 0, stroke: '#00f2ff', strokeWidth: 2 });
        } else if (activeTool === 'ellipse') {
            setCurrentObj({ id: newId, type: 'ellipse', x, y, radiusX: 0, radiusY: 0, stroke: '#00f2ff', strokeWidth: 2 });
        } else if (activeTool === 'roundrect') {
            setCurrentObj({ id: newId, type: 'roundrect', x, y, width: 0, height: 0, cornerRadius: 10, stroke: '#00f2ff', strokeWidth: 2 });
        } else if (activeTool === 'polygon') {
            setCurrentObj({ id: newId, type: 'polygon', x, y, radius: 0, sides: 6, stroke: '#00f2ff', strokeWidth: 2 });
        } else if (activeTool === 'arc') {
            setCurrentObj({ id: newId, type: 'arc', x, y, innerRadius: 0, outerRadius: 0, angle: 90, stroke: '#00f2ff', strokeWidth: 2 });
        } else if (activeTool === 'text') {
            const newComp: DrawingObject = { id: newId, type: 'text', x, y, text: 'Text', stroke: '#00f2ff', strokeWidth: 1 };
            pushHistory([...elements, newComp]);
            setTimeout(() => setSelectedIds([newId]), 50);
            return;
        } else if (activeTool === 'dimension') {
            setCurrentObj({ id: newId, type: 'dimension', points: [x, y, x, y], stroke: '#ff00ff', strokeWidth: 1 });
        }
    };

    const handlePointerMove = (e: any) => {
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

        // Apply snapping if wire or entangle tool
        let isSnapped = false;
        if (activeTool === 'wire' || activeTool === 'entangle') {
            const SNAP_RADIUS = 15;
            for (const el of storeState.elements) {
                const pins = EcosystemAdapter.getPins(el);
                for (const p of pins) {
                    const dx = x - p.pos.x;
                    const dy = y - p.pos.y;
                    if (Math.sqrt(dx*dx + dy*dy) < SNAP_RADIUS) {
                        x = p.pos.x;
                        y = p.pos.y;
                        isSnapped = true;
                        break;
                    }
                }
                if (isSnapped) break;
            }
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
        } else if ((currentObj.type === 'wire' || currentObj.type === 'entangle') && currentObj.points) {
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
            
            // If snapped, maybe we just draw straight to it if it's close enough, but Manhattan is fine
            if (isSnapped) {
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
        } else if (currentObj.type === 'ellipse' && currentObj.x !== undefined && currentObj.y !== undefined) {
            setCurrentObj({
                ...currentObj,
                radiusX: Math.abs(x - currentObj.x),
                radiusY: Math.abs(y - currentObj.y)
            });
        } else if (currentObj.type === 'roundrect' && currentObj.x !== undefined && currentObj.y !== undefined) {
            setCurrentObj({
                ...currentObj,
                width: x - currentObj.x,
                height: y - currentObj.y
            });
        } else if (currentObj.type === 'polygon' && currentObj.x !== undefined && currentObj.y !== undefined) {
            const dx = x - currentObj.x;
            const dy = y - currentObj.y;
            setCurrentObj({
                ...currentObj,
                radius: Math.sqrt(dx * dx + dy * dy)
            });
        } else if (currentObj.type === 'arc' && currentObj.x !== undefined && currentObj.y !== undefined) {
            const dx = x - currentObj.x;
            const dy = y - currentObj.y;
            const radius = Math.sqrt(dx * dx + dy * dy);
            let angle = Math.atan2(dy, dx) * (180 / Math.PI);
            if (angle < 0) angle += 360;
            setCurrentObj({
                ...currentObj,
                innerRadius: radius,
                outerRadius: radius,
                angle: angle
            });
        }
    };

    const handlePointerUp = (e: any) => {
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
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
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

                {sheetLayout !== 'none' && (
                    <Layer>
                        <Rect
                            x={0}
                            y={0}
                            width={
                                sheetLayout === 'A4' ? 210 * 3.7795275591 : 
                                sheetLayout === 'A3' ? 297 * 3.7795275591 : 
                                sheetLayout === 'A2' ? 420 * 3.7795275591 : 
                                sheetLayout === 'A1' ? 594 * 3.7795275591 : 
                                sheetLayout === 'A0' ? 841 * 3.7795275591 : 0
                            }
                            height={
                                sheetLayout === 'A4' ? 297 * 3.7795275591 : 
                                sheetLayout === 'A3' ? 420 * 3.7795275591 : 
                                sheetLayout === 'A2' ? 594 * 3.7795275591 : 
                                sheetLayout === 'A1' ? 841 * 3.7795275591 : 
                                sheetLayout === 'A0' ? 1189 * 3.7795275591 : 0
                            }
                            fill="rgba(255, 255, 255, 0.02)"
                            stroke="#334155"
                            strokeWidth={2}
                            dash={[10, 5]}
                            listening={false}
                        />
                        {/* Title Block area suggestion */}
                        <Rect
                            x={(
                                sheetLayout === 'A4' ? 210 * 3.7795275591 : 
                                sheetLayout === 'A3' ? 297 * 3.7795275591 : 
                                sheetLayout === 'A2' ? 420 * 3.7795275591 : 
                                sheetLayout === 'A1' ? 594 * 3.7795275591 : 
                                sheetLayout === 'A0' ? 841 * 3.7795275591 : 0
                            ) - 150 * 3.7795275591}
                            y={(
                                sheetLayout === 'A4' ? 297 * 3.7795275591 : 
                                sheetLayout === 'A3' ? 420 * 3.7795275591 : 
                                sheetLayout === 'A2' ? 594 * 3.7795275591 : 
                                sheetLayout === 'A1' ? 841 * 3.7795275591 : 
                                sheetLayout === 'A0' ? 1189 * 3.7795275591 : 0
                            ) - 50 * 3.7795275591}
                            width={150 * 3.7795275591}
                            height={50 * 3.7795275591}
                            stroke="#334155"
                            strokeWidth={1}
                            listening={false}
                        />
                    </Layer>
                )}

                <Layer>
                    {elements.map((obj) => (
                        <Shape key={obj.id} obj={obj} isSelectTool={activeTool === 'select'} />
                    ))}
                    {currentObj && <Shape obj={currentObj} isSelectTool={false} />}
                    {activeTool === 'protractor' && <ProtractorOverlay x={view.x * -1 / view.zoom + window.innerWidth / (2 * view.zoom)} y={view.y * -1 / view.zoom + window.innerHeight / (2 * view.zoom)} />}
                    {activeTool === 'ruler' && <RulerOverlay x={view.x * -1 / view.zoom + window.innerWidth / (2 * view.zoom) - 150} y={view.y * -1 / view.zoom + window.innerHeight / (2 * view.zoom)} />}
                    {selectionBox && activeTool === 'select' && (
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
                    {selectedIds.length > 0 && activeTool !== 'sculpt' && (
                        <Transformer
                            ref={trRef}
                            borderEnabled={false}
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
                    
                    {/* Sculpt Nodes */}
                    {activeTool === 'sculpt' && elements.filter(el => el.points && selectedIds.includes(el.id)).map(el => (
                        <Group key={`sculpt-${el.id}`}>
                            {el.points?.reduce((acc: any[], p: number, i: number, arr: number[]) => {
                                if (i % 2 === 0) {
                                    acc.push(
                                        <Circle
                                            key={`node-${i}`}
                                            name="sculpt-node"
                                            x={arr[i]}
                                            y={arr[i+1]}
                                            radius={6}
                                            fill="#ec4899"
                                            stroke="#fff"
                                            strokeWidth={1.5}
                                            draggable
                                            onDragMove={(e) => {
                                                const newPoints = [...arr];
                                                newPoints[i] = e.target.x();
                                                newPoints[i+1] = e.target.y();
                                                const store = useEngigraphStore.getState();
                                                store.updateElement(el.id, { points: newPoints });
                                            }}
                                            onDragEnd={(e) => {
                                                const newPoints = [...arr];
                                                newPoints[i] = e.target.x();
                                                newPoints[i+1] = e.target.y();
                                                const store = useEngigraphStore.getState();
                                                store.pushHistory(store.elements.map(elem => elem.id === el.id ? { ...elem, points: newPoints } : elem));
                                            }}
                                        />
                                    );
                                }
                                return acc;
                            }, [])}
                        </Group>
                    ))}
                </Layer>
            </Stage>
            {/* UI/Overlay Layer (Outside Konva Canvas) */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                {/* CFD Overlay */}
                {cfdMode && <CFDOverlay />}

                {/* Acoustic FFT Overlay */}
                {acousticMode && <AcousticOverlay />}
                
                <div className="absolute top-4 left-4">
                    {/* UI overlay content */}
                </div>
            </div>
        </div>
    );
};

const Shape = ({ obj, isSelectTool }: { obj: DrawingObject, isSelectTool: boolean }) => {
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

    const isSelected = useEngigraphStore.getState().selectedIds.includes(obj.id);
    const activeLayer = useEngigraphStore.getState().activeLayer;
    const isDifferentLayer = obj.boardLayer && obj.boardLayer !== activeLayer;
    
    const pdnMode = useEngigraphStore.getState().pdnMode;
    
    // If it's a wire, override its stroke color based on layer if it's not powered
    let computedStroke = obj.stroke;
    let shadowProps: any = {};
    if (obj.type === 'wire') {
        computedStroke = obj.boardLayer === 'top' ? '#ef4444' : '#3b82f6';
        if (obj.isPowered) {
            computedStroke = '#10b981'; // Green
            
            // PDN Mode Gradient
            if (pdnMode && obj.voltageDrop !== undefined) {
                // Map drop 0.0V -> Green, > 0.5V -> Red
                const dropRatio = Math.min(obj.voltageDrop / 0.5, 1);
                // Simple color lerp (green to red)
                const r = Math.round(16 + dropRatio * 223); // 16 to 239
                const g = Math.round(185 - dropRatio * 117); // 185 to 68
                const b = Math.round(129 - dropRatio * 61); // 129 to 68
                computedStroke = `rgb(${r}, ${g}, ${b})`;
            }
        }
        if (obj.isCorrupted && !pdnMode) computedStroke = '#f59e0b'; // Amber/Orange for corrupted
    }

    const opacity = isDifferentLayer ? 0.3 : 1;
    
    if (isSelected) {
        shadowProps = { shadowColor: '#00f2ff', shadowBlur: 10, shadowOpacity: 0.8 };
    } else if (pdnMode && obj.type === 'component' && obj.isPowerStarved) {
        shadowProps = { shadowColor: '#ef4444', shadowBlur: 20, shadowOpacity: 1 }; // Heavy red glow for starved components
    } else if (obj.type === 'wire' && obj.isCorrupted && !pdnMode) {
        shadowProps = { shadowColor: '#ef4444', shadowBlur: 15, shadowOpacity: 0.8 }; // Red glowing radiation
    }

    // ---- HOLLOW HIT DETECTION ----
    // All shapes are drawn with no fill (transparent) so only the stroke line is selectable.
    // hitStrokeWidth expands the invisible hit area around the stroke, making it easy to click.
    // This replicates the old EngiGraph paper.js behaviour where only the path/line was clickable.
    const HIT_STROKE = 12; // pixels of hit tolerance around stroke

    // Basic shapes
    if (obj.type === 'line' || obj.type === 'wire' || obj.type === 'spline') {
        return <Line id={obj.id} name="element-group" points={obj.points || []} stroke={computedStroke} strokeWidth={obj.strokeWidth} dash={obj.dash} tension={obj.type === 'spline' ? 0.5 : 0} opacity={opacity} hitStrokeWidth={HIT_STROKE} draggable={isSelectTool} listening={isSelectTool} dragBoundFunc={dragBoundFunc} {...shadowProps} />;
    }
    if (obj.type === 'rect') {
        return <Rect id={obj.id} name="element-group" x={obj.x} y={obj.y} width={obj.width} height={obj.height} stroke={computedStroke} strokeWidth={obj.strokeWidth} hitStrokeWidth={HIT_STROKE} fillEnabled={false} opacity={opacity} draggable={isSelectTool} listening={isSelectTool} dragBoundFunc={dragBoundFunc} {...shadowProps} />;
    }
    if (obj.type === 'roundrect') {
        return <Rect id={obj.id} name="element-group" x={obj.x} y={obj.y} width={obj.width} height={obj.height} cornerRadius={obj.cornerRadius || 10} stroke={computedStroke} strokeWidth={obj.strokeWidth} hitStrokeWidth={HIT_STROKE} fillEnabled={false} opacity={opacity} draggable={isSelectTool} listening={isSelectTool} dragBoundFunc={dragBoundFunc} {...shadowProps} />;
    }
    if (obj.type === 'circle') {
        return <Circle id={obj.id} name="element-group" x={obj.x} y={obj.y} radius={obj.radius} stroke={computedStroke} strokeWidth={obj.strokeWidth} hitStrokeWidth={HIT_STROKE} fillEnabled={false} opacity={opacity} draggable={isSelectTool} listening={isSelectTool} dragBoundFunc={dragBoundFunc} {...shadowProps} />;
    }
    if (obj.type === 'ellipse') {
        return <Ellipse id={obj.id} name="element-group" x={obj.x} y={obj.y} radiusX={obj.radiusX} radiusY={obj.radiusY} stroke={computedStroke} strokeWidth={obj.strokeWidth} hitStrokeWidth={HIT_STROKE} fillEnabled={false} opacity={opacity} draggable={isSelectTool} listening={isSelectTool} dragBoundFunc={dragBoundFunc} {...shadowProps} />;
    }
    if (obj.type === 'polygon') {
        return <RegularPolygon id={obj.id} name="element-group" x={obj.x} y={obj.y} sides={obj.sides || 6} radius={obj.radius} stroke={computedStroke} strokeWidth={obj.strokeWidth} hitStrokeWidth={HIT_STROKE} fillEnabled={false} opacity={opacity} draggable={isSelectTool} listening={isSelectTool} dragBoundFunc={dragBoundFunc} {...shadowProps} />;
    }
    if (obj.type === 'arc') {
        return <Arc id={obj.id} name="element-group" x={obj.x} y={obj.y} innerRadius={obj.innerRadius} outerRadius={obj.outerRadius} angle={obj.angle} stroke={computedStroke} strokeWidth={obj.strokeWidth} hitStrokeWidth={HIT_STROKE} fillEnabled={false} opacity={opacity} draggable={isSelectTool} listening={isSelectTool} dragBoundFunc={dragBoundFunc} {...shadowProps} />;
    }
    if (!obj) return null;

    if (obj.type === 'text') {
        return <Text id={obj.id} name="element-group" x={obj.x} y={obj.y} text={obj.text || 'Text'} fill={obj.stroke} fontSize={16} opacity={opacity} hitStrokeWidth={HIT_STROKE} draggable={isSelectTool} listening={isSelectTool} dragBoundFunc={dragBoundFunc} {...shadowProps} />;
    }
    if (obj.type === 'dimension' && obj.points) {
        const p1x = obj.points[0];
        const p1y = obj.points[1];
        const p2x = obj.points[2];
        const p2y = obj.points[3];
        const distance = Math.sqrt(Math.pow(p2x - p1x, 2) + Math.pow(p2y - p1y, 2)).toFixed(2);
        return (
            <Group id={obj.id} name="element-group" opacity={opacity} draggable={isSelectTool} listening={isSelectTool} dragBoundFunc={dragBoundFunc} {...shadowProps}>
                <Line points={obj.points} stroke={obj.stroke} strokeWidth={obj.strokeWidth} hitStrokeWidth={HIT_STROKE} />
                <Circle x={p1x} y={p1y} radius={3} fill={obj.stroke} />
                <Circle x={p2x} y={p2y} radius={3} fill={obj.stroke} />
                <Text x={(p1x + p2x) / 2} y={(p1y + p2y) / 2 - 15} text={`${distance}`} fill={obj.stroke} fontSize={12} />
            </Group>
        );
    }
    // Logic/Mechatronic Components
    if (obj.type === 'component') {
        return (
            <Group opacity={opacity}>
                <ComponentShape obj={obj} isSelectTool={isSelectTool} dragBoundFunc={dragBoundFunc} shadowProps={shadowProps} />
            </Group>
        );
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
