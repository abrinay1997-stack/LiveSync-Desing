import { describe, test, expect } from 'vitest';
import { Vector3 } from 'three';
import { snapValue, snapVector, snapCoords } from '../snapping';

describe('snapValue', () => {
  test('snapValue(0.3, 0.5) rounds to 0.5', () => {
    expect(snapValue(0.3, 0.5)).toBeCloseTo(0.5);
  });

  test('snapValue(0.7, 0.5) rounds to 0.5', () => {
    expect(snapValue(0.7, 0.5)).toBeCloseTo(0.5);
  });

  test('snapValue(0.8, 0.5) rounds to 1.0', () => {
    expect(snapValue(0.8, 0.5)).toBeCloseTo(1.0);
  });
});

describe('snapVector', () => {
  test('preserves Y when snapY is false (default)', () => {
    const vec = new Vector3(0.3, 1.77, 0.6);
    const result = snapVector(vec);
    expect(result.y).toBe(1.77);
  });

  test('snaps Y when snapY is true', () => {
    const vec = new Vector3(0.3, 1.77, 0.6);
    const result = snapVector(vec, true, true);
    expect(result.y).not.toBe(1.77);
    expect(result.y).toBeCloseTo(snapValue(1.77));
  });

  test('returns original vector when enabled is false', () => {
    const vec = new Vector3(0.33, 1.77, 0.66);
    const result = snapVector(vec, false);
    expect(result.x).toBe(0.33);
    expect(result.y).toBe(1.77);
    expect(result.z).toBe(0.66);
  });
});

describe('snapCoords', () => {
  test('snaps X and Z but not Y', () => {
    const [x, y, z] = snapCoords(0.3, 1.77, 0.6, true);
    expect(x).toBeCloseTo(snapValue(0.3));
    expect(y).toBe(1.77);
    expect(z).toBeCloseTo(snapValue(0.6));
  });

  test('returns original coordinates when disabled', () => {
    const [x, y, z] = snapCoords(0.33, 1.77, 0.66, false);
    expect(x).toBe(0.33);
    expect(y).toBe(1.77);
    expect(z).toBe(0.66);
  });
});
