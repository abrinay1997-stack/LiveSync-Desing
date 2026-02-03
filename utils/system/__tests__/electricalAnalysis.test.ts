import { describe, test, expect } from 'vitest';
import { calculateParallelImpedance, calculateHeadroom } from '../electricalAnalysis';

describe('calculateParallelImpedance', () => {
  test('single speaker returns same impedance', () => {
    expect(calculateParallelImpedance([8])).toBe(8);
  });

  test('two 8-ohm speakers in parallel equal 4 ohms', () => {
    expect(calculateParallelImpedance([8, 8])).toBe(4);
  });

  test('three 8-ohm speakers in parallel equal ~2.667 ohms', () => {
    const result = calculateParallelImpedance([8, 8, 8]);
    expect(result).toBeCloseTo(2.667, 2);
  });

  test('empty array returns 0', () => {
    expect(calculateParallelImpedance([])).toBe(0);
  });

  test('zero impedance returns 0 (short circuit)', () => {
    expect(calculateParallelImpedance([8, 0, 4])).toBe(0);
  });
});

describe('calculateHeadroom', () => {
  test('amp power below speaker RMS results in clip status', () => {
    const result = calculateHeadroom(400, 600, 1200);
    expect(result.status).toBe('clip');
    expect(result.headroomDB).toBe(-3);
  });

  test('amp power above speaker peak results in limit status', () => {
    const result = calculateHeadroom(2500, 600, 1200);
    expect(result.status).toBe('limit');
  });

  test('amp power between RMS and peak results in safe status', () => {
    const result = calculateHeadroom(1000, 600, 1200);
    expect(result.status).toBe('safe');
  });

  test('headroom dB calculation is correct (10 * log10(ratio))', () => {
    // ampPower=1000, rms=500 => ratio=2, dB = 10*log10(2) ~ 3.0103
    const result = calculateHeadroom(1000, 500, 2000);
    const expectedDB = 10 * Math.log10(1000 / 500);
    expect(result.headroomDB).toBeCloseTo(expectedDB, 4);
    expect(result.status).toBe('safe');
  });
});
