import React from 'react';
import * as THREE from 'three';

interface RendererProps {
    dimensions: { w: number; h: number; d: number };
    color: string;
}

export const ZoneRenderer: React.FC<RendererProps> = ({ dimensions, color }) => {
    const { w, h, d } = dimensions;
    return (
        <group>
            {/* The "Floor" of the zone */}
            <mesh position={[0, h/2, 0]}>
                <boxGeometry args={[w, h, d]} />
                <meshStandardMaterial 
                    color={color} 
                    transparent 
                    opacity={0.15} 
                    side={THREE.DoubleSide}
                    roughness={0.8}
                />
            </mesh>
            
            {/* Border / Frame */}
            <mesh position={[0, h/2, 0]}>
                <boxGeometry args={[w, h, d]} />
                <meshBasicMaterial color={color} wireframe />
            </mesh>

            {/* Direction Indicator (Front Edge) */}
            <mesh position={[0, h/2 + 0.05, d/2]}>
                <boxGeometry args={[w, 0.05, 0.05]} />
                <meshBasicMaterial color={color} />
            </mesh>
        </group>
    );
};