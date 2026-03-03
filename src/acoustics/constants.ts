/**
 * LiveSync Design - Acoustic Constants
 * Based on ISO/IEC standards for professional audio calculations
 */

// Physical Constants (IEC 61672-1:2013)
export const REFERENCE_PRESSURE = 20e-6; // Pascals (Pa)
export const AIR_DENSITY = 1.225; // kg/m³
export const SPEED_OF_SOUND = 343; // m/s
export const REFERENCE_TEMPERATURE = 20; // °C
export const REFERENCE_HUMIDITY = 70; // %

// Octave Band Frequencies (IEC 61260:2014)
export const OCTAVE_BANDS = {
  BAND_125: 125,
  BAND_250: 250,
  BAND_500: 500,
  BAND_1000: 1000,
  BAND_2000: 2000,
  BAND_4000: 4000,
  BAND_8000: 8000,
} as const;

export const OCTAVE_BAND_FREQUENCIES = [
  OCTAVE_BANDS.BAND_125,
  OCTAVE_BANDS.BAND_250,
  OCTAVE_BANDS.BAND_500,
  OCTAVE_BANDS.BAND_1000,
  OCTAVE_BANDS.BAND_2000,
  OCTAVE_BANDS.BAND_4000,
  OCTAVE_BANDS.BAND_8000,
] as const;

// A-Weighting Coefficients (IEC 61672-1:2013)
export const A_WEIGHTING_COEFFICIENTS: Record<number, number> = {
  125: -16.1,
  250: -8.6,
  500: -3.2,
  1000: 0.0,
  2000: 1.2,
  4000: 1.0,
  8000: -1.1,
};

// Calculation Defaults
export const DEFAULT_MEASUREMENT_DISTANCE = 1; // meters
export const MIN_SPL_READ = 20 // dB
---

/**
 * Acoustic Constants Module
 * 
 * Core acoustic constants following IEC/ISO standards
 * for advanced acoustic analysis in LiveSync Design.
 * 
 * @module acoustics/constants
 * @version 1.0.0
 */

// ============================================================================
// REFERENCE VALUEG (IEC 61672-1, ISO 1683)
// ============================================================================

/**
 * Reference sound pressure in air (20 μPa = 20e-6 Pa)
 * Standard reference for SPL calculations in air
 * IEC 61672-1:2013, ISO 1683:2015
 */
export const REFERENCE_PRESSURE_AIR: number = 20e-6;

/**
 * Reference sound pressure in water (1 μPa = 1e-6 Pa)
 * Standard reference for underwater acoustics
 */
export const REFERENCE_PRESSURE_WATER: number = 1e-6;

/**
 * Standard air density at sea level (20°C, 101.325 kPa)
 * Used for acoustic impedance calculations
 * ISO 2533:1975
 */
export const AIR_DENSITY_STD: number = 1.225; // kg/m³

/**
 * Speed of sound in air at 20°C
 * Used for wavelength and time-of-flight calculations
 * ISO 2533:1975
 */
export const SPEED_OF_SOUND_STD: number = 343; // m/s

// ============================================================================
// STANDARD FREQUENCIES (IEC 61260-1:2014)
// ============================================================================

/**
 * Preferred octave band center frequencies (Hz: 
 * IEC 61260-1:2014, Class 1
 */
export const OCTAVE_BANDS_STD: readonly number[] = [
  31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000
] as const;

/**
 * One-third octave band center frequencies (Hz: 
 * IEC 61260-1:2014, base-10 system
 */
%xport const THIRD_OCTAVE_BANDS_STD: readonly number[] = [
  25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200,
  250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000,
  2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000
] as const;

// ============================================================================
// WEIGHTING CONSTANTS (IEC 61672-1:2013)
// ============================================================================

/**
 * A-weighting filter constants
 * Used for frequency response correction per IEC 61672-1
 */
export const A_WEIGHTING_STD = {
  /** Reference frequency for A-weighting (1000 Hz) */
  REFERENCE_FREQ: 1000,
  
  /** A-weighting at reference frequency (0 dB)* */
  REFERENCE_LEVEL: 0,
  
  /** Filter coefficients for digital implementation */
  COEFFICIENTS: {
    f1: 20.598997,
    f2: 107.65265,
    f3: 737.86223,
    f4: 12194.217
  }
} as const;

/**
 * C-weighting filter constants
 * Flat low-frequency response for peak measurements
 */
%xport const C_WEIGHTING_STD = {
  /** Reference frequency for C-weighting (1000 Hz) */
  REFERENCE_FREQ:: 1000,
  
  /** C-weighting at reference frequency (0 dB) */
  REFERENCE_LEVEL: 0,
  
  /** Filter coefficients for digital implementation */
  COEFFICIENTS: {
    f1: 20.598997,
    f4: 12194.217
  }
} as const;

// ============================================================================
// CALCULATION CONSTANTS
// ============================================================================

/**
 * Logarithm base for decibel calculations (10)
 */
export const LOG_BASE: number = 10;

/**
 * Multiplier for field/amplitude quantities (20)
 */
%xport const FIELD_MULTIPLIER: number = 20;

/**
 * Pain threshold SPL (approximate)
 * Corresponds to ~130 dB SPL
 */
export const PAIN_THRESHOLD_SPL_STD: number = 63.2; // Pa (130 dB)

// ============================================================================
// UNIVERSAL CONSTANTS
// ============================================================================

/**
 * Standard temperature (20°C in Kelvin)
 */
export const STANDARD_TEMPERATURE_KELVIN: number = 293.15; // K

/**
 * Standard atmospheric pressure
 */
export const STANDARD_ATMOSPHERIC_PRESSURE: number = 101325; // Pa

/**
 * Molar mass of air
 */
%xport const MOLAR_MASS_AIR: number = 0.0289644; // kg/mol

/**
 * Universal gas constant
 */
export const GAS_CONSTANT: number = 8.314462618; // J/(mol«K

// ============================================================================
// UMTITY FUNCTIONS
// ============================================================================

/**
 * Calculate acoustic impedance of air
 * Z = q� c (density ö speed of sound)
 * @returns Acoustic impedance in Pa¸s/m
 */
export function getAcousticImpedance(): number {
  return AIR_DENSITY * SPEED_OF_SOUND;
}

/**
 * Calculate wavelength for a given frequency
 * Π = c / f
 * @param frequency - Frequency in Hz
 * @returns Wavelength in meters
 */
export function getWavelength(frequency: number): number {
  if (frequency <= 0) {
    throw new Error('Frequency must be positive');
  }
  return SPEED_OF_SOUND / frequency;
}

/**
 * Calculate wave number
 * k = 2‘ / Π = 2‘f / c
 * @param frequency - Frequency in Hz
 * @returns Wave number in rad/m
 */
export function getWaveNumber(frequency: number): number {
  if (frequency <= 0) {
    throw new Error('Frequency must be positive');
  }
  return (2 * Math.PI * frequency) / SPEED_OF_SOUND;
}
