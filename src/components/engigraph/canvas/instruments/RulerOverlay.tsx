import React from 'react';
import { Group, Rect, Line, Text } from 'react-konva';

interface Props {
    x?: number;
    y?: number;
}

export const RulerOverlay: React.FC<Props> = ({ x = window.innerWidth / 2 - 150, y = window.innerHeight / 2 }) => {
    const height = 40; 
    const size = 300; 

    const ticks = [];
    for (let i = 0; i <= 300; i += 1.0) {
        const xPos = i;
        const isMajor = i % 10 === 0;
        const len = isMajor ? 18 : 8;
        
        ticks.push(
            <Line 
                key={`tick-${i}`}
                points={[xPos, -height/2, xPos, -height/2 + len]}
                stroke={isMajor ? '#fff' : '#888'}
                strokeWidth={isMajor ? 1.5 : 0.8}
            />
        );

        if (isMajor && i % 20 === 0) {
            ticks.push(
                <Text 
                    key={`text-${i}`}
                    x={xPos - 5}
                    y={10}
                    text={i.toString()}
                    fill="#fff"
                    fontSize={8}
                    align="center"
                    fontFamily="monospace"
                />
            );
        }
    }

    return (
        <Group x={x} y={y} draggable>
            {/* Handle/Head */}
            <Rect x={-20} y={-height} width={20} height={height * 2} fill="#111" />
            
            {/* Ruler Body */}
            <Rect x={0} y={-height/2} width={size} height={height} stroke="#111" fillLinearGradientStartPoint={{ x: 0, y: -height/2 }} fillLinearGradientEndPoint={{ x: 0, y: height/2 }} fillLinearGradientColorStops={[0, '#2a2a2a', 0.5, '#444', 1, '#2a2a2a']} />
            
            {ticks}
        </Group>
    );
};
