/**
 * Multi-Frequency Analysis
 * 
 * Handles octave band analysis for acoustic simulation
 * ISO 9613-1 compliant air absorption
 */

import { Vector3 } from 'three';
import type { SpeakerSpec } from './raycast';
import { castAcousticRay } from './raycast';

// Standard octave band center frequencies (Hz)
export const OCTAVE_BANDS = [125, 250, 500, 1000, 2000, 4000, 8000] as const;
export type OctaveBand = typeof OCTAVE_BANDS[number];

// A-weighting coefficients (dB) per frequency
const A_WEIGHTING: Record<OctaveBand, number> = {
    125: -16.1,
    250: -8.6,
    500: -3.2,
    1000: 0.0,
    2000: 1.2,
    4000: 1.0,
    8000: -1.1
};

// Air absorption coefficients (dB/m) - ISO 9613-1 simplified
// At 20°C, 50% humidity
const AIR_ABSORPTION: Record<OctaveBand, number> = {
    125: 0.0011,
    250: 0.0027,
    500: 0.0059,
    1000: 0.0116,
    2000: 0.0283,
    4000: 0.0816,
    8000: 0.2422
};

export interface FrequencyResponse {
    frequency: OctaveBand;
    spl: number;           // dB SPL
    phase: number;         // degrees
    distance: number;      // meters
}

export interface MultiBandSPLResult {
    bands: Map<OctaveBand, number>;     // SPL per band
    composite: number;                   // A-weighted total
    aWeighted: number;                   // Same as composite (alias)
    flatWeighted: number;                // Linear (no weighting)
    responses: FrequencyResponse[];
}

/**
 * Get air absorption coefficient for frequency
 */
export function getAirAbsorption(frequency: OctaveBand): number {
    return AIR_ABSORPTION[frequency];
}

/**
 * Get A-weighting for frequency
 */
export function getAWeighting(frequency: OctaveBand): number {
    return A_WEIGHTING[frequency];
}

/**
 * Calculate SPL with frequency-dependent air absorption
 */
export function calculateFrequencyDependentSPL(
    distance: number,
    maxSPL: number,
    frequency: OctaveBand,
    angle: number = 0,
    dispersion: { horizontal: number; vertical: number } = { horizontal: 90, vertical: 60 }
): number {
    // Base inverse square law
    let spl = maxSPL - 20 * Math.log10(distance);

    // Air absorption
    const airAbs = getAirAbsorption(frequency);
    spl -= airAbs * distance;

    // Directivity (simplified)
    const avgDispersion = (dispersion.horizontal + dispersion.vertical) / 2;
    const halfAngle = avgDispersion / 2;

    if (angle > halfAngle) {
        const angleRatio = angle / halfAngle;
        const angleAttenuation = 6 * Math.log2(angleRatio);
        spl -= angleAttenuation;
    }

    return Math.max(spl, 0);
}

/**
 * Calculate multi-band SPL at target point from single speaker
 */
export function calculateMultiBandSPLFromSpeaker(
    speakerPosition: Vector3,
    targetPosition: Vector3,
    speakerMaxSPL: number | Record<OctaveBand, number>,
    dispersion: { horizontal: number; vertical: number },
    bands: readonly OctaveBand[] = OCTAVE_BANDS
): MultiBandSPLResult {
    const distance = speakerPosition.distanceTo(targetPosition);

    // Calculate direction and angle (simplified)
    const direction = new Vector3().subVectors(targetPosition, speakerPosition).normalize();
    const speakerForward = new Vector3(0, 0, -1);
    const angle = Math.acos(direction.dot(speakerForward)) * (180 / Math.PI);

    const bandSPLs = new Map<OctaveBand, number>();
    const responses: FrequencyResponse[] = [];

    // Calculate SPL for each band
    bands.forEach(freq => {
        let maxSPLForBand: number;

        if (typeof speakerMaxSPL === 'number') {
            // Single SPL value for all frequencies
            maxSPLForBand = speakerMaxSPL;
        } else {
            // Frequency-dependent SPL map
            maxSPLForBand = speakerMaxSPL[freq] ?? speakerMaxSPL[1000] ?? 120;
        }

        const spl = calculateFrequencyDependentSPL(
            distance,
            maxSPLForBand,
            freq,
            angle,
            dispersion
        );

        bandSPLs.set(freq, spl);

        // Phase calculation (simplified)
        const wavelength = 343 / freq;
        const phase = ((distance % wavelength) / wavelength) * 360;

        responses.push({
            frequency: freq,
            spl,
            phase,
            distance
        });
    });

    // Calculate composite SPL (A-weighted)
    const aWeighted = calculateAWeightedSPL(bandSPLs);

    // Calculate flat (linear) composite
    const flatWeighted = calculateLinearSPL(bandSPLs);

    return {
        bands: bandSPLs,
        composite: aWeighted,
        aWeighted,
        flatWeighted,
        responses
    };
}

/**
 * Calculate A-weighted composite SPL from band levels
 */
export function calculateAWeightedSPL(bandSPLs: Map<OctaveBand, number>): number {
    const weightedLinear = Array.from(bandSPLs.entries()).map(([freq, spl]) => {
        const weight = getAWeighting(freq);
        return Math.pow(10, (spl + weight) / 10);
    });

    const sum = weightedLinear.reduce((a, b) => a + b, 0);
    return sum > 0 ? 10 * Math.log10(sum) : 0;
}

/**
 * Calculate linear (flat) composite SPL from band levels
 */
export function calculateLinearSPL(bandSPLs: Map<OctaveBand, number>): number {
    const linear = Array.from(bandSPLs.values()).map(spl =>
        Math.pow(10, spl / 10)
    );

    const sum = linear.reduce((a, b) => a + b, 0);
    return sum > 0 ? 10 * Math.log10(sum) : 0;
}

/**
 * Get frequency-dependent dispersion (lower freq = wider)
 */
export function getFrequencyDependentDispersion(
    nominalDispersion: { horizontal: number; vertical: number },
    nominalFreq: number = 1000,
    targetFreq: OctaveBand
): { horizontal: number; vertical: number } {
    // Lower frequencies have wider dispersion
    const ratio = Math.sqrt(nominalFreq / targetFreq);

    return {
        horizontal: Math.min(180, nominalDispersion.horizontal * ratio),
        vertical: Math.min(180, nominalDispersion.vertical * ratio)
    };
}

/**
 * Combine multi-band SPL from multiple speakers
 */
export function combineMultiBandSPL(
    results: MultiBandSPLResult[]
): MultiBandSPLResult {
    if (results.length === 0) {
        return {
            bands: new Map(),
            composite: 0,
            aWeighted: 0,
            flatWeighted: 0,
            responses: []
        };
    }

    if (results.length === 1) {
        return results[0];
    }

    // Combine per band
    const combinedBands = new Map<OctaveBand, number>();

    OCTAVE_BANDS.forEach(freq => {
        const bandValues = results
            .map(r => r.bands.get(freq) || 0)
            .filter(v => v > 0);

        if (bandValues.length > 0) {
            const linear = bandValues.map(spl => Math.pow(10, spl / 10));
            const sum = linear.reduce((a, b) => a + b, 0);
            combinedBands.set(freq, 10 * Math.log10(sum));
        }
    });

    const aWeighted = calculateAWeightedSPL(combinedBands);
    const flatWeighted = calculateLinearSPL(combinedBands);

    // Combine responses (average phase for simplicity)
    const responses: FrequencyResponse[] = [];
    OCTAVE_BANDS.forEach(freq => {
        const freqResponses = results.flatMap(r =>
            r.responses.filter(resp => resp.frequency === freq)
        );

        if (freqResponses.length > 0) {
            const avgPhase = freqResponses.reduce((sum, r) => sum + r.phase, 0) / freqResponses.length;
            const avgDistance = freqResponses.reduce((sum, r) => sum + r.distance, 0) / freqResponses.length;

            responses.push({
                frequency: freq,
                spl: combinedBands.get(freq) || 0,
                phase: avgPhase,
                distance: avgDistance
            });
        }
    });

    return {
        bands: combinedBands,
        composite: aWeighted,
        aWeighted,
        flatWeighted,
        responses
    };
}

/**
 * Get recommended octave band for analysis based on system type
 */
export function getRecommendedBands(systemType: 'fullrange' | 'sub' | 'mid-high'): readonly OctaveBand[] {
    switch (systemType) {
        case 'sub':
            return [125, 250, 500] as const;
        case 'mid-high':
            return [1000, 2000, 4000, 8000] as const;
        case 'fullrange':
        default:
            return OCTAVE_BANDS;
    }
}
