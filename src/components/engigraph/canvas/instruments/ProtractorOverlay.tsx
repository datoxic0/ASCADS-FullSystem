import React, { useState } from 'react';
import { Group, Circle, Line, Text } from 'react-konva';

interface Props {
    x?: number;
    y?: number;
}

export const ProtractorOverlay: React.FC<Props> = ({ x = window.innerWidth / 2, y = window.innerHeight / 2 }) => {
    const size = 160;
    const ticks = [];
    
    for (let i = 0; i < 360; i += 1.0) {
        const isMajor = i % 10 === 0;
        const isMid = i % 5 === 0;
        const len = isMajor ? 22 : (isMid ? 16 : 10);
        
        // Convert to radians
        const rad = (i * Math.PI) / 180;
        const p1x = Math.cos(rad) * size;
        const p1y = Math.sin(rad) * size;
        const p2x = Math.cos(rad) * (size - len);
        const p2y = Math.sin(rad) * (size - len);
        
        ticks.push(
            <Line 
                key={`tick-${i}`}
                points={[p1x, p1y, p2x, p2y]}
                stroke={isMajor ? '#ffffff' : (isMid ? 'rgba(0, 255, 238, 0.8)' : 'rgba(0, 255, 238, 0.3)')}
                strokeWidth={isMajor ? 1.5 : 0.6}
            />
        );

        if (isMajor && i % 20 === 0) {
            const tx = Math.cos(rad) * (size - 36);
            const ty = Math.sin(rad) * (size - 36);
            ticks.push(
                <Text 
                    key={`text-${i}`}
                    x={tx - 15}
                    y={ty - 5}
                    text={`${i}°`}
                    fill="#ffffff"
                    fontSize={9}
                    fontStyle="bold"
                    fontFamily="Consolas"
                    align="center"
                    rotation={i + 90}
                    offsetX={-15}
                    offsetY={-5}
                />
            );
        }
    }

    return (
        <Group x={x} y={y} draggable>
            <Circle radius={size} stroke="#00ffee" fill="rgba(0, 255, 238, 0.03)" strokeWidth={2.5} />
            {ticks}
            <Line points={[-size * 1.1, 0, size * 1.1, 0]} stroke="rgba(0, 255, 204, 0.4)" strokeWidth={0.5} dash={[10, 5]} />
            <Line points={[0, -size * 1.1, 0, size * 1.1]} stroke="rgba(0, 255, 204, 0.4)" strokeWidth={0.5} dash={[10, 5]} />
        </Group>
    );
};
