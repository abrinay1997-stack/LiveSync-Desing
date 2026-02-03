/**
 * Additional Unit Tests for Geometric Analysis
 */

import { calculateAngleFromVertical, calculateTensionVector, validateRiggingAngle } from '../geometry';
import {
    calculateUniformLoadDeflection,
    calculatePointLoadDeflection,
    recommendTrussSize
} from '../deflection';

describe('Geometric Analysis', () => {
    test('calculates angle from vertical correctly', () => {
        // Vertical cable (0°)
        const angle1 = calculateAngleFromVertical(
            { x: 0, y: 10, z: 0 },
            { x: 0, y: 5, z: 0 }
        );
        expect(angle1).toBe(0);

        // 45° cable
        const angle2 = calculateAngleFromVertical(
            { x: 0, y: 10, z: 0 },
            { x: 5, y: 5, z: 0 }
        );
        expect(angle2).toBeCloseTo(45, 1);

        // 60° cable
        const angle3 = calculateAngleFromVertical(
            { x: 0, y: 10, z: 0 },
            { x: 8.66, y: 5, z: 0 }
        );
        expect(angle3).toBeCloseTo(60, 1);
    });

    test('calculates tension with angle correction', () => {
        const weight = 100; // kg

        // Vertical: T = W × g
        const tension1 = calculateTensionVector(
            { x: 0, y: 10, z: 0 },
            { x: 0, y: 5, z: 0 },
            weight,
            1
        );
        expect(tension1.magnitude).toBeCloseTo(weight * 9.81, 1);
        expect(tension1.angle).toBe(0);

        // 45°: T = W × g / cos(45°) ≈ 1.414 × W × g
        const tension2 = calculateTensionVector(
            { x: 0, y: 10, z: 0 },
            { x: 5, y: 5, z: 0 },
            weight,
            1
        );
        expect(tension2.magnitude).toBeCloseTo(weight * 9.81 * Math.SQRT2, 1);
        expect(tension2.angle).toBeCloseTo(45, 1);
    });

    test('validates rigging angles', () => {
        // Safe angle
        const result1 = validateRiggingAngle(30);
        expect(result1.safe).toBe(true);
        expect(result1.warning).toBeUndefined();

        // Warning angle
        const result2 = validateRiggingAngle(50);
        expect(result2.safe).toBe(true);
        expect(result2.warning).toBeDefined();

        // Critical angle
        const result3 = validateRiggingAngle(65);
        expect(result3.safe).toBe(false);
        expect(result3.warning).toContain('Critical');
    });
});

describe('Deflection Calculations', () => {
    test('calculates uniform load deflection', () => {
        const result = calculateUniformLoadDeflection(
            {
                length: 3,
                material: 'aluminum',
                crossSection: 'F34'
            },
            10 // kg/m
        );

        expect(result.maxDeflection).toBeGreaterThan(0);
        expect(result.deflectionRatio).toBeGreaterThan(0);
    });

    test('calculates point load deflection', () => {
        const result = calculatePointLoadDeflection(
            {
                length: 3,
                material: 'aluminum',
                crossSection: 'F34'
            },
            500 // kg
        );

        expect(result.maxDeflection).toBeGreaterThan(0);
        expect(result.safetyOk).toBeDefined();
    });

    test('detects excessive deflection', () => {
        // Heavy load on small truss = bad deflection
        const result = calculatePointLoadDeflection(
            {
                length: 10, // 10m span
                material: 'aluminum',
                crossSection: 'F34'
            },
            2000 // 2 tons!
        );

        expect(result.safetyOk).toBe(false);
        expect(result.warnings.length).toBeGreaterThan(0);
    });

    test('recommends appropriate truss size', () => {
        const recommendation = recommendTrussSize(5, 600, 'aluminum');

        expect(recommendation.recommended).toMatch(/F34|F44|F54/);
        expect(recommendation.reason).toBeDefined();
    });
});
