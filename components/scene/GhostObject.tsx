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
    nearbyPoints: ConnectionPoint[]; // Show available connection points
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
        let nearbyPoints: ConnectionPoint[] = [];

        if (template.type === 'truss' && snappingEnabled && connectionPoints.length > 0) {
            const ghostDims = template.dimensions || { w: 1, h: 0.29, d: 0.29 };
            const NEARBY_THRESHOLD = 4.0; // Show nearby points within 4m XZ distance
            const SNAP_THRESHOLD = 1.2; // Snap when within 1.2m of connection

            // Find all nearby connection points (for visual hints)
            nearbyPoints = connectionPoints.filter(cp => {
                const xzDist = Math.sqrt(
                    Math.pow(cp.position.x - x, 2) +
                    Math.pow(cp.position.z - z, 2)
                );
                return xzDist < NEARBY_THRESHOLD;
            });

            // Try to find the best snap among all nearby points
            let bestSnap = {
                snapped: false,
                position: new THREE.Vector3(x, heightOffset, z),
                rotation: new THREE.Euler(0, 0, 0),
                distance: Infinity,
                targetPoint: null as ConnectionPoint | null
            };

            for (const cp of nearbyPoints) {
                // Calculate multiple potential ghost positions for this connection point
                const halfWidth = ghostDims.w / 2;

                // Test positions: placing ghost so its ends align with the connection point
                const testConfigs = [
                    // Horizontal orientations - ghost's left end at CP
                    { pos: new THREE.Vector3(cp.position.x + halfWidth, cp.position.y, cp.position.z), rot: new THREE.Euler(0, 0, 0) },
                    // Horizontal - ghost's right end at CP
                    { pos: new THREE.Vector3(cp.position.x - halfWidth, cp.position.y, cp.position.z), rot: new THREE.Euler(0, 0, 0) },
                    // Vertical down - ghost's top at CP (Z rotation 90°)
                    { pos: new THREE.Vector3(cp.position.x, cp.position.y - halfWidth, cp.position.z), rot: new THREE.Euler(0, 0, Math.PI / 2) },
                    // Vertical up - ghost's bottom at CP (Z rotation -90°)
                    { pos: new THREE.Vector3(cp.position.x, cp.position.y + halfWidth, cp.position.z), rot: new THREE.Euler(0, 0, -Math.PI / 2) },
                    // Rotated on Y axis variations
                    { pos: new THREE.Vector3(cp.position.x, cp.position.y, cp.position.z + halfWidth), rot: new THREE.Euler(0, Math.PI / 2, 0) },
                    { pos: new THREE.Vector3(cp.position.x, cp.position.y, cp.position.z - halfWidth), rot: new THREE.Euler(0, Math.PI / 2, 0) },
                ];

                for (const config of testConfigs) {
                    // Check distance from mouse to this potential position (XZ only for usability)
                    const xzDistToConfig = Math.sqrt(
                        Math.pow(config.pos.x - x, 2) +
                        Math.pow(config.pos.z - z, 2)
                    );

                    if (xzDistToConfig < SNAP_THRESHOLD) {
                        // Verify this would actually snap
                        const snapResult = calculateSnapToConnection(
                            config.pos,
                            config.rot,
                            ghostDims,
                            connectionPoints,
                            1.5 // Generous threshold
                        );

                        if (snapResult.snapped && snapResult.distance < bestSnap.distance) {
                            bestSnap = {
                                snapped: true,
                                position: snapResult.position,
                                rotation: snapResult.rotation,
                                distance: snapResult.distance,
                                targetPoint: snapResult.targetPoint || null
                            };
                        }
                    }
                }
            }

            if (bestSnap.snapped) {
                setGhostState({
                    position: [bestSnap.position.x, bestSnap.position.y, bestSnap.position.z],
                    rotation: [bestSnap.rotation.x, bestSnap.rotation.y, bestSnap.rotation.z],
                    snappedToConnection: true,
                    targetPoint: bestSnap.targetPoint,
                    nearbyPoints
                });
                return;
            }
        }

        setGhostState({
            position: [x, heightOffset, z],
            rotation,
            snappedToConnection,
            targetPoint,
            nearbyPoints
        });
    };

    const handleClick = (e: any) => {
        if (activePlacementAsset && ghostState) {
            e.stopPropagation();

            // Add object with snapped position and rotation
            const store = useStore.getState();
            store.pushHistory();

            // Ensure object is not placed below ground
            let finalPosition = [...ghostState.position] as [number, number, number];
            const dims = template!.dimensions || { w: 1, h: 1, d: 1 };
            const minY = dims.h / 2; // Minimum Y to keep object on ground

            // For vertical objects, calculate proper minimum Y based on rotation
            const rot = new THREE.Euler(...ghostState.rotation);
            if (Math.abs(rot.z) > 0.1) {
                // Object is tilted, use width as height consideration
                const effectiveHeight = Math.max(dims.h, dims.w) / 2;
                if (finalPosition[1] < effectiveHeight) {
                    finalPosition[1] = effectiveHeight;
                }
            } else if (finalPosition[1] < minY) {
                finalPosition[1] = minY;
            }

            const existingCount = objects.filter(o => o.model === activePlacementAsset).length;
            const newObj = {
                id: crypto.randomUUID(),
                name: `${template!.name} ${existingCount + 1}`,
                model: activePlacementAsset,
                type: template!.type,
                position: finalPosition,
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

            {/* Show nearby connection points as visual hints */}
            {ghostState && ghostState.nearbyPoints && ghostState.nearbyPoints.length > 0 && (
                <group>
                    {ghostState.nearbyPoints.map((cp, idx) => (
                        <group key={cp.id} position={cp.position.toArray()}>
                            {/* Pulsing sphere at connection point */}
                            <mesh>
                                <sphereGeometry args={[0.15, 16, 16]} />
                                <meshBasicMaterial
                                    color={ghostState.snappedToConnection && ghostState.targetPoint?.id === cp.id ? '#22c55e' : '#06b6d4'}
                                    transparent
                                    opacity={0.6}
                                />
                            </mesh>
                            {/* Direction indicator */}
                            <Line
                                points={[
                                    [0, 0, 0],
                                    cp.direction.clone().multiplyScalar(0.5).toArray()
                                ]}
                                color={ghostState.snappedToConnection && ghostState.targetPoint?.id === cp.id ? '#22c55e' : '#f59e0b'}
                                lineWidth={3}
                            />
                            {/* Vertical guide line to ground */}
                            <Line
                                points={[
                                    [0, 0, 0],
                                    [0, -cp.position.y, 0]
                                ]}
                                color="#06b6d4"
                                lineWidth={1}
                                dashed
                                dashSize={0.2}
                                gapSize={0.1}
                            />
                        </group>
                    ))}
                </group>
            )}
        </>
    );
};
