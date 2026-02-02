import React, { useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store';
import { ASSETS } from '../../types';
import { AssetGeometry } from './AssetGeometry';

export const GhostObject = () => {
    const activePlacementAsset = useStore(state => state.activePlacementAsset);
    const addObject = useStore(state => state.addObject);
    const snappingEnabled = useStore(state => state.snappingEnabled);
    
    const [pos, setPos] = useState<[number, number, number] | null>(null);
    const { raycaster, camera, pointer } = useThree();

    const template = activePlacementAsset ? ASSETS[activePlacementAsset] : null;

    const handlePointerMove = (e: any) => {
        // Solo calcular si estamos intentando colocar algo
        if (!activePlacementAsset) return;

        // Note: 'e' here is the R3F event which already contains intersections, 
        // but since we want to intersect a specific conceptual plane:
        
        // We can just rely on the event from the plane mesh below
        const point = e.point; // R3F event point (Vector3)

        if (point) {
            let x = point.x;
            let z = point.z;
            
            if (snappingEnabled) {
                x = Math.round(x * 2) / 2;
                z = Math.round(z * 2) / 2;
            }
            
            // Altura basada en el objeto para que quede sobre el suelo
            const heightOffset = template?.dimensions ? template.dimensions.h / 2 : 0;
            
            setPos([x, heightOffset, z]);
        }
    };

    const handleClick = (e: any) => {
        if (activePlacementAsset && pos) {
            e.stopPropagation(); // Evitar que el click seleccione cosas debajo
            addObject(activePlacementAsset, pos);
        }
    }

    if (!activePlacementAsset || !template) return null;

    return (
        <>
            {/* Plane invisible pero RAYCASTABLE para capturar el mouse en todo el viewport SOLO cuando estamos colocando */}
            {/* visible={false} prevents raycasting in Three.js, so we must use visible={true} with a transparent material */}
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
                    <mesh position={[0, -pos[1]/2, 0]}>
                        <boxGeometry args={[0.02, pos[1], 0.02]} />
                        <meshBasicMaterial color="#06b6d4" opacity={0.5} transparent />
                    </mesh>
                </group>
            )}
        </>
    );
};