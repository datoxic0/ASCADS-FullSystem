import React from 'react';
import { Group, Rect, Circle, Line } from 'react-konva';
import { PCBFootprintInstance } from '../store/usePCBStore';
import { FootprintLibrary } from '../lib/FootprintLibrary';

interface PCBFootprintProps {
    instance: PCBFootprintInstance;
    isSelected: boolean;
    onClick?: (e: any) => void;
    onDragEnd?: (id: string, x: number, y: number) => void;
    visibleLayers: Record<string, boolean>;
}

export const PCBFootprint: React.FC<PCBFootprintProps> = ({ instance, isSelected, onClick, onDragEnd, visibleLayers }) => {
    const def = FootprintLibrary[instance.footprintId];
    if (!def) return null;

    const isBottom = instance.layer === 'bottom';
    
    // Scale from mm to pixels. Let's assume 1mm = 10px on canvas natively.
    // We do all math in pixels so 1mm -> 10px.
    const MM_TO_PX = 10;

    const handleDragEnd = (e: any) => {
        if (onDragEnd) {
            onDragEnd(instance.id, e.target.x(), e.target.y());
        }
    };

    const getPadColor = (layer: 'top' | 'bottom' | 'thruhole') => {
        if (layer === 'thruhole') return '#f59e0b'; // Gold/Amber for THT pads
        if (layer === 'top') return isBottom ? '#2563eb' : '#ef4444'; // Red for Top, Blue for Bottom
        if (layer === 'bottom') return isBottom ? '#ef4444' : '#2563eb';
        return '#888888';
    };

    const silkColor = isBottom ? '#0ea5e9' : '#f8fafc'; // Cyan-ish for bottom silk, White for top silk
    
    const showSilk = isBottom ? visibleLayers.bottom_silk : visibleLayers.top_silk;
    const showPads = isBottom ? visibleLayers.bottom_copper : visibleLayers.top_copper;

    return (
        <Group
            x={instance.x}
            y={instance.y}
            rotation={instance.rotation}
            draggable
            onClick={onClick}
            onDragEnd={handleDragEnd}
        >
            {/* Render Silkscreen */}
            {showSilk && def.silkscreen.map((silk, idx) => (
                <Line
                    key={`silk-${idx}`}
                    points={silk.points.map(p => p * MM_TO_PX)}
                    stroke={silkColor}
                    strokeWidth={silk.width * MM_TO_PX}
                    lineCap="round"
                    lineJoin="round"
                />
            ))}

            {/* Render Pads */}
            {(showPads || visibleLayers.drills) && def.pads.map(pad => {
                // Mirror X if placed on bottom layer
                const px = (isBottom ? -pad.x : pad.x) * MM_TO_PX;
                const py = pad.y * MM_TO_PX;
                const pw = pad.width * MM_TO_PX;
                const ph = pad.height * MM_TO_PX;
                const color = getPadColor(pad.layer);

                const isPadVisible = pad.layer === 'thruhole' ? (visibleLayers.top_copper || visibleLayers.bottom_copper) : showPads;

                return (
                    <Group key={`pad-${pad.id}`} x={px} y={py}>
                        {isPadVisible && (
                            <>
                                {pad.shape === 'rect' && (
                                    <Rect x={-pw/2} y={-ph/2} width={pw} height={ph} fill={color} />
                                )}
                                {pad.shape === 'roundrect' && (
                                    <Rect x={-pw/2} y={-ph/2} width={pw} height={ph} cornerRadius={pw * 0.2} fill={color} />
                                )}
                                {pad.shape === 'circle' && (
                                    <Circle radius={pw/2} fill={color} />
                                )}
                                {pad.shape === 'oval' && (
                                    <Rect x={-pw/2} y={-ph/2} width={pw} height={ph} cornerRadius={Math.min(pw, ph) / 2} fill={color} />
                                )}
                            </>
                        )}
                        {/* Render Drill Hole if applicable */}
                        {pad.drill && visibleLayers.drills && (
                            <Circle radius={(pad.drill * MM_TO_PX) / 2} fill="#111827" /> // Hole color (background)
                        )}
                    </Group>
                );
            })}

            {/* Selection Highlight */}
            {isSelected && (
                <Rect
                    x={-20}
                    y={-20}
                    width={40}
                    height={40}
                    stroke="#00f2ff"
                    strokeWidth={2}
                    dash={[4, 4]}
                    listening={false}
                />
            )}
        </Group>
    );
};
