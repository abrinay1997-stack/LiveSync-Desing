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
export const DEFAULT_SPEAKER_SENSITIVITY = 96; // dB
export const MAX_CALCULATION_DISTANCE = 1000; // meters
export const MIN_DISTANCE = 0.1; // meters

// Tolerance Values
export const A_WEIGHTING_TOLERANCE = 0.1; // dB
export const SPL_CALCULATION_TOLERANCE = 0.5; // dB
export const ATMOSPHERIC_ABSORPTION_TOLERANCE = 0.1; // dB/100m