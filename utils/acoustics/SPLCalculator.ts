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
import { calculateWavelength, SPEED_OF_SOUND } from './raycast';
import {
    calculateMultiBandSPLFromSpeaker,
    OCTAVE_BANDS,
    type MultiBandSPLResult
} from './frequencyAnalysis';
import { calculateAllReflections, combineDirectAndReflectedSPL, createDefaultRoom } from './reflections';
import { checkMultipleObstacles, applyOcclusion, type Obstacle } from './occlusion';

export interface SPLContribution {
    speakerId: string;
    spl: number;           // dB
    distance: number;      // meters
    arrivalTime: number;   // seconds
    phase: number;         // degrees (0-360)
    isOccluded?: boolean;
    reflections?: number;  // gain from reflections
}

export interface SPLResult {
    totalSPL: number;           // Combined SPL in dB
    contributions: SPLContribution[];
    hasInterference: boolean;
    interferenceType: 'constructive' | 'destructive' | 'none';
}

// Temporary: Global room and obstacles for MVP
// In a real app these would come from the store/scene
const DEFAULT_ROOM = createDefaultRoom();
const DEFAULT_OBSTACLES: Obstacle[] = []; // Populate if we had scene data

/**
 * Calculate total SPL at a point from multiple speakers
 * Uses Phase 4 Advanced Acoustics engine
 */
export function calculateTotalSPL(
    targetPoint: Vector3,
    speakers: Array<{ id: string; spec: SpeakerSpec }>,
    frequency: number = 1000,
    options: { showReflections?: boolean; showOcclusion?: boolean } = { showReflections: true, showOcclusion: true }
): SPLResult {
    const contributions: SPLContribution[] = [];
    const isComposite = frequency <= 0; // 0 or -1 means composite A-weighted

    // Iterate over speakers
    speakers.forEach(({ id, spec }) => {
        // 1. Calculate Multi-Band SPL (Direct Sound)
        // This handles distance, air absorption, and directivity
        const mbResult = calculateMultiBandSPLFromSpeaker(
            spec.position,
            targetPoint,
            spec.frequencyResponse || spec.maxSPL,
            spec.dispersion,
            OCTAVE_BANDS,
            spec.directivityByFreq
        );

        // Determine base SPL for requested frequency
        let baseSPL: number;
        if (isComposite) {
            baseSPL = mbResult.aWeighted;
        } else {
            // Find closest band or interpolate? For now use closest band
            // If freq is not exact octave, maybe interpolate, but for grid usually we pick standard bands
            // @ts-ignore
            baseSPL = mbResult.bands.get(frequency as any) || 0;
        }

        // 2. Obstacle Occlusion
        let spl = baseSPL;
        let isOccluded = false;
        let occlusionAtt = 0;

        const checkFreq = isComposite ? 1000 : frequency;

        if (options.showOcclusion) {
            const occlusion = checkMultipleObstacles(
                spec.position,
                targetPoint,
                DEFAULT_OBSTACLES,
                checkFreq as any
            );

            if (occlusion.isOccluded) {
                spl = applyOcclusion(baseSPL, occlusion);
                isOccluded = true;
                occlusionAtt = occlusion.attenuationDB;
            }
        }

        // 3. Room Reflections
        // Only if not fully occluded (simplified)
        // And usually we add reflected energy to the total
        let reflectionGain = 0;
        if (options.showReflections && (!isOccluded || occlusionAtt < 10)) {
            const reflections = calculateAllReflections(
                spec.position,
                targetPoint,
                DEFAULT_ROOM,
                checkFreq as any
            );

            // Calculate how much SPL reflections add
            // This is complex for composite, so we approximate
            const splWithReflections = combineDirectAndReflectedSPL(
                spl,
                reflections,
                checkFreq as any
            );

            reflectionGain = splWithReflections - spl;
            spl = splWithReflections;
        }

        // Calculate phase (for interference check)
        const distance = spec.position.distanceTo(targetPoint);
        const wavelength = calculateWavelength(isComposite ? 1000 : frequency);
        const phase = ((distance % wavelength) / wavelength) * 360;

        contributions.push({
            speakerId: id,
            spl,
            distance,
            arrivalTime: distance / SPEED_OF_SOUND,
            phase,
            isOccluded: isOccluded,
            reflections: reflectionGain
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

    // Apply interference effects (Simplified)
    // Only apply if looking at specific low frequency, not composite
    // Interference is less relevant for A-weighted composite of noise/music
    if (hasInterference) {
        if (interferenceType === 'constructive') {
            totalSPL += 0.5;
        } else if (interferenceType === 'destructive') {
            totalSPL -= 3;
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
