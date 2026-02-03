/**
 * Tests for Quick Construction Tools
 */

import { describe, test, expect } from 'vitest';
import * as THREE from 'three';
import {
    getAvailableTrussLengths,
    findBestTrussForLength,
    extendTruss,
    duplicateTrussInDirection,
    fillGapBetweenTrusses,
    quickRotate,
    snapRotation
} from '../quickTools';
import { SceneObject } from '../../../types';

const createTruss = (
    id: string,
    position: [number, number, number] = [0, 0, 0],
    rotation: [number, number, number] = [0, 0, 0],
    model: string = 'truss-30'
): SceneObject => ({
    id,
    name: `Truss ${id}`,
    model,
    type: 'truss',
    position,
    rotation,
    scale: [1, 1, 1],
    layerId: 'rigging',
    color: '#d4d4d8',
    dimensions: { w: 3.0, h: 0.29, d: 0.29 }
});

describe('getAvailableTrussLengths', () => {
    test('returns array of truss lengths sorted descending', () => {
        const lengths = getAvailableTrussLengths();

        expect(lengths.length).toBeGreaterThan(0);
        expect(lengths[0].length).toBeGreaterThanOrEqual(lengths[lengths.length - 1].length);
    });

    test('excludes corner pieces', () => {
        const lengths = getAvailableTrussLengths();
        const hasCorner = lengths.some(t => t.model.includes('corner'));
        expect(hasCorner).toBe(false);
    });
});

describe('findBestTrussForLength', () => {
    test('finds exact match when available', () => {
        const model = findBestTrussForLength(3.0);
        expect(model).toBe('truss-30');
    });

    test('finds closest smaller truss when exact not available', () => {
        const model = findBestTrussForLength(2.7);
        expect(model).toBe('truss-25'); // 2.5m is closest that doesn't exceed
    });

    test('returns smallest truss for very small lengths', () => {
        const model = findBestTrussForLength(0.3);
        expect(model).toBeDefined();
    });
});

describe('extendTruss', () => {
    test('extends truss in the correct direction', () => {
        const truss = createTruss('t1', [0, 0, 0]);
        const result = extendTruss(truss, []);

        expect(result.success).toBe(true);
        expect(result.newObject).toBeDefined();
        expect(result.newObject?.type).toBe('truss');
    });

    test('positions new truss at end of existing', () => {
        const truss = createTruss('t1', [0, 2, 0]);
        const result = extendTruss(truss, []);

        expect(result.success).toBe(true);
        // New truss should be offset by the truss length
        const newPos = result.newObject?.position;
        expect(newPos).toBeDefined();
        // Should be offset by 3m (truss width) in some direction
        const offset = Math.abs(newPos![0]) + Math.abs(newPos![2]);
        expect(offset).toBeGreaterThan(2); // At least 2m offset
    });

    test('fails for non-truss objects', () => {
        const speaker: SceneObject = {
            ...createTruss('s1'),
            type: 'speaker'
        };
        const result = extendTruss(speaker, []);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });
});

describe('duplicateTrussInDirection', () => {
    test('duplicates forward with correct offset', () => {
        const truss = createTruss('t1', [0, 2, 0]);
        const result = duplicateTrussInDirection(truss, 'forward');

        expect(result.success).toBe(true);
        expect(result.newObject?.position![0]).toBeCloseTo(3, 1); // Width = 3m
    });

    test('duplicates backward with negative offset', () => {
        const truss = createTruss('t1', [5, 2, 0]);
        const result = duplicateTrussInDirection(truss, 'backward');

        expect(result.success).toBe(true);
        expect(result.newObject?.position![0]).toBeCloseTo(2, 1); // 5 - 3 = 2
    });

    test('respects truss rotation when duplicating', () => {
        // Rotated 90° around Y
        const truss = createTruss('t1', [0, 2, 0], [0, Math.PI / 2, 0]);
        const result = duplicateTrussInDirection(truss, 'forward');

        expect(result.success).toBe(true);
        // Forward should now be along Z axis
        expect(Math.abs(result.newObject?.position![0]!)).toBeLessThan(0.1);
        expect(Math.abs(result.newObject?.position![2]!)).toBeGreaterThan(2);
    });

    test('fails for non-truss objects', () => {
        const speaker: SceneObject = {
            ...createTruss('s1'),
            type: 'speaker'
        };
        const result = duplicateTrussInDirection(speaker, 'forward');

        expect(result.success).toBe(false);
    });
});

describe('fillGapBetweenTrusses', () => {
    test('calculates fill pieces for gap', () => {
        const truss1 = createTruss('t1', [0, 2, 0]);
        const truss2 = createTruss('t2', [9, 2, 0]); // 6m gap between ends

        const result = fillGapBetweenTrusses(truss1, truss2);

        expect(result.success).toBe(true);
        expect(result.pieces.length).toBeGreaterThan(0);
        expect(result.totalLength).toBeGreaterThan(0);
    });

    test('reports already connected for close trusses', () => {
        const truss1 = createTruss('t1', [0, 2, 0]);
        const truss2 = createTruss('t2', [3, 2, 0]); // Right at connection point

        const result = fillGapBetweenTrusses(truss1, truss2);

        expect(result.success).toBe(false);
        expect(result.error).toContain('already connected');
    });

    test('fails for non-truss objects', () => {
        const truss = createTruss('t1');
        const speaker: SceneObject = { ...createTruss('s1'), type: 'speaker' };

        const result = fillGapBetweenTrusses(truss, speaker);

        expect(result.success).toBe(false);
    });
});

describe('quickRotate', () => {
    test('rotates by positive degrees', () => {
        const truss = createTruss('t1', [0, 0, 0], [0, 0, 0]);
        const newRot = quickRotate(truss, 'y', 15);

        expect(newRot[1]).toBeCloseTo(15 * Math.PI / 180, 4);
    });

    test('rotates by negative degrees', () => {
        const truss = createTruss('t1', [0, 0, 0], [0, 0, 0]);
        const newRot = quickRotate(truss, 'y', -15);

        expect(newRot[1]).toBeCloseTo(-15 * Math.PI / 180, 4);
    });

    test('accumulates with existing rotation', () => {
        const truss = createTruss('t1', [0, 0, 0], [0, Math.PI / 4, 0]);
        const newRot = quickRotate(truss, 'y', 15);

        expect(newRot[1]).toBeCloseTo(Math.PI / 4 + 15 * Math.PI / 180, 4);
    });
});

describe('snapRotation', () => {
    test('snaps to nearest 15 degree increment', () => {
        const rotation: [number, number, number] = [0, 0.28, 0]; // ~16 degrees
        const snapped = snapRotation(rotation, 15);

        expect(snapped[1]).toBeCloseTo(15 * Math.PI / 180, 2);
    });

    test('snaps to 0 when close', () => {
        const rotation: [number, number, number] = [0, 0.05, 0]; // ~3 degrees
        const snapped = snapRotation(rotation, 15);

        expect(snapped[1]).toBeCloseTo(0, 4);
    });

    test('snaps all axes', () => {
        const rotation: [number, number, number] = [0.28, 0.52, 0.79];
        const snapped = snapRotation(rotation, 15);

        // All should be multiples of 15 degrees
        const inc = 15 * Math.PI / 180;
        expect(snapped[0] % inc).toBeLessThan(0.01);
        expect(snapped[1] % inc).toBeLessThan(0.01);
        expect(snapped[2] % inc).toBeLessThan(0.01);
    });
});
