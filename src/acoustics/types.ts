/**
 * @module acoustics/types
 * @description TypeScript type definitions for the acoustic analysis module.
 * Provides interfaces and enums for octave-band analysis, SPL results,
 * and acoustic measurement points.
 *
 * @see RULE-001: No JSX in .ts files
 * @see RULE-006: No implicit 'any' types
 */

import {
  OCTAVE_BAND_CENTER_FREQUENCIES,
  THIRD_OCTAVE_BAND_CENTER_FREQUENCIES,
} from './constants';

// =============================================================================
// Enums
// =============================================================================

/**
 * Frequency weighting type per IEC 61672-1:2013.
 */
export enum FrequencyWeighting {
  /** A-weighting: models human ear sensitivity */
  A = 'A',
  /** C-weighting: flat response with roll-off at extremes */
  C = 'C',
  /** Z-weighting: no frequency weighting (linear) */
  Z = 'Z',
}

/**
 * Time weighting constant for sound level measurements.
 * Per IEC 61672-1:2013.
 */
export enum TimeWeighting {
  /** Fast: 125 ms time constant */
  Fast = 'Fast',
  /** Slow: 1000 ms time constant */
  Slow = 'Slow',
  /** Impulse: 35 ms rise, 1500 ms decay */
  Impulse = 'Impulse',
}

/**
 * Band type for frequency analysis.
 */
export enum BandType {
  /** Full octave band analysis per IEC 61260-1 */
  Octave = 'octave',
  /** One-third octave band analysis per IEC 61260-1 */
  ThirdOctave = 'third-octave',
}

// =============================================================================
// Core Interfaces
// =============================================================================

/**
 * Represents a single octave or third-octave band measurement.
 */
export interface OctaveBand {
  /** Center frequency of the band in Hz */
  readonly centerFrequency: number;
  /** Lower edge frequency of the band in Hz */
  readonly lowerFrequency: number;
  /** Upper edge frequency of the band in Hz */
  readonly upperFrequency: number;
  /** Measured SPL level in the band (dB) */
  readonly level: number;
  /** A-weighted level in the band (dBA) */
  readonly aWeightedLevel: number;
  /** Band type (octave or third-octave) */
  readonly bandType: BandType;
}

/**
 * Result of an SPL analysis computation.
 */
export interface SPLResult {
  /** Overall broadband SPL (dB, Z-weighted) */
  readonly overallLevel: number;
  /** Overall A-weighted SPL (dBA) */
  readonly overallAWeighted: number;
  /** Individual band results */
  readonly bands: readonly OctaveBand[];
  /** Frequency weighting applied */
  readonly frequencyWeighting: FrequencyWeighting;
  /** Time weighting applied */
  readonly timeWeighting: TimeWeighting;
  /** Band type used for analysis */
  readonly bandType: BandType;
  /** Timestamp of the measurement (ISO 8601) */
  readonly timestamp: string;
  /** Whether the result is valid (all bands within expected ranges) */
  readonly isValid: boolean;
}

/**
 * Represents a spatial measurement point in the acoustic field.
 */
export interface AcousticPoint {
  /** Unique identifier for the measurement point (RULE-002) */
  readonly id: string;
  /** Human-readable name/label */
  readonly name: string;
  /** X coordinate in meters */
  readonly x: number;
  /** Y coordinate in meters */
  readonly y: number;
  /** Z coordinate in meters */
  readonly z: number;
  /** Distance from the source in meters */
  readonly distanceFromSource: number;
  /** SPL measurement result at this point */
  readonly splResult: SPLResult | null;
}

/**
 * Configuration for an SPL analysis run.
 */
export interface SPLAnalysisConfig {
  /** Sample rate of the input signal in Hz */
  readonly sampleRate: number;
  /** FFT window size (must be power of 2) */
  readonly fftSize: number;
  /** Frequency weighting to apply */
  readonly frequencyWeighting: FrequencyWeighting;
  /** Time weighting to apply */
  readonly timeWeighting: TimeWeighting;
  /** Band type for frequency analysis */
  readonly bandType: BandType;
  /** Overlap ratio for FFT windows (0.0 to 0.99) */
  readonly overlapRatio: number;
}

/**
 * Input signal data for SPL analysis.
 */
export interface AudioSignalInput {
  /** Raw audio samples (normalized to -1.0 to 1.0) */
  readonly samples: readonly number[];
  /** Sample rate in Hz */
  readonly sampleRate: number;
  /** Number of channels (1 = mono, 2 = stereo) */
  readonly channels: number;
  /** Duration in seconds */
  readonly duration: number;
}

// =============================================================================
// Type Guards (RULE-005: Explicit return types)
// =============================================================================

/**
 * Type guard to validate an OctaveBand object.
 */
export function isValidOctaveBand(band: unknown): band is OctaveBand {
  if (typeof band !== 'object' || band === null) {
    return false;
  }
  const b = band as Record<string, unknown>;
  return (
    typeof b.centerFrequency === 'number' &&
    typeof b.lowerFrequency === 'number' &&
    typeof b.upperFrequency === 'number' &&
    typeof b.level === 'number' &&
    typeof b.aWeightedLevel === 'number' &&
    typeof b.bandType === 'string' &&
    (b.bandType === BandType.Octave || b.bandType === BandType.ThirdOctave)
  );
}

/**
 * Type guard to validate an SPLResult object.
 */
export function isValidSPLResult(result: unknown): result is SPLResult {
  if (typeof result !== 'object' || result === null) {
    return false;
  }
  const r = result as Record<string, unknown>;
  return (
    typeof r.overallLevel === 'number' &&
    typeof r.overallAWeighted === 'number' &&
    Array.isArray(r.bands) &&
    typeof r.frequencyWeighting === 'string' &&
    typeof r.timeWeighting === 'string' &&
    typeof r.bandType === 'string' &&
    typeof r.timestamp === 'string' &&
    typeof r.isValid === 'boolean'
  );
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Valid octave band center frequency (constrained to IEC 61260-1 standard values).
 */
export type OctaveBandFrequency = typeof OCTAVE_BAND_CENTER_FREQUENCIES[number];

/**
 * Valid third-octave band center frequency.
 */
export type ThirdOctaveBandFrequency = typeof THIRD_OCTAVE_BAND_CENTER_FREQUENCIES[number];

/**
 * SPL value in decibels. Constrained to valid acoustic range.
 */
export type SPLDecibels = number;

/**
 * Pressure value in Pascals.
 */
export type PressurePascals = number;
