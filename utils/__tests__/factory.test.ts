import { describe, test, expect } from 'vitest';
import { createSceneObject, cloneSceneObject } from '../factory';

describe('createSceneObject', () => {
  test('creates a valid speaker object from la-k2 key', () => {
    const obj = createSceneObject('la-k2', [0, 0, 0]);
    expect(obj).not.toBeNull();
    expect(obj!.model).toBe('la-k2');
    expect(obj!.type).toBe('speaker');
    expect(obj!.name).toContain('K2');
    expect(obj!.id).toBeDefined();
    expect(obj!.position).toEqual([0, 0, 0]);
  });

  test('returns null for unknown asset key', () => {
    const obj = createSceneObject('nonexistent-key', [0, 0, 0]);
    expect(obj).toBeNull();
  });

  test('sets layerId to audio for speakers', () => {
    const obj = createSceneObject('la-k2', [0, 0, 0]);
    expect(obj!.layerId).toBe('audio');
  });

  test('sets layerId to rigging for truss', () => {
    const obj = createSceneObject('truss-30', [0, 0, 0]);
    expect(obj!.layerId).toBe('rigging');
  });

  test('creates arrayConfig for line array speakers', () => {
    const obj = createSceneObject('la-k2', [0, 0, 0]);
    expect(obj!.arrayConfig).toBeDefined();
    expect(obj!.arrayConfig!.enabled).toBe(true);
    expect(obj!.arrayConfig!.boxCount).toBe(6);
    expect(obj!.arrayConfig!.splayAngles).toHaveLength(6);
  });

  test('disables array for non-line-array speakers (monitors)', () => {
    const obj = createSceneObject('la-x15', [0, 0, 0]);
    expect(obj!.arrayConfig).toBeDefined();
    expect(obj!.arrayConfig!.enabled).toBe(false);
  });
});

describe('cloneSceneObject', () => {
  test('clone creates a new id but preserves properties', () => {
    const original = createSceneObject('la-k2', [5, 10, 15])!;
    const clone = cloneSceneObject(original);

    expect(clone.id).not.toBe(original.id);
    expect(clone.model).toBe(original.model);
    expect(clone.type).toBe(original.type);
    expect(clone.layerId).toBe(original.layerId);
  });

  test('clone offsets position by 1 in x', () => {
    const original = createSceneObject('la-k2', [5, 10, 15])!;
    const clone = cloneSceneObject(original);

    expect(clone.position[0]).toBe(original.position[0] + 1);
    expect(clone.position[1]).toBe(original.position[1]);
    expect(clone.position[2]).toBe(original.position[2]);
  });

  test('clone deep-copies splayAngles array', () => {
    const original = createSceneObject('la-k2', [0, 0, 0])!;
    original.arrayConfig!.splayAngles[0] = 3;

    const clone = cloneSceneObject(original);
    clone.arrayConfig!.splayAngles[0] = 7;

    expect(original.arrayConfig!.splayAngles[0]).toBe(3);
    expect(clone.arrayConfig!.splayAngles[0]).toBe(7);
  });
});
