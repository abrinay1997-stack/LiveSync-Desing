/**
 * Unit Tests for Multi-Frequency Analysis
 */

import {
    OCTAVE_BANDS,
    getAirAbsorption,
    getAWeighting,
    calculateFrequencyDependentSPL,
    calculateAWeightedSPL,
    calculateLinearSPL,
    getFrequencyDependentDispersion,
    combineMultiBandSPL,
    type OctaveBand
} from '../frequencyAnalysis';

describe('Frequency Analysis - Air Absorption', () => {
    test('air absorption increases with frequency', () => {
        const abs125 = getAirAbsorption(125);
        const abs1k = getAirAbsorption(1000);
        const abs8k = getAirAbsorption(8000);

        expect(abs1k).toBeGreaterThan(abs125);
        expect(abs8k).toBeGreaterThan(abs1k);
    });

    test('air absorption values are realistic', () => {
        // 8kHz should have significant absorption
        expect(getAirAbsorption(8000)).toBeGreaterThan(0.1);

        // 125Hz should have minimal absorption
        expect(getAirAbsorption(125)).toBeLessThan(0.01);
    });
});

describe('Frequency Analysis - A-Weighting', () => {
    test('1kHz has zero A-weighting', () => {
        expect(getAWeighting(1000)).toBe(0);
    });

    test('low frequencies are attenuated', () => {
        expect(getAWeighting(125)).toBeLessThan(-10);
        expect(getAWeighting(250)).toBeLessThan(0);
    });

    test('mid frequencies are slightly boosted', () => {
        expect(getAWeighting(2000)).toBeGreaterThan(0);
    });
});

describe('Frequency Analysis - SPL Calculation', () => {
    test('high frequencies attenuate more at distance', () => {
        const distance = 50; // 50 meters
        const maxSPL = 130;

        const spl125 = calculateFrequencyDependentSPL(distance, maxSPL, 125);
        const spl8k = calculateFrequencyDependentSPL(distance, maxSPL, 8000);

        // 8kHz should have more attenuation due to air absorption
        expect(spl8k).toBeLessThan(spl125);
    });

    test('SPL follows inverse square law baseline', () => {
        const maxSPL = 120;

        // At 1m
        const spl1m = calculateFrequencyDependentSPL(1, maxSPL, 1000);

        // At 10m (should be ~20dB less, plus small air absorption)
        const spl10m = calculateFrequencyDependentSPL(10, maxSPL, 1000);

        const difference = spl1m - spl10m;
        expect(difference).toBeGreaterThan(19); // ~20dB but with air absorption
        expect(difference).toBeLessThan(21);
    });
});

describe('Frequency Analysis - A-Weighted Composite', () => {
    test('calculates A-weighted SPL correctly', () => {
        const bandSPLs = new Map<OctaveBand, number>([
            [125, 90],
            [500, 95],
            [1000, 100],
            [4000, 95]
        ]);

        const aWeighted = calculateAWeightedSPL(bandSPLs);

        // A-weighted should be close to but not exactly equal to 1kHz value
        expect(aWeighted).toBeGreaterThan(95);
        expect(aWeighted).toBeLessThan(102);
    });

    test('flat and A-weighted differ for low frequencies', () => {
        const bandSPLs = new Map<OctaveBand, number>([
            [125, 100], // Heavy low frequency
            [1000, 80]
        ]);

        const aWeighted = calculateAWeightedSPL(bandSPLs);
        const flat = calculateLinearSPL(bandSPLs);

        // Flat should be higher due to 100dB at 125Hz
        expect(flat).toBeGreaterThan(aWeighted);
    });
});

describe('Frequency Analysis - Dispersion', () => {
    test('lower frequencies have wider dispersion', () => {
        const nominal = { horizontal: 110, vertical: 10 };

        const disp125 = getFrequencyDependentDispersion(nominal, 1000, 125);
        const disp4k = getFrequencyDependentDispersion(nominal, 1000, 4000);

        expect(disp125.horizontal).toBeGreaterThan(nominal.horizontal);
        expect(disp4k.horizontal).toBeLessThan(nominal.horizontal);
    });

    test('dispersion does not exceed 180 degrees', () => {
        const nominal = { horizontal: 120, vertical: 60 };

        const disp125 = getFrequencyDependentDispersion(nominal, 1000, 125);

        expect(disp125.horizontal).toBeLessThanOrEqual(180);
        expect(disp125.vertical).toBeLessThanOrEqual(180);
    });
});

describe('Frequency Analysis - Multi-Speaker Combination', () => {
    test('combines multiple speakers logarithmically', () => {
        // Two identical speakers at same distance/level
        const result1 = {
            bands: new Map<OctaveBand, number>([[1000, 90]]),
            composite: 90,
            aWeighted: 90,
            flatWeighted: 90,
            responses: []
        };

        const result2 = {
            bands: new Map<OctaveBand, number>([[1000, 90]]),
            composite: 90,
            aWeighted: 90,
            flatWeighted: 90,
            responses: []
        };

        const combined = combineMultiBandSPL([result1, result2]);
        const combinedSPL = combined.bands.get(1000);

        // Should be ~93dB (90 + 3dB for doubling)
        expect(combinedSPL).toBeCloseTo(93, 1);
    });
});
