/**
 * Tests for Connection Points System
 */

import { describe, test, expect } from 'vitest';
import * as THREE from 'three';
import {
    getTrussConnectionPoints,
    getAllConnectionPoints,
    findNearestConnectionPoint,
    calculateSnapToConnection,
    getExtensionGuides,
    calculateGapFill
} from '../connectionPoints';
import { SceneObject } from '../../../types';

const createTruss = (
    id: string,
    position: [number, number, number] = [0, 0, 0],
    rotation: [number, number, number] = [0, 0, 0],
    width: number = 3.0
): SceneObject => ({
    id,
    name: `Truss ${id}`,
    model: 'truss-30',
    type: 'truss',
    position,
    rotation,
    scale: [1, 1, 1],
    layerId: 'rigging',
    color: '#d4d4d8',
    dimensions: { w: width, h: 0.29, d: 0.29 }
});

describe('getTrussConnectionPoints', () => {
    test('returns two connection points for a truss', () => {
        const truss = createTruss('t1');
        const points = getTrussConnectionPoints(truss);

        expect(points).toHaveLength(2);
        expect(points[0].type).toBe('end');
        expect(points[1].type).toBe('end');
    });

    test('connection points are at correct positions for unrotated truss', () => {
        const truss = createTruss('t1', [5, 2, 3], [0, 0, 0], 3.0);
        const points = getTrussConnectionPoints(truss);

        // Left point should be at center - width/2
        expect(points[0].position.x).toBeCloseTo(5 - 1.5, 2);
        expect(points[0].position.y).toBeCloseTo(2, 2);
        expect(points[0].position.z).toBeCloseTo(3, 2);

        // Right point should be at center + width/2
        expect(points[1].position.x).toBeCloseTo(5 + 1.5, 2);
        expect(points[1].position.y).toBeCloseTo(2, 2);
        expect(points[1].position.z).toBeCloseTo(3, 2);
    });

    test('connection points rotate with truss', () => {
        // Rotate 90 degrees around Y axis
        const truss = createTruss('t1', [0, 0, 0], [0, Math.PI / 2, 0], 3.0);
        const points = getTrussConnectionPoints(truss);

        // After 90° Y rotation, local X axis maps to world Z axis
        // Left end (-1.5, 0, 0) local → (0, 0, 1.5) world
        // Right end (1.5, 0, 0) local → (0, 0, -1.5) world
        expect(points[0].position.x).toBeCloseTo(0, 2);
        expect(points[0].position.z).toBeCloseTo(1.5, 2);

        expect(points[1].position.x).toBeCloseTo(0, 2);
        expect(points[1].position.z).toBeCloseTo(-1.5, 2);
    });

    test('directions point outward from truss ends', () => {
        const truss = createTruss('t1');
        const points = getTrussConnectionPoints(truss);

        // Left direction should point in -X
        expect(points[0].direction.x).toBeCloseTo(-1, 2);
        expect(points[0].direction.y).toBeCloseTo(0, 2);
        expect(points[0].direction.z).toBeCloseTo(0, 2);

        // Right direction should point in +X
        expect(points[1].direction.x).toBeCloseTo(1, 2);
        expect(points[1].direction.y).toBeCloseTo(0, 2);
        expect(points[1].direction.z).toBeCloseTo(0, 2);
    });

    test('returns empty array for non-truss objects', () => {
        const speaker: SceneObject = {
            ...createTruss('s1'),
            type: 'speaker'
        };
        const points = getTrussConnectionPoints(speaker);
        expect(points).toHaveLength(0);
    });
});

describe('getAllConnectionPoints', () => {
    test('returns connection points from all trusses', () => {
        const objects = [
            createTruss('t1', [0, 0, 0]),
            createTruss('t2', [5, 0, 0]),
            createTruss('t3', [10, 0, 0])
        ];

        const points = getAllConnectionPoints(objects);
        expect(points).toHaveLength(6); // 2 points per truss × 3 trusses
    });

    test('filters out non-truss objects', () => {
        const objects: SceneObject[] = [
            createTruss('t1'),
            { ...createTruss('m1'), type: 'motor' },
            { ...createTruss('s1'), type: 'speaker' }
        ];

        const points = getAllConnectionPoints(objects);
        expect(points).toHaveLength(2); // Only the truss
    });
});

describe('findNearestConnectionPoint', () => {
    test('finds the nearest unconnected point', () => {
        const truss = createTruss('t1', [0, 0, 0], [0, 0, 0], 3.0);
        const points = getTrussConnectionPoints(truss);

        const testPos = new THREE.Vector3(1.6, 0, 0); // Close to right end
        const nearest = findNearestConnectionPoint(testPos, points, 1.0);

        expect(nearest).not.toBeNull();
        expect(nearest?.id).toBe('t1-right');
    });

    test('returns null if no point within max distance', () => {
        const truss = createTruss('t1', [0, 0, 0]);
        const points = getTrussConnectionPoints(truss);

        const testPos = new THREE.Vector3(10, 0, 0); // Far away
        const nearest = findNearestConnectionPoint(testPos, points, 1.0);

        expect(nearest).toBeNull();
    });

    test('excludes specified object ID', () => {
        const truss = createTruss('t1', [0, 0, 0]);
        const points = getTrussConnectionPoints(truss);

        const testPos = new THREE.Vector3(1.5, 0, 0);
        const nearest = findNearestConnectionPoint(testPos, points, 1.0, 't1');

        expect(nearest).toBeNull(); // All points belong to t1
    });

    test('skips connected points', () => {
        const truss = createTruss('t1', [0, 0, 0]);
        const points = getTrussConnectionPoints(truss);
        points[1].connected = true; // Mark right end as connected

        const testPos = new THREE.Vector3(0, 0, 0); // At center, equidistant from both ends
        const nearest = findNearestConnectionPoint(testPos, points, 2.0);

        // Should find left end since right is connected
        expect(nearest?.id).toBe('t1-left');
    });
});

describe('calculateSnapToConnection', () => {
    test('snaps when ghost end is near connection point', () => {
        const truss = createTruss('t1', [0, 0, 0], [0, 0, 0], 3.0);
        const points = getTrussConnectionPoints(truss);

        // Ghost positioned so its left end is near truss's right end
        const ghostPos = new THREE.Vector3(3.0, 0, 0); // Left end would be at 1.5
        const ghostRot = new THREE.Euler(0, 0, 0);
        const ghostDims = { w: 3.0, h: 0.29, d: 0.29 };

        const result = calculateSnapToConnection(
            ghostPos,
            ghostRot,
            ghostDims,
            points,
            0.5
        );

        expect(result.snapped).toBe(true);
        expect(result.targetPoint?.id).toBe('t1-right');
    });

    test('returns not snapped when too far', () => {
        const truss = createTruss('t1', [0, 0, 0]);
        const points = getTrussConnectionPoints(truss);

        const ghostPos = new THREE.Vector3(10, 0, 0);
        const ghostRot = new THREE.Euler(0, 0, 0);
        const ghostDims = { w: 3.0, h: 0.29, d: 0.29 };

        const result = calculateSnapToConnection(
            ghostPos,
            ghostRot,
            ghostDims,
            points,
            0.5
        );

        expect(result.snapped).toBe(false);
    });
});

describe('getExtensionGuides', () => {
    test('returns extension lines for unconnected points', () => {
        const truss = createTruss('t1', [0, 0, 0]);
        const { lines, suggestedLengths } = getExtensionGuides(truss);

        expect(lines).toHaveLength(2); // Both ends unconnected
        expect(suggestedLengths).toContain(1.0);
        expect(suggestedLengths).toContain(2.0);
        expect(suggestedLengths).toContain(3.0);
    });

    test('returns empty for non-truss objects', () => {
        const speaker: SceneObject = {
            ...createTruss('s1'),
            type: 'speaker'
        };
        const { lines } = getExtensionGuides(speaker);
        expect(lines).toHaveLength(0);
    });
});

describe('calculateGapFill', () => {
    test('finds exact fit with available lengths', () => {
        const point1 = {
            id: 'p1',
            objectId: 't1',
            position: new THREE.Vector3(0, 0, 0),
            direction: new THREE.Vector3(1, 0, 0),
            type: 'end' as const,
            connected: false
        };

        const point2 = {
            id: 'p2',
            objectId: 't2',
            position: new THREE.Vector3(6, 0, 0),
            direction: new THREE.Vector3(-1, 0, 0),
            type: 'end' as const,
            connected: false
        };

        const result = calculateGapFill(point1, point2, [1, 2, 3]);

        expect(result.gap).toBeCloseTo(6, 2);
        expect(result.suggestions.length).toBeGreaterThan(0);

        // Should find 3+3 or 2+2+2
        const hasValidSuggestion = result.suggestions.some(
            s => Math.abs(s.total - 6) < 0.1
        );
        expect(hasValidSuggestion).toBe(true);
    });

    test('handles gaps that cannot be filled exactly', () => {
        const point1 = {
            id: 'p1',
            objectId: 't1',
            position: new THREE.Vector3(0, 0, 0),
            direction: new THREE.Vector3(1, 0, 0),
            type: 'end' as const,
            connected: false
        };

        const point2 = {
            id: 'p2',
            objectId: 't2',
            position: new THREE.Vector3(7.3, 0, 0), // Awkward gap
            direction: new THREE.Vector3(-1, 0, 0),
            type: 'end' as const,
            connected: false
        };

        const result = calculateGapFill(point1, point2, [1, 2, 3]);

        expect(result.gap).toBeCloseTo(7.3, 2);
        // May or may not have exact suggestions
    });
});
