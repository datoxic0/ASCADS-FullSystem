import React from 'react';
import { Group, Rect, Circle, Line, Arc, Path, Text } from 'react-konva';
import { EcosystemAdapter } from '../solvers/EcosystemAdapter';

interface PartProps {
    id: string;
    x: number;
    y: number;
    isPowered?: boolean;
    speed?: number;
    stroke?: string;
    dragBoundFunc?: (pos: any) => any;
    isSelectTool?: boolean;
    shadowProps?: any;
}

export const ComponentShape: React.FC<{ obj: any, dragBoundFunc?: (pos: any) => any, isSelectTool?: boolean, shadowProps?: any }> = ({ obj, dragBoundFunc, isSelectTool, shadowProps }) => {
    const props = {
        id: obj.id,
        x: obj.x || 0,
        y: obj.y || 0,
        isPowered: obj.isPowered,
        speed: obj.speed,
        stroke: obj.stroke || '#00f2ff',
        dragBoundFunc: dragBoundFunc,
        isSelectTool: isSelectTool,
        shadowProps: shadowProps,
        obj: obj
    };

    const pins = EcosystemAdapter.getPins(obj as any);
    const temp = obj.temperature || 20;
    const isHot = temp > 40;
    const isBurnedOut = obj.isBurnedOut;
    
    return (
        <Group id={props.id} name="element-group" x={props.x} y={props.y} draggable={isSelectTool} listening={isSelectTool} dragBoundFunc={dragBoundFunc} {...shadowProps}>
            {/* Thermal Heatmap Aura */}
            {isHot && !isBurnedOut && (
                <Circle x={0} y={0} radius={30} fill="rgba(239, 68, 68, 0.2)" shadowColor="#ef4444" shadowBlur={temp} shadowOpacity={Math.min(1, temp/100)} />
            )}
            
            <Group opacity={isBurnedOut ? 0.4 : 1}>
                {(() => {
                    switch (obj.partType) {
                        case 'nema17': return <Nema17 {...props} />;
                        case 'arduino_uno': return <ArduinoUno {...props} />;
                        case 'esp32': return <Esp32 {...props} />;
                        case 'pico': return <Pico {...props} />;
                        case 'lcd_1602': 
                        case 'lcd': return <Lcd1602 {...props} />;
                        case 'keypad': return <Keypad {...props} />;
                        case 'breadboard': return <Breadboard {...props} />;
                        case 'servo': return <Servo {...props} />;
                        case 'dcmotor': return <DcMotor {...props} />;
                        case 'gate_and': return <GateAnd {...props} />;
                        case 'gate_or': return <GateOr {...props} />;
                        case 'gate_not': return <GateNot {...props} />;
                        case 'gate_hadamard': return <GateHadamard {...props} />;
                        case 'gate_pauli_x': return <GatePauliX {...props} />;
                        case 'gate_cnot': return <GateCNOT {...props} />;
                        case 'gate_measure': return <GateMeasure {...props} />;
                        case 'fan': return <Fan {...props} />;
                        case 'resistor': return <Resistor {...props} />;
                        case 'led_red': 
                        case 'led_blue': 
                        case 'led': return <Led {...props} />;
                        case 'battery_18650': 
                        case 'battery': return <Battery {...props} />;
                        case 'ground': return <Ground {...props} />;
                        case 'switch_spst': 
                        case 'switch': return <SwitchSPST {...props} />;
                        case 'button': return <Button {...props} />;
                        case 'via': return <Via {...props} />;
                        default: return <GenericPart {...props} />;
                    }
                })()}
            </Group>

            {/* Wear Level Aura / Smoke */}
            {!!obj.wearLevel && obj.wearLevel > 0.5 && !isBurnedOut && (
                <Group>
                    {/* Simulated smoke puff based on wear */}
                    <Circle x={-5} y={-15} radius={10 * obj.wearLevel} fill="rgba(100,100,100,0.4)" shadowBlur={5} shadowColor="#333" />
                    <Circle x={5} y={-20} radius={15 * obj.wearLevel} fill="rgba(80,80,80,0.3)" shadowBlur={8} shadowColor="#333" />
                    {/* Wear warning icon */}
                    <Text text="⚠️" x={-6} y={-25} fontSize={12} fill="#fbbf24" />
                </Group>
            )}

            {/* Burnout Indicator */}
            {isBurnedOut && (
                <Group>
                    <Circle x={0} y={0} radius={12} fill="rgba(0,0,0,0.8)" stroke="#ef4444" strokeWidth={1} />
                    <Line points={[-6, -6, 6, 6]} stroke="#ef4444" strokeWidth={2} />
                    <Line points={[-6, 6, 6, -6]} stroke="#ef4444" strokeWidth={2} />
                </Group>
            )}
        </Group>
    );
};

const GenericPart: React.FC<PartProps & { obj: any }> = ({ id, x, y, isPowered, stroke, dragBoundFunc, isSelectTool, shadowProps, obj }) => {
    const pins = EcosystemAdapter.getPins(obj as any);
    return (
        <Group>
            <Rect x={-20} y={-20} width={40} height={40} stroke={isPowered ? '#ffcc00' : '#fff'} fill="#333" />
            {pins.map((p, i) => (
                <Circle key={i} x={p.pos.x - x} y={p.pos.y - y} radius={3} stroke="#ffcc00" strokeWidth={1} fill="transparent" />
            ))}
        </Group>
    );
};

// Quantum Gates (Phase 19)
const GateHadamard: React.FC<PartProps> = ({ stroke }) => (
    <Group>
        <Rect x={-20} y={-20} width={40} height={40} stroke="#a855f7" fill="rgba(168, 85, 247, 0.1)" strokeWidth={2} />
        <Text text="H" x={-6} y={-8} fontSize={20} fill="#a855f7" fontStyle="bold" />
    </Group>
);

const GatePauliX: React.FC<PartProps> = ({ stroke }) => (
    <Group>
        <Rect x={-20} y={-20} width={40} height={40} stroke="#a855f7" fill="rgba(168, 85, 247, 0.1)" strokeWidth={2} />
        <Text text="X" x={-6} y={-8} fontSize={20} fill="#a855f7" fontStyle="bold" />
    </Group>
);

const GateCNOT: React.FC<PartProps> = ({ stroke }) => (
    <Group>
        <Rect x={-30} y={-30} width={60} height={60} stroke="#a855f7" fill="rgba(168, 85, 247, 0.05)" strokeWidth={1} dash={[4, 4]} />
        <Circle x={0} y={-12} radius={4} fill="#a855f7" />
        <Line points={[0, -12, 0, 12]} stroke="#a855f7" strokeWidth={2} />
        <Circle x={0} y={12} radius={10} stroke="#a855f7" strokeWidth={2} />
        <Line points={[-10, 12, 10, 12]} stroke="#a855f7" strokeWidth={2} />
        <Line points={[0, 2, 0, 22]} stroke="#a855f7" strokeWidth={2} />
    </Group>
);

const GateMeasure: React.FC<PartProps> = ({ stroke }) => (
    <Group>
        <Rect x={-20} y={-20} width={40} height={40} stroke="#a855f7" fill="rgba(168, 85, 247, 0.1)" strokeWidth={2} />
        <Arc x={0} y={6} innerRadius={10} outerRadius={12} angle={180} rotation={180} fill="#a855f7" />
        <Line points={[0, 6, 8, -4]} stroke="#a855f7" strokeWidth={2} />
    </Group>
);

const Nema17: React.FC<any> = ({ id, x, y, isPowered, speed = 0, stroke, dragBoundFunc, isSelectTool, shadowProps, obj }) => {
    const rotation = obj?.currentAngle || 0;
    const pins = EcosystemAdapter.getPins(obj as any);
    const isColliding = obj?.isColliding;
    const armLength = obj?.armLength || 60;
    return (
        <Group>
            <Rect x={-21.15} y={-21.15} width={42.3} height={42.3} stroke={stroke} strokeWidth={1} fill="rgba(30,40,50,0.5)" />
            <Circle x={0} y={0} radius={11} stroke={stroke} strokeWidth={1} />
            <Group rotation={rotation % 360}>
                <Line points={[0, -11, 0, 11]} stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={1} />
                <Line points={[-11, 0, 11, 0]} stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={1} />
                {/* Mechanical Arm */}
                <Line points={[0, 0, armLength, 0]} stroke={isColliding ? '#ef4444' : stroke} strokeWidth={4} />
                {isColliding && <Circle x={armLength} y={0} radius={4} fill="#ef4444" />}
            </Group>
            {pins.map((p, i) => (
                <Circle key={i} x={p.pos.x - x} y={p.pos.y - y} radius={3} stroke="#00f2ff" strokeWidth={1} fill="#0a0b0c" />
            ))}
        </Group>
    );
};

const ArduinoUno: React.FC<PartProps> = ({ id, x, y, stroke, dragBoundFunc, isSelectTool, shadowProps }) => (
    <Group>
        <Rect x={-34.3} y={-26.7} width={68.6} height={53.3} stroke={stroke} fill="rgba(0, 100, 150, 0.2)" strokeWidth={1} />
        <Rect x={-37} y={-20} width={16} height={12} stroke={stroke} strokeWidth={1} />
        <Rect x={-37} y={8} width={14} height={9} stroke={stroke} strokeWidth={1} />
        <Rect x={-5} y={-5} width={25} height={10} stroke={stroke} strokeWidth={1} />
        <Rect x={-10} y={-25} width={40} height={3} stroke={stroke} strokeWidth={1} />
        <Rect x={-10} y={22} width={35} height={3} stroke={stroke} strokeWidth={1} />
    </Group>
);

const Esp32: React.FC<PartProps> = ({ id, x, y, stroke, dragBoundFunc, isSelectTool, shadowProps }) => (
    <Group>
        <Rect x={-14} y={-24} width={28} height={48} stroke={stroke} fill="rgba(50, 50, 50, 0.4)" strokeWidth={1} />
        <Rect x={-9} y={-22} width={18} height={25.5} stroke={stroke} strokeWidth={1} />
        <Rect x={-8} y={-21} width={16} height={5} stroke={stroke} strokeWidth={0.5} dash={[1, 1]} />
    </Group>
);

const Pico: React.FC<PartProps> = ({ id, x, y, stroke, dragBoundFunc, isSelectTool, shadowProps }) => (
    <Group>
        <Rect x={-10.5} y={-25.5} width={21} height={51} stroke={stroke} fill="rgba(20, 80, 50, 0.3)" strokeWidth={1} />
        <Rect x={-7} y={-20} width={14} height={14} stroke={stroke} strokeWidth={1} />
        <Circle x={0} y={15} radius={3} stroke={stroke} strokeWidth={1} />
    </Group>
);

const Lcd1602: React.FC<PartProps> = ({ id, x, y, stroke, dragBoundFunc, isSelectTool, shadowProps }) => (
    <Group>
        <Rect x={-40} y={-18} width={80} height={36} stroke={stroke} fill="rgba(0,50,0,0.2)" strokeWidth={1} />
        <Rect x={-35.5} y={-13} width={71} height={26} stroke={stroke} strokeWidth={1} />
        <Rect x={-32.25} y={-7.25} width={64.5} height={14.5} stroke={stroke} fill="rgba(100,255,100,0.1)" strokeWidth={1} />
    </Group>
);

const Keypad: React.FC<PartProps> = ({ id, x, y, stroke, dragBoundFunc, isSelectTool, shadowProps }) => (
    <Group>
        <Rect x={-30} y={-35} width={60} height={70} stroke={stroke} fill="rgba(20,20,30,0.4)" strokeWidth={1} />
        {[0,1,2,3].map(row => 
            [0,1,2,3].map(col => (
                <Rect key={`${row}-${col}`} x={-25 + col * 14} y={-30 + row * 16} width={10} height={12} stroke={stroke} strokeWidth={0.5} />
            ))
        )}
    </Group>
);

const Breadboard: React.FC<PartProps> = ({ id, x, y, stroke, dragBoundFunc, isSelectTool, shadowProps }) => (
    <Group>
        <Rect x={-80} y={-25} width={160} height={50} stroke={stroke} fill="rgba(240,240,230,0.05)" strokeWidth={1} />
        <Line points={[-75, -15, 75, -15]} stroke={stroke} strokeWidth={0.5} dash={[2, 4]} />
        <Line points={[-75, -10, 75, -10]} stroke={stroke} strokeWidth={0.5} dash={[2, 4]} />
        <Line points={[-75, 10, 75, 10]} stroke={stroke} strokeWidth={0.5} dash={[2, 4]} />
        <Line points={[-75, 15, 75, 15]} stroke={stroke} strokeWidth={0.5} dash={[2, 4]} />
        <Line points={[-80, 0, 80, 0]} stroke={stroke} strokeWidth={1} />
    </Group>
);

const Servo: React.FC<any> = ({ id, x, y, isPowered, stroke, dragBoundFunc, isSelectTool, shadowProps, obj }) => {
    const angle = obj?.currentAngle || 0;
    const isColliding = obj?.isColliding;
    const armLength = obj?.armLength || 60;
    return (
        <Group>
            <Rect x={-11.5} y={-11.5} width={23} height={23} stroke={stroke} fill="rgba(30,100,200,0.2)" strokeWidth={1} />
            <Rect x={-16.5} y={-6} width={33} height={12} stroke={stroke} strokeWidth={1} />
            <Group x={0} y={0} rotation={angle}>
                <Circle x={0} y={0} radius={4} stroke={stroke} strokeWidth={1} fill={isPowered ? '#ffcc00' : 'transparent'} />
                {/* Mechanical Arm */}
                <Line points={[0, 0, armLength, 0]} stroke={isColliding ? '#ef4444' : stroke} strokeWidth={4} />
                {isColliding && <Circle x={armLength} y={0} radius={4} fill="#ef4444" />}
            </Group>
        </Group>
    );
};

const DcMotor: React.FC<any> = ({ id, x, y, stroke, dragBoundFunc, isSelectTool, shadowProps, obj }) => {
    const rotation = obj?.currentAngle || 0;
    const isColliding = obj?.isColliding;
    const armLength = obj?.armLength || 60;
    return (
        <Group>
            <Circle x={0} y={0} radius={15} stroke={stroke} fill="rgba(150,150,150,0.2)" strokeWidth={1} />
            <Circle x={0} y={0} radius={3} stroke={stroke} fill={stroke} />
            <Group rotation={rotation % 360}>
                <Line points={[0, -10, 0, 10]} stroke={stroke} strokeWidth={1} />
                <Line points={[-10, 0, 10, 0]} stroke={stroke} strokeWidth={1} />
                {/* Mechanical Arm */}
                <Line points={[0, 0, armLength, 0]} stroke={isColliding ? '#ef4444' : stroke} strokeWidth={4} />
                {isColliding && <Circle x={armLength} y={0} radius={4} fill="#ef4444" />}
            </Group>
        </Group>
    );
};

const Fan: React.FC<any> = ({ id, x, y, isPowered, stroke, dragBoundFunc, isSelectTool, shadowProps, obj }) => {
    // Basic animation rotation (since tick rotates currentAngle)
    const rotation = obj?.currentAngle || 0;
    const pins = EcosystemAdapter.getPins(obj as any);
    return (
        <Group>
            {/* Casing */}
            <Rect x={-20} y={-20} width={40} height={40} stroke={stroke} strokeWidth={2} fill="rgba(20,20,20,0.5)" cornerRadius={5} />
            {/* Blades */}
            <Group rotation={rotation * 5}> {/* Spin faster visually */}
                <Circle x={0} y={0} radius={3} fill={stroke} />
                <Path data="M 0 -3 Q 15 -10 0 -18 Q -15 -10 0 -3 Z" fill={isPowered ? '#0ea5e9' : stroke} />
                <Path data="M 0 -3 Q 15 -10 0 -18 Q -15 -10 0 -3 Z" fill={isPowered ? '#0ea5e9' : stroke} rotation={120} />
                <Path data="M 0 -3 Q 15 -10 0 -18 Q -15 -10 0 -3 Z" fill={isPowered ? '#0ea5e9' : stroke} rotation={240} />
            </Group>
            {/* Wind Vector Lines (only when powered) */}
            {isPowered && (
                <Group>
                    <Line points={[0, -25, 0, -45]} stroke="#0ea5e9" strokeWidth={1} dash={[5, 5]} opacity={0.5} />
                    <Line points={[-10, -25, -15, -40]} stroke="#0ea5e9" strokeWidth={1} dash={[5, 5]} opacity={0.3} />
                    <Line points={[10, -25, 15, -40]} stroke="#0ea5e9" strokeWidth={1} dash={[5, 5]} opacity={0.3} />
                </Group>
            )}
            {pins.map((p, i) => (
                <Circle key={i} x={p.pos.x - x} y={p.pos.y - y} radius={2.5} stroke={stroke} strokeWidth={1.5} fill="#0a0b0c" className="terminal-pin" />
            ))}
        </Group>
    );
};

const GateAnd: React.FC<any> = ({ id, x, y, isPowered, stroke, dragBoundFunc, isSelectTool, shadowProps, obj }) => {
    const pins = EcosystemAdapter.getPins(obj as any);
    return (
        <Group>
            <Path data="M -10 -10 L 0 -10 A 10 10 0 0 1 0 10 L -10 10 Z" stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={isPowered ? 2 : 1.2} />
            <Line points={[-15, -5, -10, -5]} stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={isPowered ? 2 : 1.2} />
            <Line points={[-15, 5, -10, 5]} stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={isPowered ? 2 : 1.2} />
            <Line points={[10, 0, 15, 0]} stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={isPowered ? 2 : 1.2} />
            {pins.map((p, i) => (
                <Circle key={i} x={p.pos.x - x} y={p.pos.y - y} radius={2.5} stroke={stroke} strokeWidth={1.5} fill="#0a0b0c" className="terminal-pin" />
            ))}
        </Group>
    );
};

const GateOr: React.FC<any> = ({ id, x, y, isPowered, stroke, dragBoundFunc, isSelectTool, shadowProps, obj }) => {
    const pins = EcosystemAdapter.getPins(obj as any);
    return (
        <Group>
            <Path data="M -10 -10 Q -5 0 -10 10 Q 5 10 10 0 Q 5 -10 -10 -10 Z" stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={isPowered ? 2 : 1.2} />
            <Line points={[-15, -5, -7, -5]} stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={isPowered ? 2 : 1.2} />
            <Line points={[-15, 5, -7, 5]} stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={isPowered ? 2 : 1.2} />
            <Line points={[10, 0, 15, 0]} stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={isPowered ? 2 : 1.2} />
            {pins.map((p, i) => (
                <Circle key={i} x={p.pos.x - x} y={p.pos.y - y} radius={2.5} stroke={stroke} strokeWidth={1.5} fill="#0a0b0c" className="terminal-pin" />
            ))}
        </Group>
    );
};

const GateNot: React.FC<any> = ({ id, x, y, isPowered, stroke, dragBoundFunc, isSelectTool, shadowProps, obj }) => {
    const pins = EcosystemAdapter.getPins(obj as any);
    return (
        <Group>
            <Path data="M -10 -10 L -10 10 L 5 0 Z" stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={isPowered ? 2 : 1.2} />
            <Circle x={7} y={0} radius={2} stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={isPowered ? 2 : 1.2} />
            <Line points={[-15, 0, -10, 0]} stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={isPowered ? 2 : 1.2} />
            <Line points={[9, 0, 15, 0]} stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={isPowered ? 2 : 1.2} />
            {pins.map((p, i) => (
                <Circle key={i} x={p.pos.x - x} y={p.pos.y - y} radius={2.5} stroke={stroke} strokeWidth={1.5} fill="#0a0b0c" className="terminal-pin" />
            ))}
        </Group>
    );
};

const Resistor: React.FC<any> = ({ id, x, y, isPowered, stroke, dragBoundFunc, isSelectTool, shadowProps, obj }) => {
    const pins = EcosystemAdapter.getPins(obj as any);
    return (
        <Group>
            <Line points={[-20, 0, 20, 0]} stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={isPowered ? 2 : 1.2} />
            <Rect x={-10} y={-3} width={20} height={6} stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={isPowered ? 2 : 1.2} fill="#0a0b0c" />
            <Rect x={-6} y={-3} width={2} height={6} fill="#8B4513" />
            <Rect x={-2} y={-3} width={2} height={6} fill="#FF0000" />
            <Rect x={2} y={-3} width={2} height={6} fill="#FFA500" />
            {pins.map((p, i) => (
                <Circle key={i} x={p.pos.x - x} y={p.pos.y - y} radius={2.5} stroke={stroke} strokeWidth={1.5} fill="#0a0b0c" className="terminal-pin" />
            ))}
        </Group>
    );
};

const Led: React.FC<any> = ({ id, x, y, isPowered, stroke, dragBoundFunc, isSelectTool, shadowProps, obj }) => {
    // Default to a bright color if it's generic led, or infer from partType if led_red / led_blue
    const onColor = obj?.partType === 'led_blue' ? '#3b82f6' : '#ff0000';
    const pins = EcosystemAdapter.getPins(obj as any);
    return (
        <Group>
            <Line points={[-15, 0, -5, 0]} stroke={stroke} strokeWidth={1} />
            <Line points={[5, 0, 15, 0]} stroke={stroke} strokeWidth={1} />
            <Path data="M -5 -5 L -5 5 L 5 0 Z" stroke={stroke} strokeWidth={1} fill={isPowered ? onColor : 'transparent'} />
            <Line points={[5, -5, 5, 5]} stroke={stroke} strokeWidth={1} />
            <Circle x={0} y={0} radius={8} stroke={stroke} strokeWidth={1} fill={isPowered ? onColor : 'transparent'} shadowColor={isPowered ? onColor : 'transparent'} shadowBlur={isPowered ? 15 : 0} />
            {pins.map((p, i) => (
                <Circle key={i} x={p.pos.x - x} y={p.pos.y - y} radius={2.5} stroke={stroke} strokeWidth={1.5} fill="#0a0b0c" className="terminal-pin" />
            ))}
        </Group>
    );
};

const Battery: React.FC<any> = ({ id, x, y, stroke, dragBoundFunc, isSelectTool, shadowProps, obj }) => {
    const is18650 = obj?.partType === 'battery_18650';
    const pins = EcosystemAdapter.getPins(obj as any);
    return (
        <Group>
            {is18650 ? (
                <>
                    <Rect x={-9} y={-32.5} width={18} height={65} stroke={stroke} fill="rgba(100,50,200,0.2)" strokeWidth={1} />
                    <Rect x={-4} y={-34} width={8} height={2} stroke={stroke} strokeWidth={1} />
                </>
            ) : (
                <>
                    <Line points={[-15, 0, -5, 0]} stroke={stroke} strokeWidth={1} />
                    <Line points={[5, 0, 15, 0]} stroke={stroke} strokeWidth={1} />
                    <Line points={[-5, -10, -5, 10]} stroke={stroke} strokeWidth={2} />
                    <Line points={[5, -5, 5, 5]} stroke={stroke} strokeWidth={2} />
                    <Text x={-12} y={-15} text="+" fill={stroke} fontSize={10} />
                </>
            )}
            {pins.map((p, i) => (
                <Circle key={i} x={p.pos.x - x} y={p.pos.y - y} radius={2.5} stroke={stroke} strokeWidth={1.5} fill="#0a0b0c" className="terminal-pin" />
            ))}
        </Group>
    );
};

const Ground: React.FC<PartProps> = ({ id, x, y, stroke, dragBoundFunc, isSelectTool, shadowProps }) => (
    <Group>
        <Line points={[0, 0, 0, -10]} stroke={stroke} strokeWidth={1} />
        <Line points={[-8, 0, 8, 0]} stroke={stroke} strokeWidth={1} />
        <Line points={[-5, 3, 5, 3]} stroke={stroke} strokeWidth={1} />
        <Line points={[-2, 6, 2, 6]} stroke={stroke} strokeWidth={1} />
    </Group>
);

const SwitchSPST: React.FC<any> = ({ id, x, y, isPowered, stroke, dragBoundFunc, isSelectTool, shadowProps, obj }) => {
    const isOpen = obj?.state === 'open';
    const leverY = isOpen ? -8 : 0;
    const pins = EcosystemAdapter.getPins(obj as any);
    return (
        <Group>
            <Line points={[-15, 0, -5, 0]} stroke={stroke} strokeWidth={1} />
            <Line points={[5, 0, 15, 0]} stroke={stroke} strokeWidth={1} />
            <Line points={[-5, 0, 5, leverY]} stroke={isPowered ? '#ffcc00' : stroke} strokeWidth={1} />
            {pins.map((p, i) => (
                <Circle key={i} x={p.pos.x - x} y={p.pos.y - y} radius={2.5} stroke={stroke} strokeWidth={1.5} fill="#0a0b0c" className="terminal-pin" />
            ))}
        </Group>
    );
};

const Button: React.FC<any> = ({ id, x, y, stroke, dragBoundFunc, isSelectTool, shadowProps, obj }) => {
    const isPushed = obj?.state === true;
    const pushY = isPushed ? 0 : -5;
    return (
        <Group>
            <Line points={[-15, 0, -5, 0]} stroke={stroke} strokeWidth={1} />
            <Line points={[5, 0, 15, 0]} stroke={stroke} strokeWidth={1} />
            <Line points={[-5, pushY, 5, pushY]} stroke={stroke} strokeWidth={1} />
            <Line points={[0, pushY, 0, pushY - 5]} stroke={stroke} strokeWidth={1} />
            <Rect x={-4} y={pushY - 7} width={8} height={2} stroke={stroke} strokeWidth={1} fill={stroke} />
        </Group>
    );
};

const Via: React.FC<PartProps> = ({ id, x, y, stroke, dragBoundFunc, isSelectTool, shadowProps }) => {
    // A via connects layers, visually represented as a through-hole with an annular ring.
    return (
        <Group>
            <Circle x={0} y={0} radius={6} stroke="#f59e0b" strokeWidth={2} fill="#1e293b" />
            <Circle x={0} y={0} radius={3} fill="#0a0b0c" />
            <Circle x={0} y={0} radius={2.5} stroke={stroke} strokeWidth={1.5} fill="#0a0b0c" className="terminal-pin" />
        </Group>
    );
};
