/**
 * Acoustic Constants Module
 *
 * IEC/ISO compliant constants for acoustic calculations.
 *
 * @module acoustics/constants
 * @version 1.1.0
 */

// Reference values (IEC 61672-1, ISO 1683)
export const REFERENCE_PRESSURE: number = 20e-6;
export const REFERENCE_PRESSURE_AIR: number = 20e-6;
export const REFERENCE_PRESSURE_WATER: number = 1e-6;
export const REFERENCE_INTENSITY: number = 1e-12;
export const REFERENCE_POWER: number = 1e-12;

// Atmospheric conditions (ISO 2533, IEC 61672-1)
export const AIR_DENSITY: number = 1.225;
export const AIR_DENSITY_STANDARD: number = 1.225;
export const SPEED_OF_SOUND: number = 343;
export const SPEED_OF_SOUND_AIR: number = 343;
export const REFERENCE_TEMPERATURE: number = 20;
export const REFERENCE_PRESSURE_ATMOSPHERIC: number = 101325;
export const REFERENCE_HUMIDITY: number = 70;

// Octave band frequencies (IEC 61260-1:2014)
export const OCTAVE_BANDS = {
  BAND_31_5: 31.5,
  BAND_63: 63,
  BAND_125: 125,
  BAND_250: 250,
  BAND_500: 500,
  BAND_1000: 1000,
  BAND_2000: 2000,
  BAND_4000: 4000,
  BAND_8000: 8000,
  BAND_16000: 16000,
} as const;

export const OCTAVE_BAND_FREQUENCIES: number[] = [31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

// A-weighting coefficients (IEC 61672-1:2013)
export const A_WEIGHTING: Record<number, number> = {
  31.5: -39.4,
  63: -26.2,
  125: -16.1,
  250: -8.6,
  500: -3.2,
  1000: 0,
  2000: 1.2,
  4000: 1.0,
  8000: -1.1,
  16000: -6.6,
};
export const A_WEIGHTING_COEFFICIENTS = A_WEIGHTING;

// C-weighting coefficients (IEC 61672-1:2013)
export const C_WEIGHTING: Record<number, number> = {
  31.5: -3.0,
  63: -0.8,
  125: -0.2,
  250: 0,
  500: 0,
  1000: 0,
  2000: -0.2,
  4000: -0.8,
  8000: -3.0,
  16000: -8.5,
};
export const C_WEIGHTING_COEFFICIENTS = C_WEIGHTING;

// Z-weighting (flat/zero)
export const Z_WEIGHTING_COEFFICIENTS: Record<number, number> = {
  31.5: 0,
  63: 0,
  125: 0,
  250: 0,
  500: 0,
  1000: 0,
  2000: 0,
  4000: 0,
  8000: 0,
  16000: 0,
};

// Atmospheric absorption (dB/m at 20°C, 70% RH)
export const ATMOSPHERIC_ABSORPTION: Record<number, number> = {
  31.5: 0.0001,
  63: 0.0004,
  125: 0.0012,
  250: 0.004,
  500: 0.009,
  1000: 0.026,
  2000: 0.07,
  4000: 0.19,
  8000: 0.57,
  16000: 2.0,
};

// Calculation defaults
export const DEFAULT_MEASUREMENT_DISTANCE: number = 1;
export const MIN_SPL_READ: number = 20;
export const MIN_SPL_READABLE: number = 20;
export const MAX_SPL_READABLE: number = 140;
export const DEFAULT_TIME_WEIGHTING: string = 'F';
export const TIME_WEIGHTING_CONSTANTS = {
  FAST: 0.125,
  SLOW: 1.0,
  IMPULSE: 0.035,
} as const;

export const REFERENCE_REVERBERATION_TIME: number = 0.5;

// Utility functions
export function calculateSpeedOfSound(t: number): number {
  return 331.3 + 0.606 * t;
}

export function calculateWavelength(f: number, c: number = 343): number {
  return c / f;
}

export function getAWeighting(f: number): number {
  return A_WEIGHTING[f] ?? 0;
}

export function getCWeighting(f: number): number {
  return C_WEIGHTING[f] ?? 0;
}

export function getAtmosphericAbsorption(f: number): number {
  return ATMOSPHERIC_ABSORPTION[f] ?? 0;
}
