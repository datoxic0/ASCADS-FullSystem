import React, { useRef, useState } from 'react';
import { Stage, Layer, Line, Rect, Circle, Text, Transformer } from 'react-konva';
import { useEngigraphStore, ToolType } from '../store/useEngigraphStore';

interface DrawingObject {
    id: string;
    type: ToolType;
    points?: number[];
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    radius?: number;
    text?: string;
    stroke?: string;
    fill?: string;
    strokeWidth?: number;
}

export const EngigraphCanvas: React.FC = () => {
    const { activeTool, view, setView } = useEngigraphStore();
    const [objects, setObjects] = useState<DrawingObject[]>([]);
    const [currentObj, setCurrentObj] = useState<DrawingObject | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const stageRef = useRef<any>(null);
    const trRef = useRef<any>(null);

    React.useEffect(() => {
        if (selectedId) {
            const node = stageRef.current.findOne(`#${selectedId}`);
            if (node) {
                trRef.current.nodes([node]);
                trRef.current.getLayer().batchDraw();
            }
        } else if (trRef.current) {
            trRef.current.nodes([]);
            trRef.current.getLayer().batchDraw();
        }
    }, [selectedId, objects]);

    const handleMouseDown = (e: any) => {
        const stage = e.target.getStage();
        const pointer = stage.getPointerPosition();
        
        // Adjust for pan and zoom
        const x = (pointer.x - view.x) / view.zoom;
        const y = (pointer.y - view.y) / view.zoom;

        if (activeTool === 'pan') return;

        // Selection Logic
        if (activeTool === 'select') {
            const clickedOnEmpty = e.target === stage || e.target.parent?.className === 'GridPattern';
            if (clickedOnEmpty) {
                setSelectedId(null);
            } else {
                const id = e.target.id() || e.target.parent?.id();
                setSelectedId(id);
            }
            return;
        }

        const newId = `obj-${Date.now()}`;
        if (activeTool === 'line') {
            setCurrentObj({ id: newId, type: 'line', points: [x, y, x, y], stroke: '#00f2ff', strokeWidth: 2 });
        } else if (activeTool === 'rect') {
            setCurrentObj({ id: newId, type: 'rect', x, y, width: 0, height: 0, stroke: '#00f2ff', strokeWidth: 2 });
        } else if (activeTool === 'circle') {
            setCurrentObj({ id: newId, type: 'circle', x, y, radius: 0, stroke: '#00f2ff', strokeWidth: 2 });
        }
    };

    const handleMouseMove = (e: any) => {
        if (!currentObj) return;

        const stage = e.target.getStage();
        const pointer = stage.getPointerPosition();
        const x = (pointer.x - view.x) / view.zoom;
        const y = (pointer.y - view.y) / view.zoom;

        if (currentObj.type === 'line' && currentObj.points) {
            setCurrentObj({
                ...currentObj,
                points: [currentObj.points[0], currentObj.points[1], x, y]
            });
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

    const handleMouseUp = () => {
        if (currentObj) {
            setObjects([...objects, currentObj]);
            setCurrentObj(null);
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
                    {objects.map((obj) => (
                        <Shape key={obj.id} obj={obj} />
                    ))}
                    {currentObj && <Shape obj={currentObj} />}
                    {selectedId && (
                        <Transformer
                            ref={trRef}
                            boundBoxFunc={(oldBox, newBox) => {
                                if (newBox.width < 5 || newBox.height < 5) {
                                    return oldBox;
                                }
                                return newBox;
                            }}
                        />
                    )}
                </Layer>
            </Stage>
        </div>
    );
};

const Shape = ({ obj }: { obj: DrawingObject }) => {
    const isSelected = obj.id;
    if (obj.type === 'line') {
        return <Line id={obj.id} points={obj.points || []} stroke={obj.stroke} strokeWidth={obj.strokeWidth} draggable />;
    }
    if (obj.type === 'rect') {
        return <Rect id={obj.id} x={obj.x} y={obj.y} width={obj.width} height={obj.height} stroke={obj.stroke} strokeWidth={obj.strokeWidth} draggable />;
    }
    if (obj.type === 'circle') {
        return <Circle id={obj.id} x={obj.x} y={obj.y} radius={obj.radius} stroke={obj.stroke} strokeWidth={obj.strokeWidth} draggable />;
    }
    return null;
};

const GridPattern = () => {
    // A simple grid pattern generator using lines
    const lines = [];
    const step = 50;
    const size = 5000;
    for (let i = -size; i < size; i += step) {
        lines.push(<Line key={`h${i}`} points={[-size, i, size, i]} stroke="#1e293b" strokeWidth={1} />);
        lines.push(<Line key={`v${i}`} points={[i, -size, i, size]} stroke="#1e293b" strokeWidth={1} />);
    }
    return <>{lines}</>;
};
