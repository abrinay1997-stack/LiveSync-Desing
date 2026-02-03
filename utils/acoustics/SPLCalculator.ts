/**
 * SPL (Sound Pressure Level) Calculator
 * 
 * Handles acoustic calculations including:
 * - Inverse square law
 * - Multiple source summation
 * - Phase interference
 */

import { Vector3 } from 'three';
import type { SpeakerSpec } from './raycast';
import { castAcousticRay, calculateWavelength } from './raycast';

export interface SPLContribution {
    speakerId: string;
    spl: number;           // dB
    distance: number;      // meters
    arrivalTime: number;   // seconds
    phase: number;         // degrees (0-360)
}

export interface SPLResult {
    totalSPL: number;           // Combined SPL in dB
    contributions: SPLContribution[];
    hasInterference: boolean;
    interferenceType: 'constructive' | 'destructive' | 'none';
}

const SPEED_OF_SOUND = 343; // m/s

/**
 * Calculate total SPL at a point from multiple speakers
 */
export function calculateTotalSPL(
    targetPoint: Vector3,
    speakers: Array<{ id: string; spec: SpeakerSpec }>,
    frequency: number = 1000
): SPLResult {
    const contributions: SPLContribution[] = [];

    // Calculate contribution from each speaker
    speakers.forEach(({ id, spec }) => {
        const ray = castAcousticRay(spec, targetPoint, frequency);
        const distance = spec.position.distanceTo(targetPoint);
        const arrivalTime = distance / SPEED_OF_SOUND;

        // Calculate phase based on distance
        const wavelength = calculateWavelength(frequency);
        const phase = ((distance % wavelength) / wavelength) * 360;

        contributions.push({
            speakerId: id,
            spl: ray.intensity,
            distance,
            arrivalTime,
            phase
        });
    });

    // Combine SPL values
    const { totalSPL, hasInterference, interferenceType } = combineSPL(contributions);

    return {
        totalSPL,
        contributions,
        hasInterference,
        interferenceType
    };
}

/**
 * Combine multiple SPL values logarithmically
 * SPL_total = 10 × log₁₀(Σ 10^(SPL_i / 10))
 */
function combineSPL(contributions: SPLContribution[]): {
    totalSPL: number;
    hasInterference: boolean;
    interferenceType: 'constructive' | 'destructive' | 'none';
} {
    if (contributions.length === 0) {
        return { totalSPL: 0, hasInterference: false, interferenceType: 'none' };
    }

    if (contributions.length === 1) {
        return {
            totalSPL: contributions[0].spl,
            hasInterference: false,
            interferenceType: 'none'
        };
    }

    // Check for phase interference
    const { hasInterference, interferenceType } = analyzePhaseInterference(contributions);

    // Logarithmic summation
    const linearSum = contributions.reduce((sum, contrib) => {
        return sum + Math.pow(10, contrib.spl / 10);
    }, 0);

    let totalSPL = 10 * Math.log10(linearSum);

    // Apply interference effects
    if (hasInterference) {
        if (interferenceType === 'constructive') {
            // Slight boost (already accounted for in linear sum, but can add emphasis)
            totalSPL += 0.5; // Small boost
        } else if (interferenceType === 'destructive') {
            // Significant reduction
            totalSPL -= 3; // 3dB reduction for destructive interference
        }
    }

    return { totalSPL, hasInterference, interferenceType };
}

/**
 * Analyze phase relationships for interference
 */
function analyzePhaseInterference(contributions: SPLContribution[]): {
    hasInterference: boolean;
    interferenceType: 'constructive' | 'destructive' | 'none';
} {
    if (contributions.length < 2) {
        return { hasInterference: false, interferenceType: 'none' };
    }

    // Compare phases between sources
    const phases = contributions.map(c => c.phase);

    // Calculate phase differences
    const phaseDiffs: number[] = [];
    for (let i = 0; i < phases.length - 1; i++) {
        for (let j = i + 1; j < phases.length; j++) {
            let diff = Math.abs(phases[i] - phases[j]);
            // Normalize to 0-180 range
            if (diff > 180) diff = 360 - diff;
            phaseDiffs.push(diff);
        }
    }

    // Determine interference type
    const avgPhaseDiff = phaseDiffs.reduce((sum, d) => sum + d, 0) / phaseDiffs.length;

    if (avgPhaseDiff < 45) {
        // Mostly in phase - constructive
        return { hasInterference: true, interferenceType: 'constructive' };
    } else if (avgPhaseDiff > 135) {
        // Mostly out of phase - destructive
        return { hasInterference: true, interferenceType: 'destructive' };
    }

    return { hasInterference: false, interferenceType: 'none' };
}

/**
 * Calculate SPL frequency response at a point
 * (Simplified - assumes flat response)
 */
export function calculateFrequencyResponse(
    targetPoint: Vector3,
    speakers: Array<{ id: string; spec: SpeakerSpec }>,
    frequencies: number[] = [125, 250, 500, 1000, 2000, 4000, 8000]
): Map<number, number> {
    const response = new Map<number, number>();

    frequencies.forEach(freq => {
        const result = calculateTotalSPL(targetPoint, speakers, freq);
        response.set(freq, result.totalSPL);
    });

    return response;
}

/**
 * Evaluate coverage quality at a point
 */
export function evaluateCoverage(spl: number): {
    quality: 'poor' | 'acceptable' | 'good' | 'excellent' | 'excessive';
    color: string;
    message: string;
} {
    if (spl < 85) {
        return {
            quality: 'poor',
            color: '#ef4444',
            message: 'Insufficient coverage'
        };
    } else if (spl < 90) {
        return {
            quality: 'acceptable',
            color: '#f59e0b',
            message: 'Marginal coverage'
        };
    } else if (spl < 100) {
        return {
            quality: 'good',
            color: '#22c55e',
            message: 'Good coverage'
        };
    } else if (spl < 105) {
        return {
            quality: 'excellent',
            color: '#10b981',
            message: 'Excellent coverage'
        };
    } else {
        return {
            quality: 'excessive',
            color: '#ef4444',
            message: 'Excessive SPL - hearing risk'
        };
    }
}
