import { describe, it, expect } from 'vitest';
import {
  BGV_C1_SAFETY_FACTOR,
  GRAVITY,
  DEFAULT_WLL_KG,
  MAX_DYNAMIC_LOAD_KG,
  MAX_DYNAMIC_LOAD_N,
  MAX_BRIDLE_ANGLE_DEG,
  MIN_SLING_ANGLE_DEG,
  computeMaxDynamicLoad,
  isLoadSafe,
  slingCapacityFactor,
  kgToNewtons,
  newtonsToKg,
} from '../physicsCompliance';

describe('physicsCompliance', () => {
  // ─── Constants ───────────────────────────────────────────────────────────────

  describe('BGV-C1 constants', () => {
    it('should define safety factor as 5 (BGV-C1 5:1 rule)', () => {
      expect(BGV_C1_SAFETY_FACTOR).toBe(5);
    });

    it('should use standard gravitational acceleration', () => {
      expect(GRAVITY).toBeCloseTo(9.80665, 5);
    });

    it('should set default WLL to 1000 kg (1-ton hoist)', () => {
      expect(DEFAULT_WLL_KG).toBe(1000);
    });

    it('should compute MAX_DYNAMIC_LOAD_KG as WLL / safety factor', () => {
      expect(MAX_DYNAMIC_LOAD_KG).toBe(DEFAULT_WLL_KG / BGV_C1_SAFETY_FACTOR);
      expect(MAX_DYNAMIC_LOAD_KG).toBe(200);
    });

    it('should compute MAX_DYNAMIC_LOAD_N from kg and gravity', () => {
      expect(MAX_DYNAMIC_LOAD_N).toBeCloseTo(200 * 9.80665, 2);
      expect(MAX_DYNAMIC_LOAD_N).toBe(MAX_DYNAMIC_LOAD_KG * GRAVITY);
    });

    it('should define maximum bridle angle as 60 degrees', () => {
      expect(MAX_BRIDLE_ANGLE_DEG).toBe(60);
    });

    it('should define minimum sling angle as 30 degrees', () => {
      expect(MIN_SLING_ANGLE_DEG).toBe(30);
    });
  });

  // ─── computeMaxDynamicLoad ─────────────────────────────────────────────────

  describe('computeMaxDynamicLoad', () => {
    it('should return WLL / safety factor with defaults', () => {
      expect(computeMaxDynamicLoad(1000)).toBe(200);
    });

    it('should accept a custom safety factor', () => {
      expect(computeMaxDynamicLoad(1000, 10)).toBe(100);
    });

    it('should handle fractional results', () => {
      expect(computeMaxDynamicLoad(500, 3)).toBeCloseTo(166.6667, 3);
    });

    it('should throw RangeError for non-positive WLL', () => {
      expect(() => computeMaxDynamicLoad(0)).toThrow(RangeError);
      expect(() => computeMaxDynamicLoad(-100)).toThrow(RangeError);
    });

    it('should throw RangeError for non-positive safety factor', () => {
      expect(() => computeMaxDynamicLoad(1000, 0)).toThrow(RangeError);
      expect(() => computeMaxDynamicLoad(1000, -1)).toThrow(RangeError);
    });
  });

  // ─── isLoadSafe ────────────────────────────────────────────────────────────

  describe('isLoadSafe', () => {
    it('should return true when load is below limit', () => {
      expect(isLoadSafe(100)).toBe(true);
    });

    it('should return true when load equals limit exactly', () => {
      expect(isLoadSafe(200)).toBe(true);
    });

    it('should return false when load exceeds limit', () => {
      expect(isLoadSafe(201)).toBe(false);
    });

    it('should work with custom WLL', () => {
      // WLL=500, SF=5 → max 100 kg
      expect(isLoadSafe(99, 500)).toBe(true);
      expect(isLoadSafe(101, 500)).toBe(false);
    });

    it('should work with custom safety factor', () => {
      // WLL=1000, SF=10 → max 100 kg
      expect(isLoadSafe(100, 1000, 10)).toBe(true);
      expect(isLoadSafe(101, 1000, 10)).toBe(false);
    });
  });

  // ─── slingCapacityFactor ───────────────────────────────────────────────────

  describe('slingCapacityFactor', () => {
    it('should return 1.0 for 180 degrees (vertical lift)', () => {
      expect(slingCapacityFactor(180)).toBeCloseTo(1.0, 10);
    });

    it('should return Math.SQRT2/2 for 90 degrees', () => {
      expect(slingCapacityFactor(90)).toBeCloseTo(Math.SQRT2 / 2, 10);
    });

    it('should return sqrt(3)/2 for 120 degrees', () => {
      expect(slingCapacityFactor(120)).toBeCloseTo(Math.sqrt(3) / 2, 10);
    });

    it('should return 0.5 for 60 degrees', () => {
      expect(slingCapacityFactor(60)).toBeCloseTo(0.5, 10);
    });

    it('should throw for zero angle', () => {
      expect(() => slingCapacityFactor(0)).toThrow(RangeError);
    });

    it('should throw for negative angle', () => {
      expect(() => slingCapacityFactor(-10)).toThrow(RangeError);
    });

    it('should throw for angle > 180', () => {
      expect(() => slingCapacityFactor(181)).toThrow(RangeError);
    });
  });

  // ─── Unit conversions ──────────────────────────────────────────────────────

  describe('kgToNewtons / newtonsToKg', () => {
    it('should convert 1 kg to ~9.80665 N', () => {
      expect(kgToNewtons(1)).toBeCloseTo(9.80665, 5);
    });

    it('should convert 100 kg to ~980.665 N', () => {
      expect(kgToNewtons(100)).toBeCloseTo(980.665, 3);
    });

    it('should convert 9.80665 N back to 1 kg', () => {
      expect(newtonsToKg(9.80665)).toBeCloseTo(1, 5);
    });

    it('should round-trip correctly', () => {
      const kg = 42.5;
      expect(newtonsToKg(kgToNewtons(kg))).toBeCloseTo(kg, 10);
    });

    it('should handle zero', () => {
      expect(kgToNewtons(0)).toBe(0);
      expect(newtonsToKg(0)).toBe(0);
    });
  });
});
