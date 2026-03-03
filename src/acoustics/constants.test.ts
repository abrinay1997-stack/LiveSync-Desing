/**
 * Unit Tests for Acoustic Constants Module
 * 
 * Tests all exported constants and utility functions
 * to ensure IEC/ISO compliance and correctness.
 * 
 * @module acoustics/constants.test
 * @version 1.0.0
 */

import { describe, it, expect } from 'vitest';
import {
  // Reference values
  REFERENCE_PRESSURE,
  REFERENCE_PRESSURE_WATER,
  AIR_DENSITY,
  SPEED_OF_SOUND,
  REFERENCE_TEMPERATURE,
  REFERENCE_HUMIDITY,
  
  // Octave bands
  OCTAVE_BANDS,
  OCTAVE_BAND_FREQUENCIES,
  
  // Weighting
  A_WEIGHTING_COEFFICIENTS,
  
  // Calculation defaults
  DEFAULT_MEASUREMENT_DISTANCE,
  MIN_SPL_READ,
  
  // Enhanced constants
  REFERENCE_PRESSURE_AIR,
  AIR_DENSITY_STD,
  SPEED_OF_SOUND_STD,
  OCTAVE_BANDS_STD,
  THIRD_OCTAVE_BANDS_STD,
  A_WEIGHTING_STD,
  C_WEIGHTING_STD,
  LOG_BASE,
  FIELD_MULTIPLIER,
  PAIN_THRESHOLD_SPL_STD,
  STANDARD_TEMPERATURE_KELVIN,
  STANDARD_ATMOSPHERIC_PRESSURE,
  MOLAR_MASS_AIR,
  GAS_CONSTANT,
  
  // Utility functions
  getAcousticImpedance,
  getWavelength,
  getWaveNumber,
} from './constants';

describe('Acoustic Constants', () => {
  describe('Reference Values (IEC 61672-1, ISO 1683)', () => {
    it('should have correct reference pressure in air (20 μPa)', () => {
      expect(REFERENCE_PRESSURE).toBe(20e-6);
      expect(REFERENCE_PRESSURE_AIR).toBe(20e-6);
    });

    it('should have correct reference pressure in water (1 μPa)', () => {
      expect(REFERENCE_PRESSURE_WATER).toBe(1e-6);
    });

    it('should have correct air density at sea level (1.225 kg/m³)', () => {
      expect(AIR_DENSITY)