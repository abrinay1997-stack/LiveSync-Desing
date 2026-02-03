/**
 * Acoustic Ray Casting Engine
 * 
 * Calculates sound propagation from speakers to measurement points
 */

import { Vector3 } from 'three';

export const SPEED_OF_SOUND = 343; // m/s at 20°C

export interface AcousticRay {
    origin: Vector3;
    direction: Vector3;
    intensity: number;      // dB SPL
    distance: number;       // meters
    frequency: number;      // Hz (center frequency)
    angle: number;          // degrees off-axis
}

export interface SpeakerSpec {
    position: Vector3;
    rotation: [number, number, number];
    maxSPL: number;         // dB @ 1m
    dispersion: {
        horizontal: number; // degrees
        vertical: number;   // degrees
    };
    power: number;          // Watts

    // Phase 4 enhancements
    frequencyResponse?: Record<number, number>;
    directivityByFreq?: Record<number, { horizontal: number; vertical: number }>;
}

/**
 * Cast acoustic ray from speaker to target point
 */
export function castAcousticRay(
    speaker: SpeakerSpec,
    targetPoint: Vector3,
    frequency: number = 1000
): AcousticRay {
    const origin = speaker.position;

    // Direction vector
    const direction = new Vector3()
        .subVectors(targetPoint, origin)
        .normalize();

    const distance = origin.distanceTo(targetPoint);

    // Calculate angle off-axis
    // For simplicity, we use speaker's Y-axis as main axis
    const speakerForward = new Vector3(0, 0, -1);

    // Apply speaker rotation (simplified - assumes speaker faces -Z)
    const angle = Math.acos(direction.dot(speakerForward)) * (180 / Math.PI);

    // Calculate intensity at target point
    const intensity = calculateIntensity(
        speaker.maxSPL,
        distance,
        angle,
        speaker.dispersion,
        frequency
    );

    return {
        origin,
        direction,
        intensity,
        distance,
        frequency,
        angle
    };
}

/**
 * Calculate intensity with distance attenuation and directivity
 */
function calculateIntensity(
    maxSPL: number,
    distance: number,
    angle: number,
    dispersion: { horizontal: number; vertical: number },
    frequency: number
): number {
    // Inverse square law: SPL drops 6dB per doubling of distance
    const distanceAttenuation = 20 * Math.log10(distance);
    let spl = maxSPL - distanceAttenuation;

    // Directivity pattern (simplified conical)
    const avgDispersion = (dispersion.horizontal + dispersion.vertical) / 2;
    const halfAngle = avgDispersion / 2;

    if (angle > halfAngle) {
        // Off-axis attenuation
        // Simple model: -6dB per doubling of angle beyond coverage
        const angleRatio = angle / halfAngle;
        const angleAttenuation = 6 * Math.log2(angleRatio);
        spl -= angleAttenuation;
    }

    // Ensure SPL doesn't go negative
    return Math.max(spl, 0);
}

/**
 * Calculate wavelength for given frequency
 */
export function calculateWavelength(frequency: number): number {
    return SPEED_OF_SOUND / frequency;
}

/**
 * Check if target point is within speaker's coverage cone
 */
export function isWithinCoverage(
    speaker: SpeakerSpec,
    targetPoint: Vector3
): boolean {
    const direction = new Vector3()
        .subVectors(targetPoint, speaker.position)
        .normalize();

    const speakerForward = new Vector3(0, 0, -1);
    const angle = Math.acos(direction.dot(speakerForward)) * (180 / Math.PI);

    const avgDispersion = (speaker.dispersion.horizontal + speaker.dispersion.vertical) / 2;

    return angle <= avgDispersion / 2;
}

/**
 * Calculate direct sound arrival time
 */
export function calculateArrivalTime(
    speaker: SpeakerSpec,
    targetPoint: Vector3
): number {
    const distance = speaker.position.distanceTo(targetPoint);
    return distance / SPEED_OF_SOUND; // seconds
}

/**
 * Cast multiple rays in a cone pattern (for more accurate simulation)
 */
export function castRayPattern(
    speaker: SpeakerSpec,
    targetPoint: Vector3,
    rayCount: number = 5
): AcousticRay[] {
    const rays: AcousticRay[] = [];

    // Primary ray (direct)
    rays.push(castAcousticRay(speaker, targetPoint));

    // Additional rays in pattern (simplified - just offset slightly)
    const offset = 0.1; // meters

    for (let i = 0; i < rayCount - 1; i++) {
        const angle = (i / (rayCount - 1)) * 2 * Math.PI;
        const offsetPoint = targetPoint.clone().add(
            new Vector3(
                Math.cos(angle) * offset,
                0,
                Math.sin(angle) * offset
            )
        );

        rays.push(castAcousticRay(speaker, offsetPoint));
    }

    return rays;
}
