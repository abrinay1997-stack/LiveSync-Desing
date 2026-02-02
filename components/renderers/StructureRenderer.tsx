import React from 'react';

interface RendererProps {
    dimensions: { w: number; h: number; d: number };
    color: string;
}

export const TrussRenderer: React.FC<RendererProps> = ({ dimensions, color }) => {
    const { w, h, d } = dimensions;
    return (
        <group>
            {/* Main Structure Frame */}
            <mesh>
               <boxGeometry args={[w, h, d]} />
               <meshStandardMaterial 
                    color="#e4e4e7" 
                    roughness={0.2} 
                    metalness={0.8} 
                    wireframe={true} 
                />
            </mesh>
            {/* Inner Mass (simulated density to catch shadows) */}
            <mesh scale={[0.9, 0.9, 0.9]}>
               <boxGeometry args={[w, h, d]} />
               <meshStandardMaterial 
                    color={color} 
                    transparent 
                    opacity={0.1} 
               />
            </mesh>
        </group>
    );
};

export const MotorRenderer: React.FC<RendererProps> = ({ dimensions, color }) => {
    const { w, h, d } = dimensions;
    return (
        <group>
            <mesh>
                <boxGeometry args={[w, h, d]} />
                <meshStandardMaterial color={color} roughness={0.5} metalness={0.5} />
            </mesh>
            <mesh position={[0, -h/2, 0]}>
                 <cylinderGeometry args={[0.02, 0.02, 2, 8]} />
                 <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
            </mesh>
        </group>
    );
};