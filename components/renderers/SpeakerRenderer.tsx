import React from 'react';

interface RendererProps {
    dimensions: { w: number; h: number; d: number };
    color: string;
}

export const SpeakerRenderer: React.FC<RendererProps> = ({ dimensions, color }) => {
    const { w, h, d } = dimensions;
    return (
        <group>
            {/* Enclosure (Matte/Rugged) */}
            <mesh>
                <boxGeometry args={[w, h, d]} />
                <meshStandardMaterial 
                    color={color} 
                    roughness={0.7} 
                    metalness={0.1} 
                />
            </mesh>

            {/* Front Grill (Metallic, textured look via roughness) */}
            <mesh position={[0, 0, d / 2 + 0.001]}>
                <planeGeometry args={[w * 0.94, h * 0.94]} />
                <meshStandardMaterial 
                    color="#18181b" 
                    roughness={0.9} 
                    metalness={0.6}
                />
            </mesh>

            {/* Side Handles / Rigging Hardware Hints */}
            <mesh position={[w/2 + 0.001, 0, 0]} rotation={[0, Math.PI/2, 0]}>
                <planeGeometry args={[d * 0.5, h * 0.4]} />
                <meshStandardMaterial color="#333" metalness={0.9} roughness={0.4} />
            </mesh>
            <mesh position={[-w/2 - 0.001, 0, 0]} rotation={[0, -Math.PI/2, 0]}>
                <planeGeometry args={[d * 0.5, h * 0.4]} />
                <meshStandardMaterial color="#333" metalness={0.9} roughness={0.4} />
            </mesh>
        </group>
    );
};