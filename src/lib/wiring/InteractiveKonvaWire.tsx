import React, { useState } from 'react';
import { Group, Line, Circle } from 'react-konva';
import { Point, calculateOrthogonalPoints, getSegmentHit, pointsToKonvaFlat, konvaFlatToPoints } from './WireManager';
import { ENGIGRAPHS_COLORS, WIRE_DEFAULTS } from './constants';

interface InteractiveKonvaWireProps {
  id: string;
  start: Point;
  end: Point;
  points?: number[]; // existing flat points array from state
  isActive: boolean;
  isSelected: boolean;
  isHovered: boolean;
  color?: string; // Custom color override
  thickness?: number; // Custom thickness override
  routing?: 'HVH' | 'VHV';
  onUpdatePoints: (id: string, newPoints: number[]) => void;
  onSelect: () => void;
}

export const InteractiveKonvaWire: React.FC<InteractiveKonvaWireProps> = ({
  id,
  start,
  end,
  points,
  isActive,
  isSelected,
  isHovered,
  color,
  thickness,
  routing,
  onUpdatePoints,
  onSelect
}) => {
  const [hoveredWaypoint, setHoveredWaypoint] = useState<number | null>(null);
  
  // Calculate or parse points
  const wirePoints = points && points.length > 0 
    ? konvaFlatToPoints(points) 
    : calculateOrthogonalPoints(start, end, routing);

  // Force start and end to match terminals regardless of dragged waypoints
  if (wirePoints.length > 0) {
    wirePoints[0] = start;
    wirePoints[wirePoints.length - 1] = end;
  }

  // Determine appearance based on Engigraphs standards and state
  let strokeColor = color || (isActive ? ENGIGRAPHS_COLORS.POWER_VCC : ENGIGRAPHS_COLORS.BASE_WIRE);
  if (isSelected) strokeColor = ENGIGRAPHS_COLORS.SELECTED;
  else if (isHovered) strokeColor = ENGIGRAPHS_COLORS.HOVER;

  const strokeWidth = thickness || (isActive ? WIRE_DEFAULTS.THICKNESS_ACTIVE : WIRE_DEFAULTS.THICKNESS);

  const flatPoints = pointsToKonvaFlat(wirePoints);

  const handleLineClick = (e: any) => {
    e.cancelBubble = true;
    onSelect();
    
    // If double click, add a waypoint where clicked
    if (e.evt.detail === 2) {
      const stage = e.target.getStage();
      const pos = stage.getRelativePointerPosition();
      const hitIdx = getSegmentHit(pos.x, pos.y, wirePoints);
      
      if (hitIdx !== -1) {
        const newPoints = [...wirePoints];
        newPoints.splice(hitIdx + 1, 0, { x: pos.x, y: pos.y });
        onUpdatePoints(id, pointsToKonvaFlat(newPoints));
      }
    }
  };

  const handleDragMove = (e: any, index: number) => {
    const newPoints = [...wirePoints];
    newPoints[index] = { x: e.target.x(), y: e.target.y() };
    onUpdatePoints(id, pointsToKonvaFlat(newPoints));
  };

  const handleDragEnd = (e: any, index: number) => {
    // Snap to grid (assuming 10px grid, we could pass this down if needed)
    const gridSize = 10;
    const newPoints = [...wirePoints];
    newPoints[index] = { 
      x: Math.round(e.target.x() / gridSize) * gridSize, 
      y: Math.round(e.target.y() / gridSize) * gridSize 
    };
    onUpdatePoints(id, pointsToKonvaFlat(newPoints));
  };

  const handleWaypointDoubleClick = (e: any, index: number) => {
    e.cancelBubble = true;
    // Remove waypoint
    if (index > 0 && index < wirePoints.length - 1) {
      const newPoints = [...wirePoints];
      newPoints.splice(index, 1);
      onUpdatePoints(id, pointsToKonvaFlat(newPoints));
    }
  };

  return (
    <Group>
      {/* Visible Line with hitStrokeWidth for easier hitting/clicking */}
      <Line
        points={flatPoints}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        hitStrokeWidth={15}
        opacity={isActive ? 1 : 0.8}
        lineJoin="round"
        dash={isActive ? [6, 4] : undefined}
        shadowBlur={isActive ? 8 : 0}
        shadowColor={strokeColor}
        onClick={handleLineClick}
        onTap={handleLineClick}
        onMouseEnter={() => { document.body.style.cursor = 'pointer'; }}
        onMouseLeave={() => { document.body.style.cursor = 'default'; }}
      />

      {/* Terminal caps */}
      <Circle x={start.x} y={start.y} radius={isActive ? 3 : 2} fill={strokeColor} listening={false} />
      <Circle x={end.x} y={end.y} radius={isActive ? 3 : 2} fill={strokeColor} listening={false} />

      {/* Waypoints (Anchors) - Only visible when selected */}
      {isSelected && wirePoints.map((pt, i) => {
        // Start and end are anchored to components, not independently draggable
        if (i === 0 || i === wirePoints.length - 1) return null;
        
        return (
          <Circle
            key={i}
            x={pt.x}
            y={pt.y}
            radius={hoveredWaypoint === i ? 6 : 4}
            fill="#ffffff"
            stroke={ENGIGRAPHS_COLORS.SELECTED}
            strokeWidth={2}
            draggable
            onDragMove={(e) => handleDragMove(e, i)}
            onDragEnd={(e) => handleDragEnd(e, i)}
            onMouseEnter={() => setHoveredWaypoint(i)}
            onMouseLeave={() => setHoveredWaypoint(null)}
            onDblClick={(e) => handleWaypointDoubleClick(e, i)}
          />
        );
      })}
    </Group>
  );
};
