import React from 'react';
import { Group, Rect, Circle, Line, Arc, Path } from 'react-konva';

interface PartProps {
    id: string;
    x: number;
    y: number;
    isPowered?: boolean;
    speed?: number;
    stroke?: string;
    dragBoundFunc?: (pos: any) => any;
}

export const ComponentShape: React.FC<{ obj: any, dragBoundFunc?: (pos: any) => any }> = ({ obj, dragBoundFunc }) => {
    const props = {
        id: obj.id,
        x: obj.x || 0,
        y: obj.y || 0,
        isPowered: obj.isPowered,
        speed: obj.speed,
        stroke: obj.stroke,
        dragBoundFunc: dragBoundFunc,
        obj: obj
    };

    switch (obj.partType) {
        case 'nema17': return <Nema17 {...props} />;
        case 'arduino_uno': return <ArduinoUno {...props} />;
        case 'esp32': return <Esp32 {...props} />;
        case 'lcd_1602': return <Lcd1602 {...props} />;
        case 'gate_and': return <GateAnd {...props} />;
        case 'gate_or': return <GateOr {...props} />;
        case 'gate_not': return <GateNot {...props} />;
        case 'resistor': return <Resistor {...props} />;
        case 'led_red': return <LedRed {...props} />;
        case 'led_blue': return <LedBlue {...props} />;
        case 'battery_18650': return <Battery18650 {...props} />;
        case 'ground': return <Ground {...props} />;
        case 'switch_spst': return <SwitchSPST {...props} />;
        case 'button': return <Button {...props} />;
        default: return <GenericPart {...props} />;
    }
};

const GenericPart: React.FC<PartProps> = ({ id, x, y, isPowered }) => (
    <Group id={id} name="element-group" x={x} y={y} draggable dragBoundFunc={dragBoundFunc}>
        <Rect x={-20} y={-20} width={40} height={40} stroke={isPowered ? '#ffcc00' : '#fff'} fill="#333" />
    </Group>
);

const Nema17: React.FC<any> = ({ id, x, y, isPowered, speed = 0, stroke = '#fff', obj }) => {
    const rotation = obj?.currentAngle || 0;
    return (
        <Group id={id} name="element-group" x={x} y={y} draggable dragBoundFunc={dragBoundFunc}>
            <Rect x={-21.15} y={-21.15} width={42.3} height={42.3} stroke={stroke} strokeWidth={1} />
            <Circle x={0} y={0} radius={11} stroke={stroke} strokeWidth={1} />
            <Group rotation={rotation % 360}>
                <Circle x={0} y={0} radius={2.5} stroke={stroke} strokeWidth={1} />
                <Line points={[0, 0, 0, -10]} stroke={stroke} strokeWidth={1} />
            </Group>
        </Group>
    );
};

const ArduinoUno: React.FC<PartProps> = ({ id, x, y, stroke = '#fff' }) => (
    <Group id={id} name="element-group" x={x} y={y} draggable dragBoundFunc={dragBoundFunc}>
        <Rect x={-34.3} y={-26.7} width={68.6} height={53.3} stroke={stroke} fill="rgba(0, 100, 150, 0.2)" strokeWidth={1} />
        <Rect x={-37} y={-20} width={16} height={12} stroke={stroke} strokeWidth={1} />
        <Rect x={-37} y={8} width={14} height={9} stroke={stroke} strokeWidth={1} />
        <Rect x={-5} y={-5} width={25} height={10} stroke={stroke} strokeWidth={1} />
        <Rect x={-10} y={-25} width={40} height={3} stroke={stroke} strokeWidth={1} />
        <Rect x={-10} y={22} width={35} height={3} stroke={stroke} strokeWidth={1} />
    </Group>
);

const Esp32: React.FC<PartProps> = ({ id, x, y, stroke = '#fff' }) => (
    <Group id={id} name="element-group" x={x} y={y} draggable dragBoundFunc={dragBoundFunc}>
        <Rect x={-14} y={-24} width={28} height={48} stroke={stroke} fill="rgba(50, 50, 50, 0.4)" strokeWidth={1} />
        <Rect x={-9} y={-22} width={18} height={25.5} stroke={stroke} strokeWidth={1} />
        <Rect x={-8} y={-21} width={16} height={5} stroke={stroke} strokeWidth={0.5} dash={[1, 1]} />
    </Group>
);

const Lcd1602: React.FC<PartProps> = ({ id, x, y, stroke = '#fff' }) => (
    <Group id={id} name="element-group" x={x} y={y} draggable dragBoundFunc={dragBoundFunc}>
        <Rect x={-40} y={-18} width={80} height={36} stroke={stroke} fill="rgba(0,0,0,0.4)" strokeWidth={1} />
        <Rect x={-35.5} y={-13} width={71} height={26} stroke={stroke} strokeWidth={1} />
        <Rect x={-32.25} y={-7.25} width={64.5} height={14.5} stroke={stroke} strokeWidth={1} />
    </Group>
);

const GateAnd: React.FC<PartProps> = ({ id, x, y, isPowered, stroke = '#fff' }) => (
    <Group id={id} name="element-group" x={x} y={y} draggable dragBoundFunc={dragBoundFunc}>
        {/* Simple path for AND gate */}
        <Path data="M -10 -10 L 0 -10 A 10 10 0 0 1 0 10 L -10 10 Z" stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={isPowered ? 2 : 1.2} />
        <Line points={[-15, -5, -10, -5]} stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={isPowered ? 2 : 1.2} />
        <Line points={[-15, 5, -10, 5]} stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={isPowered ? 2 : 1.2} />
        <Line points={[10, 0, 15, 0]} stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={isPowered ? 2 : 1.2} />
    </Group>
);

const GateOr: React.FC<PartProps> = ({ id, x, y, isPowered, stroke = '#fff' }) => (
    <Group id={id} name="element-group" x={x} y={y} draggable dragBoundFunc={dragBoundFunc}>
        {/* Simple path for OR gate */}
        <Path data="M -10 -10 Q -5 0 -10 10 Q 5 10 10 0 Q 5 -10 -10 -10 Z" stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={isPowered ? 2 : 1.2} />
        <Line points={[-15, -5, -7, -5]} stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={isPowered ? 2 : 1.2} />
        <Line points={[-15, 5, -7, 5]} stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={isPowered ? 2 : 1.2} />
        <Line points={[10, 0, 15, 0]} stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={isPowered ? 2 : 1.2} />
    </Group>
);

const GateNot: React.FC<PartProps> = ({ id, x, y, isPowered, stroke = '#fff' }) => (
    <Group id={id} name="element-group" x={x} y={y} draggable dragBoundFunc={dragBoundFunc}>
        <Path data="M -10 -10 L -10 10 L 5 0 Z" stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={isPowered ? 2 : 1.2} />
        <Circle x={7} y={0} radius={2} stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={isPowered ? 2 : 1.2} />
        <Line points={[-15, 0, -10, 0]} stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={isPowered ? 2 : 1.2} />
        <Line points={[9, 0, 15, 0]} stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={isPowered ? 2 : 1.2} />
    </Group>
);

const Resistor: React.FC<PartProps> = ({ id, x, y, isPowered, stroke = '#fff' }) => (
    <Group id={id} name="element-group" x={x} y={y} draggable dragBoundFunc={dragBoundFunc}>
        <Line points={[-20, 0, 20, 0]} stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={isPowered ? 2 : 1.2} />
        <Rect x={-10} y={-3} width={20} height={6} stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={isPowered ? 2 : 1.2} fill="#0a0b0c" />
        <Rect x={-6} y={-3} width={2} height={6} fill="#8B4513" />
        <Rect x={-2} y={-3} width={2} height={6} fill="#FF0000" />
        <Rect x={2} y={-3} width={2} height={6} fill="#FFA500" />
    </Group>
);

const LedRed: React.FC<PartProps> = ({ id, x, y, isPowered, stroke = '#fff' }) => (
    <Group id={id} name="element-group" x={x} y={y} draggable dragBoundFunc={dragBoundFunc}>
        <Line points={[-15, 0, -5, 0]} stroke={stroke} strokeWidth={1} />
        <Line points={[5, 0, 15, 0]} stroke={stroke} strokeWidth={1} />
        <Path data="M -5 -5 L -5 5 L 5 0 Z" stroke={stroke} strokeWidth={1} fill={isPowered ? '#ff0000' : 'transparent'} />
        <Line points={[5, -5, 5, 5]} stroke={stroke} strokeWidth={1} />
        <Circle x={0} y={0} radius={8} stroke={isPowered ? '#ff6666' : stroke} strokeWidth={1} fill={isPowered ? '#ff0000' : 'transparent'} shadowColor={isPowered ? '#ff0000' : 'transparent'} shadowBlur={isPowered ? 15 : 0} />
    </Group>
);

const LedBlue: React.FC<PartProps> = ({ id, x, y, isPowered, stroke = '#fff' }) => (
    <Group id={id} name="element-group" x={x} y={y} draggable dragBoundFunc={dragBoundFunc}>
        <Line points={[-15, 0, -5, 0]} stroke={stroke} strokeWidth={1} />
        <Line points={[5, 0, 15, 0]} stroke={stroke} strokeWidth={1} />
        <Path data="M -5 -5 L -5 5 L 5 0 Z" stroke={stroke} strokeWidth={1} fill={isPowered ? '#3b82f6' : 'transparent'} />
        <Line points={[5, -5, 5, 5]} stroke={stroke} strokeWidth={1} />
        <Circle x={0} y={0} radius={8} stroke={isPowered ? '#8fb6f9' : stroke} strokeWidth={1} fill={isPowered ? '#3b82f6' : 'transparent'} shadowColor={isPowered ? '#3b82f6' : 'transparent'} shadowBlur={isPowered ? 15 : 0} />
    </Group>
);

const Battery18650: React.FC<PartProps> = ({ id, x, y, stroke = '#fff' }) => (
    <Group id={id} name="element-group" x={x} y={y} draggable dragBoundFunc={dragBoundFunc}>
        <Rect x={-9} y={-32.5} width={18} height={65} stroke={stroke} strokeWidth={1} />
        <Rect x={-4} y={-34} width={8} height={2} stroke={stroke} strokeWidth={1} />
    </Group>
);

const Ground: React.FC<PartProps> = ({ id, x, y, stroke = '#fff' }) => (
    <Group id={id} name="element-group" x={x} y={y} draggable dragBoundFunc={dragBoundFunc}>
        <Line points={[0, 0, 0, -10]} stroke={stroke} strokeWidth={1} />
        <Line points={[-8, 0, 8, 0]} stroke={stroke} strokeWidth={1} />
        <Line points={[-5, 3, 5, 3]} stroke={stroke} strokeWidth={1} />
        <Line points={[-2, 6, 2, 6]} stroke={stroke} strokeWidth={1} />
    </Group>
);

const SwitchSPST: React.FC<PartProps> = ({ id, x, y, isPowered, stroke = '#fff', obj }: any) => {
    const isOpen = obj?.state === 'open';
    const leverY = isOpen ? -8 : 0;
    return (
        <Group id={id} name="element-group" x={x} y={y} draggable dragBoundFunc={dragBoundFunc}>
            <Line points={[-15, 0, -5, 0]} stroke={stroke} strokeWidth={1} />
            <Line points={[5, 0, 15, 0]} stroke={stroke} strokeWidth={1} />
            <Line points={[-5, 0, 5, leverY]} stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={1} />
        </Group>
    );
};

const Button: React.FC<PartProps> = ({ id, x, y, isPowered, stroke = '#fff', obj }: any) => {
    const isPushed = obj?.state === true;
    const pushY = isPushed ? 0 : -5;
    return (
        <Group id={id} name="element-group" x={x} y={y} draggable dragBoundFunc={dragBoundFunc}>
            <Line points={[-15, 0, -5, 0]} stroke={stroke} strokeWidth={1} />
            <Line points={[5, 0, 15, 0]} stroke={stroke} strokeWidth={1} />
            <Line points={[-5, pushY, 5, pushY]} stroke={stroke} strokeWidth={1} />
            <Line points={[0, pushY, 0, pushY - 5]} stroke={stroke} strokeWidth={1} />
            <Rect x={-4} y={pushY - 7} width={8} height={2} stroke={stroke} strokeWidth={1} fill={stroke} />
        </Group>
    );
};
