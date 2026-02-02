import React, { useMemo } from 'react';
import * as THREE from 'three';
import { AssetGeometry } from './AssetGeometry';
import { ArrayConfig, ASSETS } from '../../types';
import { Edges } from '@react-three/drei';

interface ArrayGeometryProps {
    type: string;
    dimensions?: { w: number; h: number; d: number };
    color: string;
    arrayConfig: ArrayConfig;
}

// Component to visualize the acoustic dispersion (The "Cone")
const CoverageCone = ({ 
    dispersion, 
    throwDistance, 
    color 
}: { 
    dispersion: { h: number, v: number }, 
    throwDistance: number, 
    color: string 
}) => {
    // Calculate the geometry of the projection pyramid
    // Typical Line Array element: Narrow Vertical (e.g. 10deg), Wide Horizontal (e.g. 110deg)
    const geometry = useMemo(() => {
        // Convert deg to rad
        const hRad = THREE.MathUtils.degToRad(dispersion.h / 2);
        const vRad = THREE.MathUtils.degToRad(dispersion.v / 2);

        // Calculate dimensions at the end of the throw
        const halfWidth = Math.tan(hRad) * throwDistance;
        const halfHeight = Math.tan(vRad) * throwDistance;

        // Vertices: Origin (0,0,0) -> 4 Corners at ThrowDistance
        // Z is forward in our local asset space (check AssetGeometry orientation)
        // Adjusting to match: Z is depth.
        const z = throwDistance;
        
        const vertices = new Float32Array([
            0, 0, 0, // Tip
            -halfWidth, halfHeight, z,  // Top Left
            halfWidth, halfHeight, z,   // Top Right
            halfWidth, -halfHeight, z,  // Bottom Right
            -halfWidth, -halfHeight, z, // Bottom Left
            -halfWidth, halfHeight, z,  // Close loop to Top Left
        ]);

        // Indices to create the wireframe pyramid lines
        const indices = [
            0, 1, 0, 2, 0, 3, 0, 4, // Lines from tip to corners
            1, 2, 2, 3, 3, 4, 4, 1  // Rectangular base at distance
        ];

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geo.setIndex(indices);
        return geo;
    }, [dispersion, throwDistance]);

    return (
        <lineSegments geometry={geometry}>
            <lineBasicMaterial color={color} transparent opacity={0.3} depthTest={false} />
        </lineSegments>
    );
};

export const ArrayGeometry: React.FC<ArrayGeometryProps> = ({ type, dimensions, color, arrayConfig }) => {
    const { boxCount, splayAngles, siteAngle, showThrowLines, throwDistance } = arrayConfig;
    const height = dimensions?.h || 0.35;
    
    // Get Asset definition for dispersion specs
    const assetSpec = ASSETS[type];
    const dispersion = assetSpec?.dispersion || { h: 90, v: 90 };

    const boxes = useMemo(() => {
        const items = [];
        let currentPos = new THREE.Vector3(0, 0, 0);
        let currentAngle = THREE.MathUtils.degToRad(siteAngle); 

        for (let i = 0; i < boxCount; i++) {
            const splay = splayAngles[i] || 0;
            const splayRad = THREE.MathUtils.degToRad(splay);
            
            // Add half the splay (simplified mechanical hinge)
            currentAngle += splayRad;

            items.push({
                index: i,
                position: currentPos.clone(),
                rotation: new THREE.Euler(currentAngle, 0, 0),
            });

            const yOffset = -height * Math.cos(currentAngle);
            const zOffset = height * Math.sin(currentAngle); 

            currentPos.add(new THREE.Vector3(0, yOffset, zOffset));
        }
        return items;
    }, [boxCount, splayAngles, siteAngle, height]);

    return (
        <group>
            {/* Bumper/Grid Reference */}
            <mesh position={[0, 0.1, 0]}>
                <boxGeometry args={[dimensions?.w || 1, 0.05, dimensions?.d || 1]} />
                <meshStandardMaterial color="#3f3f46" />
            </mesh>

            {boxes.map((box) => (
                <group key={box.index} position={box.position} rotation={box.rotation}>
                    <AssetGeometry 
                        type={type} 
                        dimensions={dimensions} 
                        color={color} 
                    />
                    
                    {/* ID Label */}
                    <mesh position={[(dimensions?.w || 1)/2 + 0.01, 0, 0]} rotation={[0, Math.PI/2, 0]}>
                         <planeGeometry args={[0.2, 0.1]} />
                         <meshBasicMaterial color="black" />
                    </mesh>

                    {/* IMPROVED: Dispersion Cone instead of Laser Line */}
                    {showThrowLines && (
                        <CoverageCone 
                            dispersion={dispersion} 
                            throwDistance={throwDistance} 
                            color={box.index % 2 === 0 ? "#06b6d4" : "#a5f3fc"} 
                        />
                    )}
                </group>
            ))}
        </group>
    );
};