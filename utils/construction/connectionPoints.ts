/**
 * Connection Points System
 *
 * Calculates connection points for trusses and other connectable objects.
 * Used for smart snapping and construction assistance.
 *
 * Supports:
 * - Horizontal trusses (ends on X axis)
 * - Vertical trusses (ends on Y axis when rotated)
 * - Any orientation (automatic detection)
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
 * Works for any orientation (horizontal, vertical, or angled)
 */
export function getTrussConnectionPoints(obj: SceneObject): ConnectionPoint[] {
    if (obj.type !== 'truss') return [];

    const points: ConnectionPoint[] = [];
    const pos = new THREE.Vector3(...obj.position);
    const rot = new THREE.Euler(...obj.rotation);
    const dims = obj.dimensions || { w: 1, h: 0.29, d: 0.29 };

    // Create rotation matrix
    const rotMatrix = new THREE.Matrix4().makeRotationFromEuler(rot);

    // Truss extends along its LOCAL X axis (width dimension)
    // When horizontal: extends along world X
    // When vertical (rotated 90° on Z): extends along world Y
    // When rotated 90° on Y: extends along world Z

    // Left end (local -X)
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

    // Right end (local +X)
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
 * Works for any orientation of the ghost and target trusses
 */
export function calculateSnapToConnection(
    ghostPosition: THREE.Vector3,
    ghostRotation: THREE.Euler,
    ghostDimensions: { w: number; h: number; d: number },
    connectionPoints: ConnectionPoint[],
    snapThreshold: number = 0.8
): SnapResult {
    // Create rotation matrix for ghost
    const rotMatrix = new THREE.Matrix4().makeRotationFromEuler(ghostRotation);

    // Calculate where the ghost's connection points would be (both ends)
    const ghostEnd1Local = new THREE.Vector3(-ghostDimensions.w / 2, 0, 0);
    const ghostEnd2Local = new THREE.Vector3(ghostDimensions.w / 2, 0, 0);

    // Apply rotation to get world-space offsets
    const ghostEnd1Offset = ghostEnd1Local.clone().applyMatrix4(rotMatrix);
    const ghostEnd2Offset = ghostEnd2Local.clone().applyMatrix4(rotMatrix);

    // World positions of ghost ends
    const ghostEnd1World = ghostPosition.clone().add(ghostEnd1Offset);
    const ghostEnd2World = ghostPosition.clone().add(ghostEnd2Offset);

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
        const distLeft = ghostEnd1World.distanceTo(targetPoint.position);
        if (distLeft < snapThreshold && distLeft < bestSnap.distance) {
            // Snap ghost's left end to target
            const alignedRotation = calculateAlignmentRotation(targetPoint.direction, 'left', ghostRotation);
            const newRotMatrix = new THREE.Matrix4().makeRotationFromEuler(alignedRotation);
            const newLeftOffset = new THREE.Vector3(-ghostDimensions.w / 2, 0, 0).applyMatrix4(newRotMatrix);
            const newPos = targetPoint.position.clone().sub(newLeftOffset);

            bestSnap = {
                snapped: true,
                position: newPos,
                rotation: alignedRotation,
                connectionPoint: {
                    id: 'ghost-left',
                    objectId: 'ghost',
                    position: ghostEnd1World,
                    direction: new THREE.Vector3(-1, 0, 0).applyMatrix4(rotMatrix).normalize(),
                    type: 'end',
                    connected: false
                },
                targetPoint,
                distance: distLeft
            };
        }

        // Check right end of ghost
        const distRight = ghostEnd2World.distanceTo(targetPoint.position);
        if (distRight < snapThreshold && distRight < bestSnap.distance) {
            // Snap ghost's right end to target
            const alignedRotation = calculateAlignmentRotation(targetPoint.direction, 'right', ghostRotation);
            const newRotMatrix = new THREE.Matrix4().makeRotationFromEuler(alignedRotation);
            const newRightOffset = new THREE.Vector3(ghostDimensions.w / 2, 0, 0).applyMatrix4(newRotMatrix);
            const newPos = targetPoint.position.clone().sub(newRightOffset);

            bestSnap = {
                snapped: true,
                position: newPos,
                rotation: alignedRotation,
                connectionPoint: {
                    id: 'ghost-right',
                    objectId: 'ghost',
                    position: ghostEnd2World,
                    direction: new THREE.Vector3(1, 0, 0).applyMatrix4(rotMatrix).normalize(),
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
 * Now properly handles all 3D orientations
 */
function calculateAlignmentRotation(
    targetDirection: THREE.Vector3,
    whichEnd: 'left' | 'right',
    currentRotation: THREE.Euler
): THREE.Euler {
    // Normalize target direction
    const targetDir = targetDirection.clone().normalize();

    // Determine which axis the truss should align with
    // The truss extends along its local X axis

    // For snapping:
    // - left (local -X) should point OPPOSITE to target direction
    // - right (local +X) should point SAME as target direction

    let alignDir: THREE.Vector3;
    if (whichEnd === 'left') {
        // Our left (-X) meets target, so our +X should point opposite to target
        alignDir = targetDir.clone().negate();
    } else {
        // Our right (+X) meets target, so our +X should point opposite to target
        alignDir = targetDir.clone().negate();
    }

    // Check if target direction is primarily vertical (Y axis)
    const isVertical = Math.abs(targetDir.y) > 0.7;

    if (isVertical) {
        // Vertical alignment - rotate around Z axis
        // If target points up (+Y), we need Z rotation of -90° (for right) or +90° (for left)
        // If target points down (-Y), opposite
        const sign = targetDir.y > 0 ? 1 : -1;
        const zRot = whichEnd === 'left' ? sign * Math.PI / 2 : -sign * Math.PI / 2;
        return new THREE.Euler(0, 0, zRot);
    } else {
        // Horizontal alignment - rotate around Y axis
        const angle = Math.atan2(alignDir.z, alignDir.x);
        return new THREE.Euler(0, -angle, 0);
    }
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
    const suggestedLengths = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0]; // Standard truss lengths

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
    availableLengths: number[] = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0]
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

/**
 * Snap position to ground (Y = 0 + half object height)
 */
export function snapToGround(
    position: THREE.Vector3,
    dimensions: { w: number; h: number; d: number },
    rotation: THREE.Euler
): THREE.Vector3 {
    // Calculate the lowest point of the object based on rotation
    const rotMatrix = new THREE.Matrix4().makeRotationFromEuler(rotation);

    // Check all 8 corners of the bounding box
    const halfW = dimensions.w / 2;
    const halfH = dimensions.h / 2;
    const halfD = dimensions.d / 2;

    const corners = [
        new THREE.Vector3(-halfW, -halfH, -halfD),
        new THREE.Vector3(halfW, -halfH, -halfD),
        new THREE.Vector3(-halfW, halfH, -halfD),
        new THREE.Vector3(halfW, halfH, -halfD),
        new THREE.Vector3(-halfW, -halfH, halfD),
        new THREE.Vector3(halfW, -halfH, halfD),
        new THREE.Vector3(-halfW, halfH, halfD),
        new THREE.Vector3(halfW, halfH, halfD),
    ];

    // Find the lowest corner after rotation
    let minY = Infinity;
    for (const corner of corners) {
        corner.applyMatrix4(rotMatrix);
        if (corner.y < minY) {
            minY = corner.y;
        }
    }

    // Adjust Y position so the lowest point is at Y=0
    const newPos = position.clone();
    newPos.y = position.y - minY;

    // Ensure Y is not negative (minimum Y = 0)
    if (newPos.y < 0) newPos.y = 0;

    return newPos;
}

/**
 * Check if an object is below ground level
 */
export function isObjectBelowGround(
    position: THREE.Vector3,
    dimensions: { w: number; h: number; d: number },
    rotation: THREE.Euler
): { belowGround: boolean; lowestPoint: number } {
    const rotMatrix = new THREE.Matrix4().makeRotationFromEuler(rotation);

    const halfW = dimensions.w / 2;
    const halfH = dimensions.h / 2;
    const halfD = dimensions.d / 2;

    const corners = [
        new THREE.Vector3(-halfW, -halfH, -halfD),
        new THREE.Vector3(halfW, -halfH, -halfD),
        new THREE.Vector3(-halfW, halfH, -halfD),
        new THREE.Vector3(halfW, halfH, -halfD),
        new THREE.Vector3(-halfW, -halfH, halfD),
        new THREE.Vector3(halfW, -halfH, halfD),
        new THREE.Vector3(-halfW, halfH, halfD),
        new THREE.Vector3(halfW, halfH, halfD),
    ];

    let minY = Infinity;
    for (const corner of corners) {
        corner.applyMatrix4(rotMatrix);
        const worldY = position.y + corner.y;
        if (worldY < minY) {
            minY = worldY;
        }
    }

    return {
        belowGround: minY < -0.001, // Small tolerance
        lowestPoint: minY
    };
}
