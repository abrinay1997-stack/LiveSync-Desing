/**
 * Unit Tests for Room Reflections
 */

import { Vector3, Plane } from 'three';
import {
    createDefaultRoom,
    calculateReflection,
    calculateAllReflections,
    getAbsorptionCoefficient,
    estimateReverbTime,
    combineDirectAndReflectedSPL,
    type ReflectionSurface,
    type MaterialType
} from '../reflections';

describe('Room Reflections - Surface Creation', () => {
    test('creates default room with 6 surfaces', () => {
        const room = createDefaultRoom();
        expect(room.length).toBe(6); // floor + ceiling + 4 walls
    });

    test('floor surface has correct orientation', () => {
        const room = createDefaultRoom();
        const floor = room.find(s => s.id === 'floor');

        expect(floor).toBeDefined();
        expect(floor?.plane.normal.y).toBe(1); // Points up
    });

    test('materials are correctly assigned', () => {
        const room = createDefaultRoom(40, 40, 10, 'carpet', 'wood', 'concrete');

        const floor = room.find(s => s.id === 'floor');
        const wall = room.find(s => s.id === 'wall-front');
        const ceiling = room.find(s => s.id === 'ceiling');

        expect(floor?.material).toBe('carpet');
        expect(wall?.material).toBe('wood');
        expect(ceiling?.material).toBe('concrete');
    });
});

describe('Room Reflections - Absorption Coefficients', () => {
    test('carpet absorbs more at high frequencies', () => {
        const abs125 = getAbsorptionCoefficient('carpet', 125);
        const abs4k = getAbsorptionCoefficient('carpet', 4000);

        expect(abs4k).toBeGreaterThan(abs125);
    });

    test('concrete has low absorption', () => {
        const abs = getAbsorptionCoefficient('concrete', 1000);
        expect(abs).toBeLessThan(0.1);
    });

    test('absorption coefficients are between 0 and 1', () => {
        const materials: MaterialType[] = ['concrete', 'wood', 'carpet', 'curtain', 'glass'];

        materials.forEach(material => {
            const abs = getAbsorptionCoefficient(material, 1000);
            expect(abs).toBeGreaterThanOrEqual(0);
            expect(abs).toBeLessThanOrEqual(1);
        });
    });
});

describe('Room Reflections - Mirror Image', () => {
    test('calculates floor reflection correctly', () => {
        const source = new Vector3(0, 5, 0); // 5m above floor
        const listener = new Vector3(10, 1.7, 0); // 10m away, ear height

        const room = createDefaultRoom();
        const floor = room.find(s => s.id === 'floor')!;

        const reflection = calculateReflection(source, listener, floor, 1000);

        expect(reflection).toBeDefined();
        expect(reflection?.mirrorSource.y).toBeCloseTo(-5); // Mirror below floor
    });

    test('reflection path is longer than direct path', () => {
        const source = new Vector3(0, 5, 0);
        const listener = new Vector3(10, 1.7, 0);

        const room = createDefaultRoom();
        const floor = room.find(s => s.id === 'floor')!;

        const reflection = calculateReflection(source, listener, floor, 1000);
        const directDistance = source.distanceTo(listener);

        expect(reflection?.totalPath).toBeGreaterThan(directDistance);
    });

    test('reflection has positive delay', () => {
        const source = new Vector3(0, 5, 0);
        const listener = new Vector3(10, 1.7, 0);

        const room = createDefaultRoom();
        const floor = room.find(s => s.id === 'floor')!;

        const reflection = calculateReflection(source, listener, floor, 1000);

        expect(reflection?.delay).toBeGreaterThan(0);
    });
});

describe('Room Reflections - Multi-Surface', () => {
    test('finds multiple reflections', () => {
        const source = new Vector3(0, 5, 0);
        const listener = new Vector3(5, 1.7, 5);

        const room = createDefaultRoom(20, 20, 10);
        const reflections = calculateAllReflections(source, listener, room, 1000, 50);

        // Should find at least floor and some walls
        expect(reflections.length).toBeGreaterThan(0);
    });

    test('reflections are sorted by delay', () => {
        const source = new Vector3(0, 5, 0);
        const listener = new Vector3(5, 1.7, 5);

        const room = createDefaultRoom();
        const reflections = calculateAllReflections(source, listener, room, 1000, 50);

        for (let i = 1; i < reflections.length; i++) {
            expect(reflections[i].delay).toBeGreaterThanOrEqual(reflections[i - 1].delay);
        }
    });

    test('filters reflections by max delay', () => {
        const source = new Vector3(0, 5, 0);
        const listener = new Vector3(5, 1.7, 5);

        const room = createDefaultRoom();
        const reflections = calculateAllReflections(source, listener, room, 1000, 10); // Only 10ms

        reflections.forEach(r => {
            expect(r.delay).toBeLessThanOrEqual(10);
        });
    });
});

describe('Room Reflections - SPL Combination', () => {
    test('reflected SPL increases total level', () => {
        const directSPL = 90;

        const mockReflection = {
            surfaceId: 'floor',
            mirrorSource: new Vector3(),
            reflectionPoint: new Vector3(),
            directPath: 5,
            reflectedPath: 5,
            totalPath: 10,
            delay: 5,
            attenuation: {
                125: 3, 250: 3, 500: 3, 1000: 3, 2000: 3, 4000: 3, 8000: 3
            }
        };

        const combined = combineDirectAndReflectedSPL(directSPL, [mockReflection], 1000);

        expect(combined).toBeGreaterThan(directSPL);
    });
});

describe('Room Reflections - Reverb Time', () => {
    test('larger rooms have longer reverb times', () => {
        const room = createDefaultRoom();

        const t60Small = estimateReverbTime(100, room, 1000); // 100 m³
        const t60Large = estimateReverbTime(1000, room, 1000); // 1000 m³

        expect(t60Large).toBeGreaterThan(t60Small);
    });

    test('reverb time is capped at 5 seconds', () => {
        const room = createDefaultRoom();
        const t60 = estimateReverbTime(10000, room, 1000);

        expect(t60).toBeLessThanOrEqual(5);
    });
});
