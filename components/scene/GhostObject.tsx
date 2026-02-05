/**
 * Ghost Object - Smart Placement Preview
 *
 * Shows a preview of the object being placed with intelligent snapping:
 * - Grid snapping
 * - Object alignment snapping
 * - Connection point snapping for trusses (auto-rotation)
 */

import React, { useState, useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { useStore } from '../../store';
import { ASSETS } from '../../data/library';
import { AssetGeometry } from './AssetGeometry';
import { snapCoords } from '../../utils/snapping';
import {
    getAllConnectionPoints,
    calculateSnapToConnection,
    ConnectionPoint
} from '../../utils/construction/connectionPoints';

interface GhostState {
    position: [number, number, number];
    rotation: [number, number, number];
    snappedToConnection: boolean;
    targetPoint: ConnectionPoint | null;
}

export const GhostObject = () => {
    const activePlacementAsset = useStore(state => state.activePlacementAsset);
    const addObject = useStore(state => state.addObject);
    const snappingEnabled = useStore(state => state.snappingEnabled);
    const objects = useStore(state => state.objects);

    const [ghostState, setGhostState] = useState<GhostState | null>(null);
    const [snapLines, setSnapLines] = useState<{ x: number | null; z: number | null }>({ x: null, z: null });

    const template = activePlacementAsset ? ASSETS[activePlacementAsset] : null;

    // Get all connection points from existing objects
    const connectionPoints = useMemo(() => {
        if (!template || template.type !== 'truss') return [];
        return getAllConnectionPoints(objects);
    }, [objects, template]);

    const handlePointerMove = (e: any) => {
        if (!activePlacementAsset || !template) return;

        const point = e.point;
        if (!point) return;

        let x = point.x;
        let z = point.z;
        let rotation: [number, number, number] = [0, 0, 0];
        let snappedToConnection = false;
        let targetPoint: ConnectionPoint | null = null;

        // Height based on object bounds
        const heightOffset = template.dimensions ? template.dimensions.h / 2 : 0;

        // --- 1. GRID SNAPPING ---
        const coords = snapCoords(x, 0, z, snappingEnabled);
        x = coords[0];
        z = coords[2];

        // --- 2. OBJECT-TO-OBJECT ALIGNMENT SNAPPING ---
        let snappedX: number | null = null;
        let snappedZ: number | null = null;

        if (snappingEnabled) {
            const ALIGN_THRESHOLD = 0.3;

            for (const obj of objects) {
                if (Math.abs(obj.position[0] - x) < ALIGN_THRESHOLD) {
                    x = obj.position[0];
                    snappedX = x;
                }
                if (Math.abs(obj.position[2] - z) < ALIGN_THRESHOLD) {
                    z = obj.position[2];
                    snappedZ = z;
                }
            }
        }

        setSnapLines({ x: snappedX, z: snappedZ });

        // --- 3. CONNECTION POINT SNAPPING (for trusses) ---
        if (template.type === 'truss' && snappingEnabled && connectionPoints.length > 0) {
            const ghostDims = template.dimensions || { w: 1, h: 0.29, d: 0.29 };

            // First, try standard horizontal snapping at ground level
            const ghostPos = new THREE.Vector3(x, heightOffset, z);
            const ghostRot = new THREE.Euler(0, 0, 0);

            let snapResult = calculateSnapToConnection(
                ghostPos,
                ghostRot,
                ghostDims,
                connectionPoints,
                0.8 // Snap threshold
            );

            // If no snap found, check for nearby connection points at ANY height
            // This enables vertical truss construction
            if (!snapResult.snapped) {
                const VERTICAL_SNAP_THRESHOLD = 1.5; // XZ distance to trigger vertical snap search

                for (const cp of connectionPoints) {
                    // Check XZ distance (ignore Y)
                    const xzDist = Math.sqrt(
                        Math.pow(cp.position.x - x, 2) +
                        Math.pow(cp.position.z - z, 2)
                    );

                    if (xzDist < VERTICAL_SNAP_THRESHOLD) {
                        // Try snapping at this connection point's height
                        // Test both horizontal and vertical ghost orientations
                        const testPositions = [
                            // Horizontal ghost at connection point height
                            { pos: new THREE.Vector3(x, cp.position.y, z), rot: new THREE.Euler(0, 0, 0) },
                            // Vertical ghost (rotated 90° on Z)
                            { pos: new THREE.Vector3(x, cp.position.y, z), rot: new THREE.Euler(0, 0, Math.PI / 2) },
                            // Vertical ghost (rotated -90° on Z)
                            { pos: new THREE.Vector3(x, cp.position.y, z), rot: new THREE.Euler(0, 0, -Math.PI / 2) },
                        ];

                        for (const test of testPositions) {
                            const testResult = calculateSnapToConnection(
                                test.pos,
                                test.rot,
                                ghostDims,
                                connectionPoints,
                                1.0 // Slightly larger threshold for vertical
                            );

                            if (testResult.snapped && (!snapResult.snapped || testResult.distance < snapResult.distance)) {
                                snapResult = testResult;
                            }
                        }
                    }
                }
            }

            if (snapResult.snapped) {
                // Use FULL position including Y for vertical truss support
                x = snapResult.position.x;
                z = snapResult.position.z;
                const y = snapResult.position.y;
                rotation = [snapResult.rotation.x, snapResult.rotation.y, snapResult.rotation.z];
                snappedToConnection = true;
                targetPoint = snapResult.targetPoint || null;

                // Update ghost state with correct Y position
                setGhostState({
                    position: [x, y, z],
                    rotation,
                    snappedToConnection,
                    targetPoint
                });
                return;
            }
        }

        setGhostState({
            position: [x, heightOffset, z],
            rotation,
            snappedToConnection,
            targetPoint
        });
    };

    const handleClick = (e: any) => {
        if (activePlacementAsset && ghostState) {
            e.stopPropagation();

            // Add object with snapped position and rotation
            const store = useStore.getState();
            store.pushHistory();

            const existingCount = objects.filter(o => o.model === activePlacementAsset).length;
            const newObj = {
                id: crypto.randomUUID(),
                name: `${template!.name} ${existingCount + 1}`,
                model: activePlacementAsset,
                type: template!.type,
                position: ghostState.position,
                rotation: ghostState.rotation,
                scale: [1, 1, 1] as [number, number, number],
                layerId: 'rigging',
                color: template!.color || '#fff',
                dimensions: { ...template!.dimensions },
                locked: false
            };

            useStore.setState(state => ({
                objects: [...state.objects, newObj],
                selectedIds: state.continuousPlacement ? [] : [newObj.id],
                activePlacementAsset: state.continuousPlacement ? state.activePlacementAsset : null,
                activeTool: state.continuousPlacement ? state.activeTool : 'select'
            }));
        }
    };

    if (!activePlacementAsset || !template) return null;

    return (
        <>
            {/* Invisible raycast plane */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                onPointerMove={handlePointerMove}
                onClick={handleClick}
            >
                <planeGeometry args={[1000, 1000]} />
                <meshBasicMaterial visible={false} />
            </mesh>

            {ghostState && (
                <group
                    position={ghostState.position}
                    rotation={new THREE.Euler(...ghostState.rotation)}
                >
                    {/* Ghost geometry */}
                    <AssetGeometry
                        type={template.type || 'speaker'}
                        dimensions={template.dimensions}
                        color={ghostState.snappedToConnection ? '#22c55e' : template.color || '#fff'}
                        isGhost={true}
                    />

                    {/* Vertical placement indicator */}
                    <mesh position={[0, -ghostState.position[1] / 2, 0]}>
                        <boxGeometry args={[0.02, ghostState.position[1], 0.02]} />
                        <meshBasicMaterial
                            color={ghostState.snappedToConnection ? '#22c55e' : '#06b6d4'}
                            opacity={0.5}
                            transparent
                        />
                    </mesh>

                    {/* Connection indicator when snapped */}
                    {ghostState.snappedToConnection && ghostState.targetPoint && (
                        <group>
                            {/* Glow ring at snap point */}
                            <mesh
                                position={ghostState.targetPoint.position.clone().sub(new THREE.Vector3(...ghostState.position))}
                                rotation={[-Math.PI / 2, 0, 0]}
                            >
                                <ringGeometry args={[0.1, 0.2, 16]} />
                                <meshBasicMaterial
                                    color="#22c55e"
                                    transparent
                                    opacity={0.8}
                                    side={THREE.DoubleSide}
                                />
                            </mesh>

                            {/* Connection line */}
                            <Line
                                points={[
                                    [0, 0, 0],
                                    ghostState.targetPoint.position.clone().sub(new THREE.Vector3(...ghostState.position)).toArray()
                                ]}
                                color="#22c55e"
                                lineWidth={3}
                            />
                        </group>
                    )}

                    {/* Alignment snap guides */}
                    {snapLines.x !== null && !ghostState.snappedToConnection && (
                        <mesh position={[0, -ghostState.position[1] / 2, 0]}>
                            <boxGeometry args={[0.05, 0.1, 100]} />
                            <meshBasicMaterial color="#3b82f6" opacity={0.2} transparent />
                        </mesh>
                    )}
                    {snapLines.z !== null && !ghostState.snappedToConnection && (
                        <mesh position={[0, -ghostState.position[1] / 2, 0]}>
                            <boxGeometry args={[100, 0.1, 0.05]} />
                            <meshBasicMaterial color="#3b82f6" opacity={0.2} transparent />
                        </mesh>
                    )}
                </group>
            )}
        </>
    );
};
