import React from 'react';
import * as THREE from 'three';

interface RendererProps {
    dimensions: { w: number; h: number; d: number };
    color: string;
    isGhost?: boolean;
}

// --- AUDIO SOURCES (Speakers, Subs) ---
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

// --- STRUCTURES (Truss, Motors) ---
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

// --- ZONES (Audience, Stage Decks) ---
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

// --- GENERIC / GHOST ---
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