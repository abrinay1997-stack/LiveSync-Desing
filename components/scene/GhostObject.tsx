import React, { useState } from 'react';
import { useThree } from '@react-three/fiber';
import { useStore } from '../../store';
import { ASSETS } from '../../data/library';
import { AssetGeometry } from './AssetGeometry';
import { snapCoords } from '../../utils/snapping';

export const GhostObject = () => {
    const activePlacementAsset = useStore(state => state.activePlacementAsset);
    const addObject = useStore(state => state.addObject);
    const snappingEnabled = useStore(state => state.snappingEnabled);
    const objects = useStore(state => state.objects); // Get existing objects for snapping
    
    const [pos, setPos] = useState<[number, number, number] | null>(null);
    const [snapLines, setSnapLines] = useState<{x: number | null, z: number | null}>({x: null, z: null});

    const template = activePlacementAsset ? ASSETS[activePlacementAsset] : null;

    const handlePointerMove = (e: any) => {
        // Only calculate if placing
        if (!activePlacementAsset) return;

        const point = e.point; // R3F event point (Vector3)

        if (point) {
            let x = point.x;
            let z = point.z;
            
            // --- 1. GRID SNAPPING ---
            const coords = snapCoords(x, 0, z, snappingEnabled);
            x = coords[0];
            z = coords[2];

            // --- 2. OBJECT-TO-OBJECT SNAPPING (Magnetic) ---
            // If snapping is enabled, we also check if we are close to another object's alignment
            let snappedX = null;
            let snappedZ = null;

            if (snappingEnabled) {
                const SNAP_THRESHOLD = 0.3; // Distance to trigger snap
                
                // Find closest alignment
                for (const obj of objects) {
                    if (Math.abs(obj.position[0] - x) < SNAP_THRESHOLD) {
                        x = obj.position[0];
                        snappedX = x;
                    }
                    if (Math.abs(obj.position[2] - z) < SNAP_THRESHOLD) {
                        z = obj.position[2];
                        snappedZ = z;
                    }
                }
            }
            
            setSnapLines({ x: snappedX, z: snappedZ });

            // Height based on object bounds to sit on floor
            const heightOffset = template?.dimensions ? template.dimensions.h / 2 : 0;
            
            setPos([x, heightOffset, z]);
        }
    };

    const handleClick = (e: any) => {
        if (activePlacementAsset && pos) {
            e.stopPropagation(); // Stop click from hitting things below
            addObject(activePlacementAsset, pos);
        }
    }

    if (!activePlacementAsset || !template) return null;

    return (
        <>
            {/* Invisible RAYCASTABLE plane to catch mouse over the entire viewport ONLY when placing */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} onPointerMove={handlePointerMove} onClick={handleClick}>
                <planeGeometry args={[1000, 1000]} />
                <meshBasicMaterial visible={false} />
            </mesh>
            
            {pos && (
                <group position={pos}>
                    <AssetGeometry 
                        type={template.type || 'speaker'} 
                        dimensions={template.dimensions} 
                        color={template.color || '#fff'} 
                        isGhost={true} 
                    />
                    
                    {/* Grid Snap Indicator Line (Green) */}
                    <mesh position={[0, -pos[1]/2, 0]}>
                        <boxGeometry args={[0.02, pos[1], 0.02]} />
                        <meshBasicMaterial color="#06b6d4" opacity={0.5} transparent />
                    </mesh>

                    {/* Object Snap Guides (Blue Infinite Lines) */}
                    {snapLines.x !== null && (
                         <mesh position={[0, -pos[1]/2, 0]}>
                            <boxGeometry args={[0.05, 0.1, 100]} />
                            <meshBasicMaterial color="#3b82f6" opacity={0.2} transparent />
                        </mesh>
                    )}
                    {snapLines.z !== null && (
                         <mesh position={[0, -pos[1]/2, 0]}>
                            <boxGeometry args={[100, 0.1, 0.05]} />
                            <meshBasicMaterial color="#3b82f6" opacity={0.2} transparent />
                        </mesh>
                    )}
                </group>
            )}
        </>
    );
};