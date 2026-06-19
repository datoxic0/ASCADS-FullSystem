import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Circuit,
  Gate,
  GateKind,
  Selection,
  Signal,
  SimulationResult,
  SymbolStyle,
  ViewState,
  Wire,
  WireEnd,
} from "@/lib/types";
import {
  GRID,
  defaultGate,
  pinsFor,
  sizeOf,
  snapToGrid,
} from "@/lib/component-defs";
import { signalColor } from "@/lib/simulator";
import { GateBody } from "./GateBody";
import { cn } from "@/lib/utils";

const SNAP_RADIUS = 28; // world-space pixels for magnetic pin snap

type Props = {
  circuit: Circuit;
  view: ViewState;
  setView: (v: ViewState | ((prev: ViewState) => ViewState)) => void;
  selection: Selection;
  setSelection: (s: Selection) => void;
  symbolStyle: SymbolStyle;
  showGrid: boolean;
  snap: boolean;
  simulation: SimulationResult;
  pendingPlace: GateKind | null;
  setPendingPlace: (k: GateKind | null) => void;
  onAddGate: (gate: Gate) => void;
  onUpdateGate: (id: string, partial: Partial<Gate>, commit?: boolean) => void;
  onMoveGates: (dx: number, dy: number, ids: string[], commit?: boolean) => void;
  onAddWire: (wire: Wire) => void;
  onRemoveWiresAtInput: (gateId: string, pinIndex: number) => void;
  onDeleteWire?: (id: string) => void;
  onCursorChange?: (p: { x: number; y: number } | null) => void;
  showSignalLabels?: boolean;
};

type Interaction =
  | { kind: "idle" }
  | { kind: "pan"; lastSX: number; lastSY: number }
  | {
      kind: "drag-gates";
      lastX: number;
      lastY: number;
      moved: boolean;
      startedAt: number;
    }
  | {
      kind: "draw-wire";
      from: WireEnd;
      cursor: { x: number; y: number };
    }
  | {
      kind: "rect-select";
      startX: number;
      startY: number;
      currentX: number;
      currentY: number;
      additive: boolean;
    };

function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function wirePath(fx: number, fy: number, tx: number, ty: number): string {
  if (tx > fx + 18) {
    const midX = (fx + tx) / 2;
    return `M ${fx} ${fy} L ${midX} ${fy} L ${midX} ${ty} L ${tx} ${ty}`;
  }
  const exitX = fx + 16;
  const entryX = tx - 16;
  const midY = ty < fy ? Math.min(fy, ty) - 28 : Math.max(fy, ty) + 28;
  return `M ${fx} ${fy} L ${exitX} ${fy} L ${exitX} ${midY} L ${entryX} ${midY} L ${entryX} ${ty} L ${tx} ${ty}`;
}

function gatePinAbs(gate: Gate, pinIndex: number): { x: number; y: number } {
  const pins = pinsFor(gate);
  const p = pins[pinIndex];
  return { x: gate.x + p.x, y: gate.y + p.y };
}

/** Compute the midpoint of an orthogonal wire path. */
function wireMidpoint(fx: number, fy: number, tx: number, ty: number): { x: number; y: number } {
  if (tx > fx + 18) {
    const midX = (fx + tx) / 2;
    return { x: midX, y: (fy + ty) / 2 };
  }
  const midY = ty < fy ? Math.min(fy, ty) - 28 : Math.max(fy, ty) + 28;
  return { x: (fx + 16 + tx - 16) / 2, y: midY };
}

export function CircuitCanvas({
  circuit,
  view,
  setView,
  selection,
  setSelection,
  symbolStyle,
  showGrid,
  snap,
  simulation,
  pendingPlace,
  setPendingPlace,
  onAddGate,
  onUpdateGate,
  onMoveGates,
  onAddWire,
  onRemoveWiresAtInput,
  onDeleteWire,
  onCursorChange,
  showSignalLabels = false,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [interaction, setInteraction] = useState<Interaction>({ kind: "idle" });
  const [hoverPin, setHoverPin] = useState<WireEnd | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const screenToWorld = useCallback(
    (sx: number, sy: number) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      const localX = sx - rect.left;
      const localY = sy - rect.top;
      return {
        x: (localX - view.tx) / view.scale,
        y: (localY - view.ty) / view.scale,
      };
    },
    [view.tx, view.ty, view.scale],
  );

  const reportCursor = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      const w = screenToWorld(e.clientX, e.clientY);
      onCursorChange?.(w);
    },
    [screenToWorld, onCursorChange],
  );

  /* ---------- Magnetic snap target during wire drawing ---------- */

  const snapTarget = useMemo<WireEnd | null>(() => {
    if (interaction.kind !== "draw-wire") return null;
    const fromGate = circuit.gates[interaction.from.gateId];
    if (!fromGate) return null;
    const fromPin = pinsFor(fromGate)[interaction.from.pinIndex];
    if (!fromPin) return null;
    // If started from output, look for input pins; if started from input, look for output pins
    const wantInputPins = fromPin.type === "out";
    const cursor = interaction.cursor;
    let best: WireEnd | null = null;
    let bestDist = SNAP_RADIUS;
    for (const gate of Object.values(circuit.gates)) {
      if (gate.id === interaction.from.gateId) continue;
      const pins = pinsFor(gate);
      for (let i = 0; i < pins.length; i++) {
        const pin = pins[i];
        if (wantInputPins ? pin.type !== "in" : pin.type !== "out") continue;
        const px = gate.x + pin.x;
        const py = gate.y + pin.y;
        const dist = Math.hypot(cursor.x - px, cursor.y - py);
        if (dist < bestDist) {
          bestDist = dist;
          best = { gateId: gate.id, pinIndex: i };
        }
      }
    }
    return best;
  }, [interaction, circuit.gates]);

  /* ---------- Drag-and-drop from the Palette ---------- */

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const kind = e.dataTransfer.getData("application/x-logic-lab-gate") as GateKind;
    if (!kind) return;
    const w = screenToWorld(e.clientX, e.clientY);
    placeGateAt(kind, w.x, w.y);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const placeGateAt = (kind: GateKind, x: number, y: number) => {
    const def = defaultGate(kind, 0, 0);
    const { w, h } = sizeOf({ kind, inputs: def.inputs });
    let nx = x - w / 2;
    let ny = y - h / 2;
    if (snap) {
      nx = snapToGrid(nx);
      ny = snapToGrid(ny);
    }
    const id = newId(kind.toLowerCase());
    onAddGate({ id, ...def, x: nx, y: ny });
  };

  /* ---------- Mouse interaction on background ---------- */

  const onSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setInteraction({ kind: "pan", lastSX: e.clientX, lastSY: e.clientY });
      return;
    }

    if (pendingPlace && e.button === 0) {
      const w = screenToWorld(e.clientX, e.clientY);
      placeGateAt(pendingPlace, w.x, w.y);
      if (!e.shiftKey) setPendingPlace(null);
      return;
    }

    if (e.button === 0) {
      const w = screenToWorld(e.clientX, e.clientY);
      setInteraction({
        kind: "rect-select",
        startX: w.x,
        startY: w.y,
        currentX: w.x,
        currentY: w.y,
        additive: e.shiftKey || e.metaKey || e.ctrlKey,
      });
      if (!(e.shiftKey || e.metaKey || e.ctrlKey)) {
        setSelection({ gates: new Set(), wires: new Set() });
      }
    }
  };

  const onSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    reportCursor(e);

    if (interaction.kind === "pan") {
      const dx = e.clientX - interaction.lastSX;
      const dy = e.clientY - interaction.lastSY;
      setView((prev) => ({ ...prev, tx: prev.tx + dx, ty: prev.ty + dy }));
      setInteraction({ kind: "pan", lastSX: e.clientX, lastSY: e.clientY });
      return;
    }

    if (interaction.kind === "draw-wire") {
      const w = screenToWorld(e.clientX, e.clientY);
      setInteraction({ ...interaction, cursor: w });
      return;
    }

    if (interaction.kind === "rect-select") {
      const w = screenToWorld(e.clientX, e.clientY);
      setInteraction({ ...interaction, currentX: w.x, currentY: w.y });
      return;
    }

    if (interaction.kind === "drag-gates") {
      const w = screenToWorld(e.clientX, e.clientY);
      const dx = w.x - interaction.lastX;
      const dy = w.y - interaction.lastY;
      if (!interaction.moved && Math.hypot(dx, dy) < 3) return;
      onMoveGates(dx, dy, Array.from(selection.gates), false);
      setInteraction({
        kind: "drag-gates",
        lastX: w.x,
        lastY: w.y,
        moved: true,
        startedAt: interaction.startedAt,
      });
    }
  };

  const onSvgMouseUp = (_e: React.MouseEvent<SVGSVGElement>) => {
    if (interaction.kind === "rect-select") {
      const x0 = Math.min(interaction.startX, interaction.currentX);
      const x1 = Math.max(interaction.startX, interaction.currentX);
      const y0 = Math.min(interaction.startY, interaction.currentY);
      const y1 = Math.max(interaction.startY, interaction.currentY);
      const moved = Math.abs(interaction.currentX - interaction.startX) > 3 ||
                    Math.abs(interaction.currentY - interaction.startY) > 3;
      if (moved) {
        const newGates = new Set(interaction.additive ? selection.gates : []);
        for (const g of Object.values(circuit.gates)) {
          const { w, h } = sizeOf(g);
          if (g.x >= x0 && g.x + w <= x1 && g.y >= y0 && g.y + h <= y1) {
            newGates.add(g.id);
          }
        }
        setSelection({ gates: newGates, wires: new Set() });
      }
    }
    if (interaction.kind === "drag-gates" && interaction.moved) {
      if (snap) {
        for (const id of selection.gates) {
          const g = circuit.gates[id];
          if (!g) continue;
          const sx = snapToGrid(g.x);
          const sy = snapToGrid(g.y);
          if (sx !== g.x || sy !== g.y) {
            onUpdateGate(id, { x: sx, y: sy }, false);
          }
        }
      }
      onMoveGates(0, 0, Array.from(selection.gates), true);
    }
    // If mouseup on canvas while drawing wire with a snap target, complete the wire
    if (interaction.kind === "draw-wire" && snapTarget) {
      const fromGate = circuit.gates[interaction.from.gateId];
      if (fromGate) {
        const fromPin = pinsFor(fromGate)[interaction.from.pinIndex];
        const snapGate = circuit.gates[snapTarget.gateId];
        if (snapGate && fromPin) {
          const snapPin = pinsFor(snapGate)[snapTarget.pinIndex];
          let fromEnd: WireEnd, toEnd: WireEnd;
          if (fromPin.type === "out" && snapPin.type === "in") {
            fromEnd = interaction.from;
            toEnd = snapTarget;
          } else if (fromPin.type === "in" && snapPin.type === "out") {
            fromEnd = snapTarget;
            toEnd = interaction.from;
          } else {
            setInteraction({ kind: "idle" });
            return;
          }
          onAddWire({ id: newId("w"), from: fromEnd, to: toEnd });
        }
      }
    }
    setInteraction({ kind: "idle" });
  };

  /* ---------- Mouse on a gate ---------- */

  const onGateMouseDown = (e: React.MouseEvent, gate: Gate) => {
    e.stopPropagation();

    if (e.button === 1) {
      setInteraction({ kind: "pan", lastSX: e.clientX, lastSY: e.clientY });
      return;
    }

    if (pendingPlace) {
      const w = screenToWorld(e.clientX, e.clientY);
      placeGateAt(pendingPlace, w.x, w.y);
      if (!e.shiftKey) setPendingPlace(null);
      return;
    }

    const additive = e.shiftKey || e.metaKey || e.ctrlKey;
    const isSelected = selection.gates.has(gate.id);
    let nextGates: Set<string>;
    if (additive) {
      nextGates = new Set(selection.gates);
      if (isSelected) nextGates.delete(gate.id);
      else nextGates.add(gate.id);
    } else if (!isSelected) {
      nextGates = new Set([gate.id]);
    } else {
      nextGates = new Set(selection.gates);
    }
    setSelection({ gates: nextGates, wires: new Set() });

    const w = screenToWorld(e.clientX, e.clientY);
    setInteraction({
      kind: "drag-gates",
      lastX: w.x,
      lastY: w.y,
      moved: false,
      startedAt: Date.now(),
    });
  };

  const onGateClick = (e: React.MouseEvent, gate: Gate) => {
    e.stopPropagation();
    if (
      interaction.kind === "drag-gates" &&
      !interaction.moved &&
      (gate.kind === "INPUT" || gate.kind === "BUTTON") &&
      !e.shiftKey &&
      !e.metaKey &&
      !e.ctrlKey
    ) {
      onUpdateGate(gate.id, { on: !gate.on }, true);
    }
  };

  /** Right-click on INPUT toggles it; right-click on any gate also selects it. */
  const onGateContextMenu = (e: React.MouseEvent, gate: Gate) => {
    e.preventDefault();
    e.stopPropagation();
    setSelection({ gates: new Set([gate.id]), wires: new Set() });
    if (gate.kind === "INPUT" || gate.kind === "BUTTON") {
      onUpdateGate(gate.id, { on: !gate.on }, true);
    }
  };

  /* ---------- Pin interactions ---------- */

  const onPinMouseDown = (e: React.MouseEvent, gate: Gate, pinIndex: number) => {
    e.stopPropagation();
    const pins = pinsFor(gate);
    const pin = pins[pinIndex];
    if (e.altKey || e.metaKey) {
      // Alt/Meta + click on any pin removes wires at that pin
      if (pin.type === "in") onRemoveWiresAtInput(gate.id, pinIndex);
      return;
    }
    // Start wire drawing from either pin type
    const start = gatePinAbs(gate, pinIndex);
    setInteraction({
      kind: "draw-wire",
      from: { gateId: gate.id, pinIndex },
      cursor: start,
    });
  };

  const onPinMouseEnter = (gate: Gate, pinIndex: number) => {
    setHoverPin({ gateId: gate.id, pinIndex });
  };

  const onPinMouseLeave = () => {
    setHoverPin(null);
  };

  const onPinMouseUp = (e: React.MouseEvent, gate: Gate, pinIndex: number) => {
    e.stopPropagation();
    if (interaction.kind !== "draw-wire") return;
    if (interaction.from.gateId === gate.id) {
      setInteraction({ kind: "idle" });
      return;
    }
    const fromGate = circuit.gates[interaction.from.gateId];
    if (!fromGate) return;
    const fromPin = pinsFor(fromGate)[interaction.from.pinIndex];
    if (!fromPin) return;
    const pins = pinsFor(gate);
    const pin = pins[pinIndex];
    // Determine wire direction — must be output → input
    let fromEnd: WireEnd, toEnd: WireEnd;
    if (fromPin.type === "out" && pin.type === "in") {
      fromEnd = interaction.from;
      toEnd = { gateId: gate.id, pinIndex };
    } else if (fromPin.type === "in" && pin.type === "out") {
      fromEnd = { gateId: gate.id, pinIndex };
      toEnd = interaction.from;
    } else {
      setInteraction({ kind: "idle" });
      return;
    }
    onAddWire({ id: newId("w"), from: fromEnd, to: toEnd });
    setInteraction({ kind: "idle" });
  };

  /* ---------- Wire interactions ---------- */

  const onWireMouseDown = (e: React.MouseEvent, wireId: string) => {
    e.stopPropagation();
    const additive = e.shiftKey || e.metaKey || e.ctrlKey;
    const next = additive ? new Set(selection.wires) : new Set<string>();
    if (next.has(wireId)) next.delete(wireId);
    else next.add(wireId);
    setSelection({
      gates: additive ? selection.gates : new Set(),
      wires: next,
    });
  };

  const onWireContextMenu = (e: React.MouseEvent, wireId: string) => {
    e.preventDefault();
    e.stopPropagation();
    onDeleteWire?.(wireId);
  };

  /* ---------- Wheel zoom ---------- */

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      setView((prev) => {
        const factor = Math.exp(-e.deltaY * 0.0015);
        const newScale = Math.min(3, Math.max(0.25, prev.scale * factor));
        const ratio = newScale / prev.scale;
        return {
          scale: newScale,
          tx: sx - (sx - prev.tx) * ratio,
          ty: sy - (sy - prev.ty) * ratio,
        };
      });
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [setView]);

  /* ---------- Rendering ---------- */

  const renderedGates = useMemo(() => {
    return Object.values(circuit.gates).map((gate) => {
      const pins = pinsFor(gate);
      const signals: Signal[] = pins.map(
        (_p, i) => simulation.pinValues.get(`${gate.id}:${i}`) ?? "X",
      );
      return { gate, pins, signals };
    });
  }, [circuit.gates, simulation.pinValues]);

  const renderedWires = useMemo(() => {
    return Object.values(circuit.wires).map((wire) => {
      const fromGate = circuit.gates[wire.from.gateId];
      const toGate = circuit.gates[wire.to.gateId];
      if (!fromGate || !toGate) return null;
      const a = gatePinAbs(fromGate, wire.from.pinIndex);
      const b = gatePinAbs(toGate, wire.to.pinIndex);
      const sig = simulation.wireValues.get(wire.id) ?? "X";
      return { wire, a, b, sig };
    }).filter((x): x is NonNullable<typeof x> => x !== null);
  }, [circuit.wires, circuit.gates, simulation.wireValues]);

  const junctions = useMemo(() => {
    const counts = new Map<string, { x: number; y: number; sig: Signal; count: number }>();
    for (const r of renderedWires) {
      const key = `${r.a.x},${r.a.y}`;
      const e = counts.get(key);
      if (e) e.count++;
      else counts.set(key, { x: r.a.x, y: r.a.y, sig: r.sig, count: 1 });
    }
    return Array.from(counts.values()).filter((j) => j.count > 1);
  }, [renderedWires]);

  // Compute draw-wire visual endpoint (snapped if near a pin)
  const drawWireEndpoint = useMemo(() => {
    if (interaction.kind !== "draw-wire") return null;
    const fromGate = circuit.gates[interaction.from.gateId];
    if (!fromGate) return null;
    if (snapTarget) {
      const snapGate = circuit.gates[snapTarget.gateId];
      if (snapGate) return gatePinAbs(snapGate, snapTarget.pinIndex);
    }
    return interaction.cursor;
  }, [interaction, circuit.gates, snapTarget]);

  let cursorStyle = "default";
  if (pendingPlace) cursorStyle = "crosshair";
  else if (interaction.kind === "pan") cursorStyle = "grabbing";
  else if (interaction.kind === "draw-wire") cursorStyle = "crosshair";
  else if (interaction.kind === "drag-gates") cursorStyle = "grabbing";

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden bg-background select-none"
      onDrop={onDrop}
      onDragOver={onDragOver}
      data-testid="circuit-canvas"
    >
      <svg
        ref={svgRef}
        width={size.w}
        height={size.h}
        viewBox={`0 0 ${size.w} ${size.h}`}
        style={{ cursor: cursorStyle, display: "block" }}
        onMouseDown={onSvgMouseDown}
        onMouseMove={onSvgMouseMove}
        onMouseUp={onSvgMouseUp}
        onMouseLeave={() => {
          if (interaction.kind === "draw-wire") setInteraction({ kind: "idle" });
          if (interaction.kind === "pan") setInteraction({ kind: "idle" });
          onCursorChange?.(null);
        }}
      >
        <defs>
          <pattern
            id="grid-pattern"
            width={GRID * view.scale}
            height={GRID * view.scale}
            patternUnits="userSpaceOnUse"
            x={view.tx % (GRID * view.scale)}
            y={view.ty % (GRID * view.scale)}
          >
            <circle
              cx={(GRID * view.scale) / 2}
              cy={(GRID * view.scale) / 2}
              r={Math.max(0.5, 0.7 * view.scale)}
              fill="hsl(var(--grid))"
            />
          </pattern>
          <pattern
            id="grid-major"
            width={GRID * 5 * view.scale}
            height={GRID * 5 * view.scale}
            patternUnits="userSpaceOnUse"
            x={view.tx % (GRID * 5 * view.scale)}
            y={view.ty % (GRID * 5 * view.scale)}
          >
            <circle
              cx={(GRID * 5 * view.scale) / 2}
              cy={(GRID * 5 * view.scale) / 2}
              r={Math.max(1, 1.4 * view.scale)}
              fill="hsl(var(--grid))"
              opacity={0.65}
            />
          </pattern>
        </defs>

        {showGrid && (
          <>
            <rect x={0} y={0} width={size.w} height={size.h} fill="url(#grid-pattern)" />
            <rect x={0} y={0} width={size.w} height={size.h} fill="url(#grid-major)" />
          </>
        )}

        <g transform={`translate(${view.tx} ${view.ty}) scale(${view.scale})`}>
          {/* Wires */}
          <g>
            {renderedWires.map(({ wire, a, b, sig }) => {
              const isSel = selection.wires.has(wire.id);
              const high = sig === 1;
              return (
                <g key={wire.id}>
                  {/* Wide transparent hit area */}
                  <path
                    d={wirePath(a.x, a.y, b.x, b.y)}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={10}
                    style={{ cursor: "pointer" }}
                    onMouseDown={(e) => onWireMouseDown(e, wire.id)}
                    onContextMenu={(e) => onWireContextMenu(e, wire.id)}
                  />
                  {/* Visible wire */}
                  <path
                    d={wirePath(a.x, a.y, b.x, b.y)}
                    fill="none"
                    stroke={signalColor(sig)}
                    strokeWidth={isSel ? 3 : 2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      filter: high ? "drop-shadow(0 0 3px hsl(var(--signal-high)/0.6))" : "none",
                      pointerEvents: "none",
                    }}
                  />
                  {/* Animated pulse on HIGH wires */}
                  {high && (
                    <path
                      className="wire-pulse"
                      d={wirePath(a.x, a.y, b.x, b.y)}
                      fill="none"
                      stroke="hsl(var(--signal-high))"
                      strokeWidth={2.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="6 14"
                      strokeOpacity={0.85}
                      pointerEvents="none"
                    />
                  )}
                  {/* Selection highlight */}
                  {isSel && (
                    <path
                      d={wirePath(a.x, a.y, b.x, b.y)}
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth={5}
                      strokeOpacity={0.18}
                      strokeLinecap="round"
                      style={{ pointerEvents: "none" }}
                    />
                  )}
                </g>
              );
            })}
          </g>

          {/* Signal labels on wire midpoints */}
          {showSignalLabels && (
            <g pointerEvents="none">
              {renderedWires.map(({ wire, a, b, sig }) => {
                const mid = wireMidpoint(a.x, a.y, b.x, b.y);
                const label = sig === 1 ? "1" : sig === 0 ? "0" : "X";
                const col = signalColor(sig);
                return (
                  <g key={`lbl-${wire.id}`}>
                    <rect
                      x={mid.x - 7}
                      y={mid.y - 7}
                      width={14}
                      height={13}
                      rx={3}
                      fill="hsl(var(--background))"
                      stroke={col}
                      strokeWidth={0.9}
                      opacity={0.92}
                    />
                    <text
                      x={mid.x}
                      y={mid.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={9}
                      fontFamily="var(--app-font-mono)"
                      fontWeight={700}
                      fill={col}
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* Junction dots */}
          <g pointerEvents="none">
            {junctions.map((j, i) => (
              <circle
                key={i}
                cx={j.x}
                cy={j.y}
                r={3.2}
                fill={signalColor(j.sig)}
              />
            ))}
          </g>

          {/* Gates */}
          <g>
            {renderedGates.map(({ gate, pins, signals }) => {
              const isSel = selection.gates.has(gate.id);
              const { w, h } = sizeOf(gate);
              const isInput = gate.kind === "INPUT";
              return (
                <g
                  key={gate.id}
                  transform={`translate(${gate.x} ${gate.y})`}
                  onMouseDown={(e) => onGateMouseDown(e, gate)}
                  onClick={(e) => onGateClick(e, gate)}
                  onContextMenu={(e) => onGateContextMenu(e, gate)}
                  style={{ cursor: isInput ? "pointer" : "grab" }}
                  data-testid={`gate-${gate.id}`}
                >
                  {isSel && (
                    <rect
                      x={-6}
                      y={-6}
                      width={w + 12}
                      height={h + 12}
                      rx={8}
                      fill="hsl(var(--primary) / 0.06)"
                      stroke="hsl(var(--primary))"
                      strokeWidth={1.2}
                      strokeDasharray="4 3"
                      pointerEvents="none"
                    />
                  )}

                  <GateBody
                    gate={gate}
                    style={symbolStyle}
                    signals={signals}
                  />

                  {/* Pin hit areas + visible dots */}
                  {pins.map((pin, i) => {
                    const sig = signals[i];
                    const isHover =
                      hoverPin?.gateId === gate.id && hoverPin?.pinIndex === i;
                    // Highlight pins that are valid targets during wire drawing
                    const isValidTarget = (() => {
                      if (interaction.kind !== "draw-wire") return false;
                      if (gate.id === interaction.from.gateId) return false;
                      const fromGate = circuit.gates[interaction.from.gateId];
                      if (!fromGate) return false;
                      const fromPin = pinsFor(fromGate)[interaction.from.pinIndex];
                      if (!fromPin) return false;
                      return fromPin.type === "out" ? pin.type === "in" : pin.type === "out";
                    })();
                    const isSnapped = snapTarget?.gateId === gate.id && snapTarget?.pinIndex === i;
                    return (
                      <g key={i}>
                        <circle
                          cx={pin.x}
                          cy={pin.y}
                          r={2.6}
                          fill={signalColor(sig)}
                          pointerEvents="none"
                        />
                        {(isHover || isValidTarget) && (
                          <circle
                            cx={pin.x}
                            cy={pin.y}
                            r={isSnapped ? 8 : 6}
                            fill={isSnapped ? "hsl(var(--primary)/0.15)" : "none"}
                            stroke={isSnapped ? "hsl(var(--primary))" : "hsl(var(--primary)/0.6)"}
                            strokeWidth={isSnapped ? 2 : 1.4}
                            strokeDasharray={isSnapped ? undefined : "2 2"}
                            pointerEvents="none"
                          />
                        )}
                        <circle
                          cx={pin.x}
                          cy={pin.y}
                          r={9}
                          fill="transparent"
                          style={{ cursor: pin.type === "out" ? "crosshair" : "cell" }}
                          onMouseDown={(e) => onPinMouseDown(e, gate, i)}
                          onMouseUp={(e) => onPinMouseUp(e, gate, i)}
                          onMouseEnter={() => onPinMouseEnter(gate, i)}
                          onMouseLeave={onPinMouseLeave}
                        />
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </g>

          {/* In-progress wire */}
          {interaction.kind === "draw-wire" && drawWireEndpoint && (() => {
            const fromGate = circuit.gates[interaction.from.gateId];
            if (!fromGate) return null;
            const fromPin = pinsFor(fromGate)[interaction.from.pinIndex];
            const a = gatePinAbs(fromGate, interaction.from.pinIndex);
            const ep = drawWireEndpoint;
            // Draw in correct direction based on pin type
            const pathD = fromPin?.type === "in"
              ? wirePath(ep.x, ep.y, a.x, a.y)
              : wirePath(a.x, a.y, ep.x, ep.y);
            return (
              <g pointerEvents="none">
                <path
                  d={pathD}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.2}
                  strokeDasharray={snapTarget ? undefined : "4 3"}
                  strokeOpacity={snapTarget ? 1 : 0.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    filter: snapTarget ? "drop-shadow(0 0 3px hsl(var(--primary)/0.5))" : "none",
                  }}
                />
                {/* Snap target ring */}
                {snapTarget && (() => {
                  const snapGate = circuit.gates[snapTarget.gateId];
                  if (!snapGate) return null;
                  const sp = gatePinAbs(snapGate, snapTarget.pinIndex);
                  return (
                    <circle
                      cx={sp.x}
                      cy={sp.y}
                      r={10}
                      fill="hsl(var(--primary)/0.1)"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                    />
                  );
                })()}
              </g>
            );
          })()}

          {/* Selection rectangle */}
          {interaction.kind === "rect-select" && (() => {
            const x = Math.min(interaction.startX, interaction.currentX);
            const y = Math.min(interaction.startY, interaction.currentY);
            const w = Math.abs(interaction.currentX - interaction.startX);
            const h = Math.abs(interaction.currentY - interaction.startY);
            if (w < 3 && h < 3) return null;
            return (
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill="hsl(var(--primary) / 0.08)"
                stroke="hsl(var(--primary))"
                strokeWidth={1.2 / view.scale}
                className="marching-ants"
              />
            );
          })()}
        </g>
      </svg>

      {/* Placement hint */}
      {pendingPlace && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-xs text-primary backdrop-blur-sm shadow-sm font-medium pointer-events-none">
          Click to place {pendingPlace} · Shift+click to place multiple · ESC to cancel
        </div>
      )}

      {/* Wire-drawing hint */}
      {interaction.kind === "draw-wire" && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-card/90 border border-border text-xs text-muted-foreground backdrop-blur-sm shadow-sm pointer-events-none">
          {snapTarget
            ? "Release to connect · ESC to cancel"
            : "Drag to a pin to connect · ESC to cancel · Right-click wire to delete"}
        </div>
      )}

      {/* Empty canvas hint */}
      {Object.keys(circuit.gates).length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center fade-up">
            <div className="text-sm text-muted-foreground">
              Drag a component from the palette, or open an example circuit.
              <br />
              <span className="text-xs opacity-60 mt-1 block">Click INPUT toggles to flip their value. Right-click a wire to delete it.</span>
            </div>
          </div>
        </div>
      )}

      {/* Zoom controls */}
      <div
        className={cn(
          "absolute bottom-3 right-3 flex flex-col gap-1 bg-card/80 backdrop-blur-sm rounded-md border border-border shadow-sm",
          "px-1 py-1",
        )}
      >
        <button
          aria-label="Zoom in"
          className="hover-elevate active-elevate-2 px-2 py-1 rounded text-xs font-mono"
          onClick={() =>
            setView((p) => ({
              ...p,
              scale: Math.min(3, p.scale * 1.2),
              tx: size.w / 2 - (size.w / 2 - p.tx) * 1.2,
              ty: size.h / 2 - (size.h / 2 - p.ty) * 1.2,
            }))
          }
        >
          +
        </button>
        <button
          aria-label="Reset zoom"
          className="hover-elevate active-elevate-2 px-2 py-0.5 rounded text-[10px] font-mono text-muted-foreground"
          onClick={() => setView({ tx: 0, ty: 0, scale: 1 })}
        >
          1:1
        </button>
        <button
          aria-label="Zoom out"
          className="hover-elevate active-elevate-2 px-2 py-1 rounded text-xs font-mono"
          onClick={() =>
            setView((p) => ({
              ...p,
              scale: Math.max(0.25, p.scale / 1.2),
              tx: size.w / 2 - (size.w / 2 - p.tx) / 1.2,
              ty: size.h / 2 - (size.h / 2 - p.ty) / 1.2,
            }))
          }
        >
          −
        </button>
      </div>
    </div>
  );
}
