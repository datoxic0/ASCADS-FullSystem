import React, { useState } from 'react';
import { Point, calculateOrthogonalPoints, getSegmentHit, pointsToSvgPath } from './WireManager';
import { ENGIGRAPHS_COLORS, WIRE_DEFAULTS } from './constants';

interface InteractiveSvgWireProps {
  id: string;
  start: Point;
  end: Point;
  waypoints?: Point[];
  isActive: boolean | null | undefined;
  isSelected: boolean;
  isHovered?: boolean;
  color?: string;
  thickness?: number;
  routing?: 'HVH' | 'VHV';
  onUpdateWaypoints: (id: string, newWaypoints: Point[]) => void;
  onSelect: (e?: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  // Canvas coordinate conversion to help with mouse events
  getCanvasCoordinates?: (clientX: number, clientY: number) => Point;
}

export const InteractiveSvgWire: React.FC<InteractiveSvgWireProps> = ({
  id,
  start,
  end,
  waypoints = [],
  isActive,
  isSelected,
  isHovered,
  color,
  thickness,
  routing,
  onUpdateWaypoints,
  onSelect,
  onContextMenu,
  getCanvasCoordinates
}) => {
  const [hoveredWaypoint, setHoveredWaypoint] = useState<number | null>(null);
  const [draggingWaypoint, setDraggingWaypoint] = useState<number | null>(null);

  // If no waypoints exist, generate a standard orthogonal route
  let wirePoints = waypoints.length > 0 
    ? [start, ...waypoints, end] 
    : calculateOrthogonalPoints(start, end, routing);

  // Ensure start and end always match exactly
  wirePoints[0] = start;
  wirePoints[wirePoints.length - 1] = end;

  // Engigraphs Color Logic
  let strokeColor = color || ENGIGRAPHS_COLORS.BASE_WIRE;
  
  if (isSelected) {
    strokeColor = ENGIGRAPHS_COLORS.SELECTED;
  } else if (isHovered) {
    strokeColor = ENGIGRAPHS_COLORS.HOVER;
  } else if (!color) {
    // If no custom color is set, use simulation state
    if (isActive === true) {
      strokeColor = ENGIGRAPHS_COLORS.LOGIC_HIGH;
    } else if (isActive === false) {
      strokeColor = ENGIGRAPHS_COLORS.LOGIC_LOW;
    } else if (isActive === undefined || isActive === null) {
      // Keep base color if undefined (e.g. unknown state "X")
      strokeColor = ENGIGRAPHS_COLORS.BASE_WIRE;
    }
  }

  const strokeWidth = thickness || (isActive === true ? WIRE_DEFAULTS.THICKNESS_ACTIVE : WIRE_DEFAULTS.THICKNESS);

  const pathData = pointsToSvgPath(wirePoints);

  const handleLineClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(e);
    
    // Double click to add waypoint
    if (e.detail === 2 && getCanvasCoordinates) {
      const pos = getCanvasCoordinates(e.clientX, e.clientY);
      const hitIdx = getSegmentHit(pos.x, pos.y, wirePoints);
      
      if (hitIdx !== -1) {
        // Because wirePoints includes start/end, a hitIdx means the segment between hitIdx and hitIdx+1
        const currentWaypoints = [...waypoints];
        // The index in waypoints array corresponds to hitIdx since waypoints = wirePoints[1...n-1]
        // Actually, if wirePoints is [start, wp0, wp1, end]
        // A hit on segment 0 (start to wp0) -> insert before wp0 (index 0)
        // A hit on segment 1 (wp0 to wp1) -> insert before wp1 (index 1)
        currentWaypoints.splice(hitIdx, 0, pos);
        onUpdateWaypoints(id, currentWaypoints);
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent, index: number) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    // index here is the index in the waypoints array (0-based)
    setDraggingWaypoint(index);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingWaypoint !== null && getCanvasCoordinates) {
      e.stopPropagation();
      const pos = getCanvasCoordinates(e.clientX, e.clientY);
      // Snap to grid
      const gridSize = 10;
      const snapX = Math.round(pos.x / gridSize) * gridSize;
      const snapY = Math.round(pos.y / gridSize) * gridSize;

      const newWaypoints = [...waypoints];
      newWaypoints[draggingWaypoint] = { x: snapX, y: snapY };
      onUpdateWaypoints(id, newWaypoints);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingWaypoint !== null) {
      e.stopPropagation();
      e.currentTarget.releasePointerCapture(e.pointerId);
      setDraggingWaypoint(null);
    }
  };

  const handleWaypointDoubleClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const newWaypoints = [...waypoints];
    newWaypoints.splice(index, 1);
    onUpdateWaypoints(id, newWaypoints);
  };

  return (
    <g>
      {/* Invisible thicker line for hit detection */}
      <path
        d={pathData}
        stroke="transparent"
        strokeWidth={15}
        fill="none"
        onClick={handleLineClick}
        onContextMenu={onContextMenu}
        style={{ cursor: 'pointer' }}
      />
      
      {/* Visible Line */}
      <path
        d={pathData}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          filter: isActive === true ? `drop-shadow(0 0 6px ${strokeColor})` : 'none',
          pointerEvents: 'none'
        }}
      />

      {/* Terminal caps */}
      <circle cx={start.x} cy={start.y} r={isActive === true ? 3 : 2} fill={strokeColor} style={{ pointerEvents: 'none' }} />
      <circle cx={end.x} cy={end.y} r={isActive === true ? 3 : 2} fill={strokeColor} style={{ pointerEvents: 'none' }} />

      {/* Draggable Waypoints (only shown when selected) */}
      {isSelected && waypoints.map((wp, i) => (
        <circle
          key={`wp-${id}-${i}`}
          cx={wp.x}
          cy={wp.y}
          r={hoveredWaypoint === i || draggingWaypoint === i ? 6 : 4}
          fill="#ffffff"
          stroke={ENGIGRAPHS_COLORS.SELECTED}
          strokeWidth={2}
          onPointerDown={(e) => handlePointerDown(e, i)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onMouseEnter={() => setHoveredWaypoint(i)}
          onMouseLeave={() => setHoveredWaypoint(null)}
          onDoubleClick={(e) => handleWaypointDoubleClick(e, i)}
          style={{ cursor: 'move', touchAction: 'none' }}
        />
      ))}
    </g>
  );
};
