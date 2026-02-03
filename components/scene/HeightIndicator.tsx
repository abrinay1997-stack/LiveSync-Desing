/**
 * Height Indicator Component
 *
 * Shows vertical reference line and height value while dragging objects
 * Helps users understand object elevation relative to ground level (Y=0)
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Html, Line } from '@react-three/drei';

interface HeightIndicatorProps {
    position: [number, number, number];
    visible: boolean;
}

export const HeightIndicator: React.FC<HeightIndicatorProps> = ({ position, visible }) => {
    if (!visible) return null;

    const [x, y, z] = position;
    const height = y;
    const isAboveGround = height >= 0;

    // Line points from object to ground
    const linePoints = useMemo(() => {
        const start = new THREE.Vector3(x, y, z);
        const end = new THREE.Vector3(x, 0, z);
        return [start, end];
    }, [x, y, z]);

    // Color based on position relative to ground
    const color = isAboveGround ? '#22c55e' : '#ef4444'; // Green above, red below

    // Format height with sign
    const heightText = `${height >= 0 ? '+' : ''}${height.toFixed(2)}m`;

    return (
        <group>
            {/* Vertical reference line */}
            <Line
                points={linePoints}
                color={color}
                lineWidth={2}
                dashed
                dashSize={0.15}
                gapSize={0.1}
            />

            {/* Ground intersection marker */}
            <mesh position={[x, 0.01, z]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.15, 0.2, 16]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.8}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            {/* Height label positioned at midpoint */}
            <Html
                position={[x + 0.3, y / 2, z]}
                center
                distanceFactor={10}
                style={{
                    pointerEvents: 'none',
                    userSelect: 'none',
                }}
            >
                <div
                    style={{
                        background: isAboveGround
                            ? 'rgba(34, 197, 94, 0.9)'
                            : 'rgba(239, 68, 68, 0.9)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        fontFamily: 'monospace',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    }}
                >
                    Y: {heightText}
                </div>
            </Html>

            {/* Ground level reference text */}
            <Html
                position={[x + 0.3, 0, z]}
                center
                distanceFactor={10}
                style={{
                    pointerEvents: 'none',
                    userSelect: 'none',
                }}
            >
                <div
                    style={{
                        background: 'rgba(100, 100, 100, 0.8)',
                        color: '#a1a1aa',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        whiteSpace: 'nowrap',
                    }}
                >
                    Y=0
                </div>
            </Html>
        </group>
    );
};
