/**
 * Unit Tests for Acoustic Constants Module
 * 
 * Tests all exported constants to ensure IEC/ISO compliance and correctness.
 * 
 * @module acoustics/constants.test
 * @version 1.1.0
 */

import { describe, it, expect } from 'vitest';
import {
  // Reference values
  REFERENCE_PRESSURE,
  REFERENCE_PRESSURE_AIR,
  REFERENCE_PRESSURE_WATER,
  REFERENCE_INTENSITY,
  REFERENCE_POWER,
  
  // Atmospheric conditions
  AIR_DENSITY,
  AIR_DENSITY_STANDARD,
  SPEED_OF_SOUND,
  SPEED_OF_SOUND_AIR,
  REFERENCE_TEMPERATURE,
  REFERENCE_PRESSURE_ATMOSPHERIC,
  REFERENCE_HUMIDITY,
  
  // Octave bands
  OCTAVE_BANDS,
  OCTAVE_BAND_FREQUENCIES,
  
  // Weighting coefficients
  A_WEIGHTING_COEFFICIENTS,
  C_WEIGHTING_COEFFICIENTS,
  Z_WEIGHTING_COEFFICIENTS,
  
  // Calculation defaults
  DEFAULT_MEASUREMENT_DISTANCE,
  MIN_SPL_READ,
  MIN_SPL_READABLE,
  MAX_SPL_READABLE,
  DEFAULT_TIME_WEIGHTING,
  TIME_WEIGHTING_CONSTANTS,
} from './constants';

describe('Acoustic Constants', () => {
  describe('Reference Values (IEC 61672-1, ISO 1683)', () => {
    it('should have correct reference pressure in air (20 microPa)', () => {
      expect(REFERENCE_PRESSURE).toBe(20e-6);
      expect(REFERENCE_PRESSURE_AIR).toBe(20e-6);
    });

    it('should have correct reference pressure in water (1 microPa)', () => {
      expect(REFERENCE_PRESSURE_WATER).toBe(1e-6);
    });

    it('should have correct reference intensity (1 picoWatt/m^2)', () => {
      expect(REFERENCE_INTENSITY).toBe(1e-12);
    });

    it('should have correct reference power (1 picoWatt)', () => {
      expect(REFERENCE_POWER).toBe(1e-12);
    });
  });

  describe('Atmospheric Conditions (ISO 2533, IEC 61672-1)', () => {
    it('should have correct air density at sea level (1.225 kg/m^3)', () => {
      expect(AIR_DENSITY).toBe(1.225);
      expect(AIR_DENSITY_STANDARD).toBe(1.225);
    });

    it('should have correct speed of sound (343 m/s at 20 degC)', () => {
      expect(SPEED_OF_SOUND).toBe(343);
      expect(SPEED_OF_SOUND_AIR).toBe(343);
    });

    it('should have correct reference temperature (20 degC)', () => {
      expect(REFERENCE_TEMPERATURE).toBe(20);
    });

    it('should have correct reference atmospheric pressure (101325 Pa)', () => {
      expect(REFERENCE_PRESSURE_ATMOSPHERIC).toBe(101325);
    });

    it('should have correct reference humidity (70%)', () => {
      expect(REFERENCE_HUMIDITY).toBe(70);
    });
  });

  describe('Octave Band Frequencies (IEC 61260-1:2014)', () => {
    it('should have correct octave band constants', () => {
      expect(OCTAVE_BANDS.BAND_31_5).toBe(31.5);
      expect(OCTAVE_BANDS.BAND_63).toBe(63);
      expect(OCTAVE_BANDS.BAND_125).toBe(125);
      expect(OCTAVE_BANDS.BAND_250).toBe(250);
      expect(OCTAVE_BANDS.BAND_500).toBe(500);
      expect(OCTAVE_BANDS.BAND_1000).toBe(1000);
      expect(OCTAVE_BANDS.BAND_2000).toBe(2000);
      expect(OCTAVE_BANDS.BAND_4000).toBe(4000);
      expect(OCTAVE_BANDS.BAND_8000).toBe(8000);
      expect(OCTAVE_BANDS.BAND_16000).toBe(16000);
    });

    it('should have correct octave band frequencies array', () => {
      expect(OCTAVE_BAND_FREQUENCIES).toHaveLength(10);
      expect(OCTAVE_BAND_FREQUENCIES[0]).toBe(31.5);
      expect(OCTAVE_BAND_FREQUENCIES[2]).toBe(125);
      expect(OCTAVE_BAND_FREQUENCIES[5]).toBe(1000);
      expect(OCTAVE_BAND_FREQUENCIES[9]).toBe(16000);
    });

    it('should have frequencies in ascending order', () => {
      for (let i = 1; i < OCTAVE_BAND_FREQUENCIES.length; i++) {
        expect(OCTAVE_BAND_FREQUENCIES[i]).toBeGreaterThan(OCTAVE_BAND_FREQUENCIES[i - 1]);
      }
    });
  });

  describe('A-Weighting Coefficients (IEC 61672-1:2013)', () => {
    it('should have correct A-weighting values', () => {
      expect(A_WEIGHTING_COEFFICIENTS[31.5]).toBe(-39.4);
      expect(A_WEIGHTING_COEFFICIENTS[63]).toBe(-26.2);
      expect(A_WEIGHTING_COEFFICIENTS[125]).toBe(-16.1);
      expect(A_WEIGHTING_COEFFICIENTS[250]).toBe(-8.6);
      expect(A_WEIGHTING_COEFFICIENTS[500]).toBe(-3.2);
      expect(A_WEIGHTING_COEFFICIENTS[1000]).toBe(0.0);
      expect(A_WEIGHTING_COEFFICIENTS[2000]).toBe(1.2);
      expect(A_WEIGHTING_COEFFICIENTS[4000]).toBe(1.0);
      expect(A_WEIGHTING_COEFFICIENTS[8000]).toBe(-1.1);
      expect(A_WEIGHTING_COEFFICIENTS[16000]).toBe(-6.6);
    });

    it('should have 1kHz as reference (0 dB)', () => {
      expect(A_WEIGHTING_COEFFICIENTS[1000]).toBe(0.0);
    });
  });

  describe('C-Weighting Coefficients (IEC 61672-1:2013)', () => {
    it('should have correct C-weighting values', () => {
      expect(C_WEIGHTING_COEFFICIENTS[31.5]).toBe(-3.0);
      expect(C_WEIGHTING_COEFFICIENTS[63]).toBe(-0.8);
      expect(C_WEIGHTING_COEFFICIENTS[125]).toBe(-0.2);
      expect(C_WEIGHTING_COEFFICIENTS[250]).toBe(0.0);
      expect(C_WEIGHTING_COEFFICIENTS[1000]).toBe(0.0);
      expect(C_WEIGHTING_COEFFICIENTS[8000]).toBe(-3.0);
    });

    it('should have flat response at mid frequencies', () => {
      expect(C_WEIGHTING_COEFFICIENTS[250]).toBe(0.0);
      expect(C_WEIGHTING_COEFFICIENTS[500]).toBe(0.0);
      expect(C_WEIGHTING_COEFFICIENTS[1000]).toBe(0.0);
      expect(C_WEIGHTING_COEFFICIENTS[2000]).toBe(-0.2);
    });
  });

  describe('Z-Weighting (Zero/Flat) Coefficients', () => {
    it('should have all zero values', () => {
      Object.values(Z_WEIGHTING_COEFFICIENTS).forEach(value => {
        expect(value).toBe(0.0);
      });
    });
  });

  describe('Calculation Defaults', () => {
    it('should have correct default measurement distance', () => {
      expect(DEFAULT_MEASUREMENT_DISTANCE).toBe(1);
    });

    it('should have correct SPL range limits', () => {
      expect(MIN_SPL_READ).toBe(20);
      expect(MIN_SPL_READABLE).toBe(20);
      expect(MAX_SPL_READABLE).toBe(140);
    });

    it('should have correct default time weighting', () => {
      expect(DEFAULT_TIME_WEIGHTING).toBe('F');
    });

    it('should have correct time weighting constants', () => {
      expect(TIME_WEIGHTING_CONSTANTS.FAST).toBe(0.125);
      expect(TIME_WEIGHTING_CONSTANTS.SLOW).toBe(1.0);
      expect(TIME_WEIGHTING_CONSTANTS.IMPULSE).toBe(0.035);
    });
  });
});
