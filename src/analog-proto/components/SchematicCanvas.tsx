import React, { useRef, useEffect, useState, useCallback, useImperativeHandle } from 'react';
import { Stage, Layer, Line, Rect, Circle, Text, Group, Path } from 'react-konva';
import { COMPONENT_DEFINITIONS, GRID_SIZE } from '../constants';
import { Component, Connection } from '../types';
import { Zap, Activity, RefreshCcw } from 'lucide-react';
import { InteractiveKonvaWire } from '../../lib/wiring/InteractiveKonvaWire';

export interface SchematicCanvasRef {
  zoomIn: () => void;
  zoomOut: () => void;
  zoomFit: () => void;
}

interface SchematicCanvasProps {
  design: { components: Component[]; connections: Connection[] };
  onUpdateComponent: (id: string, updates: Partial<Component>) => void;
  onRemoveComponent: (id: string) => void;
  onAddConnection: (from: string, fromPin: number, to: string, toPin: number, routing?: 'HVH' | 'VHV') => void;
  onUpdateConnection?: (id: string, updates: Partial<import('../types').Connection>) => void;
  onRemoveConnection: (id: string) => void;
  selectedTool: 'SELECT' | 'WIRE' | 'DELETE';
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  undo?: () => void;
  redo?: () => void;
  stageRef?: React.RefObject<any>;
  // Simulation Props
  activeComponentIds?: Set<string>;
  activeConnectionIds?: Set<string>;
  simulationStates?: Record<string, any>;
  isSimulating?: boolean;
  tick?: number;
  scopeHistory?: React.MutableRefObject<{ ch1: number[]; ch2: number[] }>;
}

const SchematicCanvas = React.memo(React.forwardRef<SchematicCanvasRef, SchematicCanvasProps>(({
  design,
  onUpdateComponent,
  onRemoveComponent,
  onAddConnection,
  onUpdateConnection,
  onRemoveConnection,
  selectedTool,
  selectedComponentId,
  onSelectComponent,
  undo,
  redo,
  stageRef,
  activeComponentIds = new Set(),
  activeConnectionIds = new Set(),
  simulationStates = {},
  isSimulating = false,
  tick = 0,
  scopeHistory
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [wiringState, setWiringState] = useState<{ fromId: string; fromPin: number; x: number; y: number; routing: 'HVH' | 'VHV' } | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [editingLabel, setEditingLabel] = useState<{ id: string, text: string, x: number, y: number } | null>(null);

  const zoomFit = useCallback(() => {
    if (design.components.length === 0 || dimensions.width === 0) return;
    
    const padding = 50;
    const box = {
      minX: Math.min(...design.components.map(c => c.x)),
      minY: Math.min(...design.components.map(c => c.y)),
      maxX: Math.max(...design.components.map(c => {
        const def = COMPONENT_DEFINITIONS[c.type];
        return c.x + (c.rotation % 180 === 0 ? def.width : def.height);
      })),
      maxY: Math.max(...design.components.map(c => {
        const def = COMPONENT_DEFINITIONS[c.type];
        return c.y + (c.rotation % 180 === 0 ? def.height : def.width);
      })),
    };

    const contentWidth = box.maxX - box.minX;
    const contentHeight = box.maxY - box.minY;
    
    const scaleX = (dimensions.width - padding * 2) / contentWidth;
    const scaleY = (dimensions.height - padding * 2) / contentHeight;
    const newScale = Math.max(0.5, Math.min(scaleX, scaleY, 1.5));

    setScale(newScale);
    setPosition({
      x: (dimensions.width - contentWidth * newScale) / 2 - box.minX * newScale,
      y: (dimensions.height - contentHeight * newScale) / 2 - box.minY * newScale,
    });
  }, [design.components, dimensions]);

  const handleZoom = useCallback((center: { x: number, y: number }, factor: number) => {
    const oldScale = scale;
    const newScale = Math.max(0.5, Math.min(oldScale * factor, 3));
    
    const mousePointTo = {
      x: (center.x - position.x) / oldScale,
      y: (center.y - position.y) / oldScale,
    };

    setScale(newScale);
    setPosition({
      x: center.x - mousePointTo.x * newScale,
      y: center.y - mousePointTo.y * newScale,
    });
  }, [scale, position]);

  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      const zoomCenter = { x: dimensions.width / 2, y: dimensions.height / 2 };
      handleZoom(zoomCenter, 1.2);
    },
    zoomOut: () => {
      const zoomCenter = { x: dimensions.width / 2, y: dimensions.height / 2 };
      handleZoom(zoomCenter, 1 / 1.2);
    },
    zoomFit
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement;
      if (
        activeEl instanceof HTMLInputElement || 
        activeEl instanceof HTMLTextAreaElement || 
        activeEl?.isContentEditable ||
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.closest('.monaco-editor') !== null
      ) {
        return;
      }
      
      if ((e.key === 'r' || e.key === 'R') && wiringState) {
        setWiringState(prev => prev ? { ...prev, routing: prev.routing === 'HVH' ? 'VHV' : 'HVH' } : null);
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedComponentId) {
          if (design.connections.some(c => c.id === selectedComponentId)) {
            onRemoveConnection(selectedComponentId);
          } else {
            onRemoveComponent(selectedComponentId);
          }
        }
      } else if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          if (e.shiftKey) redo?.();
          else undo?.();
        } else if (e.key === 'y') {
          redo?.();
        }
      } else if (/^[0-9]$/.test(e.key) && selectedComponentId) {
        // Tinkercad style color shortcuts
        const colorMap: Record<string, string> = {
          '1': '#6366f1', // Default
          '2': '#ff3b30', // Red
          '3': '#4cd964', // Green
          '4': '#007aff', // Blue
          '5': '#ffcc00', // Yellow
          '6': '#5ac8fa', // Cyan
          '7': '#ff9500', // Orange
          '8': '#af52de', // Purple
          '9': '#555555', // Steel
          '0': '#000000'  // Black
        };
        const newColor = colorMap[e.key];
        // Try updating component first
        const comp = design.components.find(c => c.id === selectedComponentId);
        if (comp) {
          // If the component supports coloring, we can update it (not implemented fully for analog yet)
        } else {
          // Check if it's a connection
          const conn = design.connections.find(c => c.id === selectedComponentId);
          if (conn && onUpdateConnection) {
            onUpdateConnection(selectedComponentId, { color: newColor });
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponentId, onRemoveComponent, undo, redo, design, onSelectComponent]);

  const lastComponentsCount = useRef(0);

  useEffect(() => {
    if (design.components.length > 0 && (design.components.length !== lastComponentsCount.current) && dimensions.width > 0) {
      const timer = setTimeout(() => {
          zoomFit();
          lastComponentsCount.current = design.components.length;
      }, 50);
      return () => clearTimeout(timer);
    } else if (design.components.length === 0) {
      lastComponentsCount.current = 0;
    }
    return undefined;
  }, [design.components.length, dimensions.width, zoomFit]);

  const layerRef = useRef<any>(null);

  const snapToGrid = (val: number) => Math.round(val / GRID_SIZE) * GRID_SIZE;

  const handleDragEnd = (id: string, e: any) => {
    const x = snapToGrid(e.target.x());
    const y = snapToGrid(e.target.y());
    onUpdateComponent(id, { x, y });
    e.target.position({ x, y });
  };

  const handleComponentClick = (id: string) => {
    if (isSimulating) {
      const comp = design.components.find(c => c.id === id);
      if (comp && (comp.type === 'SWITCH' || comp.type === 'PUSH_BUTTON' || comp.type === 'TOGGLE_SWITCH' || comp.type.startsWith('LADDER_CONTACT'))) {
        const currentState = comp.properties.state;
        const newState = currentState === 'Closed' ? 'Open' : 'Closed';
        onUpdateComponent(id, { properties: { ...comp.properties, state: newState } });
        return;
      }
    }

    if (selectedTool === 'SELECT') {
      onSelectComponent(id);
    } else if (selectedTool === 'DELETE') {
      onRemoveComponent(id);
    }
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = stageRef?.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    const constrainedScale = Math.max(0.5, Math.min(newScale, 3));

    setScale(constrainedScale);
    setPosition({
      x: pointer.x - mousePointTo.x * constrainedScale,
      y: pointer.y - mousePointTo.y * constrainedScale,
    });
  };

  const calculateOrthogonalPoints = (start: { x: number; y: number }, end: { x: number; y: number }, preferredRouting?: 'HVH' | 'VHV') => {
    // If start and end are almost aligned, return 2 points
    if (Math.abs(start.x - end.x) < 2) return [start.x, start.y, start.x, end.y];
    if (Math.abs(start.y - end.y) < 2) return [start.x, start.y, end.x, start.y];

    // Standard 3-segment (S-shape)
    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);

    const useHVH = preferredRouting ? preferredRouting === 'HVH' : dx > dy;

    if (useHVH) {
      const midX = start.x + (end.x - start.x) / 2;
      return [start.x, start.y, midX, start.y, midX, end.y, end.x, end.y];
    } else {
      const midY = start.y + (end.y - start.y) / 2;
      return [start.x, start.y, start.x, midY, end.x, midY, end.x, end.y];
    }
  };

  const getRotatedPos = (comp: Component, pin: {x: number, y: number}) => {
    const rad = (comp.rotation * Math.PI) / 180;
    const rx = pin.x * Math.cos(rad) - pin.y * Math.sin(rad);
    const ry = pin.x * Math.sin(rad) + pin.y * Math.cos(rad);
    return { x: comp.x + rx, y: comp.y + ry };
  };

  const handlePinClick = (compId: string, pinIdx: number, e: any) => {
    if (selectedTool === 'WIRE') {
      e.cancelBubble = true;
      const comp = design.components.find(c => c.id === compId);
      if (!comp) return;
      const def = COMPONENT_DEFINITIONS[comp.type];
      if (!def) return;
      const pin = def.pins[pinIdx];
      if (!pin) return;
      const pinPos = getRotatedPos(comp, pin);
      
      if (!wiringState) {
        setWiringState({ fromId: compId, fromPin: pinIdx, x: pinPos.x, y: pinPos.y, routing: 'HVH' });
      } else {
        if (wiringState.fromId !== compId) {
          onAddConnection(wiringState.fromId, wiringState.fromPin, compId, pinIdx, wiringState.routing);
        }
        setWiringState(null);
      }
    }
  };

  const [hoveredPin, setHoveredPin] = useState<{ compId: string; pinIdx: number } | null>(null);

  const renderComponentShape = (comp: Component) => {
    const def = COMPONENT_DEFINITIONS[comp.type];
    if (!def) return null;
    const isSelected = comp.id === selectedComponentId;
    const isActive = activeComponentIds.has(comp.id);
    
    // Theme colors
    const color = isSelected ? '#6366f1' : (isActive ? '#fbbf24' : '#cbd5e1');
    const bgColor = isSelected ? '#1e293b' : '#0f172a';
    const strokeWidth = isActive ? 3 : 2;
    const glowColor = isActive ? 'rgba(251, 191, 36, 0.4)' : (isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent');

    let content: React.ReactNode = null;

    switch (comp.type) {
      case 'RESISTOR':
        content = (
          <Line
            points={[0, 0, 10, 0, 15, -10, 25, 10, 35, -10, 45, 10, 55, -10, 65, 10, 70, 0, 80, 0]}
            stroke={color}
            strokeWidth={2}
          />
        );
        break;
      case 'CAPACITOR':
        content = (
          <Group>
            <Line points={[0, 0, 15, 0]} stroke={color} strokeWidth={2} />
            <Line points={[15, -15, 15, 15]} stroke={color} strokeWidth={3} />
            <Line points={[25, -15, 25, 15]} stroke={color} strokeWidth={3} />
            <Line points={[25, 0, 40, 0]} stroke={color} strokeWidth={2} />
          </Group>
        );
        break;
      case 'BATTERY':
        content = (
          <Group>
            <Line points={[0, 0, 15, 0]} stroke={color} strokeWidth={2} />
            <Line points={[15, -15, 15, 15]} stroke={color} strokeWidth={4} />
            <Line points={[25, -10, 25, 10]} stroke={color} strokeWidth={2} />
            <Line points={[25, 0, 40, 0]} stroke={color} strokeWidth={2} />
            <Text text="+" x={30} y={-15} fontSize={10} fill={color} />
          </Group>
        );
        break;
      case 'GROUND':
        content = (
          <Group>
            <Line points={[15, 0, 15, 10]} stroke={color} strokeWidth={2} />
            <Line points={[0, 10, 30, 10]} stroke={color} strokeWidth={2} />
            <Line points={[5, 15, 25, 15]} stroke={color} strokeWidth={2} />
            <Line points={[10, 20, 20, 20]} stroke={color} strokeWidth={2} />
          </Group>
        );
        break;
      case 'DIODE':
        content = (
          <Group>
            <Line points={[0, 0, 10, 0]} stroke={color} strokeWidth={2} />
            <Line points={[10, -10, 10, 10, 30, 0, 10, -10]} stroke={color} strokeWidth={2} fill={isActive ? '#10b981' : bgColor} />
            <Line points={[30, -10, 30, 10]} stroke={color} strokeWidth={2} />
            <Line points={[30, 0, 40, 0]} stroke={color} strokeWidth={2} />
          </Group>
        );
        break;
      case 'TRANSISTOR':
        content = (
          <Group>
            <Line points={[0, 20, 15, 20]} stroke={color} strokeWidth={2} />
            <Line points={[15, 5, 15, 35]} stroke={color} strokeWidth={3} />
            <Line points={[15, 10, 35, 0, 40, 0]} stroke={color} strokeWidth={2} />
            <Line points={[15, 30, 35, 40, 40, 40]} stroke={color} strokeWidth={2} />
            {/* Arrow for NPN */}
            <Line points={[25, 35, 35, 40, 32, 28]} stroke={color} strokeWidth={2} />
          </Group>
        );
        break;
      case 'LED':
        content = (
          <Group>
            {isActive && <Circle x={20} y={0} radius={15} fill="rgba(16, 185, 129, 0.2)" shadowBlur={10} shadowColor="#10b981" />}
            <Line points={[0, 0, 10, 0]} stroke={color} strokeWidth={2} />
            <Line points={[10, -10, 10, 10, 30, 0, 10, -10]} stroke={color} strokeWidth={2} fill={isActive ? '#10b981' : bgColor} />
            <Line points={[30, -10, 30, 10]} stroke={color} strokeWidth={2} />
            <Line points={[30, 0, 40, 0]} stroke={color} strokeWidth={2} />
            {/* LED arrows */}
            <Line points={[15, -15, 25, -25]} stroke={color} strokeWidth={1} />
            <Line points={[20, -12, 30, -22]} stroke={color} strokeWidth={1} />
          </Group>
        );
        break;
      case 'INTEGRATED_CIRCUIT':
        content = (
          <Group>
            <Rect width={60} height={80} stroke={color} strokeWidth={2} fill={bgColor} cornerRadius={4} />
            <Circle x={30} y={8} radius={4} fill={color} />
            <Text text={comp.properties.model as string || 'IC'} x={10} y={35} fontSize={8} fill={color} fontFamily="monospace" />
          </Group>
        );
        break;
      case 'OP_AMP':
        content = (
          <Group>
            <Line points={[10, -10, 10, 50, 50, 20, 10, -10]} stroke={color} strokeWidth={2} fill={bgColor} />
            <Text text="-" x={15} y={0} fontSize={12} fill={color} />
            <Text text="+" x={15} y={25} fontSize={12} fill={color} />
          </Group>
        );
        break;
      case 'VOLTAGE_REGULATOR':
        content = (
          <Group>
            <Rect width={60} height={40} stroke={color} strokeWidth={2} fill={bgColor} cornerRadius={2} />
            <Text text="IN" x={5} y={15} fontSize={7} fill={color} />
            <Text text="GND" x={20} y={30} fontSize={7} fill={color} />
            <Text text="OUT" x={40} y={15} fontSize={7} fill={color} />
            <Text text={comp.properties.model as string || '7805'} x={15} y={5} fontSize={8} fill={color} fontStyle="bold" />
          </Group>
        );
        break;
      case 'LOGIC_AND':
        content = (
          <Group>
            <Line points={[0, 0, 30, 0]} stroke={color} strokeWidth={2} />
            <Line points={[0, 40, 30, 40]} stroke={color} strokeWidth={2} />
            <Line points={[0, 0, 0, 40]} stroke={color} strokeWidth={2} />
            <Rect x={0} y={0} width={30} height={40} fill={bgColor} />
            <Line points={[30, 0, 30, 40]} stroke={color} strokeWidth={0} />
            {/* The D shape */}
            <Circle x={30} y={20} radius={20} stroke={color} strokeWidth={2} fill={bgColor} />
            <Rect x={10} y={1} width={20} height={38} fill={bgColor} />
            <Line points={[0,0, 30,0]} stroke={color} strokeWidth={2} />
            <Line points={[0,40, 30,40]} stroke={color} strokeWidth={2} />
            <Line points={[0,0, 0,40]} stroke={color} strokeWidth={2} />
          </Group>
        );
        break;
      case 'LOGIC_OR':
        content = (
          <Group>
            <Line points={[0, 0, 20, 0, 50, 20, 20, 40, 0, 40]} stroke={color} strokeWidth={2} />
            <Circle x={-5} y={20} radius={25} stroke={color} strokeWidth={2} fill={bgColor} />
            <Rect x={-30} y={-10} width={30} height={60} fill={bgColor} />
          </Group>
        );
        break;
      case 'LOGIC_NOT':
        content = (
          <Group>
            <Line points={[0, 5, 0, 35, 45, 20, 0, 5]} stroke={color} strokeWidth={2} fill={bgColor} />
            <Circle x={52} y={20} radius={5} stroke={color} strokeWidth={2} fill={bgColor} />
          </Group>
        );
        break;
      case 'BUZZER':
        content = (
          <Group>
            <Rect x={10} y={-10} width={20} height={20} stroke={color} strokeWidth={2} fill={isActive ? 'rgba(251, 191, 36, 0.4)' : bgColor} cornerRadius={10} />
            <Line points={[0, 0, 10, 0]} stroke={color} strokeWidth={2} />
            <Line points={[30, 0, 40, 0]} stroke={color} strokeWidth={2} />
          </Group>
        );
        break;
      case 'SPEAKER':
        content = (
          <Group>
            <Line points={[10, 0, 20, 0, 35, -15, 35, 35, 20, 20, 10, 20, 10, 0]} stroke={color} strokeWidth={2} fill={isActive ? 'rgba(251, 191, 36, 0.2)' : bgColor} />
            <Line points={[0, 10, 10, 10]} stroke={color} strokeWidth={2} />
            <Line points={[0, 30, 22, 30]} stroke={color} strokeWidth={2} />
            {isActive && (
              <Group>
                <Circle x={40} y={10} radius={5} stroke={color} strokeWidth={1} />
                <Circle x={45} y={10} radius={8} stroke={color} strokeWidth={1} />
              </Group>
            )}
          </Group>
        );
        break;
      case 'MICROPHONE':
        content = (
          <Group>
            <Circle x={20} y={20} radius={15} stroke={color} strokeWidth={2} fill={bgColor} />
            <Line points={[10, 12, 30, 12]} stroke={color} strokeWidth={1} />
            <Line points={[10, 16, 30, 16]} stroke={color} strokeWidth={1} />
            <Line points={[0, 10, 5, 10]} stroke={color} strokeWidth={2} />
            <Line points={[0, 30, 5, 30]} stroke={color} strokeWidth={2} />
          </Group>
        );
        break;
      case 'OLED_DISPLAY': {
        const state = simulationStates?.[comp.id];
        content = (
          <Group>
            <Rect width={80} height={60} stroke={color} strokeWidth={3} fill="#020617" cornerRadius={2} />
            <Rect x={4} y={4} width={72} height={52} stroke={color} strokeWidth={1} opacity={0.3} />
            <Text text="128x64 OLED" x={10} y={10} fontSize={6} fill={color} opacity={0.5} />
            {isActive && (
              <Group>
                <Rect x={6} y={6} width={68} height={48} fill="rgba(56, 189, 248, 0.1)" />
                <Text text={state?.text || "BOOTING..."} x={15} y={22} fontSize={6} fill="#38bdf8" fontStyle="bold" />
                <Text text={`VOLT: ${state?.vcc || 3.3}V`} x={15} y={32} fontSize={5} fill="#38bdf8" />
                <Line points={[10, 45, 70, 45]} stroke="#38bdf8" strokeWidth={1} />
                <Line points={[10, 45, 10 + (Math.random() * 60), 45]} stroke="#38bdf8" strokeWidth={2} />
              </Group>
            )}
            <Line points={[0, 5, 5, 5]} stroke={color} strokeWidth={2} />
            <Line points={[0, 15, 5, 15]} stroke={color} strokeWidth={2} />
            <Line points={[0, 25, 5, 25]} stroke={color} strokeWidth={2} />
            <Line points={[0, 35, 5, 35]} stroke={color} strokeWidth={2} />
          </Group>
        );
        break;
      }
      case 'SEVEN_SEGMENT': {
        const value = simulationStates?.[comp.id]?.value ?? 0;
        const getSegColor = (active: boolean) => active && isActive ? '#ef4444' : '#1e293b';
        
        // Simple digit mapping (crude but effective for visuals)
        const digits = [
          [1,1,1,1,1,1,0], // 0
          [0,1,1,0,0,0,0], // 1
          [1,1,0,1,1,0,1], // 2
          [1,1,1,1,0,0,1], // 3
          [0,1,1,0,0,1,1], // 4
          [1,0,1,1,0,1,1], // 5
          [1,0,1,1,1,1,1], // 6
          [1,1,1,0,0,0,0], // 7
          [1,1,1,1,1,1,1], // 8
          [1,1,1,1,0,1,1], // 9
        ];
        const segs = digits[value % 10];

        content = (
          <Group>
            <Rect width={50} height={60} stroke={color} strokeWidth={2} fill={bgColor} />
            {/* Segments: A, B, C, D, E, F, G */}
            <Rect x={10} y={5} width={30} height={3} fill={getSegColor(segs[0] === 1)} />
            <Rect x={42} y={10} width={3} height={18} fill={getSegColor(segs[1] === 1)} />
            <Rect x={42} y={32} width={3} height={18} fill={getSegColor(segs[2] === 1)} />
            <Rect x={10} y={52} width={30} height={3} fill={getSegColor(segs[3] === 1)} />
            <Rect x={5} y={32} width={3} height={18} fill={getSegColor(segs[4] === 1)} />
            <Rect x={5} y={10} width={3} height={18} fill={getSegColor(segs[5] === 1)} />
            <Rect x={10} y={28} width={30} height={3} fill={getSegColor(segs[6] === 1)} />
            {isActive && <Circle x={45} y={55} radius={2} fill="#ef4444" />}
          </Group>
        );
        break;
      }
      case 'MOTOR':
        content = (
          <Group>
            <Circle x={30} y={20} radius={20} stroke={color} strokeWidth={2} fill={bgColor} />
            <Text text="M" x={22} y={12} fontSize={16} fill={color} fontStyle="bold" />
            <Line points={[0, 20, 10, 20]} stroke={color} strokeWidth={2} />
            <Line points={[50, 20, 60, 20]} stroke={color} strokeWidth={2} />
            {isActive && <Circle x={30} y={20} radius={12} stroke="#fbbf24" strokeWidth={1} dash={[5, 5]} />}
          </Group>
        );
        break;
      case 'SOLENOID':
        content = (
          <Group>
            <Rect x={15} y={5} width={30} height={30} stroke={color} strokeWidth={2} fill={bgColor} />
            <Line points={[20, 10, 20, 30, 25, 10, 25, 30, 30, 10, 30, 30, 35, 10, 35, 30, 40, 10, 40, 30]} stroke={color} strokeWidth={1} />
            <Rect x={isActive ? 50 : 40} y={18} width={20} height={4} fill={color} />
            <Line points={[0, 10, 15, 10]} stroke={color} strokeWidth={2} />
            <Line points={[0, 30, 15, 30]} stroke={color} strokeWidth={2} />
          </Group>
        );
        break;
      case 'RELAY':
        content = (
          <Group>
            <Rect width={60} height={40} stroke={color} strokeWidth={2} fill={bgColor} />
            {/* Coil */}
            <Line points={[0, 10, 15, 10]} stroke={color} strokeWidth={2} />
            <Line points={[0, 30, 15, 30]} stroke={color} strokeWidth={2} />
            <Rect x={15} y={10} width={10} height={20} stroke={color} opacity={0.5} />
            {/* Contacts */}
            <Line points={[60, 20, 50, 20]} stroke={color} strokeWidth={2} />
            <Line points={[50, 20, isActive ? 40 : 40, isActive ? 0 : 40]} stroke={color} strokeWidth={2} />
            <Circle x={40} y={0} radius={2} fill={color} />
            <Circle x={40} y={40} radius={2} fill={color} />
          </Group>
        );
        break;
      case 'OSCILLOSCOPE': {
        const state = simulationStates?.[comp.id];
        content = (
          <Group>
            <Rect width={60} height={40} stroke={color} strokeWidth={2} fill={bgColor} cornerRadius={2} />
            <Rect x={5} y={5} width={40} height={25} fill="#020617" stroke="#1e293b" />
            
            {/* Screen Grid */}
            <Group opacity={0.3}>
              <Line points={[5, 12, 45, 12]} stroke="#1e293b" strokeWidth={0.5} />
              <Line points={[5, 17.5, 45, 17.5]} stroke="#1e293b" strokeWidth={0.5} />
              <Line points={[5, 23, 45, 23]} stroke="#1e293b" strokeWidth={0.5} />
              <Line points={[15, 5, 15, 30]} stroke="#1e293b" strokeWidth={0.5} />
              <Line points={[25, 5, 25, 30]} stroke="#1e293b" strokeWidth={0.5} />
              <Line points={[35, 5, 35, 30]} stroke="#1e293b" strokeWidth={0.5} />
            </Group>

            {(isActive || isSimulating) && (
              <Group>
                {/* Visual Glow */}
                <Rect x={5} y={5} width={40} height={25} fill="rgba(34, 197, 94, 0.05)" />
                
                {/* Dynamic Waveform CH1 (Bright Green) */}
                <Line
                  points={(() => {
                    const pts = [];
                    const data = scopeHistory?.current?.ch1 || [];
                    for (let x = 0; x <= 40; x += 1) {
                      pts.push(5 + x);
                      const val = data[data.length - 41 + x] ?? 0;
                      // map 0..5V to 25..10 Y coords
                      pts.push(25 - (val * 3));
                    }
                    return pts;
                  })()}
                  stroke="#4ade80"
                  strokeWidth={2}
                  tension={0.2}
                  shadowBlur={5}
                  shadowColor="#4ade80"
                />
                {/* Dynamic Waveform CH2 (Electric Blue) */}
                <Line
                  points={(() => {
                    const pts = [];
                    const data = scopeHistory?.current?.ch2 || [];
                    for (let x = 0; x <= 40; x += 1) {
                      pts.push(5 + x);
                      const val = data[data.length - 41 + x] ?? 0;
                      pts.push(25 - (val * 3));
                    }
                    return pts;
                  })()}
                  stroke="#38bdf8"
                  strokeWidth={1.5}
                  tension={0.2}
                  opacity={0.8}
                  shadowBlur={3}
                  shadowColor="#38bdf8"
                />
              </Group>
            )}
            <Circle x={52} y={15} radius={3} stroke={color} fill="#22c55e" opacity={isActive ? 1 : 0.2} shadowBlur={isActive ? 5 : 0} shadowColor="#22c55e" />
            <Circle x={52} y={25} radius={3} stroke={color} fill="#38bdf8" opacity={isActive ? 1 : 0.2} shadowBlur={isActive ? 5 : 0} shadowColor="#38bdf8" />
          </Group>
        );
        break;
      }
      case 'MULTIMETER':
        content = (
          <Group>
            <Rect width={40} height={40} stroke={color} strokeWidth={2} fill={bgColor} cornerRadius={4} />
            <Rect x={5} y={5} width={30} height={15} fill="#1e293b" />
            {isActive ? (
              <Text text="5.00V" x={10} y={8} fontSize={8} fill="#ef4444" fontStyle="bold" />
            ) : (
              <Text text="0.00V" x={10} y={8} fontSize={8} fill={color} opacity={0.3} />
            )}
            <Circle x={20} y={30} radius={6} stroke={color} />
            <Line points={[20, 30, 20, 26]} stroke={color} strokeWidth={1} />
          </Group>
        );
        break;
      case 'SIGNAL_GENERATOR':
        content = (
          <Group>
            <Rect width={60} height={40} stroke={color} strokeWidth={2} fill={bgColor} />
            <Rect x={10} y={8} width={40} height={12} fill="#1e293b" />
            <Text text="1.00 kHz" x={15} y={11} fontSize={7} fill="#38bdf8" />
            <Line points={[10, 30, 20, 25, 30, 35, 40, 25, 50, 30]} stroke={color} strokeWidth={1} />
            <Circle x={5} y={35} radius={2} fill={color} />
          </Group>
        );
        break;
      case 'SPECTRUM_ANALYZER':
        content = (
          <Group>
            <Rect width={60} height={40} stroke={color} strokeWidth={2} fill={bgColor} cornerRadius={2} />
            <Rect x={8} y={6} width={44} height={28} fill="#020617" />
            {isActive || isSimulating ? (
               <Group>
                 {Array.from({ length: 12 }).map((_, i) => {
                    const h = 5 + Math.random() * 20;
                    return (
                      <Rect 
                        key={i} 
                        x={10 + i * 3.5} 
                        y={34 - h} 
                        width={2.5} 
                        height={h} 
                        fill="#38bdf8" 
                        opacity={0.8}
                      />
                    );
                 })}
               </Group>
            ) : (
              <Line points={[10, 32, 50, 32]} stroke="#1e293b" strokeWidth={1} />
            )}
            <Text text="dBm" x={45} y={8} fontSize={4} fill="#38bdf8" />
          </Group>
        );
        break;
      case 'PUSH_BUTTON': {
        const isOpen = comp.properties.state !== 'Closed';
        content = (
          <Group>
             <Circle x={20} y={20} radius={15} fill="#1e293b" stroke={color} strokeWidth={1} />
             <Circle x={20} y={20} radius={isOpen ? 10 : 12} fill={comp.properties.color === 'Green' ? '#22c55e' : '#ef4444'} shadowBlur={isOpen ? 0 : 10} />
             <Line points={[0, 20, 5, 20]} stroke={color} />
             <Line points={[35, 20, 40, 20]} stroke={color} />
          </Group>
        );
        break;
      }
      case 'TOGGLE_SWITCH': {
        const isOpen = comp.properties.state !== 'Closed';
        content = (
          <Group>
             <Rect width={40} height={20} y={10} fill="#1e293b" cornerRadius={4} />
             <Rect x={isOpen ? 2 : 22} y={12} width={16} height={16} fill={isOpen ? '#64748b' : '#6366f1'} cornerRadius={3} />
             <Line points={[0, 20, 40, 20]} stroke={color} strokeWidth={1} opacity={0.3} />
          </Group>
        );
        break;
      }
      case 'XOR_GATE':
        content = (
          <Group>
            <Path
              data="M0,0 Q20,20 0,40 M5,0 Q35,0 55,20 Q35,40 5,40 Q25,20 5,0"
              stroke={color}
              strokeWidth={2}
              fill={bgColor}
            />
          </Group>
        );
        break;
      case 'XNOR_GATE':
        content = (
          <Group>
            <Path
              data="M0,0 Q20,20 0,40 M5,0 Q35,0 55,20 Q35,40 5,40 Q25,20 5,0"
              stroke={color}
              strokeWidth={2}
              fill={bgColor}
            />
            <Circle x={60} y={20} radius={4} stroke={color} fill={bgColor} />
          </Group>
        );
        break;
      case 'NAND_GATE':
        content = (
          <Group>
            <Path
               data="M0,0 L30,0 Q55,0 55,20 Q55,40 30,40 L0,40 Z"
               stroke={color}
               strokeWidth={2}
               fill={bgColor}
            />
            <Circle x={60} y={20} radius={4} stroke={color} fill={bgColor} />
          </Group>
        );
        break;
      case 'NOR_GATE':
        content = (
          <Group>
            <Path
              data="M0,0 Q20,20 0,40 M5,0 Q35,0 55,20 Q35,40 5,40 Q25,20 5,0"
              stroke={color}
              strokeWidth={2}
              fill={bgColor}
            />
            <Circle x={60} y={20} radius={4} stroke={color} fill={bgColor} />
          </Group>
        );
        break;
      case 'LADDER_CONTACT_NO':
        content = (
          <Group>
             <Line points={[0, 20, 15, 20]} stroke={color} strokeWidth={2} />
             <Line points={[15, 10, 15, 30]} stroke={color} strokeWidth={2} />
             <Line points={[25, 10, 25, 30]} stroke={color} strokeWidth={2} />
             <Line points={[25, 20, 40, 20]} stroke={color} strokeWidth={2} />
             <Text text={comp.properties.tag as string} y={32} width={40} align="center" fontSize={8} fill={color} />
          </Group>
        );
        break;
      case 'LADDER_CONTACT_NC':
        content = (
          <Group>
             <Line points={[0, 20, 15, 20]} stroke={color} strokeWidth={2} />
             <Line points={[15, 10, 15, 30]} stroke={color} strokeWidth={2} />
             <Line points={[25, 10, 25, 30]} stroke={color} strokeWidth={2} />
             <Line points={[25, 20, 40, 20]} stroke={color} strokeWidth={2} />
             <Line points={[12, 30, 28, 10]} stroke={color} strokeWidth={2} />
             <Text text={comp.properties.tag as string} y={32} width={40} align="center" fontSize={8} fill={color} />
          </Group>
        );
        break;
      case 'LADDER_COIL':
        content = (
          <Group>
             <Line points={[0, 20, 10, 20]} stroke={color} strokeWidth={2} />
             <Path data="M10,10 Q5,20 10,30 M30,10 Q35,20 30,30" stroke={color} strokeWidth={2} />
             <Line points={[30, 20, 40, 20]} stroke={color} strokeWidth={2} />
             <Text text={comp.properties.tag as string} y={32} width={40} align="center" fontSize={8} fill={color} />
          </Group>
        );
        break;
      case 'MOSFET':
        content = (
          <Group>
            <Line points={[0, 20, 15, 20]} stroke={color} strokeWidth={2} />
            <Line points={[15, 5, 15, 35]} stroke={color} strokeWidth={3} />
            <Line points={[20, 5, 20, 15]} stroke={color} strokeWidth={2} />
            <Line points={[20, 15, 20, 25]} stroke={color} strokeWidth={2} />
            <Line points={[20, 25, 20, 35]} stroke={color} strokeWidth={2} />
            <Line points={[20, 10, 40, 0]} stroke={color} strokeWidth={2} />
            <Line points={[20, 30, 40, 40]} stroke={color} strokeWidth={2} />
            <Line points={[20, 20, 16, 20]} stroke={color} strokeWidth={2} />
          </Group>
        );
        break;
      default:
        content = (
          <Rect
            width={def.width}
            height={def.height}
            stroke={color}
            strokeWidth={2}
            fill={bgColor}
            cornerRadius={2}
          />
        );
    }

    return (
      <Group
        key={comp.id}
        x={comp.x}
        y={comp.y}
        rotation={comp.rotation}
        draggable={!isSimulating && selectedTool === 'SELECT'}
        onDragEnd={(e) => handleDragEnd(comp.id, e)}
        onClick={(e) => {
          e.cancelBubble = true;
          handleComponentClick(comp.id);
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          handleComponentClick(comp.id);
        }}
      >
        {content}
        <Text
          text={comp.label || def.name}
          x={0}
          y={def.height + 8}
          fontSize={10}
          fontFamily="monospace"
          fill={color}
          fontStyle="bold"
          onDblClick={(e) => {
            e.cancelBubble = true;
            const stage = e.target.getStage();
            if (!stage) return;
            const pos = e.target.getAbsolutePosition();
            setEditingLabel({ id: comp.id, text: comp.label || def.name, x: pos.x, y: pos.y });
          }}
          onTap={(e) => {
            e.cancelBubble = true;
            const stage = e.target.getStage();
            if (!stage) return;
            const pos = e.target.getAbsolutePosition();
            setEditingLabel({ id: comp.id, text: comp.label || def.name, x: pos.x, y: pos.y });
          }}
        />
        {/* Render Pins */}
        {def.pins.map((pin, i) => {
          const isHovered = hoveredPin?.compId === comp.id && hoveredPin?.pinIdx === i;
          const isPinActive = isActive && activeComponentIds.has(comp.id) && (i === def.pins.length - 1); // Simplistic out-pin glow
          const pinColor = isHovered ? '#818cf8' : (isPinActive ? '#fbbf24' : (selectedTool === 'WIRE' ? '#6366f1' : '#1e293b'));
          
          return (
            <Circle
              key={i}
              x={pin.x}
              y={pin.y}
              radius={isHovered ? 6 : (isSelected ? 5 : 3)}
              fill={pinColor}
              stroke={color}
              strokeWidth={isHovered ? 2 : 1}
              onClick={(e) => handlePinClick(comp.id, i, e)}
              onTap={(e) => handlePinClick(comp.id, i, e)}
              onMouseEnter={() => setHoveredPin({ compId: comp.id, pinIdx: i })}
              onMouseLeave={() => setHoveredPin(null)}
              shadowBlur={(isHovered || isPinActive) ? 10 : 0}
              shadowColor={isPinActive ? '#fbbf24' : '#6366f1'}
            />
          );
        })}
      </Group>
    );
  };

  const handleUpdateConnectionPoints = useCallback((id: string, newPoints: number[]) => {
    if (onUpdateConnection) {
      onUpdateConnection(id, { points: newPoints });
    } else {
      const conn = design.connections.find(c => c.id === id);
      if (conn) {
        conn.points = newPoints;
        const stage = (ref as any)?.current?.getStage?.();
        if (stage) stage.draw();
        onSelectComponent(selectedComponentId);
      }
    }
  }, [design, onSelectComponent, selectedComponentId, onUpdateConnection]);

  const renderConnection = (conn: Connection) => {
    const fromComp = design.components.find(c => c.id === conn.from);
    const toComp = design.components.find(c => c.id === conn.to);
    if (!fromComp || !toComp) return null;

    const fromDef = COMPONENT_DEFINITIONS[fromComp.type];
    const toDef = COMPONENT_DEFINITIONS[toComp.type];
    
    if (!fromDef || !toDef) return null;
    const fromPin = fromDef.pins[conn.fromPin];
    const toPin = toDef.pins[conn.toPin];
    if (!fromPin || !toPin) return null;

    const start = getRotatedPos(fromComp, fromPin);
    const end = getRotatedPos(toComp, toPin);
    const isActive = activeConnectionIds.has(conn.id);
    const isSelected = selectedComponentId === conn.id;

    return (
      <InteractiveKonvaWire
        key={conn.id}
        id={conn.id}
        start={start}
        end={end}
        points={conn.points}
        isActive={isActive}
        isSelected={isSelected}
        isHovered={false}
        color={conn.color}
        thickness={conn.thickness}
        routing={conn.routing}
        onUpdatePoints={handleUpdateConnectionPoints}
        onSelect={() => {
          if (selectedTool === 'DELETE') {
            onRemoveConnection(conn.id);
          } else {
            onSelectComponent(conn.id);
          }
        }}
      />
    );
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-950 relative cursor-crosshair overflow-hidden shadow-inner flex-1">
      {/* Canvas Controls Overlay */}
      <div className="absolute top-6 right-6 z-30 flex flex-col gap-2">
         <button 
           onClick={() => (ref as any).current?.zoomIn()}
           className="w-10 h-10 bg-slate-900/80 border border-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-600 transition-all backdrop-blur-xl shadow-2xl"
           title="Zoom In"
         >
            <Zap size={18} />
         </button>
         <button 
           onClick={() => (ref as any).current?.zoomOut()}
           className="w-10 h-10 bg-slate-900/80 border border-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-600 transition-all backdrop-blur-xl shadow-2xl"
           title="Zoom Out"
         >
            <Activity size={18} />
         </button>
         <button 
           onClick={() => (ref as any).current?.zoomFit()}
           className="w-10 h-10 bg-indigo-600 border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-indigo-500 transition-all backdrop-blur-xl shadow-2xl shadow-indigo-600/20"
           title="Focus Components"
         >
            <RefreshCcw size={18} />
         </button>
      </div>

      <div className="absolute inset-0 z-0 pointer-events-none opacity-20" 
           style={{ 
             backgroundImage: 'linear-gradient(rgba(99,102,241,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.1) 1px, transparent 1px)', 
             backgroundSize: `${GRID_SIZE * 2}px ${GRID_SIZE * 2}px`,
             transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`
           }} 
      />
      <div className="absolute inset-0 z-0 pointer-events-none opacity-10" 
           style={{ 
             backgroundImage: 'radial-gradient(rgba(99,102,241,0.2) 1px, transparent 1px)', 
             backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
             transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`
           }} 
      />

      {editingLabel && (
        <input
          autoFocus
          className="absolute z-50 bg-slate-900 border border-indigo-500 text-slate-200 text-[10px] font-mono px-1 py-0.5 outline-none rounded"
          style={{ 
            left: editingLabel.x, 
            top: editingLabel.y - 14,
            minWidth: '60px'
          }}
          value={editingLabel.text}
          onChange={(e) => setEditingLabel(prev => prev ? { ...prev, text: e.target.value } : null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onUpdateComponent(editingLabel.id, { label: editingLabel.text });
              setEditingLabel(null);
            } else if (e.key === 'Escape') {
              setEditingLabel(null);
            }
          }}
          onBlur={() => {
            onUpdateComponent(editingLabel.id, { label: editingLabel.text });
            setEditingLabel(null);
          }}
        />
      )}
      
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        draggable={selectedTool === 'SELECT' && !selectedComponentId}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        ref={stageRef}
        onWheel={handleWheel}
        onClick={(e) => {
          if (e.target === stageRef?.current) {
            onSelectComponent(null);
            setWiringState(null);
          }
        }}
        onDragEnd={(e) => {
          if (e.target === stageRef?.current) {
            setPosition({ x: e.target.x(), y: e.target.y() });
          }
        }}
        onMouseMove={(e) => {
          const stage = e.target.getStage();
          if (!stage) return;
          const pointer = stage.getPointerPosition();
          if (pointer) {
            const stagePos = {
              x: (pointer.x - stage.x()) / stage.scaleX(),
              y: (pointer.y - stage.y()) / stage.scaleY()
            };
            setMousePos(stagePos);
          }
        }}
      >
        <Layer ref={layerRef}>
          {design.connections.map(renderConnection)}
          {design.components.map(renderComponentShape)}
          
          {selectedTool === 'WIRE' && !hoveredPin && mousePos.x !== 0 && (
            <Circle 
              x={snapToGrid(mousePos.x)} 
              y={snapToGrid(mousePos.y)} 
              radius={2} 
              fill="#6366f1" 
              opacity={0.4}
              pointerEvents="none"
            />
          )}

          {wiringState && (
            <Line
              points={
                mousePos.x !== 0 
                  ? calculateOrthogonalPoints({ x: wiringState.x, y: wiringState.y }, mousePos, wiringState.routing)
                  : [wiringState.x, wiringState.y, wiringState.x, wiringState.y]
              }
              stroke="#6366f1"
              strokeWidth={2}
              dash={[4, 2]}
              lineJoin="round"
              opacity={0.6}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}));

export default SchematicCanvas;
