import { useMemo, useRef, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Circuit, Signal } from "@/lib/types";

export type WaveSample = {
  t: number;
  values: Record<string, Signal>;
};

type Props = {
  circuit: Circuit;
  samples: WaveSample[];
  onClose: () => void;
  onClear: () => void;
};

const PANEL_HEIGHT = 220;
const ROW_HEIGHT = 26;
const LABEL_WIDTH = 110;
const WINDOW_MS = 5000;

export function WaveformPanel({ circuit, samples, onClose, onClear }: Props) {
  const tracedGates = useMemo(() => {
    return Object.values(circuit.gates)
      .filter(
        (g) =>
          g.kind === "INPUT" ||
          g.kind === "OUTPUT" ||
          g.kind === "PROBE" ||
          g.kind === "CLOCK",
      )
      .map((g) => ({
        id: g.id,
        label: g.label || g.id.slice(0, 8),
        kind: g.kind,
      }));
  }, [circuit.gates]);

  const containerRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef(800);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      widthRef.current = el.clientWidth;
    });
    ro.observe(el);
    widthRef.current = el.clientWidth;
    return () => ro.disconnect();
  }, []);

  const now = samples.length > 0 ? samples[samples.length - 1].t : performance.now();
  const startT = now - WINDOW_MS;

  const w = widthRef.current;
  const traceW = Math.max(200, w - LABEL_WIDTH - 16);
  const totalH = Math.max(80, tracedGates.length * ROW_HEIGHT + 28);

  const xFor = (t: number) =>
    LABEL_WIDTH + ((t - startT) / WINDOW_MS) * traceW;

  return (
    <div
      ref={containerRef}
      className="border-t border-border bg-card/85 backdrop-blur-sm shrink-0 flex flex-col"
      style={{ height: PANEL_HEIGHT }}
    >
      <div className="h-8 px-3 flex items-center justify-between border-b border-border">
        <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Waveforms · last {WINDOW_MS / 1000}s
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={onClear}
            data-testid="button-wave-clear"
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
            data-testid="button-wave-close"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin">
        {tracedGates.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground px-6 text-center">
            Add a Toggle, LED, Probe or Clock to record its signal here.
          </div>
        ) : (
          <svg width="100%" height={totalH} className="block">
            {/* Time grid */}
            {Array.from({ length: 6 }).map((_, i) => {
              const x = LABEL_WIDTH + (traceW * i) / 5;
              const tLabel = ((WINDOW_MS / 1000) * (1 - i / 5)).toFixed(1);
              return (
                <g key={i}>
                  <line
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={totalH}
                    stroke="hsl(var(--border))"
                    strokeDasharray="2 4"
                    strokeWidth={0.6}
                  />
                  <text
                    x={x + 2}
                    y={11}
                    fontSize={9}
                    fontFamily="var(--app-font-mono)"
                    fill="hsl(var(--muted-foreground))"
                  >
                    -{tLabel}s
                  </text>
                </g>
              );
            })}

            {tracedGates.map((tg, i) => {
              const yTop = 16 + i * ROW_HEIGHT;
              const yMid = yTop + ROW_HEIGHT / 2;
              const yHigh = yTop + 4;
              const yLow = yTop + ROW_HEIGHT - 6;

              // Build path from samples
              const pts: { x: number; y: number; sig: Signal }[] = [];
              for (const s of samples) {
                if (s.t < startT) continue;
                const sig = s.values[tg.id] ?? "X";
                const y = sig === 1 ? yHigh : sig === 0 ? yLow : yMid;
                pts.push({ x: xFor(s.t), y, sig });
              }

              let path = "";
              for (let k = 0; k < pts.length; k++) {
                const p = pts[k];
                if (k === 0) {
                  path += `M ${p.x} ${p.y}`;
                } else {
                  const prev = pts[k - 1];
                  if (prev.y !== p.y) {
                    path += ` L ${p.x} ${prev.y} L ${p.x} ${p.y}`;
                  } else {
                    path += ` L ${p.x} ${p.y}`;
                  }
                }
              }

              return (
                <g key={tg.id}>
                  <rect
                    x={LABEL_WIDTH}
                    y={yTop}
                    width={traceW}
                    height={ROW_HEIGHT - 2}
                    fill={i % 2 === 0 ? "transparent" : "hsl(var(--muted) / 0.18)"}
                  />
                  <text
                    x={LABEL_WIDTH - 8}
                    y={yMid + 1}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fontSize={11}
                    fontFamily="var(--app-font-mono)"
                    fill="hsl(var(--foreground))"
                  >
                    {tg.label}
                  </text>
                  <text
                    x={LABEL_WIDTH - 8}
                    y={yMid + 12}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fontSize={8}
                    fontFamily="var(--app-font-mono)"
                    fill="hsl(var(--muted-foreground))"
                  >
                    {tg.kind}
                  </text>
                  {/* Baseline */}
                  <line
                    x1={LABEL_WIDTH}
                    y1={yLow}
                    x2={LABEL_WIDTH + traceW}
                    y2={yLow}
                    stroke="hsl(var(--border))"
                    strokeWidth={0.6}
                  />
                  {path && (
                    <path
                      d={path}
                      fill="none"
                      stroke="hsl(var(--signal-high))"
                      strokeWidth={1.6}
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                    />
                  )}
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}
