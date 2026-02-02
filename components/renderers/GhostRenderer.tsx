import React from 'react';

interface RendererProps {
    dimensions: { w: number; h: number; d: number };
    color: string;
}

export const GhostRenderer: React.FC<RendererProps> = ({ dimensions, color }) => (
    <mesh>
        <boxGeometry args={[dimensions.w, dimensions.h, dimensions.d]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} wireframe />
    </mesh>
);

export const GenericRenderer: React.FC<RendererProps> = ({ dimensions, color }) => (
    <mesh>
        <boxGeometry args={[dimensions.w, dimensions.h, dimensions.d]} />
        <meshStandardMaterial color={color} />
    </mesh>
);