import { describe, test, expect } from 'vitest';
import { Vector3 } from 'three';
import { calculateArrayMechanicalShape, generateDispersionGeometry } from '../arrayMath';
import { ArrayConfig } from '../../types';

const makeConfig = (boxCount: number, splayAngles?: number[]): ArrayConfig => ({
  enabled: true,
  boxCount,
  siteAngle: 0,
  splayAngles: splayAngles || Array(boxCount).fill(0),
  showThrowLines: true,
  throwDistance: 20,
});

describe('calculateArrayMechanicalShape', () => {
  const boxHeight = 0.35;

  test('array with 1 box returns 1 transform', () => {
    const result = calculateArrayMechanicalShape(makeConfig(1), boxHeight);
    expect(result).toHaveLength(1);
  });

  test('array with 6 boxes returns 6 transforms', () => {
    const result = calculateArrayMechanicalShape(makeConfig(6), boxHeight);
    expect(result).toHaveLength(6);
  });

  test('first box position is at origin', () => {
    const result = calculateArrayMechanicalShape(makeConfig(3), boxHeight);
    expect(result[0].position.x).toBeCloseTo(0);
    expect(result[0].position.y).toBeCloseTo(0);
    expect(result[0].position.z).toBeCloseTo(0);
  });

  test('splay angles affect rotation of subsequent boxes', () => {
    const flat = calculateArrayMechanicalShape(makeConfig(3, [0, 0, 0]), boxHeight);
    const splayed = calculateArrayMechanicalShape(makeConfig(3, [0, 5, 5]), boxHeight);

    // With splay angles, subsequent boxes should have different rotations
    expect(splayed[1].rotation.x).not.toBeCloseTo(flat[1].rotation.x);
    expect(splayed[2].rotation.x).not.toBeCloseTo(flat[2].rotation.x);
  });

  test('box positions progress downward (negative Y)', () => {
    const result = calculateArrayMechanicalShape(makeConfig(4), boxHeight);
    // With zero splay and zero site angle, boxes stack straight down
    for (let i = 1; i < result.length; i++) {
      expect(result[i].position.y).toBeLessThan(result[i - 1].position.y);
    }
  });
});

describe('generateDispersionGeometry', () => {
  test('creates valid BufferGeometry', () => {
    const geo = generateDispersionGeometry({ h: 90, v: 10 }, 20);
    expect(geo).toBeDefined();
    expect(geo.getAttribute('position')).toBeDefined();
    expect(geo.index).not.toBeNull();
  });

  test('has correct number of vertices', () => {
    const geo = generateDispersionGeometry({ h: 110, v: 10 }, 15);
    const posAttr = geo.getAttribute('position');
    // The geometry defines 6 vertices: tip + 4 corners + 1 loop-back
    expect(posAttr.count).toBe(6);
  });
});
