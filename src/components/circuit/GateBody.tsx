import { memo } from "react";
import type { Gate, Signal, SymbolStyle } from "@/lib/types";
import {
  IEC_LABEL,
  SEGMENTS_HEX,
  pinsFor,
  sizeOf,
} from "@/lib/component-defs";
import { signalColor } from "@/lib/simulator";

type Props = {
  gate: Gate;
  style: SymbolStyle;
  /** One signal per pin in pinsFor() order. */
  signals: Signal[];
  /** When true (palette/preview), don't render labels & glows */
  preview?: boolean;
};

/* -------------------------------------------------------------------------- */
/*  Top-level dispatcher                                                      */
/* -------------------------------------------------------------------------- */

export const GateBody = memo(function GateBody({
  gate,
  style,
  signals,
  preview = false,
}: Props) {
  const { w, h } = sizeOf(gate);
  const pins = pinsFor(gate);

  // Specialized renders
  switch (gate.kind) {
    case "INPUT":
      return <InputBody gate={gate} w={w} h={h} preview={preview} />;
    case "OUTPUT":
      return <OutputBody gate={gate} w={w} h={h} signal={signals[0]} preview={preview} />;
    case "PROBE":
      return <ProbeBody gate={gate} w={w} h={h} signal={signals[0]} preview={preview} />;
    case "CLOCK":
      return <ClockBody gate={gate} w={w} h={h} signal={signals[0]} preview={preview} />;
    case "CONST0":
    case "CONST1":
      return <ConstBody gate={gate} w={w} h={h} preview={preview} />;
    case "PULLUP":
    case "PULLDOWN":
      return <PullBody gate={gate} w={w} h={h} preview={preview} />;
    case "TRI":
      return <TriStateBody gate={gate} w={w} h={h} signals={signals} />;
    case "SEG7":
      return <SevenSegmentBody gate={gate} w={w} h={h} signals={signals} preview={preview} />;
    case "HEX4":
      return <HexDisplayBody gate={gate} w={w} h={h} signals={signals} preview={preview} />;
    case "BUTTON":
      return <ButtonBody gate={gate} w={w} h={h} preview={preview} />;
    case "RGBLED":
      return <RGBLEDBody gate={gate} w={w} h={h} signals={signals} preview={preview} />;
    case "BUZZER":
      return <BuzzerBody gate={gate} w={w} h={h} signal={signals[0]} preview={preview} />;
    case "LABEL":
      return <LabelBody gate={gate} w={w} h={h} />;
    case "NOT":
    case "BUFFER":
    case "AND":
    case "NAND":
    case "OR":
    case "NOR":
    case "XOR":
    case "XNOR":
      return (
        <SimpleLogicGate
          gate={gate}
          w={w}
          h={h}
          style={style}
          signals={signals}
        />
      );
    default:
      // Multi-pin compound blocks (latches, FFs, mux, decoders, adders, counter)
      return <BoxBody gate={gate} w={w} h={h} signals={signals} />;
  }
});

/* -------------------------------------------------------------------------- */
/*  Pin stubs and labels — generic for box-style components                   */
/* -------------------------------------------------------------------------- */

function PinStubsAndLabels({
  gate,
  signals,
  showLabels = true,
}: {
  gate: Gate;
  signals: Signal[];
  showLabels?: boolean;
}) {
  const pins = pinsFor(gate);
  const { w, h } = sizeOf(gate);
  const stubLen = 10;

  return (
    <g>
      {pins.map((pin, i) => {
        const sig = signals[i];
        let x2 = pin.x;
        let y2 = pin.y;
        let lx = pin.x;
        let ly = pin.y;
        let lAnchor: "start" | "middle" | "end" = "middle";
        let lBaseline: "middle" | "hanging" | "auto" = "middle";

        if (pin.x === 0) {
          x2 = pin.x + stubLen;
          lx = stubLen + 4;
          lAnchor = "start";
        } else if (pin.x === w) {
          x2 = pin.x - stubLen;
          lx = w - stubLen - 4;
          lAnchor = "end";
        } else if (pin.y === h) {
          y2 = pin.y - stubLen;
          ly = h - stubLen - 3;
          lAnchor = "middle";
          lBaseline = "auto";
        } else if (pin.y === 0) {
          y2 = pin.y + stubLen;
          ly = stubLen + 3;
          lBaseline = "hanging";
        }

        return (
          <g key={`pin-${i}`}>
            <line
              x1={pin.x}
              y1={pin.y}
              x2={x2}
              y2={y2}
              stroke={signalColor(sig)}
              strokeWidth={2}
              strokeLinecap="round"
            />
            {pin.clock && (
              <ClockNotch
                x={pin.x}
                y={pin.y}
                facing={pin.x === 0 ? "right" : "left"}
              />
            )}
            {showLabels && pin.label && (
              <text
                x={lx}
                y={ly}
                textAnchor={lAnchor}
                dominantBaseline={lBaseline}
                fontSize={8.5}
                fontFamily="var(--app-font-mono)"
                fontWeight={500}
                fill="hsl(var(--muted-foreground))"
              >
                {pin.label}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

function ClockNotch({
  x,
  y,
  facing,
}: {
  x: number;
  y: number;
  facing: "right" | "left";
}) {
  const size = 5;
  const dx = facing === "right" ? size : -size;
  return (
    <path
      d={`M ${x} ${y - size} L ${x + dx} ${y} L ${x} ${y + size}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Generic box body (for FFs, latches, MUX, DEC, adders, counter)            */
/* -------------------------------------------------------------------------- */

function BoxBody({
  gate,
  w,
  h,
  signals,
}: {
  gate: Gate;
  w: number;
  h: number;
  signals: Signal[];
}) {
  const stroke = "currentColor";
  const fill = "hsl(var(--card))";
  const sw = 1.6;

  let title = "";
  let subtitle = "";
  switch (gate.kind) {
    case "SRLATCH": title = "SR"; subtitle = "Latch"; break;
    case "DLATCH": title = "D"; subtitle = "Latch"; break;
    case "DFF": title = "D"; subtitle = "FF"; break;
    case "TFF": title = "T"; subtitle = "FF"; break;
    case "JKFF": title = "JK"; subtitle = "FF"; break;
    case "MUX2": title = "MUX"; subtitle = "2:1"; break;
    case "MUX4": title = "MUX"; subtitle = "4:1"; break;
    case "DEMUX2": title = "DMX"; subtitle = "1:2"; break;
    case "DEC2": title = "DEC"; subtitle = "2:4"; break;
    case "HALFADDER": title = "HA"; subtitle = "Σ"; break;
    case "FULLADDER": title = "FA"; subtitle = "Σ"; break;
    case "COUNTER4": title = "CTR4"; subtitle = "/16"; break;
    default: title = IEC_LABEL[gate.kind] ?? gate.kind;
  }

  return (
    <g>
      <PinStubsAndLabels gate={gate} signals={signals} />
      <rect
        x={10}
        y={4}
        width={w - 20}
        height={h - 8}
        rx={4}
        ry={4}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
      />
      <text
        x={w / 2}
        y={h / 2 - (subtitle ? 6 : 0)}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={subtitle ? 12 : 14}
        fontWeight={700}
        fontFamily="var(--app-font-mono)"
        fill="currentColor"
      >
        {title}
      </text>
      {subtitle && (
        <text
          x={w / 2}
          y={h / 2 + 8}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={9}
          fontFamily="var(--app-font-mono)"
          fill="hsl(var(--muted-foreground))"
        >
          {subtitle}
        </text>
      )}
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*  Simple logic gates (ANSI shape or IEC box)                                */
/* -------------------------------------------------------------------------- */

function SimpleLogicGate({
  gate,
  w,
  h,
  style,
  signals,
}: {
  gate: Gate;
  w: number;
  h: number;
  style: SymbolStyle;
  signals: Signal[];
}) {
  const pins = pinsFor(gate);
  const stroke = "currentColor";
  const sw = 1.6;

  return (
    <g>
      {/* Input stubs */}
      {pins.map((pin, i) => {
        if (pin.type !== "in") return null;
        return (
          <line
            key={`in-${i}`}
            x1={pin.x}
            y1={pin.y}
            x2={pin.x + 12}
            y2={pin.y}
            stroke={signalColor(signals[i])}
            strokeWidth={2}
            strokeLinecap="round"
          />
        );
      })}
      {/* Output stub */}
      <line
        x1={w - 12}
        y1={h / 2}
        x2={w}
        y2={h / 2}
        stroke={signalColor(signals[pins.length - 1])}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {style === "ansi" ? (
        <AnsiGateShape gate={gate} w={w} h={h} stroke={stroke} sw={sw} />
      ) : (
        <IecGateShape gate={gate} w={w} h={h} stroke={stroke} sw={sw} />
      )}
    </g>
  );
}

function AnsiGateShape({
  gate,
  w,
  h,
  stroke,
  sw,
}: {
  gate: Gate;
  w: number;
  h: number;
  stroke: string;
  sw: number;
}) {
  const cy = h / 2;
  const isNegated = ["NAND", "NOR", "XNOR", "NOT"].includes(gate.kind);
  const fill = "hsl(var(--card))";
  const bubbleR = 3.5;
  const bubbleX = w - 14;

  if (gate.kind === "NOT" || gate.kind === "BUFFER") {
    const tipX = isNegated ? w - 18 : w - 10;
    return (
      <g>
        <path
          d={`M 12 6 L 12 ${h - 6} L ${tipX} ${cy} Z`}
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
        {isNegated && (
          <circle
            cx={tipX + bubbleR + 1}
            cy={cy}
            r={bubbleR}
            fill={fill}
            stroke={stroke}
            strokeWidth={sw}
          />
        )}
      </g>
    );
  }

  if (gate.kind === "AND" || gate.kind === "NAND") {
    const bodyEnd = isNegated ? w - 18 : w - 10;
    const flatEnd = bodyEnd - (h - 12) / 2;
    const r = (h - 12) / 2;
    return (
      <g>
        <path
          d={`M 10 6 L ${flatEnd} 6 A ${r} ${r} 0 0 1 ${flatEnd} ${h - 6} L 10 ${h - 6} Z`}
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
        {isNegated && (
          <circle cx={bubbleX} cy={cy} r={bubbleR} fill={fill} stroke={stroke} strokeWidth={sw} />
        )}
      </g>
    );
  }

  // OR / NOR / XOR / XNOR — shield shape
  const isXor = gate.kind === "XOR" || gate.kind === "XNOR";
  const startX = isXor ? 18 : 10;
  const bodyEnd = isNegated ? w - 18 : w - 10;
  const tipX = bodyEnd;
  const ctrlX = startX + 24;
  const orPath = `M ${startX} 6 Q ${ctrlX} ${cy} ${startX} ${h - 6} Q ${tipX - 18} ${h - 6} ${tipX} ${cy} Q ${tipX - 18} 6 ${startX} 6 Z`;
  return (
    <g>
      <path
        d={orPath}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      {isXor && (
        <path
          d={`M ${startX - 8} 6 Q ${startX + 10} ${cy} ${startX - 8} ${h - 6}`}
          fill="none"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
        />
      )}
      {isNegated && (
        <circle cx={bubbleX} cy={cy} r={bubbleR} fill={fill} stroke={stroke} strokeWidth={sw} />
      )}
    </g>
  );
}

function IecGateShape({
  gate,
  w,
  h,
  stroke,
  sw,
}: {
  gate: Gate;
  w: number;
  h: number;
  stroke: string;
  sw: number;
}) {
  const cy = h / 2;
  const isNegated = ["NAND", "NOR", "XNOR", "NOT"].includes(gate.kind);
  const fill = "hsl(var(--card))";
  const bx = 10;
  const by = 4;
  const bw = w - 22;
  const bh = h - 8;
  const bubbleR = 3.5;
  const bubbleX = bx + bw + 3.5;

  return (
    <g>
      <rect
        x={bx}
        y={by}
        width={bw}
        height={bh}
        rx={3}
        ry={3}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
      />
      <text
        x={bx + bw / 2}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={bh > 40 ? 18 : 14}
        fontFamily="var(--app-font-mono)"
        fontWeight={600}
        fill="currentColor"
      >
        {IEC_LABEL[gate.kind]}
      </text>
      {isNegated && (
        <circle cx={bubbleX} cy={cy} r={bubbleR} fill={fill} stroke={stroke} strokeWidth={sw} />
      )}
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tri-state buffer (triangle with EN entering from below)                   */
/* -------------------------------------------------------------------------- */

function TriStateBody({
  gate,
  w,
  h,
  signals,
}: {
  gate: Gate;
  w: number;
  h: number;
  signals: Signal[];
}) {
  const stroke = "currentColor";
  const fill = "hsl(var(--card))";
  const sw = 1.6;
  const cy = h / 2 - 4;
  const tipX = w - 10;
  return (
    <g>
      <PinStubsAndLabels gate={gate} signals={signals} showLabels />
      <path
        d={`M 12 6 L 12 ${cy + (h / 2 - 4)} L ${tipX} ${cy} Z`}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*  Pull-up / Pull-down                                                       */
/* -------------------------------------------------------------------------- */

function PullBody({
  gate,
  w,
  h,
  preview,
}: {
  gate: Gate;
  w: number;
  h: number;
  preview?: boolean;
}) {
  const isUp = gate.kind === "PULLUP";
  const color = isUp ? "hsl(var(--signal-high))" : "hsl(var(--signal-low))";
  const stroke = "currentColor";
  const sw = 1.6;
  const cx = w / 2 - 4;

  return (
    <g>
      {/* Output stub */}
      <line
        x1={w - 8}
        y1={h / 2}
        x2={w}
        y2={h / 2}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* Vertical lead */}
      <line
        x1={cx}
        y1={h / 2}
        x2={cx}
        y2={isUp ? 8 : h - 8}
        stroke={stroke}
        strokeWidth={sw}
      />
      {/* Resistor zigzag */}
      <path
        d={
          isUp
            ? `M ${cx - 5} ${h / 2 - 3} L ${cx + 5} ${h / 2 - 7} L ${cx - 5} ${h / 2 - 11} L ${cx + 5} ${h / 2 - 15} L ${cx - 5} ${h / 2 - 19} L ${cx + 5} ${h / 2 - 23}`
            : `M ${cx - 5} ${h / 2 + 3} L ${cx + 5} ${h / 2 + 7} L ${cx - 5} ${h / 2 + 11} L ${cx + 5} ${h / 2 + 15} L ${cx - 5} ${h / 2 + 19} L ${cx + 5} ${h / 2 + 23}`
        }
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Rail bar */}
      <line
        x1={cx - 8}
        y1={isUp ? 8 : h - 8}
        x2={cx + 8}
        y2={isUp ? 8 : h - 8}
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      {!preview && (
        <text
          x={cx}
          y={isUp ? 4 : h - 1}
          textAnchor="middle"
          fontSize={8}
          fontFamily="var(--app-font-mono)"
          fill="hsl(var(--muted-foreground))"
          dominantBaseline={isUp ? "auto" : "hanging"}
        >
          {isUp ? "VCC" : "GND"}
        </text>
      )}
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*  7-segment display                                                          */
/* -------------------------------------------------------------------------- */

function SevenSegmentBody({
  gate,
  w,
  h,
  signals,
  preview,
}: {
  gate: Gate;
  w: number;
  h: number;
  signals: Signal[];
  preview?: boolean;
}) {
  const stroke = "currentColor";
  const fill = "hsl(var(--card))";
  const sw = 1.6;

  // Decode BCD/hex value from 4 input pins (MSB first)
  const a = signals[0];
  const b = signals[1];
  const c = signals[2];
  const d = signals[3];
  const allKnown = [a, b, c, d].every((s) => s === 0 || s === 1);
  let value: number | null = null;
  if (allKnown) {
    value = ((a as number) << 3) | ((b as number) << 2) | ((c as number) << 1) | (d as number);
  }
  const segs = value !== null ? SEGMENTS_HEX[value] ?? [false, false, false, false, false, false, true] : null;

  // Display geometry
  const dispX = 26;
  const dispY = 12;
  const dispW = w - 36;
  const dispH = h - 24;
  const segLen = dispW * 0.7;
  const segShortV = dispH * 0.42;
  const segThick = 5;
  const cxd = dispX + dispW / 2;
  const cyd = dispY + dispH / 2;

  const onColor = "hsl(var(--signal-high))";
  const offColor = "hsl(var(--muted) / 0.35)";
  const dim = (active?: boolean) => (active ? onColor : offColor);

  return (
    <g>
      <PinStubsAndLabels gate={gate} signals={signals} />
      {/* Display chassis */}
      <rect
        x={10}
        y={4}
        width={w - 20}
        height={h - 8}
        rx={6}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
      />
      {/* Inner display panel */}
      <rect
        x={dispX - 6}
        y={dispY - 4}
        width={dispW + 12}
        height={dispH + 8}
        rx={4}
        fill="hsl(var(--background))"
        stroke="hsl(var(--border))"
        strokeWidth={1}
      />
      {/* Segments */}
      <g
        transform={`translate(${cxd} ${cyd})`}
        style={{ filter: "drop-shadow(0 0 2px hsl(var(--signal-high)/0.35))" }}
      >
        <Segment x={-segLen / 2} y={-dispH / 2 + 2} len={segLen} thick={segThick} horizontal color={dim(segs?.[0])} />
        <Segment x={segLen / 2 - segThick / 2} y={-segShortV - 1} len={segShortV} thick={segThick} horizontal={false} color={dim(segs?.[1])} />
        <Segment x={segLen / 2 - segThick / 2} y={1} len={segShortV} thick={segThick} horizontal={false} color={dim(segs?.[2])} />
        <Segment x={-segLen / 2} y={dispH / 2 - segThick - 2} len={segLen} thick={segThick} horizontal color={dim(segs?.[3])} />
        <Segment x={-segLen / 2 - segThick / 2} y={1} len={segShortV} thick={segThick} horizontal={false} color={dim(segs?.[4])} />
        <Segment x={-segLen / 2 - segThick / 2} y={-segShortV - 1} len={segShortV} thick={segThick} horizontal={false} color={dim(segs?.[5])} />
        <Segment x={-segLen / 2} y={-segThick / 2} len={segLen} thick={segThick} horizontal color={dim(segs?.[6])} />
      </g>
      {!preview && value !== null && (
        <text
          x={w - 14}
          y={h - 7}
          textAnchor="end"
          fontSize={8}
          fontFamily="var(--app-font-mono)"
          fill="hsl(var(--muted-foreground))"
        >
          {value.toString(16).toUpperCase()}
        </text>
      )}
    </g>
  );
}

function Segment({
  x,
  y,
  len,
  thick,
  horizontal,
  color,
}: {
  x: number;
  y: number;
  len: number;
  thick: number;
  horizontal: boolean;
  color: string;
}) {
  const w = horizontal ? len : thick;
  const h = horizontal ? thick : len;
  // Hexagonal shape via path
  const points = horizontal
    ? `M ${x + thick / 2} ${y} L ${x + w - thick / 2} ${y} L ${x + w} ${y + h / 2} L ${x + w - thick / 2} ${y + h} L ${x + thick / 2} ${y + h} L ${x} ${y + h / 2} Z`
    : `M ${x + w / 2} ${y} L ${x + w} ${y + thick / 2} L ${x + w} ${y + h - thick / 2} L ${x + w / 2} ${y + h} L ${x} ${y + h - thick / 2} L ${x} ${y + thick / 2} Z`;
  return <path d={points} fill={color} />;
}

/* -------------------------------------------------------------------------- */
/*  BUTTON (momentary push)                                                   */
/* -------------------------------------------------------------------------- */

function ButtonBody({ gate, w, h, preview }: { gate: Gate; w: number; h: number; preview?: boolean }) {
  const on = !!gate.on;
  const active = "hsl(var(--signal-high))";
  const off = "hsl(var(--muted-foreground))";
  const colour = on ? active : off;
  const cy = h / 2;
  const btnR = Math.min(w - 16, h - 8) * 0.38;
  const cx = w / 2 - 2;

  return (
    <g>
      <line x1={cx + btnR + 4} y1={cy} x2={w} y2={cy} stroke={colour} strokeWidth={2} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={btnR + 7} fill="hsl(var(--card))" stroke={off} strokeWidth={1.4} />
      <circle cx={cx} cy={cy} r={btnR}
        fill={on ? "hsl(var(--signal-high)/0.18)" : "hsl(var(--card))"}
        stroke={colour} strokeWidth={on ? 2.5 : 1.8}
        style={{ filter: on ? "drop-shadow(0 0 4px hsl(var(--signal-high)/0.5))" : "none" }}
      />
      <circle cx={cx} cy={cy} r={btnR * 0.38} fill={on ? active : "hsl(var(--muted)/0.4)"} />
      {!preview && (
        <text x={w / 2} y={-5} textAnchor="middle" fontSize={8} fontFamily="var(--app-font-mono)" fill="hsl(var(--muted-foreground))">{gate.label ?? "BTN"}</text>
      )}
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*  RGB LED                                                                   */
/* -------------------------------------------------------------------------- */

function RGBLEDBody({ gate, w, h, signals, preview }: { gate: Gate; w: number; h: number; signals: Signal[]; preview?: boolean }) {
  const r = signals[0] === 1;
  const g = signals[1] === 1;
  const b = signals[2] === 1;

  let fill = "#1e293b";
  if (r && g && b)  fill = "#ffffff";
  else if (r && g)  fill = "#ffff00";
  else if (r && b)  fill = "#ff00ee";
  else if (g && b)  fill = "#00ffee";
  else if (r)       fill = "#ff2020";
  else if (g)       fill = "#20ff40";
  else if (b)       fill = "#4060ff";
  const isOn = r || g || b;
  const pins = pinsFor(gate);
  const cx = w - 14;
  const cy = h / 2;
  const radius = (h - 12) / 2;

  return (
    <g>
      {pins.map((pin, i) => (
        <line key={i} x1={pin.x} y1={pin.y} x2={cx - radius - 2} y2={pin.y} stroke={signalColor(signals[i])} strokeWidth={2} strokeLinecap="round" />
      ))}
      <circle cx={cx} cy={cy} r={radius + 4} fill="hsl(var(--card))" stroke="hsl(var(--muted-foreground))" strokeWidth={1.4} />
      <circle cx={cx} cy={cy} r={radius}
        fill={fill}
        stroke={isOn ? fill : "hsl(var(--muted-foreground))"}
        strokeWidth={1.5}
        style={{ filter: isOn ? `drop-shadow(0 0 6px ${fill})` : "none" }}
      />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize={7} fontFamily="var(--app-font-mono)" fontWeight={700}
        fill={isOn ? (r && g && b ? "#000" : "hsl(var(--background))") : "hsl(var(--muted-foreground))"}>
        RGB
      </text>
      {!preview && (
        <text x={w / 2} y={-5} textAnchor="middle" fontSize={8} fontFamily="var(--app-font-mono)" fill="hsl(var(--muted-foreground))">{gate.label ?? "RGB LED"}</text>
      )}
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*  BUZZER                                                                    */
/* -------------------------------------------------------------------------- */

function BuzzerBody({ gate, w, h, signal, preview }: { gate: Gate; w: number; h: number; signal: Signal; preview?: boolean }) {
  const on = signal === 1;
  const colour = on ? "hsl(var(--signal-high))" : "hsl(var(--muted-foreground))";
  const cy = h / 2;
  const bh = h * 0.55;
  const bx = 20;

  return (
    <g>
      <line x1={0} y1={cy} x2={bx - 2} y2={cy} stroke={colour} strokeWidth={2} strokeLinecap="round" />
      <polygon points={`${bx},${cy - bh * 0.35} ${bx + bh * 0.45},${cy - bh * 0.6} ${bx + bh * 0.45},${cy + bh * 0.6} ${bx},${cy + bh * 0.35}`}
        fill="hsl(var(--card))" stroke={colour} strokeWidth={1.6} />
      {on && [0.32, 0.44, 0.56].map((rf, i) => (
        <path key={i}
          d={`M ${bx + bh * 0.45 + 2} ${cy - bh * rf} Q ${bx + bh * (0.45 + rf * 0.9) + 2} ${cy} ${bx + bh * 0.45 + 2} ${cy + bh * rf}`}
          fill="none" stroke={colour} strokeWidth={1.4 - i * 0.2} opacity={1 - i * 0.3}
        />
      ))}
      {!on && (
        <line x1={bx + bh * 0.5} y1={cy - 5} x2={bx + bh * 0.5 + 8} y2={cy + 5} stroke="hsl(var(--muted-foreground)/0.4)" strokeWidth={1.4} />
      )}
      {!preview && (
        <text x={w / 2} y={-5} textAnchor="middle" fontSize={8} fontFamily="var(--app-font-mono)" fill="hsl(var(--muted-foreground))">{gate.label ?? "BUZZER"}</text>
      )}
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*  HEX4 (4-bit hex display)                                                  */
/* -------------------------------------------------------------------------- */

function HexDisplayBody({ gate, w, h, signals, preview }: { gate: Gate; w: number; h: number; signals: Signal[]; preview?: boolean }) {
  const i3 = signals[0] === 1 ? 1 : 0;
  const i2 = signals[1] === 1 ? 1 : 0;
  const i1 = signals[2] === 1 ? 1 : 0;
  const i0 = signals[3] === 1 ? 1 : 0;
  const value = i3 * 8 + i2 * 4 + i1 * 2 + i0;
  const segs = SEGMENTS_HEX[value] ?? SEGMENTS_HEX[0];
  const [sa, sb, sc, sd, se, sf, sg] = segs;

  const px = 14;
  const pw = w - px - 6;
  const ph = h - 16;
  const py = 8;
  const sw = 4;
  const dim = "#0a0a0a";
  const lit = "hsl(var(--signal-high))";

  function S({ x, y, len, horiz, on }: { x: number; y: number; len: number; horiz: boolean; on: boolean }) {
    const fill = on ? lit : dim;
    const filter = on ? "drop-shadow(0 0 2px hsl(var(--signal-high)/0.5))" : "none";
    if (horiz) {
      const pts = `M ${x + sw / 2} ${y} L ${x + len - sw / 2} ${y} L ${x + len} ${y + sw / 2} L ${x + len - sw / 2} ${y + sw} L ${x + sw / 2} ${y + sw} L ${x} ${y + sw / 2} Z`;
      return <path d={pts} fill={fill} style={{ filter }} />;
    } else {
      const pts = `M ${x + sw / 2} ${y} L ${x + sw} ${y + sw / 2} L ${x + sw} ${y + len - sw / 2} L ${x + sw / 2} ${y + len} L ${x} ${y + len - sw / 2} L ${x} ${y + sw / 2} Z`;
      return <path d={pts} fill={fill} style={{ filter }} />;
    }
  }

  const ml = pw / 2 - sw / 2;
  const hl = ph / 2 - sw;

  return (
    <g>
      <PinStubsAndLabels gate={gate} signals={signals} />
      <rect x={px - 2} y={py - 2} width={pw + 4} height={ph + 4} rx={4} fill="#050505" stroke="hsl(var(--border))" strokeWidth={1.4} />
      {/* a top   */ }<S x={px + sw}     y={py}              len={ml}   horiz on={sa} />
      {/* b top-R */ }<S x={px + pw - sw} y={py + sw}         len={hl}   horiz={false} on={sb} />
      {/* c bot-R */ }<S x={px + pw - sw} y={py + ph / 2}     len={hl}   horiz={false} on={sc} />
      {/* d bot   */ }<S x={px + sw}     y={py + ph - sw}    len={ml}   horiz on={sd} />
      {/* e bot-L */ }<S x={px}           y={py + ph / 2}     len={hl}   horiz={false} on={se} />
      {/* f top-L */ }<S x={px}           y={py + sw}         len={hl}   horiz={false} on={sf} />
      {/* g mid   */ }<S x={px + sw}     y={py + ph / 2 - sw / 2} len={ml} horiz on={sg} />
      {!preview && (
        <text x={w / 2 + 4} y={h + 11} textAnchor="middle" fontSize={9} fontFamily="var(--app-font-mono)" fontWeight={700} fill="hsl(var(--signal-high)/0.6)">
          {value.toString(16).toUpperCase()}h
        </text>
      )}
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*  LABEL                                                                     */
/* -------------------------------------------------------------------------- */

function LabelBody({ gate, w, h }: { gate: Gate; w: number; h: number }) {
  return (
    <g>
      <rect x={2} y={2} width={w - 4} height={h - 4} rx={3} fill="hsl(var(--card)/0.5)" stroke="hsl(var(--border))" strokeWidth={1} strokeDasharray="4 2" />
      <text x={w / 2} y={h / 2} textAnchor="middle" dominantBaseline="middle" fontSize={10} fontFamily="var(--app-font-mono)" fill="hsl(var(--muted-foreground))">
        {gate.label ?? "label"}
      </text>
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*  INPUT (toggle)                                                             */
/* -------------------------------------------------------------------------- */

function InputBody({ gate, w, h, preview }: { gate: Gate; w: number; h: number; preview?: boolean }) {
  const stroke = "currentColor";
  const sw = 1.6;
  const on = !!gate.on;
  const onColor = "hsl(var(--signal-high))";
  const offColor = "hsl(var(--muted))";

  return (
    <g>
      {/* Output wire stub */}
      <line
        x1={w - 8}
        y1={h / 2}
        x2={w}
        y2={h / 2}
        stroke={on ? onColor : "hsl(var(--signal-low))"}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* Body */}
      <rect
        x={4}
        y={6}
        width={w - 12}
        height={h - 12}
        rx={6}
        fill="hsl(var(--card))"
        stroke={on ? onColor : stroke}
        strokeWidth={on ? 1.8 : sw}
        style={{ filter: on ? "drop-shadow(0 0 4px hsl(var(--signal-high)/0.4))" : "none" }}
      />
      {/* Toggle track */}
      <rect
        x={9}
        y={h / 2 - 7}
        width={w - 22}
        height={14}
        rx={7}
        fill={on ? onColor : offColor}
        opacity={on ? 0.85 : 1}
      />
      {/* Toggle thumb */}
      <circle
        cx={on ? w - 16 : 16}
        cy={h / 2}
        r={5.5}
        fill="hsl(var(--card))"
        stroke={on ? onColor : "currentColor"}
        strokeWidth={sw}
        style={{ transition: "cx 120ms ease-out" }}
      />
      {/* Label above */}
      {!preview && gate.label && (
        <text
          x={w / 2}
          y={-4}
          textAnchor="middle"
          fontSize={10}
          fontFamily="var(--app-font-mono)"
          fill="hsl(var(--muted-foreground))"
        >
          {gate.label}
        </text>
      )}
      {/* Signal value below */}
      {!preview && (
        <text
          x={w / 2 - 6}
          y={h + 12}
          textAnchor="middle"
          fontSize={9}
          fontFamily="var(--app-font-mono)"
          fontWeight={700}
          fill={on ? onColor : "hsl(var(--muted-foreground))"}
        >
          {on ? "1" : "0"}
        </text>
      )}
      {/* Click hint when not preview */}
      {!preview && !on && (
        <text
          x={w / 2 - 6}
          y={h + 22}
          textAnchor="middle"
          fontSize={8}
          fontFamily="var(--app-font-mono)"
          fill="hsl(var(--muted-foreground)/0.5)"
        >
          click
        </text>
      )}
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*  OUTPUT (LED)                                                               */
/* -------------------------------------------------------------------------- */

function OutputBody({
  gate,
  w,
  h,
  signal,
  preview,
}: {
  gate: Gate;
  w: number;
  h: number;
  signal: Signal | undefined;
  preview?: boolean;
}) {
  const sw = 1.6;
  const on = signal === 1;
  const isUnknown = signal === "X" || signal === undefined;
  const fillColor = on
    ? "hsl(var(--signal-high))"
    : isUnknown
    ? "hsl(var(--card))"
    : "hsl(var(--card))";
  const ringColor = signalColor(signal);
  const ledR = h / 2 - 6;

  return (
    <g
      className={on ? "signal-glow" : ""}
      style={{
        filter: on
          ? "drop-shadow(0 0 6px hsl(var(--signal-high)/0.7))"
          : "none",
      }}
    >
      {/* Input wire stub */}
      <line
        x1={0}
        y1={h / 2}
        x2={8}
        y2={h / 2}
        stroke={signalColor(signal)}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* LED outer ring */}
      <circle
        cx={w / 2 + 4}
        cy={h / 2}
        r={ledR}
        fill={fillColor}
        stroke={ringColor}
        strokeWidth={on ? 2 : sw}
      />
      {/* LED fill glow ring when HIGH */}
      {on && (
        <>
          <circle
            cx={w / 2 + 4}
            cy={h / 2}
            r={ledR}
            fill="hsl(var(--signal-high))"
            opacity={0.85}
          />
          {/* Specular highlight */}
          <circle
            cx={w / 2 + 1}
            cy={h / 2 - 3}
            r={3}
            fill="white"
            opacity={0.3}
          />
        </>
      )}
      {/* LOW state dim fill */}
      {signal === 0 && (
        <circle
          cx={w / 2 + 4}
          cy={h / 2}
          r={ledR - 2}
          fill="hsl(var(--signal-low)/0.15)"
        />
      )}
      {/* Label above */}
      {!preview && gate.label && (
        <text
          x={w / 2 + 4}
          y={-4}
          textAnchor="middle"
          fontSize={10}
          fontFamily="var(--app-font-mono)"
          fill="hsl(var(--muted-foreground))"
        >
          {gate.label}
        </text>
      )}
      {/* Signal badge below */}
      {!preview && (
        <text
          x={w / 2 + 4}
          y={h + 12}
          textAnchor="middle"
          fontSize={9}
          fontFamily="var(--app-font-mono)"
          fontWeight={700}
          fill={signalColor(signal)}
        >
          {on ? "1" : signal === 0 ? "0" : "X"}
        </text>
      )}
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*  PROBE                                                                      */
/* -------------------------------------------------------------------------- */

function ProbeBody({
  gate,
  w,
  h,
  signal,
  preview,
}: {
  gate: Gate;
  w: number;
  h: number;
  signal: Signal | undefined;
  preview?: boolean;
}) {
  const sw = 1.6;
  const text = signal === 1 ? "1" : signal === 0 ? "0" : "X";
  const color = signalColor(signal);
  return (
    <g>
      <line
        x1={0}
        y1={h / 2}
        x2={8}
        y2={h / 2}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* Probe connector triangle */}
      <path
        d={`M 8 ${h / 2 - 6} L 8 ${h / 2 + 6} L 14 ${h / 2} Z`}
        fill={color}
        opacity={0.4}
      />
      <rect
        x={8}
        y={6}
        width={w - 12}
        height={h - 12}
        rx={4}
        fill="hsl(var(--card))"
        stroke={color}
        strokeWidth={sw}
      />
      <text
        x={(8 + w - 4) / 2}
        y={h / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="var(--app-font-mono)"
        fontSize={16}
        fontWeight={700}
        fill={color}
      >
        {text}
      </text>
      {!preview && gate.label && (
        <text
          x={w / 2 + 2}
          y={-4}
          textAnchor="middle"
          fontSize={10}
          fontFamily="var(--app-font-mono)"
          fill="hsl(var(--muted-foreground))"
        >
          {gate.label}
        </text>
      )}
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*  CLOCK                                                                      */
/* -------------------------------------------------------------------------- */

function ClockBody({
  gate,
  w,
  h,
  signal,
  preview,
}: {
  gate: Gate;
  w: number;
  h: number;
  signal: Signal | undefined;
  preview?: boolean;
}) {
  const sw = 1.6;
  const on = signal === 1;
  const stroke = "currentColor";
  return (
    <g>
      <line
        x1={w - 8}
        y1={h / 2}
        x2={w}
        y2={h / 2}
        stroke={signalColor(signal)}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <rect
        x={4}
        y={6}
        width={w - 12}
        height={h - 12}
        rx={5}
        fill="hsl(var(--card))"
        stroke={stroke}
        strokeWidth={sw}
      />
      <path
        d={`M 10 ${h / 2 + 6} L 18 ${h / 2 + 6} L 18 ${h / 2 - 6} L 28 ${h / 2 - 6} L 28 ${h / 2 + 6} L 38 ${h / 2 + 6} L 38 ${h / 2 - 6} L ${w - 14} ${h / 2 - 6}`}
        fill="none"
        stroke={on ? "hsl(var(--signal-high))" : "hsl(var(--muted-foreground))"}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {!preview && (
        <text
          x={w / 2 - 6}
          y={-4}
          textAnchor="middle"
          fontSize={9}
          fontFamily="var(--app-font-mono)"
          fill="hsl(var(--muted-foreground))"
        >
          {gate.hz ?? 1} Hz
        </text>
      )}
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*  CONST                                                                      */
/* -------------------------------------------------------------------------- */

function ConstBody({
  gate,
  w,
  h,
  preview,
}: {
  gate: Gate;
  w: number;
  h: number;
  preview?: boolean;
}) {
  const sw = 1.6;
  const isOne = gate.kind === "CONST1";
  const color = isOne ? "hsl(var(--signal-high))" : "hsl(var(--signal-low))";
  return (
    <g>
      <line
        x1={w - 8}
        y1={h / 2}
        x2={w}
        y2={h / 2}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <rect
        x={4}
        y={4}
        width={w - 12}
        height={h - 8}
        rx={4}
        fill="hsl(var(--card))"
        stroke="currentColor"
        strokeWidth={sw}
      />
      <text
        x={(4 + w - 4) / 2 - 1}
        y={h / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="var(--app-font-mono)"
        fontSize={16}
        fontWeight={700}
        fill={color}
      >
        {isOne ? "1" : "0"}
      </text>
      {!preview && (
        <text
          x={w / 2 - 4}
          y={-4}
          textAnchor="middle"
          fontSize={9}
          fontFamily="var(--app-font-mono)"
          fill="hsl(var(--muted-foreground))"
        >
          {isOne ? "VCC" : "GND"}
        </text>
      )}
    </g>
  );
}
