/**
 * Ground Plane Visual Reference
 *
 * Semi-transparent plane at Y=0 to help users understand ground level
 */

import React from 'react';
import * as THREE from 'three';
import { useStore } from '../../store';

export const GroundPlane = () => {
    const showGroundPlane = useStore(state => state.showGroundPlane ?? true);

    if (!showGroundPlane) return null;

    return (
        <group>
            {/* Main ground plane */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0.001, 0]}
                receiveShadow
            >
                <planeGeometry args={[100, 100]} />
                <meshBasicMaterial
                    color="#1a1a2e"
                    transparent
                    opacity={0.3}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            {/* Ground level indicator ring at origin */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
                <ringGeometry args={[0.45, 0.5, 32]} />
                <meshBasicMaterial
                    color="#22c55e"
                    transparent
                    opacity={0.6}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            {/* Y=0 label at origin */}
            <mesh position={[0.8, 0.1, 0]}>
                <planeGeometry args={[0.6, 0.2]} />
                <meshBasicMaterial
                    color="#22c55e"
                    transparent
                    opacity={0.8}
                />
            </mesh>
        </group>
    );
};
