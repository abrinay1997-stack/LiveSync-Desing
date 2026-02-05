import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { transientStore } from '../transientStore';
import { SceneObject } from '../../../types';

describe('TransientStore', () => {
    beforeEach(() => {
        transientStore.clear();
    });

    const createMockObject = (id: string, position: [number, number, number] = [0, 0, 0]): SceneObject => ({
        id,
        name: `Object ${id}`,
        model: 'truss-30',
        type: 'truss',
        position,
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        layerId: 'rigging',
        color: '#ffffff',
        dimensions: { w: 3, h: 0.3, d: 0.3 }
    });

    describe('initFromObject', () => {
        it('should create transform from scene object', () => {
            const obj = createMockObject('1', [5, 10, 15]);
            transientStore.initFromObject(obj);

            const transform = transientStore.getTransform('1');

            expect(transform).toBeDefined();
            expect(transform!.position.x).toBe(5);
            expect(transform!.position.y).toBe(10);
            expect(transform!.position.z).toBe(15);
        });

        it('should update existing transform', () => {
            const obj1 = createMockObject('1', [0, 0, 0]);
            const obj2 = createMockObject('1', [10, 20, 30]);

            transientStore.initFromObject(obj1);
            transientStore.initFromObject(obj2);

            const transform = transientStore.getTransform('1');

            expect(transform!.position.x).toBe(10);
            expect(transform!.position.y).toBe(20);
            expect(transform!.position.z).toBe(30);
        });
    });

    describe('initFromObjects', () => {
        it('should initialize multiple objects', () => {
            const objects = [
                createMockObject('1', [0, 0, 0]),
                createMockObject('2', [1, 1, 1]),
                createMockObject('3', [2, 2, 2])
            ];

            transientStore.initFromObjects(objects);

            expect(transientStore.getTransformCount()).toBe(3);
            expect(transientStore.getTransform('1')).toBeDefined();
            expect(transientStore.getTransform('2')).toBeDefined();
            expect(transientStore.getTransform('3')).toBeDefined();
        });

        it('should remove deleted objects', () => {
            const objects1 = [
                createMockObject('1'),
                createMockObject('2'),
                createMockObject('3')
            ];
            const objects2 = [
                createMockObject('1'),
                createMockObject('3')
            ];

            transientStore.initFromObjects(objects1);
            transientStore.initFromObjects(objects2);

            expect(transientStore.getTransformCount()).toBe(2);
            expect(transientStore.getTransform('2')).toBeUndefined();
        });
    });

    describe('imperative updates', () => {
        it('should update position without re-render', () => {
            transientStore.initFromObject(createMockObject('1'));

            transientStore.setPosition('1', 100, 200, 300);

            const transform = transientStore.getTransform('1');
            expect(transform!.position.x).toBe(100);
            expect(transform!.position.y).toBe(200);
            expect(transform!.position.z).toBe(300);
            expect(transform!.matrixNeedsUpdate).toBe(true);
        });

        it('should update rotation', () => {
            transientStore.initFromObject(createMockObject('1'));

            transientStore.setRotation('1', Math.PI / 2, Math.PI / 4, 0);

            const transform = transientStore.getTransform('1');
            expect(transform!.rotation.x).toBeCloseTo(Math.PI / 2);
            expect(transform!.rotation.y).toBeCloseTo(Math.PI / 4);
        });

        it('should update scale', () => {
            transientStore.initFromObject(createMockObject('1'));

            transientStore.setScale('1', 2, 3, 4);

            const transform = transientStore.getTransform('1');
            expect(transform!.scale.x).toBe(2);
            expect(transform!.scale.y).toBe(3);
            expect(transform!.scale.z).toBe(4);
        });

        it('should track dirty state', () => {
            transientStore.initFromObject(createMockObject('1'));

            expect(transientStore.getDirtyCount()).toBe(1);

            transientStore.updateAllDirtyMatrices();

            expect(transientStore.getDirtyCount()).toBe(0);
        });
    });

    describe('subscriptions', () => {
        it('should notify subscribers on update', () => {
            transientStore.initFromObject(createMockObject('1'));

            const callback = vi.fn();
            transientStore.subscribe('1', callback);

            // Initial call
            expect(callback).toHaveBeenCalledTimes(1);

            transientStore.setPosition('1', 10, 20, 30);

            expect(callback).toHaveBeenCalledTimes(2);
        });

        it('should unsubscribe correctly', () => {
            transientStore.initFromObject(createMockObject('1'));

            const callback = vi.fn();
            const unsubscribe = transientStore.subscribe('1', callback);

            unsubscribe();
            transientStore.setPosition('1', 10, 20, 30);

            // Only initial call
            expect(callback).toHaveBeenCalledTimes(1);
        });
    });

    describe('matrix updates', () => {
        it('should compute correct matrix', () => {
            const obj = createMockObject('1', [5, 10, 15]);
            transientStore.initFromObject(obj);

            const matrix = transientStore.updateMatrix('1');

            expect(matrix).toBeDefined();

            const position = new THREE.Vector3();
            position.setFromMatrixPosition(matrix!);

            expect(position.x).toBe(5);
            expect(position.y).toBe(10);
            expect(position.z).toBe(15);
        });

        it('should batch update all dirty matrices', () => {
            transientStore.initFromObjects([
                createMockObject('1', [1, 0, 0]),
                createMockObject('2', [2, 0, 0]),
                createMockObject('3', [3, 0, 0])
            ]);

            const updated = transientStore.updateAllDirtyMatrices();

            expect(updated.length).toBe(3);
            expect(transientStore.getDirtyCount()).toBe(0);
        });
    });
});
