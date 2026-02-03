/**
 * Room Reflections Module
 * 
 * First-order reflections using mirror image method
 * Frequency-dependent absorption coefficients
 */

import { Vector3, Plane } from 'three';
import type { OctaveBand } from './frequencyAnalysis';

export type SurfaceType = 'floor' | 'wall' | 'ceiling';
export type MaterialType = 'concrete' | 'wood' | 'carpet' | 'curtain' | 'glass';

// Absorption coefficients per frequency and material
// Values from acoustic databases (0 = total reflection, 1 = total absorption)
const ABSORPTION_COEFFICIENTS: Record<MaterialType, Record<OctaveBand, number>> = {
    concrete: {
        125: 0.01,
        250: 0.01,
        500: 0.02,
        1000: 0.02,
        2000: 0.02,
        4000: 0.03,
        8000: 0.03
    },
    wood: {
        125: 0.15,
        250: 0.11,
        500: 0.10,
        1000: 0.07,
        2000: 0.06,
        4000: 0.07,
        8000: 0.07
    },
    carpet: {
        125: 0.08,
        250: 0.24,
        500: 0.57,
        1000: 0.69,
        2000: 0.71,
        4000: 0.73,
        8000: 0.73
    },
    curtain: {
        125: 0.03,
        250: 0.04,
        500: 0.11,
        1000: 0.17,
        2000: 0.24,
        4000: 0.35,
        8000: 0.35
    },
    glass: {
        125: 0.35,
        250: 0.25,
        500: 0.18,
        1000: 0.12,
        2000: 0.07,
        4000: 0.04,
        8000: 0.04
    }
};

export interface ReflectionSurface {
    id: string;
    type: SurfaceType;
    plane: Plane;              // Surface plane
    material: MaterialType;
    absorptionCoefficients: Record<OctaveBand, number>;
}

export interface Reflection {
    surfaceId: string;
    mirrorSource: Vector3;     // Virtual speaker position
    reflectionPoint: Vector3;  // Point where sound hits surface
    directPath: number;        // Direct distance (source to point)
    reflectedPath: number;     // Reflected distance (point to listener)
    totalPath: number;         // Total path length
    delay: number;             // Time delay in ms
    attenuation: Record<OctaveBand, number>; // Frequency-dependent loss (dB)
}

/**
 * Create default room surfaces (simple rectangular room)
 */
export function createDefaultRoom(
    width: number = 40,
    depth: number = 40,
    height: number = 10,
    floorMaterial: MaterialType = 'concrete',
    wallMaterial: MaterialType = 'concrete',
    ceilingMaterial: MaterialType = 'concrete'
): ReflectionSurface[] {
    return [
        // Floor
        {
            id: 'floor',
            type: 'floor',
            plane: new Plane(new Vector3(0, 1, 0), 0), // Y = 0
            material: floorMaterial,
            absorptionCoefficients: ABSORPTION_COEFFICIENTS[floorMaterial]
        },
        // Ceiling
        {
            id: 'ceiling',
            type: 'ceiling',
            plane: new Plane(new Vector3(0, -1, 0), height), // Y = height
            material: ceilingMaterial,
            absorptionCoefficients: ABSORPTION_COEFFICIENTS[ceilingMaterial]
        },
        // Walls (4 sides)
        {
            id: 'wall-front',
            type: 'wall',
            plane: new Plane(new Vector3(0, 0, 1), depth / 2),
            material: wallMaterial,
            absorptionCoefficients: ABSORPTION_COEFFICIENTS[wallMaterial]
        },
        {
            id: 'wall-back',
            type: 'wall',
            plane: new Plane(new Vector3(0, 0, -1), depth / 2),
            material: wallMaterial,
            absorptionCoefficients: ABSORPTION_COEFFICIENTS[wallMaterial]
        },
        {
            id: 'wall-left',
            type: 'wall',
            plane: new Plane(new Vector3(1, 0, 0), width / 2),
            material: wallMaterial,
            absorptionCoefficients: ABSORPTION_COEFFICIENTS[wallMaterial]
        },
        {
            id: 'wall-right',
            type: 'wall',
            plane: new Plane(new Vector3(-1, 0, 0), width / 2),
            material: wallMaterial,
            absorptionCoefficients: ABSORPTION_COEFFICIENTS[wallMaterial]
        }
    ];
}

/**
 * Calculate mirror image of a point across a plane
 */
function mirrorPointAcrossPlane(point: Vector3, plane: Plane): Vector3 {
    const distance = plane.distanceToPoint(point);
    const mirrored = point.clone().add(
        plane.normal.clone().multiplyScalar(-2 * distance)
    );
    return mirrored;
}

/**
 * Find reflection point on surface
 */
function findReflectionPoint(
    source: Vector3,
    listener: Vector3,
    plane: Plane
): Vector3 | null {
    // Ray from source to listener
    const direction = new Vector3().subVectors(listener, source).normalize();

    // Calculate intersection with plane
    const denominator = plane.normal.dot(direction);

    if (Math.abs(denominator) < 0.0001) {
        return null; // Ray parallel to plane
    }

    const t = -(plane.normal.dot(source) + plane.constant) / denominator;

    if (t < 0) {
        return null; // Plane behind source
    }

    return source.clone().add(direction.multiplyScalar(t));
}

/**
 * Calculate first-order reflection from a surface
 */
export function calculateReflection(
    sourcePosition: Vector3,
    listenerPosition: Vector3,
    surface: ReflectionSurface,
    frequency: OctaveBand
): Reflection | null {
    // Create mirror image of source
    const mirrorSource = mirrorPointAcrossPlane(sourcePosition, surface.plane);

    // Find reflection point
    const reflectionPoint = findReflectionPoint(mirrorSource, listenerPosition, surface.plane);

    if (!reflectionPoint) {
        return null;
    }

    // Calculate path lengths
    const directPath = sourcePosition.distanceTo(reflectionPoint);
    const reflectedPath = reflectionPoint.distanceTo(listenerPosition);
    const totalPath = directPath + reflectedPath;

    // Calculate time delay (speed of sound = 343 m/s)
    const directDistance = sourcePosition.distanceTo(listenerPosition);
    const delay = ((totalPath - directDistance) / 343) * 1000; // ms

    // Calculate attenuation per frequency
    const attenuation: Partial<Record<OctaveBand, number>> = {};

    // Absorption loss
    const absorptionCoeff = surface.absorptionCoefficients[frequency];
    const reflectionLoss = -10 * Math.log10(1 - absorptionCoeff);

    attenuation[frequency] = reflectionLoss;

    return {
        surfaceId: surface.id,
        mirrorSource,
        reflectionPoint,
        directPath,
        reflectedPath,
        totalPath,
        delay,
        attenuation: attenuation as Record<OctaveBand, number>
    };
}

/**
 * Calculate all first-order reflections for a source-listener pair
 */
export function calculateAllReflections(
    sourcePosition: Vector3,
    listenerPosition: Vector3,
    surfaces: ReflectionSurface[],
    frequency: OctaveBand = 1000,
    maxDelay: number = 50 // ms (early reflections only)
): Reflection[] {
    const reflections: Reflection[] = [];

    for (const surface of surfaces) {
        const reflection = calculateReflection(
            sourcePosition,
            listenerPosition,
            surface,
            frequency
        );

        if (reflection && reflection.delay <= maxDelay) {
            reflections.push(reflection);
        }
    }

    return reflections.sort((a, b) => a.delay - b.delay);
}

/**
 * Get absorption coefficient for material and frequency
 */
export function getAbsorptionCoefficient(
    material: MaterialType,
    frequency: OctaveBand
): number {
    return ABSORPTION_COEFFICIENTS[material][frequency];
}

/**
 * Calculate reverb time estimate (T60) using Sabine equation
 * Simplified for basic room acoustics
 */
export function estimateReverbTime(
    roomVolume: number, // m³
    surfaces: ReflectionSurface[],
    frequency: OctaveBand
): number {
    // Calculate total absorption
    let totalAbsorption = 0;

    surfaces.forEach(surface => {
        // Estimate surface area (simplified)
        const area = 100; // Placeholder - would need actual surface dimensions
        const alpha = surface.absorptionCoefficients[frequency];
        totalAbsorption += area * alpha;
    });

    // Sabine equation: T60 = 0.161 * V / A
    // where V = volume (m³), A = total absorption (m² sabins)
    const t60 = totalAbsorption > 0 ? (0.161 * roomVolume) / totalAbsorption : 0;

    return Math.min(t60, 5); // Cap at 5 seconds
}

/**
 * Combine direct and reflected SPL
 */
export function combineDirectAndReflectedSPL(
    directSPL: number,
    reflections: Reflection[],
    frequency: OctaveBand
): number {
    // Convert direct SPL to linear
    let totalLinear = Math.pow(10, directSPL / 10);

    // Add reflected energy
    reflections.forEach(reflection => {
        const attenuation = reflection.attenuation[frequency] || 0;
        const reflectedSPL = directSPL - attenuation;

        if (reflectedSPL > 0) {
            totalLinear += Math.pow(10, reflectedSPL / 10);
        }
    });

    return 10 * Math.log10(totalLinear);
}
