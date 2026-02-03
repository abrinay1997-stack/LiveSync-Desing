/**
 * Unit Tests for Obstacle Occlusion
 */

import { describe, test, expect } from 'vitest';
import { Vector3, Box3 } from 'three';
import {
    createObstacle,
    calculateFresnelRadius,
    checkOcclusion,
    checkMultipleObstacles,
    applyOcclusion,
    getFrequencyDependentOcclusion,
    hasLineOfSight
} from '../occlusion';

describe('Obstacle Occlusion - Creation', () => {
    test('creates obstacle with correct bounding box', () => {
        const obstacle = createObstacle(
            'stage1',
            'stage',
            [0, 0, 0],
            { w: 10, h: 2, d: 8 }
        );

        expect(obstacle.id).toBe('stage1');
        expect(obstacle.type).toBe('stage');
        expect(obstacle.dimensions.x).toBe(10);
    });

    test('bounding box is centered on position', () => {
        const obstacle = createObstacle(
            'box1',
            'scenery',
            [5, 3, 2],
            { w: 2, h: 2, d: 2 }
        );

        const center = new Vector3();
        obstacle.bounds.getCenter(center);

        expect(center.x).toBeCloseTo(5);
        expect(center.y).toBeCloseTo(3);
        expect(center.z).toBeCloseTo(2);
    });
});

describe('Obstacle Occlusion - Fresnel Zone', () => {
    test('calculates Fresnel radius', () => {
        const source = new Vector3(0, 5, 0);
        const listener = new Vector3(20, 1.7, 0);
        const obstaclePoint = new Vector3(10, 3, 0); // Midpoint

        const radius = calculateFresnelRadius(source, listener, obstaclePoint, 1000);

        expect(radius).toBeGreaterThan(0);
    });

    test('Fresnel radius increases at lower frequencies', () => {
        const source = new Vector3(0, 5, 0);
        const listener = new Vector3(20, 1.7, 0);
        const obstaclePoint = new Vector3(10, 3, 0);

        const radius125 = calculateFresnelRadius(source, listener, obstaclePoint, 125);
        const radius4k = calculateFresnelRadius(source, listener, obstaclePoint, 4000);

        expect(radius125).toBeGreaterThan(radius4k);
    });
});

describe('Obstacle Occlusion - Detection', () => {
    test('detects occlusion when obstacle is in path', () => {
        const source = new Vector3(0, 5, 0);
        const listener = new Vector3(20, 1.7, 0);

        const obstacle = createObstacle(
            'wall1',
            'wall',
            [10, 3, 0],
            { w: 10, h: 6, d: 0.3 }
        );

        const result = checkOcclusion(source, listener, obstacle, 1000);

        expect(result.isOccluded).toBe(true);
        expect(result.attenuationDB).toBeGreaterThan(0);
    });

    test('no occlusion when obstacle is not in path', () => {
        const source = new Vector3(0, 5, 0);
        const listener = new Vector3(20, 1.7, 0);

        const obstacle = createObstacle(
            'box1',
            'scenery',
            [10, 3, 10], // Off to the side
            { w: 2, h: 2, d: 2 }
        );

        const result = checkOcclusion(source, listener, obstacle, 1000);

        expect(result.isOccluded).toBe(false);
        expect(result.attenuationDB).toBe(0);
    });

    test('full shadow has high attenuation', () => {
        const source = new Vector3(0, 5, 0);
        const listener = new Vector3(20, 1.7, 0);

        const obstacle = createObstacle(
            'wall1',
            'wall',
            [10, 3, 0],
            { w: 20, h: 10, d: 0.5 } // Large obstacle
        );

        const result = checkOcclusion(source, listener, obstacle, 1000);

        expect(result.shadowType).toBe('full');
        expect(result.attenuationDB).toBeGreaterThan(15);
    });

    test('partial shadow allows diffraction', () => {
        const source = new Vector3(0, 5, 0);
        const listener = new Vector3(20, 1.7, 0);

        const obstacle = createObstacle(
            'pole1',
            'other',
            [10, 3, 0],
            { w: 0.3, h: 3, d: 0.3 } // Thin obstacle
        );

        const result = checkOcclusion(source, listener, obstacle, 1000);

        if (result.isOccluded) {
            expect(result.diffractionPossible).toBe(true);
            expect(result.shadowType).not.toBe('full');
        }
    });
});

describe('Obstacle Occlusion - Multiple Obstacles', () => {
    test('returns worst-case occlusion', () => {
        const source = new Vector3(0, 5, 0);
        const listener = new Vector3(20, 1.7, 0);

        const obstacle1 = createObstacle('o1', 'scenery', [5, 3, 0], { w: 1, h: 1, d: 1 });
        const obstacle2 = createObstacle('o2', 'wall', [15, 3, 0], { w: 10, h: 6, d: 0.5 });

        const result = checkMultipleObstacles(source, listener, [obstacle1, obstacle2], 1000);

        // Should return the wall's occlusion (worse)
        expect(result.attenuationDB).toBeGreaterThan(0);
    });
});

describe('Obstacle Occlusion - Frequency Dependence', () => {
    test('high frequencies have more attenuation', () => {
        const baseAttenuation = 10;

        const atten125 = getFrequencyDependentOcclusion(baseAttenuation, 125);
        const atten8k = getFrequencyDependentOcclusion(baseAttenuation, 8000);

        expect(atten8k).toBeGreaterThan(atten125);
    });

    test('1kHz is reference frequency', () => {
        const baseAttenuation = 10;

        const atten1k = getFrequencyDependentOcclusion(baseAttenuation, 1000);

        expect(atten1k).toBe(baseAttenuation);
    });
});

describe('Obstacle Occlusion - SPL Application', () => {
    test('reduces SPL when occluded', () => {
        const baseSPL = 100;
        const occlusion = {
            isOccluded: true,
            attenuationDB: 10,
            diffractionPossible: true,
            fresnelZoneBlocked: 0.5,
            shadowType: 'partial' as const
        };

        const resultSPL = applyOcclusion(baseSPL, occlusion);

        expect(resultSPL).toBe(90);
    });

    test('no change when not occluded', () => {
        const baseSPL = 100;
        const occlusion = {
            isOccluded: false,
            attenuationDB: 0,
            diffractionPossible: false,
            fresnelZoneBlocked: 0,
            shadowType: 'none' as const
        };

        const resultSPL = applyOcclusion(baseSPL, occlusion);

        expect(resultSPL).toBe(100);
    });
});

describe('Obstacle Occlusion - Line of Sight', () => {
    test('has line of sight with no obstacles', () => {
        const source = new Vector3(0, 5, 0);
        const listener = new Vector3(20, 1.7, 0);

        const hasLOS = hasLineOfSight(source, listener, []);

        expect(hasLOS).toBe(true);
    });

    test('no line of sight with obstacle in path', () => {
        const source = new Vector3(0, 5, 0);
        const listener = new Vector3(20, 1.7, 0);

        const obstacle = createObstacle('wall', 'wall', [10, 3, 0], { w: 10, h: 6, d: 0.5 });

        const hasLOS = hasLineOfSight(source, listener, [obstacle]);

        expect(hasLOS).toBe(false);
    });
});
