/**
 * @module acoustics/constants
 * @description Centralized acoustic constants following IEC/ISO standards.
 * All physical constants are defined here as the single source of truth.
 *
 * Standards applied:
 * - IEC 61672-1:2013 (Sound level meters)
 * - IEC 61260-1:2014 (Octave-band filters)
 * - ISO 9613-1:1993 (Atmospheric absorption)
 * - ISO 3744:2010 (Sound power determination)
 *
 * @see RULE-002: Constants exported from central location
 * @see RULE-004: Constantes ISO/IEC centralizadas
 */

// =============================================================================
// Physical Constants
// =============================================================================

/**
 * Reference sound pressure for SPL calculations.
 * Per IEC 61672-1:2013, the reference pressure in air is 20 micropascals.
 * Unit: Pa (Pascals)
 */
export const REFERENCE_PRESSURE: number = 20e-6;

/**
 * Air density at standard conditions (20Â°C, 101.325 kPa).
 * Unit: kg/mÂ³
 */
export const AIR_DENSITY: number = 1.225;

/**
 * Speed of sound in air at standard conditions (20Â°C, 50% RH).
 * Unit: m/s
 */
export const SPEED_OF_SOUND: number = 343;

/**
 * Reference sound intensity for SIL calculations.
 * Per ISO 3744:2010.
 * Unit: W/mÂ²
 */
export const REFERENCE_INTENSITY: number = 1e-12;

/**
 * Reference sound power for SWL calculations.
 * Per ISO 3744:2010.
 * Unit: W (Watts)
 */
export const REFERENCE_POWER: number = 1e-12;

/**
 * Standard atmospheric pressure.
 * Unit: Pa (Pascals)
 */
export const STANDARD_ATMOSPHERIC_PRESSURE: number = 101325;

/**
 * Standard temperature for acoustic calculations.
 * Unit: K (Kelvin)
 */
export const STANDARD_TEMPERATURE: number = 293.15;

// =============================================================================
// Mathematical Constants (RULE-003: Use Math standard)
// =============================================================================

/**
 * Pi constant - use Math.PI directly in calculations.
 * Exported for reference/documentation purposes.
 */
export const PI: number = Math.PI;

/**
 * Square root of 2 - use Math.SQRT2 directly in calculations.
 * Exported for reference/documentation purposes.
 */
export const SQRT2: number = Math.SQRT2;

// =============================================================================
// IEC 61260-1:2014 Octave Band Constants
// =============================================================================

/**
 * Standard octave band center frequencies per IEC 61260-1:2014.
 * Covers the audible range from 31.5 Hz to 16 kHz.
 * Unit: Hz
 */
export const OCTAVE_BAND_CENTER_FREQUENCIES: readonly number[] = [
  31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000,
] as const;

/**
 * One-third octave band center frequencies per IEC 61260-1:2014.
 * Unit: Hz
 */
export const THIRD_OCTAVE_BAND_CENTER_FREQUENCIES: readonly number[] = [
  20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160,
  200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600,
  2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000,
  20000,
] as const;

/**
 * Octave band ratio. The ratio between successive octave band frequencies.
 * G = 10^(3/10) per IEC 61260-1:2014.
 */
export const OCTAVE_RATIO: number = Math.pow(10, 3 / 10);

/**
 * One-third octave band ratio.
 * G_1/3 = 10^(1/10) per IEC 61260-1:2014.
 */
export const THIRD_OCTAVE_RATIO: number = Math.pow(10, 1 / 10);

// =============================================================================
// A-Weighting Constants (IEC 61672-1:2013)
// =============================================================================

/**
 * A-weighting correction values for standard octave bands.
 * Index maps to OCTAVE_BAND_CENTER_FREQUENCIES.
 * Unit: dB
 */
export const A_WEIGHTING_CORRECTIONS: readonly number[] = [
  -39.4, -26.2, -16.1, -8.6, -3.2, 0, 1.2, 1.0, -1.1, -6.6,
] as const;

// =============================================================================
// SPL Calculation Limits
// =============================================================================

/**
 * Minimum valid SPL value (threshold of hearing).
 * Unit: dB
 */
export const MIN_SPL_DB: number = 0;

/**
 * Maximum valid SPL value (threshold of pain / structural damage).
 * Unit: dB
 */
export const MAX_SPL_DB: number = 194;

/**
 * Minimum valid pressure value to avoid log(0) errors.
 * Set to a very small positive number.
 * Unit: Pa
 */
export const MIN_PRESSURE: number = 1e-20;
