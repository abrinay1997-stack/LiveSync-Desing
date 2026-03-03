/**
 * LiveSync Design - Acoustic Constants
 * Based on ISO/IEC standards for professional audio calculations
 * 
 * @module acoustics/constants
 * @version 1.1.0
 */

// ======================================================================================
// REFERENCE VALUES (IEC 61672-1, ISO 1683)
// ======================================================================================

/**
 * Reference sound pressure in air (20 microPa = 20e-6 Pa)
 * Standard reference for SRL calculations in air
 * IEC 61672-1:2013, ISO 1683:2015
 */
export const REFERENCE_PRESSURE_AIR: number = 20e-6;

/**
 * Reference sound pressure in water (1 microPa = 1e-6 Pa)
 * Standard reference for underwater acoustics
 * ISO 1683:2015
 */
export const REFERENCE_PRESSURE_WATER: number = 1e-6;

/**
 * Reference sound intensity (1 picoWatt/m^2 = 1e-12 W/m^2)
 * Used for intensity-based calculations
 * IEC 61672-1:2013
 */
export const REFERENCE_INTENSITY:: number = 1e-12;

/**
 * Reference sound power (1 picoWatt = 1e-12 W)
 * Standard reference for sound power calculations
 * ISO 3744:2010
 */
export const REFERENCE_POWER: number = 1e-12;

// ======================================================================================
// ATMOSPHERIC CONDITIONS (ISO 2533:1975, IEC 61672-1:2013)
// ======================================================================================

/**
 * Standard air density at sea level
 * Value: 1.225 kg/m^3 at 20 degC and 101.325 kPa
 * ISO 2533:1975 Standard Atmosphere
 */
export const AIR_DENSITY_STANDARD: number = 1.225;

/**
 * Speed of sound in air at standard conditions
 * Value: 343 m/s at 20 degC
 * IEC 61672-1:2013
 */
export const SPEED_OF_SOUND_AIR: number = 343;

/**
 * Reference temperature for acoustic measurements
 * Value: 20 degrees Celsius
 * ISO 2533:1975
 */
export const REFERENCE_TEMPERATURE: number = 20;

/**
 * Reference atmospheric pressure
 * Value: 101.325 kPa (standard atmospheric pressure at sea level)
 * ISO 2533:1975
 */
export const REFERENCE_PRESSURE_ATMOSPHERIC: number = 101325;

/**
 * Reference relative humidity for acoustic measurements
 * Value: 70%
 * IEC 61672-1:2013
 */
export const REFERENCE_HUMIDITY: number = 70;

// ======================================================================================
// OCTAVE BAND FREQUENCIE (IEC 61260-1:2014)
// ======================================================================================

/**
 * Standard octave band center frequencies
 * IEC 61260-1:2014 Octave-band and fractional-octave-band filters
 */
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

/**
 * Array of standard octave band center frequencies in Hz
 * Ordered from lowest to highest frequency
 * IEC 61260-1:2014
 * 
 * @example
 * // Calculate SPL for each octave band
 * OCTAVE_BAND_FREQUENCIES.forEach(freq => {
 *   const spl = calculateSPL(signal, freq);
 *   console.log(`${freq}Hz: ${spl} dB`);
 * });
 */
export const OCTAVE_BAND_FREQUENCIES: readonly number[] = [
  OCTAVE_BANDS.BAND_31_5,
  OCTAVE_BANDS.BAND_63,
  OCTAVE_BANDS.BAND_125,
  OCTAVE_BANDS.BAND_250,
  OCTAVE_BANDS.BAND_500,
  OCTAVE_BANDS.BAND_1000,
  OCTAVE_BANDS.BAND_2000,
  OCTAVE_BANDS.BAND_4000,
  OCTAVE_BANDS.BAND_8000,
  OCTAVE_BANDS.BAND_16000,
] as const;

// ======================================================================================
// FREQUENCY WEIGHTING COEFFICIENTS (IEC 61672-1:2013)
// ======================================================================================

/**
 * A-weighting correction values for octave band frequencies
 * Used for frequency weighting in sound level meters
 * Values in dB relative to 1kHz (0 dB)
 * IEC 61672-1:2013 Table 3
 */
export const A_WEIGHTING_COEFFICIENTS: Record<number, number> = {
  31.5: -39.4,
  63: -26.2,
  125: -16.1,
  250: -8.6,
  500: -3.2,
  1000: 0.0,
  2000: 1.2,
  4000: 1.0,
  8000: -1.1,
  16000: -6.6,
};

/**
 * C-weighting correction values for octave band frequencies
 * Used for frequency weighting in sound level meters
 * Values in dB relative to 1kHz (0 dB)
 * IEC 61672-1:2013 Table 3
 */
export const C_WEIGHTING_COEFFICIENTS: Record<number, number> = {
  31.5: -3.0,
  63: -0.8,
  125: -0.2,
  250: 0.0,
  500: 0.0,
  1000: 0.0,
  2000: -0.2,
  4000: -0.8,
  8000: -3.0,
  16000: -8.5,
};

/**
 * Z-weighting (zero) - flat frequency response
 * All values are 0 dB (no frequency weighting)
 * IEC 61672-1:2013
 */
export const Z_WEIGHTING_COEFFICIENTS: Record<number, number> = {
  31.5: 0.0,
  63: 0.0,
  125: 0.0,
  250: 0.0,
  500: 0.0,
  1000: 0.0,
  2000: 0.0,
  4000: 0.0,
  8000: 0.0,
  16000: 0.0,
};

// ======================================================================================
// CALCULATION DEFAULTS
// ======================================================================================

/**
 * Default measurement distance from sound source
 * Value: 1 meter
 */
export const DEFAULT_MEASUREMENT_DISTANCE: number = 1;

/**
 * Minimum readable SPL value
 * Value: 20 dB (typical lower limit for sound level meters)
 */
export const MIN_SPL_READABLE: number = 20;

/**
 * Maximum readable SPL value
 * Value: 140 dB (typical upper limit for sound level meters)
 * IEC 61672-1:2013
 */
export const MAX_SPL_READABLE: number = 140;

/**
 * Default time weighting for SPL measurements
 * Value: 'F' (Fast) - 125ms time constant
 * Options: 'F' (Fast), 'S' (Slow), 'I' (Impulse)
 * IEC 61672-1:2013
 */
export const DEFAULT_TIME_WEIGHTING: 'F' | 'S' | 'I' = 'F';

/**
 * Time weighting constants in seconds
 * IEC 61672-1:2013
 */
export const TIME_WEIGHTING_CONSTANTS = {
  FAST: 0.125,    // 125 ms
  SLOW: 1.0,      // 1 second
  IMPULSE: 0.035, // 35 ms rise, 1.5s decay
} as const;

// ======================================================================================
// BACKWARD COMPATIBILITY EXPORTS
// ======================================================================================

/** @deprecated Use REFERENCE_PRESSURE_AIR instead */
export const REFERENCE_PRESSURE = REFERENCE_PRESSURE_AIR;

/** @deprecated Use AIR_DENSITY_STANDARD instead */
export const AIR_DENSITY = AIR_DENSITY_STANDARD;

/** @deprecated Use SPEED_OF_SOUND_AIR instead */
export const SPEED_OF_SOUND = SPEED_OF_SOUND_AIR;

/** @deprecated Use MIN_SPL_READABLE instead */
export const MIN_SPL_READ = MIN_SPL_READBLE;
