/**
 * Enhanced Directivity Module
 * 
 * Handles advanced directivity patterns, frequency interpolation,
 * and line array coupling effects.
 */

import { Vector3 } from 'three';
import type { OctaveBand } from './frequencyAnalysis';

export interface DirectivityPattern {
    horizontal: number; // degrees
    vertical: number;   // degrees
}

export interface DirectivityMap {
    [frequency: number]: DirectivityPattern;
}

/**
 * Calculate line array coupling gain
 * 
 * Line arrays couple at low frequencies to increase efficiency.
 * Gain is roughly 3dB per doubling of drivers for coupled frequencies.
 * Coupling frequency depends on total array length.
 */
export function calculateLineArrayCoupling(
    numBoxes: number,
    boxHeight: number, // meters
    frequency: number,
    splayAngles: number[] = []
): number {
    if (numBoxes <= 1) return 0;

    // Total array length
    const arrayLength = numBoxes * boxHeight;

    // Transition frequency where line source behavior breaks down
    // f = c / L
    const transitionFreq = 343 / arrayLength;

    // Coupling effectively stops above this frequency (simplified)
    if (frequency > transitionFreq * 4) {
        return 0;
    }

    // Calculate max potential gain (3dB per doubling)
    // 2 boxes = +3dB, 4 boxes = +6dB, 8 boxes = +9dB
    const maxGain = 10 * Math.log10(numBoxes);

    // Apply frequency taper
    // Full gain below transition freq, tapering off above
    if (frequency <= transitionFreq) {
        return maxGain;
    } else {
        // Linear fade out in log frequency domain
        const octavesAbove = Math.log2(frequency / transitionFreq);
        const gain = maxGain - (octavesAbove * 3); // Lose 3dB per octave above transition
        return Math.max(0, gain);
    }
}

/**
 * Interpolate directivity for a specific frequency
 */
export function getInterpolatedDirectivity(
    targetFreq: number,
    directivityMap: DirectivityMap | undefined,
    nominalDispersion: DirectivityPattern
): DirectivityPattern {
    if (!directivityMap) {
        // Fallback: Simplified physics model if no data
        // Lower freq = wider dispersion
        // Reference is 1kHz
        const refFreq = 1000;
        const ratio = Math.sqrt(refFreq / targetFreq);

        return {
            horizontal: Math.min(180, nominalDispersion.horizontal * ratio),
            vertical: Math.min(180, nominalDispersion.vertical * ratio)
        };
    }

    // Exact match
    if (directivityMap[targetFreq]) {
        return directivityMap[targetFreq];
    }

    // Find closest frequencies below and above
    const freqs = Object.keys(directivityMap).map(Number).sort((a, b) => a - b);

    // If below lowest known
    if (targetFreq <= freqs[0]) {
        return directivityMap[freqs[0]];
    }

    // If above highest known
    if (targetFreq >= freqs[freqs.length - 1]) {
        return directivityMap[freqs[freqs.length - 1]];
    }

    // Interpolate
    let lowerFreq = freqs[0];
    let upperFreq = freqs[freqs.length - 1];

    for (let i = 0; i < freqs.length - 1; i++) {
        if (targetFreq >= freqs[i] && targetFreq < freqs[i + 1]) {
            lowerFreq = freqs[i];
            upperFreq = freqs[i + 1];
            break;
        }
    }

    const lowerSpec = directivityMap[lowerFreq];
    const upperSpec = directivityMap[upperFreq];

    // Logarithmic interpolation for frequency
    const t = (Math.log(targetFreq) - Math.log(lowerFreq)) / (Math.log(upperFreq) - Math.log(lowerFreq));

    return {
        horizontal: lowerSpec.horizontal + (upperSpec.horizontal - lowerSpec.horizontal) * t,
        vertical: lowerSpec.vertical + (upperSpec.vertical - lowerSpec.vertical) * t
    };
}

/**
 * Calculate off-axis attenuation using 2nd order Gaussian approximation
 * This is more accurate than simple linear attenuation
 */
export function calculateOffAxisAttenuation(
    angle: number,
    nominalDispersion: number // Total coverage angle (-6dB points)
): number {
    // Standard definition: nominal dispersion is where level is -6dB
    const halfAngle = nominalDispersion / 2;

    // Normalized angle ratio
    const u = angle / halfAngle;

    if (u <= 0) return 0;

    // Gaussian model: Attenuation = 6 * u^2
    // At u=1 (edge of coverage), att = 6dB
    // At u=0 (on axis), att = 0dB
    let attenuation = 6 * Math.pow(u, 2); // 2nd order approximation

    // Limit maximum attenuation for very off-axis (e.g. back of speaker)
    // Real speakers have some leakage even 180 deg off axis
    return Math.min(attenuation, 30); // Cap at -30dB
}

/**
 * Calculate full 3D directivity attenuation
 */
export function calculateDirectionalAttenuation(
    targetPos: Vector3,
    speakerPos: Vector3,
    speakerRotation: Vector3, // Euler angles or direction vector could be used, assuming LookAt for now
    frequency: number,
    nominalDispersion: DirectivityPattern,
    directivityMap?: DirectivityMap
): number {
    // 1. Get interpolated dispersion for this frequency
    const dispersion = getInterpolatedDirectivity(frequency, directivityMap, nominalDispersion);

    // 2. Calculate angles relative to speaker axis
    // This is a simplified calculation assuming speaker points -Z by default
    // In a real implementation we'd use the speaker's actual rotation matrix/quaternion

    const toTarget = new Vector3().subVectors(targetPos, speakerPos).normalize();

    // Assuming simple orientation for MVP (can be enhanced with full quaternions later)
    // Vertical angle (elevation)
    const dy = toTarget.y;
    const vAngle = Math.asin(Math.abs(dy)) * (180 / Math.PI);

    // Horizontal angle (azimuth)
    const hAngle = Math.atan2(Math.abs(toTarget.x), Math.abs(toTarget.z)) * (180 / Math.PI);

    // 3. Calculate attenuation for each axis
    const attH = calculateOffAxisAttenuation(hAngle, dispersion.horizontal);
    const attV = calculateOffAxisAttenuation(vAngle, dispersion.vertical);

    // Combine (elliptical approximation)
    // A simplified way is to take the max, or a weighted sum
    return Math.sqrt(attH * attH + attV * attV);
}
