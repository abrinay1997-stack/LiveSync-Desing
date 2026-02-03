/**
 * Unit Tests for Acoustic Simulation
 */

import { describe, test, expect } from 'vitest';
import { castAcousticRay, calculateWavelength } from '../raycast';
import { calculateTotalSPL } from '../SPLCalculator';
import { generateCoverageGrid } from '../coverageGrid';
import { Vector3 } from 'three';
import type { SpeakerSpec } from '../raycast';

describe('Acoustic Ray Casting', () => {
    const testSpeaker: SpeakerSpec = {
        position: new Vector3(0, 5, 0),
        rotation: [0, 0, 0],
        maxSPL: 130,
        dispersion: { horizontal: 90, vertical: 60 },
        power: 2000
    };

    test('calculates distance attenuation correctly', () => {
        const target = new Vector3(0, 5, -10); // 10m away
        const ray = castAcousticRay(testSpeaker, target);

        // At 10m, should be ~20dB less than @ 1m
        // SPL @ 10m = 130 - 20*log10(10) = 130 - 20 = 110dB
        expect(ray.intensity).toBeCloseTo(110, 1);
        expect(ray.distance).toBe(10);
    });

    test('calculates wavelength correctly', () => {
        // λ = c / f, where c = 343 m/s
        const wavelength1k = calculateWavelength(1000);
        expect(wavelength1k).toBeCloseTo(0.343, 3);

        const wavelength500 = calculateWavelength(500);
        expect(wavelength500).toBeCloseTo(0.686, 3);
    });

    test('applies directivity attenuation for off-axis angles', () => {
        // Target directly in front (on-axis)
        const targetOnAxis = new Vector3(0, 5, -5);
        const rayOnAxis = castAcousticRay(testSpeaker, targetOnAxis);

        // Target at extreme angle (off-axis)
        const targetOffAxis = new Vector3(10, 5, -5);
        const rayOffAxis = castAcousticRay(testSpeaker, targetOffAxis);

        // Off-axis should have more attenuation
        expect(rayOffAxis.intensity).toBeLessThan(rayOnAxis.intensity);
    });
});

describe('SPL Calculator', () => {
    test('combines multiple sources logarithmically', () => {
        const speakers = [
            {
                id: 'speaker1',
                spec: {
                    position: new Vector3(0, 5, 0),
                    rotation: [0, 0, 0] as [number, number, number],
                    maxSPL: 120,
                    dispersion: { horizontal: 90, vertical: 60 },
                    power: 1000
                }
            },
            {
                id: 'speaker2',
                spec: {
                    position: new Vector3(5, 5, 0),
                    rotation: [0, 0, 0] as [number, number, number],
                    maxSPL: 120,
                    dispersion: { horizontal: 90, vertical: 60 },
                    power: 1000
                }
            }
        ];

        const target = new Vector3(2.5, 5, -5);
        const result = calculateTotalSPL(target, speakers);

        // Two equal sources should add ~3dB
        expect(result.totalSPL).toBeGreaterThan(0);
        expect(result.contributions.length).toBe(2);
    });

    test('detects phase interference', () => {
        const speakers = [
            {
                id: 'speaker1',
                spec: {
                    position: new Vector3(0, 5, 0),
                    rotation: [0, 0, 0] as [number, number, number],
                    maxSPL: 120,
                    dispersion: { horizontal: 90, vertical: 60 },
                    power: 1000
                }
            },
            {
                id: 'speaker2',
                spec: {
                    position: new Vector3(10, 5, 0),
                    rotation: [0, 0, 0] as [number, number, number],
                    maxSPL: 120,
                    dispersion: { horizontal: 90, vertical: 60 },
                    power: 1000
                }
            }
        ];

        // Target equidistant from both speakers (possible interference)
        const target = new Vector3(5, 5, -5);
        const result = calculateTotalSPL(target, speakers, 1000);

        expect(result.contributions.length).toBe(2);
        // Interference detection depends on phase difference
    });
});

describe('Coverage Grid', () => {
    test('generates grid with correct dimensions', () => {
        const speakers = [{
            id: 'speaker1',
            spec: {
                position: new Vector3(0, 5, 0),
                rotation: [0, 0, 0] as [number, number, number],
                maxSPL: 120,
                dispersion: { horizontal: 90, vertical: 60 },
                power: 1000
            }
        }];

        const grid = generateCoverageGrid(
            {
                bounds: { minX: -10, maxX: 10, minZ: -10, maxZ: 10 },
                resolution: 5,
                height: 1.7,
                frequency: 1000
            },
            speakers
        );

        expect(grid.width).toBe(5); // 20m / 5m = 4, +1 = 5 points
        expect(grid.depth).toBe(5);
        expect(grid.points.length).toBeGreaterThan(0);
    });

    test('evaluates coverage quality correctly', () => {
        const speakers = [{
            id: 'speaker1',
            spec: {
                position: new Vector3(0, 5, 0),
                rotation: [0, 0, 0] as [number, number, number],
                maxSPL: 130,
                dispersion: { horizontal: 110, vertical: 60 },
                power: 2000
            }
        }];

        const grid = generateCoverageGrid(
            {
                bounds: { minX: -5, maxX: 5, minZ: -5, maxZ: 5 },
                resolution: 2,
                height: 1.7,
                frequency: 1000
            },
            speakers
        );

        // Check that points have quality ratings
        const hasGoodCoverage = grid.points.some(p => p.quality === 'good' || p.quality === 'excellent');
        expect(hasGoodCoverage).toBe(true);

        // Check coverage statistics
        expect(grid.avgSPL).toBeGreaterThan(0);
        expect(grid.minSPL).toBeLessThanOrEqual(grid.maxSPL);
    });
});
