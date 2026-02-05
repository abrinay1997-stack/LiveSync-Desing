import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { spatialIndex } from '../spatialIndex';
import { SceneObject } from '../../../types';

describe('SpatialIndex', () => {
    beforeEach(() => {
        spatialIndex.clear();
    });

    const createMockObject = (
        id: string,
        position: [number, number, number] = [0, 0, 0],
        dimensions: { w: number; h: number; d: number } = { w: 1, h: 1, d: 1 }
    ): SceneObject => ({
        id,
        name: `Object ${id}`,
        model: 'truss-30',
        type: 'truss',
        position,
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        layerId: 'rigging',
        color: '#ffffff',
        dimensions
    });

    describe('build', () => {
        it('should build BVH from objects', () => {
            const objects = [
                createMockObject('1', [0, 0, 0]),
                createMockObject('2', [10, 0, 0]),
                createMockObject('3', [20, 0, 0])
            ];

            spatialIndex.build(objects);

            expect(spatialIndex.getObjectCount()).toBe(3);
        });

        it('should handle empty array', () => {
            spatialIndex.build([]);

            expect(spatialIndex.getObjectCount()).toBe(0);
        });

        it('should handle single object', () => {
            spatialIndex.build([createMockObject('1')]);

            expect(spatialIndex.getObjectCount()).toBe(1);
        });
    });

    describe('raycast', () => {
        it('should find objects along ray', () => {
            const objects = [
                createMockObject('1', [5, 0, 0]),
                createMockObject('2', [10, 0, 0]),
                createMockObject('3', [0, 10, 0]) // Not in ray path
            ];

            spatialIndex.build(objects);

            const origin = new THREE.Vector3(0, 0, 0);
            const direction = new THREE.Vector3(1, 0, 0);
            const results = spatialIndex.raycast(origin, direction);

            expect(results.length).toBe(2);
            expect(results[0].id).toBe('1'); // Closer
            expect(results[1].id).toBe('2');
        });

        it('should respect maxDistance', () => {
            const objects = [
                createMockObject('1', [5, 0, 0]),
                createMockObject('2', [15, 0, 0]) // Beyond maxDistance
            ];

            spatialIndex.build(objects);

            const origin = new THREE.Vector3(0, 0, 0);
            const direction = new THREE.Vector3(1, 0, 0);
            const results = spatialIndex.raycast(origin, direction, 10);

            expect(results.length).toBe(1);
            expect(results[0].id).toBe('1');
        });

        it('should return sorted by distance', () => {
            const objects = [
                createMockObject('far', [20, 0, 0]),
                createMockObject('mid', [10, 0, 0]),
                createMockObject('near', [5, 0, 0])
            ];

            spatialIndex.build(objects);

            const origin = new THREE.Vector3(0, 0, 0);
            const direction = new THREE.Vector3(1, 0, 0);
            const results = spatialIndex.raycast(origin, direction);

            expect(results[0].id).toBe('near');
            expect(results[1].id).toBe('mid');
            expect(results[2].id).toBe('far');
        });
    });

    describe('queryRadius', () => {
        it('should find objects within radius', () => {
            const objects = [
                createMockObject('inside1', [2, 0, 0]),
                createMockObject('inside2', [0, 2, 0]),
                createMockObject('outside', [10, 0, 0])
            ];

            spatialIndex.build(objects);

            const center = new THREE.Vector3(0, 0, 0);
            const results = spatialIndex.queryRadius(center, 5);

            expect(results.length).toBe(2);
            expect(results).toContain('inside1');
            expect(results).toContain('inside2');
            expect(results).not.toContain('outside');
        });
    });

    describe('nearest', () => {
        it('should find nearest object', () => {
            const objects = [
                createMockObject('far', [10, 0, 0]),
                createMockObject('near', [2, 0, 0]),
                createMockObject('mid', [5, 0, 0])
            ];

            spatialIndex.build(objects);

            const point = new THREE.Vector3(0, 0, 0);
            const result = spatialIndex.nearest(point);

            expect(result).not.toBeNull();
            expect(result!.id).toBe('near');
        });

        it('should respect maxDistance', () => {
            const objects = [
                createMockObject('1', [10, 0, 0])
            ];

            spatialIndex.build(objects);

            const point = new THREE.Vector3(0, 0, 0);
            const result = spatialIndex.nearest(point, 5);

            expect(result).toBeNull();
        });
    });

    describe('kNearest', () => {
        it('should find k nearest objects', () => {
            const objects = [
                createMockObject('1', [1, 0, 0]),
                createMockObject('2', [2, 0, 0]),
                createMockObject('3', [3, 0, 0]),
                createMockObject('4', [4, 0, 0]),
                createMockObject('5', [5, 0, 0])
            ];

            spatialIndex.build(objects);

            const point = new THREE.Vector3(0, 0, 0);
            const results = spatialIndex.kNearest(point, 3);

            expect(results.length).toBe(3);
            expect(results[0].id).toBe('1');
            expect(results[1].id).toBe('2');
            expect(results[2].id).toBe('3');
        });
    });

    describe('queryBox', () => {
        it('should find objects within box', () => {
            const objects = [
                createMockObject('inside', [5, 5, 5]),
                createMockObject('outside', [15, 15, 15])
            ];

            spatialIndex.build(objects);

            const box = new THREE.Box3(
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(10, 10, 10)
            );
            const results = spatialIndex.queryBox(box);

            expect(results.length).toBe(1);
            expect(results[0]).toBe('inside');
        });
    });

    describe('performance', () => {
        it('should handle large number of objects', () => {
            const objects: SceneObject[] = [];

            // Create 1000 objects in a grid
            for (let i = 0; i < 1000; i++) {
                const x = (i % 10) * 10;
                const y = Math.floor(i / 10) % 10 * 10;
                const z = Math.floor(i / 100) * 10;
                objects.push(createMockObject(`obj-${i}`, [x, y, z]));
            }

            const startBuild = performance.now();
            spatialIndex.build(objects);
            const buildTime = performance.now() - startBuild;

            expect(spatialIndex.getObjectCount()).toBe(1000);
            expect(buildTime).toBeLessThan(100); // Should build in under 100ms

            // Test query performance
            const origin = new THREE.Vector3(0, 0, 0);
            const direction = new THREE.Vector3(1, 1, 1).normalize();

            const startQuery = performance.now();
            for (let i = 0; i < 100; i++) {
                spatialIndex.raycast(origin, direction);
            }
            const queryTime = performance.now() - startQuery;

            expect(queryTime / 100).toBeLessThan(5); // Each query under 5ms
        });
    });
});
