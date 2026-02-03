/**
 * Catenary Visualization Component
 * 
 * Renders cable curves in 3D scene based on physics calculations
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { useStore } from '../../store';
import { ASSETS } from '../../data/library';

export const CatenaryVisualization = () => {
    const objects = useStore(state => state.objects);
    const selectedIds = useStore(state => state.selectedIds);

    // Get selected rigging points and loads
    const selection = objects.filter(o => selectedIds.includes(o.id));
    const riggingPoints = selection.filter(o => o.type === 'motor' || o.type === 'truss');
    const loads = selection.filter(o => o.type === 'speaker' || o.type === 'sub');

    // Calculate catenary curves between rigging points and suspended loads
    const curves = useMemo(() => {
        if (riggingPoints.length === 0 || loads.length === 0) return [];

        const result: Array<{
            points: THREE.Vector3[];
            color: string;
            tension: number;
        }> = [];

        loads.forEach(load => {
            const loadPos = new THREE.Vector3(...load.position);
            const asset = ASSETS[load.model];
            const weight = asset?.weight || 0;

            // Find closest rigging point (simplified - in real app would use attachment data)
            riggingPoints.forEach(point => {
                const pointPos = new THREE.Vector3(...point.position);
                const distance = pointPos.distanceTo(loadPos);

                // Only show cables within reasonable distance
                if (distance > 15) return;

                // Generate catenary curve points
                const points = generateCatenaryCurve(
                    pointPos,
                    loadPos,
                    weight,
                    20 // num points
                );

                // Calculate tension for color coding
                const dy = pointPos.y - loadPos.y;
                const horizontalDist = Math.sqrt(
                    Math.pow(pointPos.x - loadPos.x, 2) +
                    Math.pow(pointPos.z - loadPos.z, 2)
                );
                const angle = Math.atan2(horizontalDist, Math.abs(dy));
                const tension = (weight * 9.81) / Math.cos(angle);

                // Color based on tension
                let color = '#22c55e'; // Green - low tension
                if (tension > 15000) color = '#ef4444'; // Red - high tension
                else if (tension > 10000) color = '#f59e0b'; // Amber - medium tension

                result.push({ points, color, tension });
            });
        });

        return result;
    }, [riggingPoints, loads]);

    if (curves.length === 0) return null;

    return (
        <group>
            {curves.map((curve, i) => (
                <Line
                    key={i}
                    points={curve.points}
                    color={curve.color}
                    lineWidth={2}
                    dashed={false}
                    opacity={0.8}
                    transparent
                />
            ))}
        </group>
    );
};

/**
 * Generate catenary curve points between two positions
 */
function generateCatenaryCurve(
    start: THREE.Vector3,
    end: THREE.Vector3,
    weight: number,
    numPoints: number = 20
): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];

    const span = Math.sqrt(
        Math.pow(start.x - end.x, 2) +
        Math.pow(start.z - end.z, 2)
    );

    const heightDiff = start.y - end.y;

    // Estimate sag (parabolic approximation)
    const estimatedTension = weight * 9.81 * 0.5;
    const cableWeight = 2; // kg/m estimate
    const totalLinearDensity = cableWeight + (weight / span);
    const sag = (totalLinearDensity * 9.81 * Math.pow(span, 2)) / (8 * estimatedTension);

    // Generate points along curve
    for (let i = 0; i < numPoints; i++) {
        const t = i / (numPoints - 1);

        // Linear interpolation for X and Z
        const x = start.x + (end.x - start.x) * t;
        const z = start.z + (end.z - start.z) * t;

        // Parabolic curve for Y (catenary approximation)
        const localT = (t - 0.5) * 2; // -1 to 1
        const y = start.y - heightDiff * t - sag * (1 - localT * localT);

        points.push(new THREE.Vector3(x, y, z));
    }

    return points;
}
