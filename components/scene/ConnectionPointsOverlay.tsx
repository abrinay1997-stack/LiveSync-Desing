/**
 * Connection Points Overlay
 *
 * Renders visual indicators for truss connection points.
 * Shows available snap points and extension guides.
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Line, Html } from '@react-three/drei';
import { useStore } from '../../store';
import {
    getAllConnectionPoints,
    getExtensionGuides,
    ConnectionPoint
} from '../../utils/construction/connectionPoints';

interface ConnectionPointMarkerProps {
    point: ConnectionPoint;
    isHighlighted?: boolean;
    showLabel?: boolean;
}

/**
 * Single connection point marker
 */
const ConnectionPointMarker: React.FC<ConnectionPointMarkerProps> = ({
    point,
    isHighlighted = false,
    showLabel = false
}) => {
    const color = point.connected ? '#ef4444' : isHighlighted ? '#22c55e' : '#3b82f6';
    const scale = isHighlighted ? 1.5 : 1;

    return (
        <group position={point.position}>
            {/* Outer ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} scale={scale}>
                <ringGeometry args={[0.08, 0.12, 16]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.9}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            {/* Inner dot */}
            <mesh scale={scale}>
                <sphereGeometry args={[0.04, 8, 8]} />
                <meshBasicMaterial color={color} />
            </mesh>

            {/* Direction indicator */}
            <Line
                points={[
                    [0, 0, 0],
                    point.direction.toArray()
                ]}
                color={color}
                lineWidth={2}
                dashed={false}
            />

            {/* Label */}
            {showLabel && (
                <Html
                    position={[0, 0.2, 0]}
                    center
                    distanceFactor={10}
                    style={{ pointerEvents: 'none' }}
                >
                    <div
                        style={{
                            background: 'rgba(0,0,0,0.8)',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '10px',
                            fontFamily: 'monospace',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {point.connected ? 'Connected' : 'Available'}
                    </div>
                </Html>
            )}
        </group>
    );
};

interface ExtensionGuideProps {
    start: THREE.Vector3;
    end: THREE.Vector3;
    suggestedLengths: number[];
}

/**
 * Extension guide line showing where next truss could go
 */
const ExtensionGuide: React.FC<ExtensionGuideProps> = ({
    start,
    end,
    suggestedLengths
}) => {
    const direction = end.clone().sub(start).normalize();

    return (
        <group>
            {/* Main guide line (dashed) */}
            <Line
                points={[start.toArray(), end.toArray()]}
                color="#6366f1"
                lineWidth={1}
                dashed
                dashSize={0.2}
                gapSize={0.1}
            />

            {/* Distance markers at suggested lengths */}
            {suggestedLengths.map((length, i) => {
                const markerPos = start.clone().add(direction.clone().multiplyScalar(length));
                return (
                    <group key={i} position={markerPos}>
                        {/* Tick mark */}
                        <mesh rotation={[-Math.PI / 2, 0, 0]}>
                            <ringGeometry args={[0.03, 0.06, 8]} />
                            <meshBasicMaterial
                                color="#a5b4fc"
                                transparent
                                opacity={0.7}
                                side={THREE.DoubleSide}
                            />
                        </mesh>

                        {/* Distance label */}
                        <Html
                            position={[0, 0.15, 0]}
                            center
                            distanceFactor={12}
                            style={{ pointerEvents: 'none' }}
                        >
                            <div
                                style={{
                                    background: 'rgba(99, 102, 241, 0.9)',
                                    color: 'white',
                                    padding: '1px 4px',
                                    borderRadius: '2px',
                                    fontSize: '9px',
                                    fontFamily: 'monospace'
                                }}
                            >
                                {length}m
                            </div>
                        </Html>
                    </group>
                );
            })}
        </group>
    );
};

/**
 * Main overlay component that shows all connection points and guides
 */
export const ConnectionPointsOverlay: React.FC = () => {
    const objects = useStore(state => state.objects);
    const selectedIds = useStore(state => state.selectedIds);
    const activePlacementAsset = useStore(state => state.activePlacementAsset);
    const activeTool = useStore(state => state.activeTool);

    // Only show when placing trusses or when a truss is selected
    const shouldShow = useMemo(() => {
        if (activePlacementAsset?.startsWith('truss')) return true;
        if (selectedIds.length > 0) {
            const selectedObj = objects.find(o => o.id === selectedIds[0]);
            if (selectedObj?.type === 'truss') return true;
        }
        return false;
    }, [activePlacementAsset, selectedIds, objects]);

    // Get all connection points
    const connectionPoints = useMemo(() => {
        if (!shouldShow) return [];
        return getAllConnectionPoints(objects);
    }, [objects, shouldShow]);

    // Get extension guides for selected truss
    const extensionGuides = useMemo(() => {
        if (selectedIds.length !== 1) return null;
        const selectedObj = objects.find(o => o.id === selectedIds[0]);
        if (!selectedObj || selectedObj.type !== 'truss') return null;
        return getExtensionGuides(selectedObj);
    }, [selectedIds, objects]);

    if (!shouldShow) return null;

    return (
        <group>
            {/* Connection points for all trusses */}
            {connectionPoints.map(point => (
                <ConnectionPointMarker
                    key={point.id}
                    point={point}
                    isHighlighted={activePlacementAsset !== null}
                    showLabel={false}
                />
            ))}

            {/* Extension guides for selected truss */}
            {extensionGuides && extensionGuides.lines.map((line, i) => (
                <ExtensionGuide
                    key={i}
                    start={line.start}
                    end={line.end}
                    suggestedLengths={extensionGuides.suggestedLengths}
                />
            ))}
        </group>
    );
};
