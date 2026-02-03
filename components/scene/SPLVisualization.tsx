/**
 * SPL Coverage Visualization
 * 
 * Renders 2D heatmap of sound coverage in 3D scene
 */

import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import { useStore } from '../../store';
import { ASSETS } from '../../data/library';
import type { SpeakerSpec } from '../../utils/acoustics/raycast';
import { generateCoverageGrid, type CoverageGridParams } from '../../utils/acoustics/coverageGrid';

export const SPLVisualization = () => {
    const objects = useStore(state => state.objects);
    const showSPLCoverage = useStore(state => state.showSPLCoverage);
    const splMeasurementHeight = useStore(state => state.splMeasurementHeight || 1.7); // default 1.7m (ear height)
    const splResolution = useStore(state => state.splResolution || 1.0); // default 1m grid
    const splFrequency = useStore(state => state.splFrequency || 1000);
    const showReflections = useStore(state => state.showReflections);
    const showOcclusion = useStore(state => state.showOcclusion);

    // Get all speakers in scene
    const speakers = useMemo(() => {
        return objects
            .filter(obj => obj.type === 'speaker' || obj.type === 'sub')
            .map(obj => {
                const asset = ASSETS[obj.model];
                return {
                    id: obj.id,
                    spec: {
                        position: new THREE.Vector3(...obj.position),
                        rotation: obj.rotation,
                        maxSPL: asset?.maxSPL || 120,
                        dispersion: asset?.dispersion || { horizontal: 90, vertical: 60 },
                        power: asset?.power || 1000
                    } as SpeakerSpec
                };
            });
    }, [objects]);

    // Generate coverage grid
    const coverageGrid = useMemo(() => {
        if (!showSPLCoverage || speakers.length === 0) return null;

        // Define measurement area (simplified - could be from scene bounds)
        const params: CoverageGridParams = {
            bounds: {
                minX: -20,
                maxX: 20,
                minZ: -20,
                maxZ: 20
            },
            resolution: splResolution,
            height: splMeasurementHeight,
            frequency: splFrequency || 1000, // Use selected frequency
            showReflections: showReflections,
            showOcclusion: showOcclusion
        };

        return generateCoverageGrid(params, speakers);
    }, [showSPLCoverage, speakers, splMeasurementHeight, splResolution]);

    if (!showSPLCoverage || !coverageGrid) return null;

    return (
        <group>
            {/* Render coverage points as colored spheres */}
            {coverageGrid.points.map((point, i) => (
                <mesh key={i} position={point.position}>
                    <sphereGeometry args={[0.15, 8, 8]} />
                    <meshBasicMaterial color={point.color} transparent opacity={0.6} />
                </mesh>
            ))}

            {/* Optional: Grid plane for reference */}
            <mesh
                position={[0, splMeasurementHeight - 0.01, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <planeGeometry args={[40, 40]} />
                <meshBasicMaterial
                    color="#333333"
                    transparent
                    opacity={0.1}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
};
