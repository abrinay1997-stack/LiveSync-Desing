import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { lodManager, DEFAULT_LOD_LEVELS } from '../lodManager';

describe('LODManager', () => {
    beforeEach(() => {
        lodManager.clear();
        lodManager.setLevels(DEFAULT_LOD_LEVELS);
    });

    describe('initialization', () => {
        it('should initialize object state', () => {
            lodManager.initObject('test-1');

            expect(lodManager.getLevel('test-1')).toBe(0);
            expect(lodManager.isInFrustum('test-1')).toBe(true);
        });

        it('should handle multiple objects', () => {
            lodManager.initObject('obj-1');
            lodManager.initObject('obj-2');
            lodManager.initObject('obj-3');

            expect(lodManager.getObjectCount()).toBe(3);
        });
    });

    describe('updateObject', () => {
        it('should return level 0 for close objects', () => {
            lodManager.initObject('test');

            const position = new THREE.Vector3(5, 0, 0);
            const camera = new THREE.Vector3(0, 0, 0);

            const result = lodManager.updateObject('test', position, camera);

            expect(result.level).toBe(0);
            expect(result.visible).toBe(true);
        });

        it('should return higher levels for distant objects', () => {
            lodManager.initObject('test');

            const position = new THREE.Vector3(60, 0, 0);
            const camera = new THREE.Vector3(0, 0, 0);

            const result = lodManager.updateObject('test', position, camera);

            expect(result.level).toBeGreaterThan(0);
        });

        it('should detect level changes', () => {
            lodManager.initObject('test');

            const camera = new THREE.Vector3(0, 0, 0);

            // Start close
            const pos1 = new THREE.Vector3(5, 0, 0);
            lodManager.updateObject('test', pos1, camera);

            // Move far
            const pos2 = new THREE.Vector3(100, 0, 0);
            const result = lodManager.updateObject('test', pos2, camera);

            expect(result.changed).toBe(true);
        });

        it('should apply hysteresis to prevent flickering', () => {
            lodManager.initObject('test');

            const camera = new THREE.Vector3(0, 0, 0);

            // Position right at boundary (20m for level 0)
            const pos = new THREE.Vector3(20, 0, 0);
            const result1 = lodManager.updateObject('test', pos, camera);

            // Move slightly past boundary
            const pos2 = new THREE.Vector3(21, 0, 0);
            const result2 = lodManager.updateObject('test', pos2, camera);

            // Should not immediately switch due to hysteresis
            expect(result2.level).toBe(result1.level);
        });
    });

    describe('custom LOD levels', () => {
        it('should accept custom levels', () => {
            const customLevels = [
                { level: 0, distance: 10, geometryScale: 1.0, useImpostor: false },
                { level: 1, distance: 30, geometryScale: 0.5, useImpostor: false },
                { level: 2, distance: Infinity, geometryScale: 0, useImpostor: true }
            ];

            lodManager.setLevels(customLevels);
            lodManager.initObject('test');

            const camera = new THREE.Vector3(0, 0, 0);

            // Should be level 0 when close
            const pos1 = new THREE.Vector3(5, 0, 0);
            const result1 = lodManager.updateObject('test', pos1, camera);
            expect(result1.level).toBe(0);

            // Should be level 1 when medium distance
            const pos2 = new THREE.Vector3(20, 0, 0);
            const result2 = lodManager.updateObject('test', pos2, camera);
            expect(result2.level).toBe(1);

            // Should be level 2 when far
            const pos3 = new THREE.Vector3(50, 0, 0);
            const result3 = lodManager.updateObject('test', pos3, camera);
            expect(result3.level).toBe(2);
        });
    });

    describe('statistics', () => {
        it('should track level distribution via updateObject', () => {
            // Initialize objects at different distances
            lodManager.initObject('close-1');
            lodManager.initObject('close-2');
            lodManager.initObject('far-1');

            const camera = new THREE.Vector3(0, 0, 0);

            // Update objects at different distances
            const result1 = lodManager.updateObject('close-1', new THREE.Vector3(5, 0, 0), camera);
            const result2 = lodManager.updateObject('close-2', new THREE.Vector3(10, 0, 0), camera);
            const result3 = lodManager.updateObject('far-1', new THREE.Vector3(100, 0, 0), camera);

            // Verify individual results
            expect(result1.level).toBe(0); // Close = level 0
            expect(result2.level).toBe(0); // Still close = level 0
            expect(result3.level).toBeGreaterThan(0); // Far = higher level

            // Verify object count
            expect(lodManager.getObjectCount()).toBe(3);
        });
    });

    describe('removeObject', () => {
        it('should remove object state', () => {
            lodManager.initObject('test');
            expect(lodManager.getObjectCount()).toBe(1);

            lodManager.removeObject('test');
            expect(lodManager.getObjectCount()).toBe(0);
        });
    });

    describe('getLevelInfo', () => {
        it('should return level configuration', () => {
            const info = lodManager.getLevelInfo(0);

            expect(info).toBeDefined();
            expect(info!.distance).toBe(20);
            expect(info!.geometryScale).toBe(1.0);
            expect(info!.useImpostor).toBe(false);
        });

        it('should return undefined for invalid level', () => {
            const info = lodManager.getLevelInfo(99);

            expect(info).toBeUndefined();
        });
    });
});
