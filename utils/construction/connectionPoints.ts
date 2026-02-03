/**
 * Connection Points System
 *
 * Calculates connection points for trusses and other connectable objects.
 * Used for smart snapping and construction assistance.
 */

import * as THREE from 'three';
import { SceneObject } from '../../types';

export interface ConnectionPoint {
    id: string;
    objectId: string;
    position: THREE.Vector3;      // World position
    direction: THREE.Vector3;     // Outward facing direction (for alignment)
    type: 'end' | 'side' | 'top' | 'bottom';
    connected: boolean;           // Is this point already connected?
    connectedTo?: string;         // ID of connected object
}

export interface SnapResult {
    snapped: boolean;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    connectionPoint?: ConnectionPoint;
    targetPoint?: ConnectionPoint;
    distance: number;
}

/**
 * Calculate connection points for a truss based on its position, rotation, and dimensions
 */
export function getTrussConnectionPoints(obj: SceneObject): ConnectionPoint[] {
    if (obj.type !== 'truss') return [];

    const points: ConnectionPoint[] = [];
    const pos = new THREE.Vector3(...obj.position);
    const rot = new THREE.Euler(...obj.rotation);
    const dims = obj.dimensions || { w: 1, h: 0.29, d: 0.29 };

    // Create rotation matrix
    const rotMatrix = new THREE.Matrix4().makeRotationFromEuler(rot);

    // Truss extends along X axis (width), connection points at both ends
    // Left end (-X)
    const leftLocal = new THREE.Vector3(-dims.w / 2, 0, 0);
    const leftDir = new THREE.Vector3(-1, 0, 0);
    leftLocal.applyMatrix4(rotMatrix);
    leftDir.applyMatrix4(rotMatrix).normalize();

    points.push({
        id: `${obj.id}-left`,
        objectId: obj.id,
        position: pos.clone().add(leftLocal),
        direction: leftDir,
        type: 'end',
        connected: false
    });

    // Right end (+X)
    const rightLocal = new THREE.Vector3(dims.w / 2, 0, 0);
    const rightDir = new THREE.Vector3(1, 0, 0);
    rightLocal.applyMatrix4(rotMatrix);
    rightDir.applyMatrix4(rotMatrix).normalize();

    points.push({
        id: `${obj.id}-right`,
        objectId: obj.id,
        position: pos.clone().add(rightLocal),
        direction: rightDir,
        type: 'end',
        connected: false
    });

    return points;
}

/**
 * Get all connection points from all connectable objects in scene
 */
export function getAllConnectionPoints(objects: SceneObject[]): ConnectionPoint[] {
    const allPoints: ConnectionPoint[] = [];

    for (const obj of objects) {
        if (obj.type === 'truss') {
            allPoints.push(...getTrussConnectionPoints(obj));
        }
        // Future: Add support for corners, motors, etc.
    }

    return allPoints;
}

/**
 * Find the nearest connection point to a given position
 */
export function findNearestConnectionPoint(
    position: THREE.Vector3,
    connectionPoints: ConnectionPoint[],
    maxDistance: number = 1.0,
    excludeObjectId?: string
): ConnectionPoint | null {
    let nearest: ConnectionPoint | null = null;
    let minDist = maxDistance;

    for (const point of connectionPoints) {
        // Skip points from the same object
        if (excludeObjectId && point.objectId === excludeObjectId) continue;
        // Skip already connected points
        if (point.connected) continue;

        const dist = position.distanceTo(point.position);
        if (dist < minDist) {
            minDist = dist;
            nearest = point;
        }
    }

    return nearest;
}

/**
 * Calculate the snap result when placing a new object near existing connections
 */
export function calculateSnapToConnection(
    ghostPosition: THREE.Vector3,
    ghostRotation: THREE.Euler,
    ghostDimensions: { w: number; h: number; d: number },
    connectionPoints: ConnectionPoint[],
    snapThreshold: number = 0.8
): SnapResult {
    // Calculate where the ghost's connection points would be
    const ghostLeftLocal = new THREE.Vector3(-ghostDimensions.w / 2, 0, 0);
    const ghostRightLocal = new THREE.Vector3(ghostDimensions.w / 2, 0, 0);

    const rotMatrix = new THREE.Matrix4().makeRotationFromEuler(ghostRotation);
    ghostLeftLocal.applyMatrix4(rotMatrix);
    ghostRightLocal.applyMatrix4(rotMatrix);

    const ghostLeftWorld = ghostPosition.clone().add(ghostLeftLocal);
    const ghostRightWorld = ghostPosition.clone().add(ghostRightLocal);

    // Find nearest connection point to either end of ghost
    let bestSnap: SnapResult = {
        snapped: false,
        position: ghostPosition.clone(),
        rotation: ghostRotation.clone(),
        distance: Infinity
    };

    for (const targetPoint of connectionPoints) {
        if (targetPoint.connected) continue;

        // Check left end of ghost
        const distLeft = ghostLeftWorld.distanceTo(targetPoint.position);
        if (distLeft < snapThreshold && distLeft < bestSnap.distance) {
            // Snap ghost's left end to target
            const newPos = targetPoint.position.clone().sub(ghostLeftLocal);
            const newRot = calculateAlignmentRotation(targetPoint.direction, 'left');

            bestSnap = {
                snapped: true,
                position: newPos,
                rotation: newRot,
                connectionPoint: {
                    id: 'ghost-left',
                    objectId: 'ghost',
                    position: ghostLeftWorld,
                    direction: new THREE.Vector3(-1, 0, 0),
                    type: 'end',
                    connected: false
                },
                targetPoint,
                distance: distLeft
            };
        }

        // Check right end of ghost
        const distRight = ghostRightWorld.distanceTo(targetPoint.position);
        if (distRight < snapThreshold && distRight < bestSnap.distance) {
            // Snap ghost's right end to target
            const newPos = targetPoint.position.clone().sub(ghostRightLocal);
            const newRot = calculateAlignmentRotation(targetPoint.direction, 'right');

            bestSnap = {
                snapped: true,
                position: newPos,
                rotation: newRot,
                connectionPoint: {
                    id: 'ghost-right',
                    objectId: 'ghost',
                    position: ghostRightWorld,
                    direction: new THREE.Vector3(1, 0, 0),
                    type: 'end',
                    connected: false
                },
                targetPoint,
                distance: distRight
            };
        }
    }

    return bestSnap;
}

/**
 * Calculate the rotation needed to align with a connection point
 */
function calculateAlignmentRotation(
    targetDirection: THREE.Vector3,
    whichEnd: 'left' | 'right'
): THREE.Euler {
    // The truss extends along X.
    // If snapping left end, we need to point our -X toward target's direction
    // If snapping right end, we need to point our +X toward target's direction

    const targetDir = targetDirection.clone().normalize();

    // For a truss, we need to rotate around Y to align
    // Calculate the angle from the default direction
    let angle = Math.atan2(targetDir.z, targetDir.x);

    if (whichEnd === 'left') {
        // Our left points in -X, target points outward
        // We want our left to meet target, so rotate to face opposite of target direction
        angle = angle + Math.PI;
    }
    // For right end, the angle is correct as-is

    return new THREE.Euler(0, -angle, 0);
}

/**
 * Get extension guide lines from a truss (where next truss could go)
 */
export function getExtensionGuides(obj: SceneObject): {
    lines: Array<{ start: THREE.Vector3; end: THREE.Vector3; length: number }>;
    suggestedLengths: number[];
} {
    if (obj.type !== 'truss') {
        return { lines: [], suggestedLengths: [] };
    }

    const points = getTrussConnectionPoints(obj);
    const lines: Array<{ start: THREE.Vector3; end: THREE.Vector3; length: number }> = [];
    const suggestedLengths = [1.0, 2.0, 3.0]; // Standard truss lengths

    for (const point of points) {
        if (!point.connected) {
            // Create extension line in the direction the point faces
            const guideLength = 6; // Show 6m guide
            const end = point.position.clone().add(
                point.direction.clone().multiplyScalar(guideLength)
            );

            lines.push({
                start: point.position.clone(),
                end,
                length: guideLength
            });
        }
    }

    return { lines, suggestedLengths };
}

/**
 * Calculate the gap between two trusses and suggest pieces to fill it
 */
export function calculateGapFill(
    point1: ConnectionPoint,
    point2: ConnectionPoint,
    availableLengths: number[] = [0.5, 1.0, 2.0, 3.0]
): {
    gap: number;
    suggestions: Array<{ pieces: number[]; total: number; count: number }>;
} {
    const gap = point1.position.distanceTo(point2.position);

    // Find combinations that fill the gap
    const suggestions: Array<{ pieces: number[]; total: number; count: number }> = [];

    // Sort lengths descending for greedy approach
    const sortedLengths = [...availableLengths].sort((a, b) => b - a);

    // Simple greedy fill
    const greedyFill: number[] = [];
    let remaining = gap;
    for (const len of sortedLengths) {
        while (remaining >= len - 0.01) {
            greedyFill.push(len);
            remaining -= len;
        }
    }

    if (Math.abs(remaining) < 0.05) {
        suggestions.push({
            pieces: greedyFill,
            total: greedyFill.reduce((a, b) => a + b, 0),
            count: greedyFill.length
        });
    }

    // Try uniform fill if possible
    for (const len of availableLengths) {
        const count = Math.round(gap / len);
        if (Math.abs(count * len - gap) < 0.05) {
            const uniform = Array(count).fill(len);
            // Check if this is different from greedy
            if (JSON.stringify(uniform) !== JSON.stringify(greedyFill)) {
                suggestions.push({
                    pieces: uniform,
                    total: count * len,
                    count
                });
            }
        }
    }

    return { gap, suggestions };
}
