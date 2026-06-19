import React, { useRef, useEffect, useState } from 'react';
import interact from 'interactjs';
import { 
  LadderState, 
  LadderNode, 
  NODE_WIDTH, 
  NODE_HEIGHT, 
  LEFT_RAIL_X, 
  RIGHT_RAIL_X, 
  GRID_SIZE,
  RUNG_HEIGHT,
  NodeType
} from '@/lib/plc-types';
import { clsx } from 'clsx';
import { Trash2, Edit2 } from 'lucide-react';
import { playClick, playConnect } from '@/lib/audio';

interface LadderCanvasProps {
  state: LadderState;
  selectedId: string | null;
  viewport: { x: number; y: number; zoom: number };
  placementType: NodeType | 'wire' | null;
  onSelect: (id: string | null) => void;
  onUpdateNode: (id: string, updates: Partial<LadderNode>) => void;
  onUpdateNodeDragging?: (id: string, updates: Partial<LadderNode>) => void;
  onToggleAddress: (address: string) => void;
  onViewportChange: (viewport: { x: number; y: number; zoom: number }) => void;
  onCanvasClick: (x: number, y: number) => void;
  onNodeDoubleClick: (id: string) => void;
  onRungAction?: (rungIndex: number, action: 'delete' | 'edit-comment') => void;
  onAddWire?: (fromId: string, fromSide: 'left' | 'right', toId: string, toSide: 'left' | 'right') => void;
  onDeleteWire?: (id: string) => void;
}

// Memoized Node Component for performance
const MemoizedLadderNode = React.memo<{
  node: LadderNode;
  selected: boolean;
  simulationValue: any;
  isPowerActive?: boolean;
  placementType: string | null;
  wiringState: { fromId: string; fromSide: 'left' | 'right' } | null;
  isSnappedLeft?: boolean;
  isSnappedRight?: boolean;
  onSelect: (id: string) => void;
  onToggle: (addr: string) => void;
  onDoubleClick: (id: string) => void;
  onTerminalClick: (id: string, side: 'left' | 'right', x: number, y: number) => void;
  renderSymbol: (node: LadderNode) => React.ReactNode;
}>(({ 
  node, 
  selected, 
  simulationValue, 
  isPowerActive = false,
  placementType, 
  wiringState, 
  isSnappedLeft = false,
  isSnappedRight = false,
  onSelect, 
  onToggle, 
  onDoubleClick, 
  onTerminalClick,
  renderSymbol 
}) => {
  const isConducting = isPowerActive;
  const clickStartRef = React.useRef<{ x: number; y: number } | null>(null);

  return (
    <g 
      data-id={node.id}
      className={clsx(
        "ladder-node-g pointer-events-auto cursor-grab group",
        selected && "selected"
      )}
      transform={`translate(${node.x}, ${node.y})`}
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect(node.id);
        clickStartRef.current = { x: e.clientX, y: e.clientY };
      }}
      onMouseUp={(e) => {
        e.stopPropagation();
        if (clickStartRef.current) {
          const dx = Math.abs(e.clientX - clickStartRef.current.x);
          const dy = Math.abs(e.clientY - clickStartRef.current.y);
          if (dx < 6 && dy < 6) {
            if (node.type.startsWith('contact')) {
              onToggle(node.address);
            }
          }
          clickStartRef.current = null;
        }
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick(node.id);
      }}
    >
      {/* Selection Box */}
      {selected && (
        <rect 
          x={-4} 
          y={-4} 
          width={node.width + 8} 
          height={node.height + 8} 
          fill="none" 
          stroke="#3b82f6" 
          strokeWidth={2} 
          strokeDasharray="4 2"
          className="animate-pulse"
        />
      )}

      <g 
        className={clsx(
          "symbol-group transition-colors duration-100",
          isConducting ? "text-emerald-400" : "text-slate-400"
        )}
        filter={isConducting ? "url(#energized)" : undefined}
      >
        <rect width={node.width} height={node.height} fill="#0d0e12" fillOpacity={0.95} stroke="rgba(255,255,255,0.07)" strokeWidth={1} rx={4} />
        {renderSymbol(node)}
        
        {/* Labels */}
        {node.type !== 'wire-junction' && (
          <text 
            y={-12} 
            x={node.width / 2} 
            textAnchor="middle" 
            className="text-[10px] font-mono fill-sky-400 font-bold tracking-tight"
          >
            {node.address}
          </text>
        )}
        
        {node.tag && node.type !== 'wire-junction' && (
          <g transform={`translate(${node.width/2}, -32)`}>
            <rect x={-35} y={0} width={70} height={14} fill="#141720" rx={3} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
            <text 
              y={10} 
              textAnchor="middle" 
              className="text-[8px] font-mono fill-slate-400 font-medium"
            >
              {node.tag}
            </text>
          </g>
        )}

        {/* Live Physical Device Linker Status Badge */}
        {node.deviceProfile && node.deviceProfile.deviceType !== 'none' && (
          <g transform={`translate(${node.width/2}, ${node.height + 15})`}>
            <rect x={-45} y={-8} width={90} height={13} rx={4} fill="#ec4899" fillOpacity={0.12} stroke="#ec4899" strokeOpacity={0.4} strokeWidth={1} />
            <text 
              y={1} 
              textAnchor="middle" 
              className="fill-pink-400 font-mono font-black text-[7.5px] uppercase tracking-wider"
            >
              {node.deviceProfile.deviceType === 'motor' && '⚡ '}
              {node.deviceProfile.deviceType === 'piston' && '⚙️ '}
              {node.deviceProfile.deviceType === 'valve' && '💧 '}
              {node.deviceProfile.deviceType === 'light' && '🚨 '}
              {node.deviceProfile.deviceType === 'siren' && '🔊 '}
              {node.deviceProfile.deviceType === 'heater' && '🔥 '}
              {node.deviceProfile.deviceType}: {Math.round(node.deviceProfile.currentPercent || 0)}%
            </text>
          </g>
        )}
      </g>

      {/* Interaction Overlay */}
      <rect 
        width={node.width} 
        height={node.height} 
        fill="transparent" 
        className="cursor-move"
      />

      {/* Terminals (Ports) - Always highly accessible and styled beautifully under Siemens/Rockwell aesthetic */}
      <g className="transition-all duration-200">
        {/* Terminal Left */}
        <g 
          transform={`translate(0, ${node.height / 2})`}
          className="pointer-events-auto group/term cursor-crosshair"
          onMouseDown={(e) => {
            e.stopPropagation();
            onTerminalClick(node.id, 'left', node.x, node.y + node.height / 2);
          }}
        >
          {/* Decorative Anchors (Sleek Outer Ring and Core) */}
          <circle 
            r={isSnappedLeft ? 8 : 5} 
            fill="#0d0e12" 
            stroke={isSnappedLeft ? "#10b981" : (wiringState?.fromId === node.id && wiringState?.fromSide === 'left' ? "#ef4444" : "#38bdf8")} 
            strokeWidth={isSnappedLeft ? 3.5 : 1.5}
            className={clsx(
              "transition-all duration-150 group-hover/term:scale-125 group-hover/term:stroke-sky-400",
              isSnappedLeft ? "stroke-emerald-400 drop-shadow-[0_0_8px_rgb(52,211,153)] fill-emerald-500/20 animate-pulse" : (wiringState?.fromId === node.id && wiringState?.fromSide === 'left' ? "fill-rose-500/20 stroke-rose-500 animate-pulse" : "fill-sky-500/10")
            )}
          />
          <circle 
            r={isSnappedLeft ? 3 : 1.8} 
            fill={isSnappedLeft ? "#10b981" : (wiringState?.fromId === node.id && wiringState?.fromSide === 'left' ? "#ef4444" : "#0284c7")}
            className="transition-all duration-150 group-hover/term:scale-125 group-hover/term:fill-sky-400"
          />
          
          {/* Large, forgiving hit target for seamless clicks */}
          <circle 
            r={24} 
            fill="transparent" 
            className="cursor-crosshair"
          />
        </g>

        {/* Terminal Right */}
        <g 
          transform={`translate(${node.width}, ${node.height / 2})`}
          className="pointer-events-auto group/term cursor-crosshair"
          onMouseDown={(e) => {
            e.stopPropagation();
            onTerminalClick(node.id, 'right', node.x + node.width, node.y + node.height / 2);
          }}
        >
          {/* Decorative Anchors (Sleek Outer Ring and Core) */}
          <circle 
            r={isSnappedRight ? 8 : 5} 
            fill="#0d0e12" 
            stroke={isSnappedRight ? "#10b981" : (wiringState?.fromId === node.id && wiringState?.fromSide === 'right' ? "#ef4444" : "#38bdf8")} 
            strokeWidth={isSnappedRight ? 3.5 : 1.5}
            className={clsx(
              "transition-all duration-150 group-hover/term:scale-125 group-hover/term:stroke-sky-400",
              isSnappedRight ? "stroke-emerald-400 drop-shadow-[0_0_8px_rgb(52,211,153)] fill-emerald-500/20 animate-pulse" : (wiringState?.fromId === node.id && wiringState?.fromSide === 'right' ? "fill-rose-500/20 stroke-rose-500 animate-pulse" : "fill-sky-500/10")
            )}
          />
          <circle 
            r={isSnappedRight ? 3 : 1.8} 
            fill={isSnappedRight ? "#10b981" : (wiringState?.fromId === node.id && wiringState?.fromSide === 'right' ? "#ef4444" : "#0284c7")}
            className="transition-all duration-150 group-hover/term:scale-125 group-hover/term:fill-sky-400"
          />
          
          {/* Large, forgiving hit target for seamless clicks */}
          <circle 
            r={24} 
            fill="transparent" 
            className="cursor-crosshair"
          />
        </g>
      </g>
    </g>
  );
});

export function LadderCanvas({ 
  state, 
  selectedId, 
  viewport, 
  placementType,
  onSelect, 
  onUpdateNode, 
  onUpdateNodeDragging,
  onToggleAddress,
  onViewportChange,
  onCanvasClick,
  onNodeDoubleClick,
  onRungAction,
  onAddWire,
  onDeleteWire
}: LadderCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const ghostRef = useRef<SVGGElement>(null);
  const wiringPreviewRef = useRef<SVGPathElement>(null);
  const vGuideRef = useRef<SVGLineElement>(null);
  const hGuideRef = useRef<SVGLineElement>(null);
  const [wiringState, setWiringState] = useState<{fromId: string; fromSide: 'left' | 'right'; x: number; y: number} | null>(null);
  const [activeSnap, setActiveSnap] = useState<{ nodeId: string; side: 'left' | 'right'; x: number; y: number } | null>(null);

  const viewportRef = useRef(viewport);
  const stateRef = useRef(state);
  const placementTypeRef = useRef(placementType);
  const wiringStateRef = useRef<{fromId: string; fromSide: 'left' | 'right'; x: number; y: number} | null>(wiringState);
  const activeSnapRef = useRef<{ nodeId: string; side: 'left' | 'right'; x: number; y: number } | null>(activeSnap);

  useEffect(() => {
    viewportRef.current = viewport;
    stateRef.current = state;
    placementTypeRef.current = placementType;
    wiringStateRef.current = wiringState;
    activeSnapRef.current = activeSnap;
  }, [viewport, state, placementType, wiringState, activeSnap]);

  // Performance: Memoize nodes grouped by rung
  const nodesByRung = React.useMemo(() => {
    const rungs: Record<number, LadderNode[]> = {};
    state.nodes.forEach(node => {
      const rungIdx = Math.round((node.y + node.height / 2 - RUNG_HEIGHT / 2) / RUNG_HEIGHT);
      if (!rungs[rungIdx]) rungs[rungIdx] = [];
      rungs[rungIdx].push(node);
    });
    return rungs;
  }, [state.nodes]);

  // Initialize interactjs for dragging
  useEffect(() => {
    const interactable = interact('.ladder-node-g');
    
    interactable.draggable({
      inertia: false,
      autoScroll: true,
      listeners: {
        start(event) {
          const id = event.target.dataset.id;
          if (!id) return;
          const node = stateRef.current.nodes.find(n => n.id === id);
          if (!node) return;
          
          event.target.setAttribute('data-start-x', node.x.toString());
          event.target.setAttribute('data-start-y', node.y.toString());
          event.target.setAttribute('data-drag-dx', '0');
          event.target.setAttribute('data-drag-dy', '0');
          event.target.setAttribute('data-last-snapped-x', node.x.toString());
          event.target.setAttribute('data-last-snapped-y', node.y.toString());
        },
        move(event) {
          if (placementTypeRef.current === 'wire') return;

          const id = event.target.dataset.id;
          if (!id) return;

          const startX = parseFloat(event.target.getAttribute('data-start-x'));
          const startY = parseFloat(event.target.getAttribute('data-start-y'));
          if (isNaN(startX) || isNaN(startY)) return;

          const { zoom } = viewportRef.current;
          const currentDx = parseFloat(event.target.getAttribute('data-drag-dx')) || 0;
          const currentDy = parseFloat(event.target.getAttribute('data-drag-dy')) || 0;

          const nextDx = currentDx + event.dx / zoom;
          const nextDy = currentDy + event.dy / zoom;

          event.target.setAttribute('data-drag-dx', nextDx.toString());
          event.target.setAttribute('data-drag-dy', nextDy.toString());

          const nextX = startX + nextDx;
          const nextY = startY + nextDy;

          const snappedX = Math.round(nextX / GRID_SIZE) * GRID_SIZE;
          const snappedY = Math.round(nextY / GRID_SIZE) * GRID_SIZE;

          const lastX = parseFloat(event.target.getAttribute('data-last-snapped-x')) || 0;
          const lastY = parseFloat(event.target.getAttribute('data-last-snapped-y')) || 0;

          if (snappedX !== lastX || snappedY !== lastY) {
            event.target.setAttribute('data-last-snapped-x', snappedX.toString());
            event.target.setAttribute('data-last-snapped-y', snappedY.toString());
            onUpdateNodeDragging?.(id, { x: snappedX, y: snappedY });
            playClick(); // High-fidelity grid tactile micro-feedback!
          }
        },
        end(event) {
          const id = event.target.dataset.id;
          if (!id) return;

          const startX = parseFloat(event.target.getAttribute('data-start-x'));
          const startY = parseFloat(event.target.getAttribute('data-start-y'));
          const dx = parseFloat(event.target.getAttribute('data-drag-dx')) || 0;
          const dy = parseFloat(event.target.getAttribute('data-drag-dy')) || 0;

          if (isNaN(startX) || isNaN(startY)) return;

          const rawEndX = startX + dx;
          const rawEndY = startY + dy;
          const snappedX = Math.round(rawEndX / GRID_SIZE) * GRID_SIZE;
          const snappedY = Math.round(rawEndY / GRID_SIZE) * GRID_SIZE;

          onUpdateNode(id, { x: snappedX, y: snappedY });
          playConnect(); // Positive chime on snapped lock-in
        }
      }
    });

    return () => {
      interactable.unset();
    };
  }, [onUpdateNode, onUpdateNodeDragging]); 


  // Panning logic - improved for reliability
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking the background background
    const target = e.target as HTMLElement;
    if (target.closest('.ladder-node-g')) return;
    
    // Middle click OR Left click with no placement mode
    if (e.button !== 1 && e.button !== 0) return;
    if (e.button === 0 && placementType) return; // Don't pan if placing

    const startX = e.clientX - viewport.x;
    const startY = e.clientY - viewport.y;
    let hasMoved = false;

    const handleMouseMove = (mv: MouseEvent) => {
      if (Math.abs(mv.clientX - (startX + viewport.x)) > 5 || Math.abs(mv.clientY - (startY + viewport.y)) > 5) {
        hasMoved = true;
      }
      onViewportChange({
        ...viewport,
        x: mv.clientX - startX,
        y: mv.clientY - startY
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Zoom if Ctrl or Cmd is held, or if scrolling is rapid zoom-gestured
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      onViewportChange({
        ...viewport,
        zoom: Math.max(0.2, Math.min(3, viewport.zoom * delta))
      });
    } else {
      // Natural 2D trackpad panning or mouse wheel vertical/horizontal scrolling
      onViewportChange({
        ...viewport,
        x: viewport.x - e.deltaX,
        y: viewport.y - e.deltaY
      });
    }
  };

  const renderNodeSymbol = (node: LadderNode) => {
    const isEnergized = state.simulation.values[node.address];
    const isNC = node.type === 'contact-nc';
    const halfH = node.height / 2;
    const midX = node.width / 2;
    
    // Industrial Symbols (Apple Refinement)
    if (node.type.startsWith('contact')) {
      const padX = 12; // distance from center line
      return (
        <g className="symbol-contact">
          <line x1={0} y1={halfH} x2={midX - padX} y2={halfH} stroke="currentColor" strokeWidth={2.5} />
          <line x1={midX - padX} y1={6} x2={midX - padX} y2={node.height - 6} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
          <line x1={midX + padX} y1={6} x2={midX + padX} y2={node.height - 6} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
          <line x1={midX + padX} y1={halfH} x2={node.width} y2={halfH} stroke="currentColor" strokeWidth={2.5} />
          {isNC && (
            <line x1={midX - padX} y1={node.height - 6} x2={midX + padX} y2={6} stroke="currentColor" strokeWidth={2.5} />
          )}
        </g>
      );
    }
    
    if (node.type === 'coil' || node.type === 'coil-latch' || node.type === 'coil-unlatch') {
      const isLatch = node.type === 'coil-latch';
      const isUnlatch = node.type === 'coil-unlatch';
      const padX = 12; // distance from center line
      return (
        <g className="symbol-coil">
          <line x1={0} y1={halfH} x2={midX - padX} y2={halfH} stroke="currentColor" strokeWidth={2.5} />
          <path d={`M ${midX - padX} 6 Q ${midX - padX - 8} ${halfH} ${midX - padX} ${node.height - 6}`} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
          <path d={`M ${midX + padX} 6 Q ${midX + padX + 8} ${halfH} ${midX + padX} ${node.height - 6}`} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
          <line x1={midX + padX} y1={halfH} x2={node.width} y2={halfH} stroke="currentColor" strokeWidth={2.5} />
          {isLatch && <text x={midX} y={halfH + 4} textAnchor="middle" fontSize={11} fontWeight="900" fill="currentColor" className="font-sans">L</text>}
          {isUnlatch && <text x={midX} y={halfH + 4} textAnchor="middle" fontSize={11} fontWeight="900" fill="currentColor" className="font-sans">U</text>}
        </g>
      );
    }

    if (node.type === 'one-shot') {
      return (
        <g className="symbol-ons">
           <line x1={0} y1={halfH} x2={node.width} y2={halfH} stroke="currentColor" strokeWidth={1} />
           <rect x={midX - 24} y={halfH - 10} width={48} height={20} fill="#090a0d" stroke="currentColor" strokeWidth={2} />
           <text x={midX} y={halfH + 3} textAnchor="middle" fontSize={8} fontWeight="black" fill="currentColor" className="font-mono">ONS</text>
        </g>
      );
    }

    const isAdvanced = node.type === 'pid-controller' || node.type === 'scale-param' || node.type === 'limit-test' || node.type === 'alarm-block';
    
    if (node.type.startsWith('timer') || node.type.startsWith('counter') || node.type === 'reset' || node.type.startsWith('compare') || node.type.startsWith('math') || isAdvanced) {
       const accum = state.simulation.values[`${node.address}_ACC`] || 0;
       const dnVal = state.simulation.values[`${node.address}_DN`];
       
       let label = '???';
       if (node.type === 'timer-on') label = 'TON';
       else if (node.type === 'timer-off') label = 'TOF';
       else if (node.type === 'retentive-timer') label = 'RTO';
       else if (node.type === 'counter-up') label = 'CTU';
       else if (node.type === 'counter-down') label = 'CTD';
       else if (node.type === 'reset') label = 'RES';
       else if (node.type === 'compare-eq') label = 'EQU';
       else if (node.type === 'compare-ne') label = 'NEQ';
       else if (node.type === 'compare-lt') label = 'LES';
       else if (node.type === 'compare-gt') label = 'GRT';
       else if (node.type === 'math-add') label = 'ADD';
       else if (node.type === 'math-sub') label = 'SUB';
       else if (node.type === 'math-mul') label = 'MUL';
       else if (node.type === 'math-div') label = 'DIV';
       else if (node.type === 'math-mov') label = 'MOV';
       else if (node.type === 'math-sin') label = 'SIN';
       else if (node.type === 'math-cos') label = 'COS';
       else if (node.type === 'math-tan') label = 'TAN';
       else if (node.type === 'pid-controller') label = 'PID';
       else if (node.type === 'scale-param') label = 'SCP';
       else if (node.type === 'limit-test') label = 'LIM';
       else if (node.type === 'alarm-block') label = 'ALM';

       const isCompare = node.type.startsWith('compare');
       const isMath = node.type.startsWith('math');
       const isTimer = node.type.startsWith('timer');
       const isCounter = node.type.startsWith('counter');

       const bW = node.width - 24;
       const bH = node.height - 8;
       const bX = 12;
       const bY = 4;

       return (
         <g className="symbol-block">
            <rect x={bX} y={bY} width={bW} height={bH} rx={2} stroke="currentColor" strokeWidth={1.5} fill="#090a0d" />
            <text x={midX} y={bY + 10} textAnchor="middle" fontSize={7} fill="#38bdf8" fontWeight="900" className="tracking-tighter font-mono">
              {label}
            </text>
            
            {(isTimer || isCounter) && (
              <>
                <text x={bX + 8} y={bY + 18} textAnchor="start" fontSize={6} fill="currentColor" opacity={0.6} className="font-mono">
                  PRE:
                </text>
                <text x={bX + bW - 8} y={bY + 18} textAnchor="end" fontSize={6} fill="#f1f5f9" className="font-mono font-bold">
                  {node.params?.preset || 0}
                </text>
                <text x={bX + 8} y={bY + 28} textAnchor="start" fontSize={6} fill="currentColor" opacity={0.6} className="font-mono">
                  ACC:
                </text>
                <text x={bX + bW - 8} y={bY + 28} textAnchor="end" fontSize={6} fill="#f1f5f9" className={clsx("font-mono font-bold", dnVal && "text-emerald-400 drop-shadow-[0_0_4px_#10b981]")}>
                  {isTimer ? (Number(accum)/1000).toFixed(1) : accum}
                </text>
                <rect x={bX + bW - 10} y={bY + 2} width={8} height={8} rx={1} fill={dnVal ? "#10b981" : "#1e293b"} stroke={dnVal ? "#059669" : "#334155"} strokeWidth={0.8} />
                <text x={bX + bW - 13} y={bY + 8} textAnchor="end" fontSize={5} fill={dnVal ? "#10b981" : "#475569"} fontWeight="bold">DN</text>
              </>
            )}

            {(isCompare || isMath) && (
              <>
                <text x={bX + 8} y={bY + 18} textAnchor="start" fontSize={5} fill="currentColor" opacity={0.6} className="font-mono">
                  Src A:
                </text>
                <text x={bX + bW - 8} y={bY + 18} textAnchor="end" fontSize={5} fill="#f1f5f9" className="font-mono font-bold">
                  {node.params?.sourceA || 0}
                </text>
                <text x={bX + 8} y={bY + 26} textAnchor="start" fontSize={5} fill="currentColor" opacity={0.6} className="font-mono">
                  Src B:
                </text>
                <text x={bX + bW - 8} y={bY + 26} textAnchor="end" fontSize={5} fill="#f1f5f9" className="font-mono font-bold">
                  {node.params?.sourceB || 0}
                </text>
                {isMath && (
                  <>
                    <text x={bX + 8} y={bY + 34} textAnchor="start" fontSize={5} fill="currentColor" opacity={0.6} className="font-mono">
                      Dest:
                    </text>
                    <text x={bX + bW - 8} y={bY + 34} textAnchor="end" fontSize={5} fill="#f1f5f9" className="font-mono font-bold">
                      {node.params?.dest || node.address}
                    </text>
                  </>
                )}
              </>
            )}

            {isAdvanced && node.type === 'pid-controller' && (
              <>
                <text x={bX + 8} y={bY + 18} textAnchor="start" fontSize={4.5} fill="currentColor" opacity={0.6} className="font-mono">SP:</text>
                <text x={bX + bW - 8} y={bY + 18} textAnchor="end" fontSize={4.5} fill="#f1f5f9" className="font-mono">{node.params?.sp || 0}</text>
                <text x={bX + 8} y={bY + 24} textAnchor="start" fontSize={4.5} fill="currentColor" opacity={0.6} className="font-mono">PV:</text>
                <text x={bX + bW - 8} y={bY + 24} textAnchor="end" fontSize={4.5} fill="#f1f5f9" className="font-mono">{node.params?.pv || 0}</text>
                <text x={bX + 8} y={bY + 30} textAnchor="start" fontSize={4.5} fill="currentColor" opacity={0.6} className="font-mono">CV:</text>
                <text x={bX + bW - 8} y={bY + 30} textAnchor="end" fontSize={4.5} fill="#10b981" className="font-mono font-bold">{node.params?.cv || node.address}</text>
              </>
            )}

            {isAdvanced && node.type === 'scale-param' && (
              <>
                <text x={bX + 8} y={bY + 16} textAnchor="start" fontSize={4.5} fill="currentColor" opacity={0.6} className="font-mono">In(A):</text>
                <text x={bX + bW - 8} y={bY + 16} textAnchor="end" fontSize={4.5} fill="#f1f5f9" className="font-mono">{node.params?.sourceA || 0}</text>
                <text x={bX + 8} y={bY + 22} textAnchor="start" fontSize={4.5} fill="currentColor" opacity={0.6} className="font-mono">InMax:</text>
                <text x={bX + bW - 8} y={bY + 22} textAnchor="end" fontSize={4.5} fill="#f1f5f9" className="font-mono">{node.params?.inMax || 0}</text>
                <text x={bX + 8} y={bY + 28} textAnchor="start" fontSize={4.5} fill="currentColor" opacity={0.6} className="font-mono">OutMax:</text>
                <text x={bX + bW - 8} y={bY + 28} textAnchor="end" fontSize={4.5} fill="#f1f5f9" className="font-mono">{node.params?.outMax || 0}</text>
                <text x={bX + 8} y={bY + 34} textAnchor="start" fontSize={4.5} fill="currentColor" opacity={0.6} className="font-mono">Dest:</text>
                <text x={bX + bW - 8} y={bY + 34} textAnchor="end" fontSize={4.5} fill="#10b981" className="font-mono">{node.params?.dest || node.address}</text>
              </>
            )}

            {isAdvanced && (node.type === 'limit-test' || node.type === 'alarm-block') && (
              <>
                <text x={bX + 8} y={bY + 18} textAnchor="start" fontSize={4.5} fill="currentColor" opacity={0.6} className="font-mono">Test:</text>
                <text x={bX + bW - 8} y={bY + 18} textAnchor="end" fontSize={4.5} fill="#f1f5f9" className="font-mono font-bold">{node.params?.testVal || 0}</text>
                <text x={bX + 8} y={bY + 26} textAnchor="start" fontSize={4.5} fill="currentColor" opacity={0.6} className="font-mono">High:</text>
                <text x={bX + bW - 8} y={bY + 26} textAnchor="end" fontSize={4.5} fill="#f1f5f9" className="font-mono">{node.params?.highLimit || 0}</text>
                {node.type === 'limit-test' && (
                  <>
                    <text x={bX + 8} y={bY + 34} textAnchor="start" fontSize={4.5} fill="currentColor" opacity={0.6} className="font-mono">Low:</text>
                    <text x={bX + bW - 8} y={bY + 34} textAnchor="end" fontSize={4.5} fill="#f1f5f9" className="font-mono">{node.params?.lowLimit || 0}</text>
                  </>
                )}
              </>
            )}

            <line x1={0} y1={halfH} x2={bX} y2={halfH} stroke="currentColor" strokeWidth={1.5} />
            <line x1={bX + bW} y1={halfH} x2={node.width} y2={halfH} stroke="currentColor" strokeWidth={1.5} />
         </g>
       );
    }

    if (node.type === 'branch-start' || node.type === 'branch-end' || node.type === 'wire-vertical' || node.type === 'wire-junction') {
      return (
        <g className="symbol-wire">
          {node.type === 'branch-start' && (
            <>
              <line x1={0} y1={node.height/2} x2={node.width} y2={node.height/2} stroke="currentColor" strokeWidth={2.5} />
              <line x1={24} y1={node.height/2} x2={24} y2={RUNG_HEIGHT} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
            </>
          )}
          {node.type === 'branch-end' && (
            <>
              <line x1={0} y1={node.height/2} x2={node.width} y2={node.height/2} stroke="currentColor" strokeWidth={2.5} />
              <line x1={node.width - 24} y1={node.height/2} x2={node.width - 24} y2={RUNG_HEIGHT} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
            </>
          )}
          {node.type === 'wire-vertical' && (
            <line x1={node.width/2} y1={-RUNG_HEIGHT/2} x2={node.width/2} y2={RUNG_HEIGHT/2} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
          )}
          {node.type === 'wire-junction' && (
             <circle cx={node.width/2} cy={node.height/2} r={4} fill="currentColor" />
          )}
        </g>
      );
    }

    return <rect width={node.width} height={node.height} fill="none" stroke="currentColor" strokeDasharray="4 2" />;
  };

  const handleMouseMoveGlobal = (e: React.MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const { x: vX, y: vY, zoom } = viewportRef.current;
    const rawX = (e.clientX - rect.left - vX) / zoom;
    const rawY = (e.clientY - rect.top - vY) / zoom;

    const snappedX = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
    const snappedY = Math.round((rawY - RUNG_HEIGHT / 2) / RUNG_HEIGHT) * RUNG_HEIGHT + (RUNG_HEIGHT / 2 - NODE_HEIGHT / 2);

    // Update Guides (Direct DOM)
    if (vGuideRef.current && hGuideRef.current) {
      const isPlacing = placementTypeRef.current;
      if (isPlacing) {
        vGuideRef.current.setAttribute('x1', snappedX.toString());
        vGuideRef.current.setAttribute('x2', snappedX.toString());
        vGuideRef.current.style.display = 'block';
        
        hGuideRef.current.setAttribute('y1', (snappedY + NODE_HEIGHT/2).toString());
        hGuideRef.current.setAttribute('y2', (snappedY + NODE_HEIGHT/2).toString());
        hGuideRef.current.style.display = 'block';
      } else {
        vGuideRef.current.style.display = 'none';
        hGuideRef.current.style.display = 'none';
      }
    }

    // Update Ghost (Direct DOM)
    if (ghostRef.current) {
      const snappedX = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
      const snappedY = Math.round((rawY - RUNG_HEIGHT / 2) / RUNG_HEIGHT) * RUNG_HEIGHT + (RUNG_HEIGHT / 2 - NODE_HEIGHT / 2);
      ghostRef.current.setAttribute('transform', `translate(${snappedX}, ${snappedY})`);
      ghostRef.current.style.display = placementTypeRef.current && placementTypeRef.current !== 'wire' ? 'block' : 'none';
    }

    // Smart Magnet Snapping Calculation for wiring
    let bestSnap: { nodeId: string; side: 'left' | 'right'; x: number; y: number } | null = null;
    let minDistance = 35; // 35px snap radius in canvas units

    if (wiringStateRef.current) {
      const fromId = wiringStateRef.current.fromId;
      const fromSide = wiringStateRef.current.fromSide;

      for (const node of stateRef.current.nodes) {
        // Left Pin
        const lx = node.x;
        const ly = node.y + node.height / 2;
        if (!(node.id === fromId && fromSide === 'left')) {
          const dist = Math.hypot(rawX - lx, rawY - ly);
          if (dist < minDistance) {
            minDistance = dist;
            bestSnap = { nodeId: node.id, side: 'left', x: lx, y: ly };
          }
        }

        // Right Pin
        const rx = node.x + node.width;
        const ry = node.y + node.height / 2;
        if (!(node.id === fromId && fromSide === 'right')) {
          const dist = Math.hypot(rawX - rx, rawY - ry);
          if (dist < minDistance) {
            minDistance = dist;
            bestSnap = { nodeId: node.id, side: 'right', x: rx, y: ry };
          }
        }
      }
    }

    // Performance: Only update state when we enter/exit a snap target to avoid rendering lag
    const prevSnap = activeSnapRef.current;
    if (bestSnap?.nodeId !== prevSnap?.nodeId || bestSnap?.side !== prevSnap?.side) {
      activeSnapRef.current = bestSnap;
      setActiveSnap(bestSnap);
    }

    // Update Wiring Preview (Direct DOM with snap coordinates if valid)
    if (wiringPreviewRef.current && wiringStateRef.current) {
      const sw = wiringStateRef.current;
      const targetX = bestSnap ? bestSnap.x : rawX;
      const targetY = bestSnap ? bestSnap.y : rawY;
      const midX = (sw.x + targetX) / 2;
      const d = `M ${sw.x} ${sw.y} L ${midX} ${sw.y} L ${midX} ${targetY} L ${targetX} ${targetY}`;
      wiringPreviewRef.current.setAttribute('d', d);
      wiringPreviewRef.current.style.display = 'block';
    } else if (wiringPreviewRef.current) {
      wiringPreviewRef.current.style.display = 'none';
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Calculate canvas coordinates
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const rawX = e.clientX - rect.left - viewport.x;
    const rawY = e.clientY - rect.top - viewport.y;
    const x = rawX / viewport.zoom;
    const y = rawY / viewport.zoom;

    // If we're currently dragging a wire, clicking checks snap first or creates a junction
    if (wiringState) {
      const lastSnap = activeSnapRef.current;
      if (lastSnap) {
        onAddWire?.(wiringState.fromId, wiringState.fromSide, lastSnap.nodeId, lastSnap.side);
        setWiringState(null);
        setActiveSnap(null);
        activeSnapRef.current = null;
        playConnect();
        return;
      }

      // Otherwise create a junction on the canvas
      onCanvasClick(x, y); // This creates the junction in App.tsx
      setWiringState(null);
      playClick();
      return;
    }

    // If it's a right click, it might be for context or panning, don't trigger click
    if (e.button !== 0) return;

    // Check if we clicked on an actual node or terminal
    const target = e.target as HTMLElement;
    if (target.closest('.ladder-node-g') || target.closest('.terminal-pin')) return;

    onCanvasClick(x, y);
  };

  const handleTerminalClick = (nodeId: string, side: 'left' | 'right', x: number, y: number) => {
    if (!wiringState) {
      setWiringState({ fromId: nodeId, fromSide: side, x, y });
      playClick();
    } else {
      if (wiringState.fromId === nodeId && wiringState.fromSide === side) {
        setWiringState(null); // Cancel
        playClick();
        return;
      }
      onAddWire?.(wiringState.fromId, wiringState.fromSide, nodeId, side);
      setWiringState(null);
      playConnect();
    }
  };

  return (
    <div 
      ref={containerRef}
      className={clsx(
        "w-full h-full select-none canvas-grid flex items-center justify-center bg-[#090a0d] transition-all",
        placementType ? "cursor-cell" : "cursor-grab active:cursor-grabbing"
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMoveGlobal}
      onWheel={handleWheel}
      onClick={handleClick}
    >
      <svg 
        ref={svgRef}
        width="100%" 
        height="100%"
        className="overflow-visible pointer-events-auto"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        }}
      >
        <rect 
          x={-5000} 
          y={-5000} 
          width={10000} 
          height={20000} 
          fill="transparent" 
          className="pointer-events-auto cursor-grab"
        />
        <defs>
          <filter id="energized" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
            <feFlood floodColor="#4ade80" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Power Rails */}
        <line x1={LEFT_RAIL_X} y1={-1000} x2={LEFT_RAIL_X} y2={15000} className={clsx("rail rail-left", state.simulation.isRunning && "energized-rail")} />
        <line x1={RIGHT_RAIL_X} y1={-1000} x2={RIGHT_RAIL_X} y2={15000} className="rail rail-right" />

        {/* Visual Guides / Rungs */}
        {Array.from({ length: 50 }).map((_, i) => {
          const comment = state.rungComments?.[i];
          const yBase = i * RUNG_HEIGHT;
          const yCenter = yBase + (RUNG_HEIGHT/2);
          
          return (
            <g key={i}>
              {/* Rung Interaction Handle */}
              <g 
                className="rung-handle opacity-0 hover:opacity-100 transition-opacity cursor-pointer pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onRungAction?.(i, 'delete');
                }}
              >
                 <rect x={LEFT_RAIL_X - 40} y={yCenter - 10} width={24} height={20} rx={4} fill="#fee2e2" />
                 <Trash2 x={LEFT_RAIL_X - 34} y={yCenter - 6} size={12} className="text-red-500" />
              </g>

              {comment && (
                <g transform={`translate(${LEFT_RAIL_X}, ${yBase})`}>
                  <rect x={0} y={4} width={RIGHT_RAIL_X - LEFT_RAIL_X} height={24} fill="#fffbeb" stroke="#fef3c7" strokeWidth={0.5} />
                  <text x={8} y={20} fontStyle="italic" className="text-[10px] fill-amber-700 font-bold uppercase tracking-tight">
                    {comment}
                  </text>
                  <g className="cursor-pointer pointer-events-auto" onClick={() => onRungAction?.(i, 'edit-comment')}>
                    <Edit2 x={RIGHT_RAIL_X - LEFT_RAIL_X - 20} y={8} size={10} className="text-amber-400" />
                  </g>
                </g>
              )}
              
              <line 
                x1={LEFT_RAIL_X} 
                y1={yCenter} 
                x2={RIGHT_RAIL_X} 
                y2={yCenter} 
                className={clsx(
                  "rung-line transition-all duration-300 pointer-events-auto cursor-crosshair",
                  placementType ? "opacity-60 stroke-blue-400 stroke-[3px]" : "opacity-30 stroke-black stroke-[1.5px]"
                )}
                onMouseDown={(e) => {
                  if (placementType !== 'wire') return;
                  e.stopPropagation();
                  const target = e.currentTarget as SVGLineElement;
                  const rect = target.getBoundingClientRect();
                  if (rect) {
                    const x = (e.clientX - rect.left) / viewport.zoom + LEFT_RAIL_X;
                    const y = yCenter;
                    onCanvasClick(x, y); 
                  }
                }}
              />
              <text 
                x={LEFT_RAIL_X - 16} 
                y={yCenter + 5} 
                textAnchor="end" 
                className="text-[12px] font-bold fill-zinc-300 select-none"
              >
                {i + 1}
              </text>
            </g>
          );
        })}

        {/* Logic Continuity Background Lines (Memoized) */}
        {Object.entries(nodesByRung).map(([rungIdx, nodes]) => {
          const i = parseInt(rungIdx);
          const rungY = i * RUNG_HEIGHT + (RUNG_HEIGHT / 2);
          const activeNodes = nodes as LadderNode[];
          if (activeNodes.length === 0) return null;

          const sortedNodes = [...activeNodes].sort((a, b) => a.x - b.x);
          
          // Pre-calculate cumulative power transduction from left to right:
          const powerStates: boolean[] = []; 
          let currentPower = state.simulation.isRunning;
          sortedNodes.forEach((node) => {
            const nodeActive = !!state.simulation.values[node.address];
            const nodeLogicalConduction = node.type === 'contact-nc' ? !nodeActive : (node.type.startsWith('contact') ? nodeActive : true);
            currentPower = currentPower && nodeLogicalConduction;
            powerStates.push(currentPower);
          });
          
          return (
            <g key={`rung-wires-${i}`}>
              {/* Rail to first node */}
              <line 
                x1={LEFT_RAIL_X} 
                y1={sortedNodes[0].y + sortedNodes[0].height / 2} 
                x2={sortedNodes[0].x} 
                y2={sortedNodes[0].y + sortedNodes[0].height / 2} 
                className={clsx(
                  "rung-line transition-all duration-300",
                  state.simulation.isRunning ? "opacity-100 stroke-emerald-500 stroke-[3.5px] drop-shadow-[0_0_8px_rgba(16,185,129,0.3)] energized-flow-line" : "opacity-20 stroke-slate-600"
                )} 
              />
              
              {/* Node to node */}
              {sortedNodes.map((node, idx) => {
                const nextNode = sortedNodes[idx + 1];
                if (nextNode) {
                  const nodePout = state.simulation.values[`__pout_${node.id}`];
                  const isConducting = state.simulation.isRunning && (nodePout !== undefined ? !!nodePout : powerStates[idx]);
                  
                  return (
                    <line 
                      key={`wire-${node.id}-${nextNode.id}`}
                      x1={node.x + node.width} 
                      y1={node.y + node.height / 2} 
                      x2={nextNode.x} 
                      y2={nextNode.y + nextNode.height / 2} 
                      className={clsx(
                        "rung-line transition-all duration-300",
                        isConducting ? "opacity-100 stroke-emerald-500 stroke-[3.5px] drop-shadow-[0_0_10px_rgba(16,185,129,0.6)] energized-flow-line" : "opacity-20 stroke-slate-500"
                      )}
                    />
                  );
                }
                return null;
              })}
              
              {/* Last node to rail */}
              <line 
                x1={sortedNodes[sortedNodes.length - 1].x + sortedNodes[sortedNodes.length - 1].width} 
                y1={sortedNodes[sortedNodes.length - 1].y + sortedNodes[sortedNodes.length - 1].height / 2} 
                x2={RIGHT_RAIL_X} 
                y2={sortedNodes[sortedNodes.length - 1].y + sortedNodes[sortedNodes.length - 1].height / 2} 
                className={clsx(
                  "rung-line transition-all duration-300",
                  state.simulation.isRunning && (state.simulation.values[`__pout_${sortedNodes[sortedNodes.length - 1].id}`] !== undefined ? !!state.simulation.values[`__pout_${sortedNodes[sortedNodes.length - 1].id}`] : powerStates[powerStates.length - 1]) ? "opacity-100 stroke-emerald-500 stroke-[3.5px] drop-shadow-[0_0_10px_rgba(16,185,129,0.6)] energized-flow-line" : "opacity-20 stroke-slate-600"
                )} 
              />
            </g>
          );
        })}

        {/* Manual Wires */}
        {state.wires.map(wire => {
          const fromNode = state.nodes.find(n => n.id === wire.fromId);
          const toNode = state.nodes.find(n => n.id === wire.toId);
          if (!fromNode || !toNode) return null;

          const x1 = wire.fromSide === 'left' ? fromNode.x : fromNode.x + fromNode.width;
          const y1 = fromNode.y + fromNode.height / 2;
          const x2 = wire.toSide === 'left' ? toNode.x : toNode.x + toNode.width;
          const y2 = toNode.y + toNode.height / 2;

          const isConducting = state.simulation.isRunning && 
                              !!state.simulation.values[`__pout_${fromNode.id}`];

          return (
            <g key={wire.id} className="group pointer-events-auto">
              <line 
                x1={x1} 
                y1={y1} 
                x2={x2} 
                y2={y2}
                stroke="transparent"
                strokeWidth={14}
                className="cursor-pointer pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteWire?.(wire.id);
                }}
              />
              <line 
                x1={x1} 
                y1={y1} 
                x2={x2} 
                y2={y2}
                stroke={isConducting ? "rgba(16, 185, 129, 0.45)" : "rgba(255, 255, 255, 0.05)"}
                strokeWidth={isConducting ? 4 : 2.5}
                strokeLinecap="round"
                className={clsx("transition-all duration-300 group-hover:stroke-red-500/30", isConducting && "energized-flow-line")}
              />
              <line 
                x1={x1} 
                y1={y1} 
                x2={x2} 
                y2={y2}
                stroke={isConducting ? "#10b981" : "#52525b"}
                strokeWidth={1.5}
                strokeLinecap="round"
                className={clsx("transition-all duration-300 group-hover:stroke-red-500", isConducting && "energized-flow-line")}
                filter={isConducting ? "url(#energized)" : undefined}
              />
              {/* Delete Handle */}
              <g 
                transform={`translate(${(x1+x2)/2 - 8}, ${(y1+y2)/2 - 8})`}
                className="opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-150"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteWire?.(wire.id);
                }}
              >
                <circle r={8} fill="#ef4444" cx={8} cy={8} className="hover:fill-red-500 transition-colors" />
                <Trash2 x={3} y={3} size={10} className="text-white" />
              </g>
            </g>
          );
        })}

        {/* Guides */}
        <line ref={vGuideRef} y1={-1000} y2={10000} stroke="#3b82f6" strokeWidth={0.5} strokeDasharray="2 2" style={{ display: 'none', pointerEvents: 'none' }} />
        <line ref={hGuideRef} x1={-1000} x2={5000} stroke="#3b82f6" strokeWidth={0.5} strokeDasharray="2 2" style={{ display: 'none', pointerEvents: 'none' }} />

        {/* Interaction Overlays (Refs for performance) */}
        <path 
          ref={wiringPreviewRef}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="4 2"
          style={{ pointerEvents: 'none', display: 'none' }}
        />
        
        <g ref={ghostRef} opacity={0.3} style={{ pointerEvents: 'none', display: 'none' }}>
          <rect width={NODE_WIDTH} height={NODE_HEIGHT} fill="none" stroke="#3b82f6" strokeDasharray="4 2" />
          <text x={NODE_WIDTH/2} y={-10} textAnchor="middle" className="text-[10px] fill-blue-500 font-bold uppercase">PLACING</text>
        </g>

        {/* Components */}
        {state.nodes.map((node) => (
          <MemoizedLadderNode 
            key={node.id}
            node={node}
            selected={selectedId === node.id}
            simulationValue={state.simulation.values[node.address]}
            isPowerActive={state.simulation.isRunning && !!state.simulation.values[`__pout_${node.id}`]}
            placementType={placementType}
            wiringState={wiringState}
            isSnappedLeft={activeSnap?.nodeId === node.id && activeSnap?.side === 'left'}
            isSnappedRight={activeSnap?.nodeId === node.id && activeSnap?.side === 'right'}
            onSelect={onSelect}
            onToggle={onToggleAddress}
            onDoubleClick={onNodeDoubleClick}
            onTerminalClick={handleTerminalClick}
            renderSymbol={renderNodeSymbol}
          />
        ))}
      </svg>
    </div>
  );
}
