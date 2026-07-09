import React from 'react';
import { Line, Circle, Group } from 'react-konva';
import { PCBTrack, PCBVia } from '../store/usePCBStore';

interface PCBTrackProps {
    track: PCBTrack;
    isSelected: boolean;
    onClick?: (e: any) => void;
    visibleLayers: Record<string, boolean>;
}

export const PCBTrackView: React.FC<PCBTrackProps> = ({ track, isSelected, onClick, visibleLayers }) => {
    const MM_TO_PX = 10;
    const isTop = track.layer === 'top_copper';
    const isVisible = isTop ? visibleLayers.top_copper : visibleLayers.bottom_copper;
    
    if (!isVisible) return null;

    const color = isTop ? '#ef4444' : '#2563eb';

    return (
        <Line
            points={track.points.map(p => p * MM_TO_PX)}
            stroke={color}
            strokeWidth={track.width * MM_TO_PX}
            lineCap="round"
            lineJoin="round"
            onClick={onClick}
            shadowColor={isSelected ? '#00f2ff' : undefined}
            shadowBlur={isSelected ? 10 : 0}
            opacity={0.8}
        />
    );
};

interface PCBViaProps {
    via: PCBVia;
    isSelected: boolean;
    onClick?: (e: any) => void;
    visibleLayers: Record<string, boolean>;
}

export const PCBViaView: React.FC<PCBViaProps> = ({ via, isSelected, onClick, visibleLayers }) => {
    const MM_TO_PX = 10;
    const isVisible = visibleLayers.top_copper || visibleLayers.bottom_copper;
    
    if (!isVisible) return null;

    return (
        <Group x={via.x * MM_TO_PX} y={via.y * MM_TO_PX} onClick={onClick}>
            <Circle 
                radius={(via.diameter * MM_TO_PX) / 2} 
                fill="#f59e0b" // Copper color
                shadowColor={isSelected ? '#00f2ff' : undefined}
                shadowBlur={isSelected ? 10 : 0}
            />
            {visibleLayers.drills && (
                <Circle radius={(via.drill * MM_TO_PX) / 2} fill="#111827" /> // Hole
            )}
        </Group>
    );
};
