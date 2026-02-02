import React from 'react';
import { useStore } from '../../store';

interface AssetGeometryProps {
    type: string;
    dimensions?: { w: number; h: number; d: number };
    color: string;
    isGhost?: boolean;
}

export const AssetGeometry: React.FC<AssetGeometryProps> = ({ type, dimensions, color, isGhost = false }) => {
    const w = dimensions?.w || 1;
    const h = dimensions?.h || 1;
    const d = dimensions?.d || 1;

    // Ghost Material (Simplified, Transparent)
    if (isGhost) {
        return (
            <mesh>
                <boxGeometry args={[w, h, d]} />
                <meshBasicMaterial color={color} transparent opacity={0.4} wireframe />
            </mesh>
        );
    }

    // Truss Geometry (Aluminum/Structural Look)
    if (type === 'truss') {
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
                {/* Inner Mass (simulated density) */}
                <mesh scale={[0.9, 0.9, 0.9]}>
                   <boxGeometry args={[w, h, d]} />
                   <meshStandardMaterial 
                        color={color} 
                        transparent 
                        opacity={0.1} 
                   />
                </mesh>
            </group>
        )
    }

    // Motor (Industrial Yellow/Black)
    if (type === 'motor') {
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
        )
    }
    
    // Speaker Geometry (PBR Matte Plastic & Metal Grill)
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