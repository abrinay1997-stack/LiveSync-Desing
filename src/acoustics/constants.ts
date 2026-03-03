/**
 * LiveSync Design - Acoustic Constants
 * @module acoustics/constants
 */

export const REFERENCE_PRESSURE_AIR: number = 20e-6;
export const REFERENCE_PRESSURE_WATER: number = 1e-6;
export const REFERENCE_INTENSITY: number = 1e-12;
export const REFERENCE_POWER: number = 1e-12;
export const AIR_DENSITY_STANDARD: number = 1.225;
export const SPEED_OF_SOUND_AIR: number = 343;
export const REFERENCE_TEMPERATURE: number = 20;
export const REFERENCE_PRESSURE_ATMOSPHERIC: number = 101.325;
export const OCTAVE_BAND_FREQUENCIES: number[] = [31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
export const THIRD_OCTAVE_BAND_FREQUENCIES: number[] = [25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000];
export const A_WEIGHTING: Record<number, number> = { 31.5: -39.4, 63: -26.2, 125: -16.1, 250: -8.6, 500: -3.2, 1000: 0, 2000: 1.2, 4000: 1.0, 8000: -1.1, 16000: -6.6 };
export const C_WEIGHTING: Record<number, number> = { 31.5: -3.0, 63: -0.8, 125: -0.2, 250: 0, 500: 0, 1000: 0, 2000: -0.2, 4000: -0.8, 8000: -3.0, 16000: -8.5 };
export const Z_WEIGHTING: Record<number, number> = { 31.5: 0, 63: 0, 125: 0, 250: 0, 500: 0, 1000: 0, 2000: 0, 4000: 0, 8000: 0, 16000: 0 };
export const ATMOSPHERIC_ABSORPTION: Record<number, number> = { 31.5: 0.0001, 63: 0.0004, 125: 0.0012, 250: 0.004, 500: 0.009, 1000: 0.026, 2000: 0.07, 4000: 0.19, 8000: 0.57, 16000: 2.0 };
export const REFERENCE_REVERBERATION_TIME: number = 0.5;

export function calculateSpeedOfSound(temperature: number): number { return 331.3 + 0.606 * temperature; }
export function calculateWavelength(frequency: number, speedOfSound: number = 343): number { return speedOfSound / frequency; }
export function getAWeighting(frequency: number): number { return A_WEIGHTING[frequency] ?? 0; }
export function getCWeighting(frequency: number): number { return C_WEIGHTING[frequency] ?? 0; }
export function getAtmosphericAbsorption(frequency: number): number { return ATMOSPHERIC_ABSORPTION[frequency] ?? 0; }
