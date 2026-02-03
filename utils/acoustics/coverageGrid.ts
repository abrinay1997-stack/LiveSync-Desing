/**
 * Coverage Grid Generator
 * 
 * Creates a 2D grid of measurement points and calculates SPL at each
 */

import { Vector3 } from 'three';
import type { SpeakerSpec } from './raycast';
import { calculateTotalSPL, type SPLResult } from './SPLCalculator';

export interface CoveragePoint {
    position: Vector3;
    spl: number;
    splResult: SPLResult;
    quality: 'poor' | 'acceptable' | 'good' | 'excellent' | 'excessive';
    color: string;
}

export interface CoverageGridParams {
    bounds: {
        minX: number;
        maxX: number;
        minZ: number;
        maxZ: number;
    };
    resolution: number;  // meters between points
    height: number;      // Y coordinate (measurement height)
    frequency: number;   // Hz for calculations
    showReflections?: boolean;
    showOcclusion?: boolean;
}

export interface CoverageGrid {
    points: CoveragePoint[];
    width: number;        // number of points in X
    depth: number;        // number of points in Z
    avgSPL: number;
    minSPL: number;
    maxSPL: number;
    coverage: {
        poor: number;     // percentage
        acceptable: number;
        good: number;
        excellent: number;
        excessive: number;
    };
}

/**
 * Generate coverage grid for acoustic analysis
 */
export function generateCoverageGrid(
    params: CoverageGridParams,
    speakers: Array<{ id: string; spec: SpeakerSpec }>
): CoverageGrid {
    const { bounds, resolution, height, frequency } = params;
    const points: CoveragePoint[] = [];

    let totalSPL = 0;
    let minSPL = Infinity;
    let maxSPL = -Infinity;

    const coverageCounts = {
        poor: 0,
        acceptable: 0,
        good: 0,
        excellent: 0,
        excessive: 0
    };

    // Generate grid points
    const width = Math.ceil((bounds.maxX - bounds.minX) / resolution);
    const depth = Math.ceil((bounds.maxZ - bounds.minZ) / resolution);

    for (let x = 0; x <= width; x++) {
        for (let z = 0; z <= depth; z++) {
            const position = new Vector3(
                bounds.minX + x * resolution,
                height,
                bounds.minZ + z * resolution
            );

            // Calculate SPL at this point
            const splResult = calculateTotalSPL(position, speakers, frequency, {
                showReflections: params.showReflections,
                showOcclusion: params.showOcclusion
            });
            const spl = splResult.totalSPL;

            // Evaluate quality
            const { quality, color } = evaluateCoverageQuality(spl);

            points.push({
                position,
                spl,
                splResult,
                quality,
                color
            });

            totalSPL += spl;
            minSPL = Math.min(minSPL, spl);
            maxSPL = Math.max(maxSPL, spl);
            coverageCounts[quality]++;
        }
    }

    const totalPoints = points.length;
    const avgSPL = totalSPL / totalPoints;

    // Calculate coverage percentages
    const coverage = {
        poor: (coverageCounts.poor / totalPoints) * 100,
        acceptable: (coverageCounts.acceptable / totalPoints) * 100,
        good: (coverageCounts.good / totalPoints) * 100,
        excellent: (coverageCounts.excellent / totalPoints) * 100,
        excessive: (coverageCounts.excessive / totalPoints) * 100
    };

    return {
        points,
        width: width + 1,
        depth: depth + 1,
        avgSPL,
        minSPL,
        maxSPL,
        coverage
    };
}

/**
 * Evaluate coverage quality based on SPL level
 */
function evaluateCoverageQuality(spl: number): {
    quality: 'poor' | 'acceptable' | 'good' | 'excellent' | 'excessive';
    color: string;
} {
    if (spl < 85) {
        return { quality: 'poor', color: '#ef4444' };
    } else if (spl < 90) {
        return { quality: 'acceptable', color: '#f59e0b' };
    } else if (spl < 100) {
        return { quality: 'good', color: '#22c55e' };
    } else if (spl < 105) {
        return { quality: 'excellent', color: '#10b981' };
    } else {
        return { quality: 'excessive', color: '#dc2626' };
    }
}

/**
 * Find areas with phase issues (interference zones)
 */
export function findInterferenceZones(grid: CoverageGrid): CoveragePoint[] {
    return grid.points.filter(point => point.splResult.hasInterference);
}

/**
 * Generate simplified grid (fewer points for performance)
 */
export function generateQuickGrid(
    params: CoverageGridParams,
    speakers: Array<{ id: string; spec: SpeakerSpec }>
): CoverageGrid {
    // Double the resolution for faster calculation
    const quickParams = {
        ...params,
        resolution: params.resolution * 2
    };

    return generateCoverageGrid(quickParams, speakers);
}

/**
 * Export grid data for analysis
 */
export function exportGridData(grid: CoverageGrid): string {
    const data = grid.points.map(p => ({
        x: p.position.x.toFixed(2),
        y: p.position.y.toFixed(2),
        z: p.position.z.toFixed(2),
        spl: p.spl.toFixed(1),
        quality: p.quality
    }));

    return JSON.stringify({
        metadata: {
            width: grid.width,
            depth: grid.depth,
            avgSPL: grid.avgSPL.toFixed(1),
            minSPL: grid.minSPL.toFixed(1),
            maxSPL: grid.maxSPL.toFixed(1),
            coverage: grid.coverage
        },
        points: data
    }, null, 2);
}
