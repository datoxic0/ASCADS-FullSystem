import React from 'react';
import { Group, Rect, Circle, Text, Path } from 'react-konva';

export interface FootprintProps {
  type: string;
  label: string;
  isHovered: boolean;
  viewMode: '2D' | '3D';
}

const Pad = ({ x, y, size = 12, isThroughHole = true }: { x: number; y: number; size?: number; isThroughHole?: boolean }) => (
  <Group x={x} y={y}>
    <Circle radius={size/2} fill="#fbbf24" stroke="#d97706" strokeWidth={1} />
    {isThroughHole && <Circle radius={size/4} fill="#0f172a" />}
  </Group>
);

const SMDPad = ({ x, y, w = 12, h = 16 }: { x: number; y: number; w?: number; h?: number }) => (
  <Rect x={x - w/2} y={y - h/2} width={w} height={h} fill="#fbbf24" cornerRadius={1} />
);

export const renderFootprint = ({ type, label, isHovered, viewMode }: FootprintProps) => {
  const is3D = viewMode === '3D';
  const shadow = is3D ? { shadowColor: '#000', shadowBlur: 10, shadowOffsetX: -5, shadowOffsetY: 5, shadowOpacity: 0.6 } : {};

  // Default dimensions
  let width = 60;
  let height = 40;

  let body = null;
  let pads = null;

  // Classify by package type
  if (['RESISTOR', 'DIODE', 'INDUCTOR'].includes(type)) {
    // Axial Package (0805 or TH)
    width = 80; height = 24;
    body = (
      <Group>
        {is3D && <Rect x={20} y={6} width={40} height={12} fill="#000" opacity={0.3} offsetY={-4} offsetX={4} />}
        <Rect x={20} y={6} width={40} height={12} fill={type === 'DIODE' ? '#1e293b' : '#0369a1'} cornerRadius={2} stroke={isHovered ? '#6366f1' : '#000'} strokeWidth={1} {...shadow} />
        {/* Silkscreen outline */}
        <Rect x={4} y={2} width={72} height={20} stroke="#fff" strokeWidth={1} opacity={0.8} />
        <Text text={label} x={0} y={-10} width={80} align="center" fill="#fff" fontSize={10} fontFamily="monospace" />
      </Group>
    );
    pads = (
      <Group>
        <Pad x={10} y={12} />
        <Pad x={70} y={12} />
      </Group>
    );
  } else if (['INTEGRATED_CIRCUIT', 'OP_AMP', 'LOGIC_AND', 'LOGIC_OR', 'XOR_GATE', 'XNOR_GATE', 'NAND_GATE', 'NOR_GATE', 'LOGIC_NOT'].includes(type)) {
    // DIP-8 / DIP-14 Package
    width = 80; height = 60;
    body = (
      <Group>
        {is3D && <Rect x={15} y={10} width={50} height={40} fill="#000" opacity={0.4} offsetY={-5} offsetX={5} />}
        <Rect x={15} y={10} width={50} height={40} fill="#0f172a" cornerRadius={2} stroke={isHovered ? '#6366f1' : '#1e293b'} strokeWidth={1.5} {...shadow} />
        <Circle x={25} y={18} radius={2} fill="#334155" /> {/* Pin 1 dot */}
        <Path data="M 15 25 Q 25 30 15 35" stroke="#1e293b" strokeWidth={1} /> {/* Notch */}
        <Rect x={12} y={8} width={56} height={44} stroke="#fff" strokeWidth={1} opacity={0.6} />
        <Text text={label} x={15} y={24} width={50} align="center" fill="#94a3b8" fontSize={9} fontFamily="monospace" rotation={90} offsetX={-10} offsetY={25} />
      </Group>
    );
    pads = (
      <Group>
        {/* Top row */}
        {[20, 33, 46, 59].map((px, i) => <SMDPad key={`t${i}`} x={px} y={8} w={6} h={12} />)}
        {/* Bottom row */}
        {[20, 33, 46, 59].map((px, i) => <SMDPad key={`b${i}`} x={px} y={52} w={6} h={12} />)}
      </Group>
    );
  } else if (['CAPACITOR', 'LED', 'TRANSISTOR', 'MOSFET', 'VOLTAGE_REGULATOR'].includes(type)) {
    // Radial / TO-92 / TO-220
    width = 40; height = 40;
    body = (
      <Group>
        {is3D && <Circle x={20} y={20} radius={12} fill="#000" opacity={0.3} offsetY={-4} offsetX={4} />}
        {['TRANSISTOR', 'MOSFET', 'VOLTAGE_REGULATOR'].includes(type) ? (
           <Path data="M 10 15 L 30 15 L 30 25 A 10 10 0 0 1 10 25 Z" fill="#0f172a" stroke={isHovered ? '#6366f1' : '#1e293b'} strokeWidth={1} {...shadow} />
        ) : (
           <Circle x={20} y={20} radius={12} fill={type === 'LED' ? '#ef4444' : '#1e293b'} stroke={isHovered ? '#6366f1' : '#000'} strokeWidth={1} {...shadow} />
        )}
        <Circle x={20} y={20} radius={16} stroke="#fff" strokeWidth={1} opacity={0.8} dash={[2, 2]} />
        <Text text={label} x={0} y={35} width={40} align="center" fill="#fff" fontSize={9} fontFamily="monospace" />
      </Group>
    );
    pads = (
      <Group>
        {['TRANSISTOR', 'MOSFET', 'VOLTAGE_REGULATOR'].includes(type) ? (
          <>
            <Pad x={12} y={20} size={8} />
            <Pad x={20} y={20} size={8} />
            <Pad x={28} y={20} size={8} />
          </>
        ) : (
          <>
            <Pad x={15} y={20} size={10} />
            <Pad x={25} y={20} size={10} />
          </>
        )}
      </Group>
    );
  } else if (type === 'BATTERY') {
    width = 100; height = 40;
    body = (
      <Group>
        {is3D && <Rect x={10} y={5} width={80} height={30} fill="#000" opacity={0.3} offsetY={-6} offsetX={6} />}
        <Rect x={10} y={5} width={80} height={30} fill="#1e293b" cornerRadius={4} stroke={isHovered ? '#6366f1' : '#334155'} strokeWidth={2} {...shadow} />
        <Rect x={5} y={2} width={90} height={36} stroke="#fff" strokeWidth={1.5} opacity={0.9} />
        <Text text="+" x={85} y={15} fill="#fff" fontSize={14} fontStyle="bold" />
        <Text text="-" x={5} y={12} fill="#fff" fontSize={18} fontStyle="bold" />
        <Text text={label} x={0} y={14} width={100} align="center" fill="#e2e8f0" fontSize={12} fontFamily="monospace" fontStyle="bold" />
      </Group>
    );
    pads = (
      <Group>
        <Pad x={15} y={20} size={16} />
        <Pad x={85} y={20} size={16} />
      </Group>
    );
  } else {
    // Default Generic footprint
    body = (
      <Group>
        {is3D && <Rect x={5} y={5} width={width-10} height={height-10} fill="#000" opacity={0.3} offsetY={-4} offsetX={4} />}
        <Rect x={5} y={5} width={width-10} height={height-10} fill="#1e293b" cornerRadius={2} stroke={isHovered ? '#6366f1' : '#334155'} strokeWidth={1} {...shadow} />
        <Rect x={2} y={2} width={width-4} height={height-4} stroke="#fff" strokeWidth={1} opacity={0.5} />
        <Text text={label} x={0} y={height/2 - 5} width={width} align="center" fill="#94a3b8" fontSize={9} fontFamily="monospace" />
      </Group>
    );
    pads = (
      <Group>
        <SMDPad x={5} y={height/2} />
        <SMDPad x={width-5} y={height/2} />
      </Group>
    );
  }

  return (
    <Group>
      {pads}
      {body}
    </Group>
  );
};
