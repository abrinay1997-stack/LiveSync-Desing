/**
 * Geometric Analysis for Rigging
 * 
 * Calculates real cable angles and tension vectors based on 3D positions
 */

import { Vector3 } from 'three';

export interface Point3D {
    x: number;
    y: number;
    z: number;
}

export interface TensionVector {
    magnitude: number;        // Newtons
    direction: Vector3;       // Normalized direction
    angle: number;            // Degrees from vertical
    horizontalComponent: number;
    verticalComponent: number;
}

/**
 * Calculate angle between two 3D points relative to vertical (Y-axis)
 */
export function calculateAngleFromVertical(
    point1: Point3D,
    point2: Point3D
): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const dz = point2.z - point1.z;

    const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
    const angleRad = Math.atan2(horizontalDistance, Math.abs(dy));

    return (angleRad * 180) / Math.PI; // Convert to degrees
}

/**
 * Calculate tension vector from rigging point to load
 */
export function calculateTensionVector(
    riggingPoint: Point3D,
    loadPoint: Point3D,
    loadWeight: number, // kg
    numAttachments: number = 1
): TensionVector {
    const GRAVITY = 9.81; // m/s²

    // Direction vector from load to rigging point
    const dx = riggingPoint.x - loadPoint.x;
    const dy = riggingPoint.y - loadPoint.y;
    const dz = riggingPoint.z - loadPoint.z;

    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Normalized direction
    const direction = new Vector3(
        dx / distance,
        dy / distance,
        dz / distance
    );

    // Angle from vertical
    const angle = calculateAngleFromVertical(loadPoint, riggingPoint);

    // Force calculation
    // For multiple attachment points, assume equal distribution
    const forcePerCable = (loadWeight / numAttachments) * GRAVITY;

    // The tension must support the weight component
    // T * cos(angle) = Weight/n
    // T = Weight / (n * cos(angle))
    const angleRad = (angle * Math.PI) / 180;
    const magnitude = forcePerCable / Math.cos(angleRad);

    const verticalComponent = magnitude * Math.cos(angleRad);
    const horizontalComponent = magnitude * Math.sin(angleRad);

    return {
        magnitude,
        direction,
        angle,
        verticalComponent,
        horizontalComponent
    };
}

/**
 * Calculate resultant force on a rigging point from multiple loads
 */
export function calculateResultantForce(
    riggingPoint: Point3D,
    loads: Array<{ position: Point3D; weight: number }>
): {
    totalForce: number;
    direction: Vector3;
    tensionVectors: TensionVector[];
} {
    const tensionVectors: TensionVector[] = [];
    const resultant = new Vector3(0, 0, 0);

    loads.forEach(load => {
        const tension = calculateTensionVector(
            riggingPoint,
            load.position,
            load.weight,
            1
        );

        tensionVectors.push(tension);

        // Add to resultant (vector addition)
        const force = tension.direction.clone().multiplyScalar(tension.magnitude);
        resultant.add(force);
    });

    const totalForce = resultant.length();
    const direction = resultant.clone().normalize();

    return {
        totalForce,
        direction,
        tensionVectors
    };
}

/**
 * Check if angle is within safe limits (BGV-C1)
 * Angles > 45° from vertical significantly increase tension
 */
export function validateRiggingAngle(angle: number): {
    safe: boolean;
    warning?: string;
} {
    if (angle > 60) {
        return {
            safe: false,
            warning: `Critical angle: ${angle.toFixed(1)}° (>60° from vertical)`
        };
    }

    if (angle > 45) {
        return {
            safe: true,
            warning: `Steep angle: ${angle.toFixed(1)}° increases tension by ${(1 / Math.cos(angle * Math.PI / 180)).toFixed(2)}x`
        };
    }

    return { safe: true };
}
