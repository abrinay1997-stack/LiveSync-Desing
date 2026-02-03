/**
 * SPL Coverage Visualization
 * 
 * Renders 2D heatmap of sound coverage in 3D scene
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useStore } from '../../store';
import { ASSETS } from '../../data/library';
import type { SpeakerSpec } from '../../utils/acoustics/raycast';
import { generateCoverageGrid, type CoverageGridParams } from '../../utils/acoustics/coverageGrid';
import type { Obstacle } from '../../utils/acoustics/occlusion';
import type { AcousticEnvironment } from '../../utils/acoustics/SPLCalculator';

export const SPLVisualization = () => {
    const objects = useStore(state => state.objects);
    const showSPLCoverage = useStore(state => state.showSPLCoverage);
    const splMeasurementHeight = useStore(state => state.splMeasurementHeight || 1.7); // default 1.7m (ear height)
    const splResolution = useStore(state => state.splResolution || 1.0); // default 1m grid
    const splFrequency = useStore(state => state.splFrequency || 1000);
    const showReflections = useStore(state => state.showReflections);
    const showOcclusion = useStore(state => state.showOcclusion);

    const OBSTACLE_TYPES = new Set(['stage', 'truss', 'bumper']);

    // Get all speakers in scene with full frequency data
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
                        power: asset?.power || 1000,
                        frequencyResponse: asset?.frequencyResponse,
                        directivityByFreq: asset?.directivityByFreq
                    } as SpeakerSpec
                };
            });
    }, [objects]);

    // Build obstacles from scene objects (stages, trusses, scenery)
    const obstacles = useMemo((): Obstacle[] => {
        return objects
            .filter(obj => OBSTACLE_TYPES.has(obj.type))
            .map(obj => {
                const asset = ASSETS[obj.model];
                const dims = asset?.dimensions || { w: 1, h: 1, d: 1 };
                const pos = new THREE.Vector3(...obj.position);
                const halfW = dims.w / 2;
                const halfH = dims.h / 2;
                const halfD = dims.d / 2;
                return {
                    id: obj.id,
                    type: obj.type as 'stage' | 'truss' | 'scenery',
                    position: pos,
                    dimensions: new THREE.Vector3(dims.w, dims.h, dims.d),
                    bounds: new THREE.Box3(
                        new THREE.Vector3(pos.x - halfW, pos.y - halfH, pos.z - halfD),
                        new THREE.Vector3(pos.x + halfW, pos.y + halfH, pos.z + halfD)
                    )
                };
            });
    }, [objects]);

    // Build acoustic environment from scene data
    const environment = useMemo((): AcousticEnvironment | undefined => {
        if (obstacles.length === 0) return undefined;
        return { obstacles };
    }, [obstacles]);

    // Generate coverage grid
    const coverageGrid = useMemo(() => {
        if (!showSPLCoverage || speakers.length === 0) return null;

        const params: CoverageGridParams = {
            bounds: {
                minX: -20,
                maxX: 20,
                minZ: -20,
                maxZ: 20
            },
            resolution: splResolution,
            height: splMeasurementHeight,
            frequency: splFrequency || 1000,
            showReflections: showReflections,
            showOcclusion: showOcclusion,
            environment: environment
        };

        return generateCoverageGrid(params, speakers);
    }, [showSPLCoverage, speakers, splMeasurementHeight, splResolution, splFrequency, showReflections, showOcclusion, environment]);

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
