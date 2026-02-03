/**
 * Unit Tests for Enhanced Directivity
 */

import { Vector3 } from 'three';
import {
    calculateLineArrayCoupling,
    getInterpolatedDirectivity,
    calculateOffAxisAttenuation,
    type DirectivityMap
} from '../directivity';

describe('Directivity - Line Array Coupling', () => {
    test('coupling increases with box count', () => {
        const height = 0.3; // 30cm box
        const freq = 100; // Low freq

        const gain2 = calculateLineArrayCoupling(2, height, freq);
        const gain8 = calculateLineArrayCoupling(8, height, freq);

        expect(gain8).toBeGreaterThan(gain2);
        expect(gain8).toBeCloseTo(9, 0.5); // ~9dB for 8 boxes (10*log10(8))
    });

    test('coupling decreases at high frequencies', () => {
        const height = 0.3;
        const numBoxes = 8; // ~2.4m length -> 143Hz transition

        const lowFreqGain = calculateLineArrayCoupling(numBoxes, height, 100);
        const highFreqGain = calculateLineArrayCoupling(numBoxes, height, 4000);

        expect(highFreqGain).toBeLessThan(lowFreqGain);
        expect(highFreqGain).toBe(0); // Should be 0 at 4kHz for this size
    });
});

describe('Directivity - Interpolation', () => {
    const map: DirectivityMap = {
        125: { horizontal: 120, vertical: 60 },
        1000: { horizontal: 90, vertical: 10 },
        4000: { horizontal: 60, vertical: 5 }
    };

    test('returns exact match', () => {
        const result = getInterpolatedDirectivity(1000, map, { horizontal: 90, vertical: 90 });
        expect(result.horizontal).toBe(90);
        expect(result.vertical).toBe(10);
    });

    test('interpolates between frequencies', () => {
        // 500Hz is log-midway between 125 and 1000 roughly
        const result = getInterpolatedDirectivity(500, map, { horizontal: 90, vertical: 90 });

        expect(result.horizontal).toBeLessThan(120);
        expect(result.horizontal).toBeGreaterThan(90);
    });

    test('falls back to calculation if no map', () => {
        const nominal = { horizontal: 100, vertical: 50 };
        const result = getInterpolatedDirectivity(125, undefined, nominal);

        // Lower freq = wider
        expect(result.horizontal).toBeGreaterThan(nominal.horizontal);
    });
});

describe('Directivity - Off Axis', () => {
    test('zero attenuation on axis', () => {
        const att = calculateOffAxisAttenuation(0, 90);
        expect(att).toBe(0);
    });

    test('6dB attenuation at nominal angle edge', () => {
        // Nominal 90 deg -> edge is 45 deg
        const att = calculateOffAxisAttenuation(45, 90);
        expect(att).toBeCloseTo(6, 1);
    });

    test('high attenuation far off axis', () => {
        const att = calculateOffAxisAttenuation(90, 90); // 90 deg off axis (back/side)
        expect(att).toBeGreaterThan(10);
    });
});
