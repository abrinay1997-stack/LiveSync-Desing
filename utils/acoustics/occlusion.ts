/**
 * Obstacle Occlusion Module
 * 
 * Ray blocking detection using bounding boxes
 * Fresnel zone calculation for diffraction
 */

import { Vector3, Box3, Ray } from 'three';
import type { OctaveBand } from './frequencyAnalysis';

export type ObstacleType = 'stage' | 'truss' | 'scenery' | 'wall' | 'other';

export interface Obstacle {
    id: string;
    type: ObstacleType;
    bounds: Box3;              // Bounding box
    position: Vector3;
    dimensions: Vector3;       // Width, height, depth
}

export interface OcclusionResult {
    isOccluded: boolean;
    attenuationDB: number;     // Total attenuation in dB
    diffractionPossible: boolean;
    fresnelZoneBlocked: number; // 0 = no block, 1 = full block
    shadowType: 'none' | 'partial' | 'full';
}

/**
 * Create obstacle from scene object
 */
export function createObstacle(
    id: string,
    type: ObstacleType,
    position: [number, number, number],
    dimensions: { w: number; h: number; d: number }
): Obstacle {
    const pos = new Vector3(...position);
    const dims = new Vector3(dimensions.w, dimensions.h, dimensions.d);

    // Create bounding box centered on position
    const halfDims = dims.clone().multiplyScalar(0.5);
    const min = pos.clone().sub(halfDims);
    const max = pos.clone().add(halfDims);

    return {
        id,
        type,
        bounds: new Box3(min, max),
        position: pos,
        dimensions: dims
    };
}

/**
 * Check if ray intersects bounding box
 */
function rayIntersectsBox(
    rayOrigin: Vector3,
    rayDirection: Vector3,
    box: Box3
): { intersects: boolean; distance: number } {
    const ray = new Ray(rayOrigin, rayDirection);
    const intersection = ray.intersectBox(box, new Vector3());

    if (intersection) {
        const distance = rayOrigin.distanceTo(intersection);
        return { intersects: true, distance };
    }

    return { intersects: false, distance: Infinity };
}

/**
 * Calculate Fresnel zone radius at a point
 * 
 * The first Fresnel zone is the area where phase difference is < 90°
 */
export function calculateFresnelRadius(
    source: Vector3,
    listener: Vector3,
    obstaclePoint: Vector3,
    frequency: number
): number {
    const wavelength = 343 / frequency; // c / f

    const d1 = source.distanceTo(obstaclePoint);
    const d2 = obstaclePoint.distanceTo(listener);
    const totalDist = d1 + d2;

    if (totalDist === 0) return 0;

    // First Fresnel zone radius: r = √(λ × d1 × d2 / (d1 + d2))
    const radius = Math.sqrt((wavelength * d1 * d2) / totalDist);

    return radius;
}

/**
 * Calculate occlusion for a single obstacle
 */
export function checkOcclusion(
    source: Vector3,
    listener: Vector3,
    obstacle: Obstacle,
    frequency: OctaveBand = 1000
): OcclusionResult {
    // Direction from source to listener
    const direction = new Vector3().subVectors(listener, source).normalize();
    const totalDistance = source.distanceTo(listener);

    // Check if ray intersects obstacle bounding box
    const intersection = rayIntersectsBox(source, direction, obstacle.bounds);

    if (!intersection.intersects) {
        return {
            isOccluded: false,
            attenuationDB: 0,
            diffractionPossible: false,
            fresnelZoneBlocked: 0,
            shadowType: 'none'
        };
    }

    // Ray intersects - check if obstacle is between source and listener
    if (intersection.distance > totalDistance) {
        return {
            isOccluded: false,
            attenuationDB: 0,
            diffractionPossible: false,
            fresnelZoneBlocked: 0,
            shadowType: 'none'
        };
    }

    // Calculate intersection point
    const intersectionPoint = source.clone().add(
        direction.clone().multiplyScalar(intersection.distance)
    );

    // Calculate Fresnel zone radius at intersection
    const fresnelRadius = calculateFresnelRadius(source, listener, intersectionPoint, frequency);

    // Estimate how much of Fresnel zone is blocked
    // Simplified: compare obstacle size to fresnel radius
    const obstacleRadius = Math.min(obstacle.dimensions.x, obstacle.dimensions.y) / 2;
    const fresnelBlocked = Math.min(1, obstacleRadius / fresnelRadius);

    // Determine shadow type and attenuation
    let shadowType: 'none' | 'partial' | 'full';
    let attenuation: number;
    let diffractionPossible: boolean;

    if (fresnelBlocked > 0.9) {
        // Full shadow - obstacle blocks entire Fresnel zone
        shadowType = 'full';
        attenuation = 20; // -20dB to -∞dB
        diffractionPossible = false;
    } else if (fresnelBlocked > 0.3) {
        // Partial shadow - significant blocking
        shadowType = 'partial';
        attenuation = 6 + (fresnelBlocked * 14); // -6dB to -20dB
        diffractionPossible = true;
    } else {
        // Edge of shadow - minor blocking, diffraction dominant
        shadowType = 'partial';
        attenuation = fresnelBlocked * 6; // 0dB to -6dB
        diffractionPossible = true;
    }

    return {
        isOccluded: true,
        attenuationDB: attenuation,
        diffractionPossible,
        fresnelZoneBlocked: fresnelBlocked,
        shadowType
    };
}

/**
 * Check occlusion against multiple obstacles
 * Returns the worst-case occlusion
 */
export function checkMultipleObstacles(
    source: Vector3,
    listener: Vector3,
    obstacles: Obstacle[],
    frequency: OctaveBand = 1000
): OcclusionResult {
    let worstOcclusion: OcclusionResult = {
        isOccluded: false,
        attenuationDB: 0,
        diffractionPossible: false,
        fresnelZoneBlocked: 0,
        shadowType: 'none'
    };

    obstacles.forEach(obstacle => {
        const result = checkOcclusion(source, listener, obstacle, frequency);

        if (result.attenuationDB > worstOcclusion.attenuationDB) {
            worstOcclusion = result;
        }
    });

    return worstOcclusion;
}

/**
 * Apply occlusion attenuation to SPL
 */
export function applyOcclusion(
    baseSPL: number,
    occlusion: OcclusionResult
): number {
    if (!occlusion.isOccluded) {
        return baseSPL;
    }

    return Math.max(0, baseSPL - occlusion.attenuationDB);
}

/**
 * Get attenuation factor for frequency (higher freq = more attenuation)
 */
export function getFrequencyDependentOcclusion(
    baseAttenuation: number,
    frequency: OctaveBand
): number {
    // High frequencies are blocked more than low frequencies
    const freqFactor: Record<OctaveBand, number> = {
        125: 0.5,   // Low freq - significant diffraction
        250: 0.6,
        500: 0.7,
        1000: 1.0,  // Reference
        2000: 1.2,
        4000: 1.4,
        8000: 1.6   // High freq - minimal diffraction
    };

    return baseAttenuation * freqFactor[frequency];
}

/**
 * Find shadow zones in a coverage area
 */
export function findShadowZones(
    sources: Vector3[],
    measurementPoints: Vector3[],
    obstacles: Obstacle[],
    frequency: OctaveBand = 1000
): Array<{ point: Vector3; shadowLevel: number }> {
    const shadowZones: Array<{ point: Vector3; shadowLevel: number }> = [];

    measurementPoints.forEach(point => {
        let maxShadow = 0;

        sources.forEach(source => {
            const occlusion = checkMultipleObstacles(source, point, obstacles, frequency);
            maxShadow = Math.max(maxShadow, occlusion.fresnelZoneBlocked);
        });

        if (maxShadow > 0.3) {
            shadowZones.push({
                point: point.clone(),
                shadowLevel: maxShadow
            });
        }
    });

    return shadowZones;
}

/**
 * Check line-of-sight (simplified occlusion check)
 */
export function hasLineOfSight(
    source: Vector3,
    listener: Vector3,
    obstacles: Obstacle[]
): boolean {
    const direction = new Vector3().subVectors(listener, source).normalize();
    const totalDistance = source.distanceTo(listener);

    for (const obstacle of obstacles) {
        const intersection = rayIntersectsBox(source, direction, obstacle.bounds);

        if (intersection.intersects && intersection.distance < totalDistance) {
            return false;
        }
    }

    return true;
}
