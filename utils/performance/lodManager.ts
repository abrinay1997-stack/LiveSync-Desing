/**
 * LOD Manager - Level of Detail System
 *
 * Manages multiple levels of detail for objects based on camera distance.
 * Features:
 * - Distance-based LOD switching with hysteresis
 * - Frustum culling integration
 * - Billboard/impostor support for distant objects
 * - Smooth transitions
 */

import * as THREE from 'three';
import { transientStore } from './transientStore';

// LOD level definition
export interface LODLevel {
    level: number;
    distance: number; // Max distance for this level
    geometryScale: number; // Geometry detail scale (1.0 = full)
    useImpostor: boolean; // Use billboard instead of geometry
}

// Default LOD configuration
export const DEFAULT_LOD_LEVELS: LODLevel[] = [
    { level: 0, distance: 20, geometryScale: 1.0, useImpostor: false },   // Full detail
    { level: 1, distance: 50, geometryScale: 0.5, useImpostor: false },   // Medium detail
    { level: 2, distance: 100, geometryScale: 0.25, useImpostor: false }, // Low detail
    { level: 3, distance: Infinity, geometryScale: 0, useImpostor: true } // Billboard
];

// Per-object LOD state
interface ObjectLODState {
    id: string;
    currentLevel: number;
    lastDistance: number;
    inFrustum: boolean;
}

class LODManager {
    private states: Map<string, ObjectLODState> = new Map();
    private levels: LODLevel[] = DEFAULT_LOD_LEVELS;
    private hysteresis = 2; // Distance hysteresis to prevent flickering

    // Object pools
    private tempVec = new THREE.Vector3();
    private tempFrustum = new THREE.Frustum();
    private tempMatrix = new THREE.Matrix4();
    private tempBox = new THREE.Box3();
    private tempSphere = new THREE.Sphere();

    // Statistics
    private stats = {
        level0: 0,
        level1: 0,
        level2: 0,
        level3: 0,
        culled: 0
    };

    /**
     * Configure LOD levels
     */
    setLevels(levels: LODLevel[]): void {
        this.levels = levels.sort((a, b) => a.distance - b.distance);
    }

    /**
     * Get current LOD levels
     */
    getLevels(): LODLevel[] {
        return this.levels;
    }

    /**
     * Initialize state for an object
     */
    initObject(id: string): void {
        if (!this.states.has(id)) {
            this.states.set(id, {
                id,
                currentLevel: 0,
                lastDistance: 0,
                inFrustum: true
            });
        }
    }

    /**
     * Remove object state
     */
    removeObject(id: string): void {
        this.states.delete(id);
    }

    /**
     * Update LOD for a single object
     */
    updateObject(
        id: string,
        position: THREE.Vector3,
        cameraPosition: THREE.Vector3,
        frustum?: THREE.Frustum
    ): { level: number; visible: boolean; changed: boolean } {
        let state = this.states.get(id);

        if (!state) {
            this.initObject(id);
            state = this.states.get(id)!;
        }

        const distance = position.distanceTo(cameraPosition);
        state.lastDistance = distance;

        // Frustum culling (if frustum provided)
        if (frustum) {
            this.tempSphere.set(position, 5); // Approximate bounding sphere
            state.inFrustum = frustum.intersectsSphere(this.tempSphere);
        } else {
            state.inFrustum = true;
        }

        // Determine LOD level with hysteresis
        const prevLevel = state.currentLevel;
        let newLevel = this.levels.length - 1;

        for (let i = 0; i < this.levels.length; i++) {
            const levelDist = this.levels[i].distance;

            // Apply hysteresis: harder to switch to higher detail
            const effectiveDist = i < prevLevel
                ? levelDist - this.hysteresis
                : levelDist + this.hysteresis;

            if (distance <= effectiveDist) {
                newLevel = i;
                break;
            }
        }

        state.currentLevel = newLevel;

        return {
            level: newLevel,
            visible: state.inFrustum,
            changed: newLevel !== prevLevel
        };
    }

    /**
     * Batch update all objects (call once per frame)
     */
    updateAll(camera: THREE.Camera): Map<string, { level: number; visible: boolean }> {
        const results = new Map<string, { level: number; visible: boolean }>();

        // Reset stats
        this.stats = { level0: 0, level1: 0, level2: 0, level3: 0, culled: 0 };

        // Get frustum from camera
        camera.updateMatrixWorld();
        this.tempMatrix.multiplyMatrices(
            camera.projectionMatrix,
            camera.matrixWorldInverse
        );
        this.tempFrustum.setFromProjectionMatrix(this.tempMatrix);

        const cameraPosition = camera.position;

        // Update each object
        for (const [id, state] of this.states) {
            const transform = transientStore.getTransform(id);
            if (!transform) continue;

            const result = this.updateObject(
                id,
                transform.position,
                cameraPosition,
                this.tempFrustum
            );

            results.set(id, { level: result.level, visible: result.visible });

            // Update stats
            if (!result.visible) {
                this.stats.culled++;
            } else {
                switch (result.level) {
                    case 0: this.stats.level0++; break;
                    case 1: this.stats.level1++; break;
                    case 2: this.stats.level2++; break;
                    default: this.stats.level3++; break;
                }
            }
        }

        return results;
    }

    /**
     * Get LOD level for an object
     */
    getLevel(id: string): number {
        return this.states.get(id)?.currentLevel ?? 0;
    }

    /**
     * Check if object is in frustum
     */
    isInFrustum(id: string): boolean {
        return this.states.get(id)?.inFrustum ?? true;
    }

    /**
     * Get distance to camera for an object
     */
    getDistance(id: string): number {
        return this.states.get(id)?.lastDistance ?? 0;
    }

    /**
     * Get LOD statistics
     */
    getStats(): typeof this.stats {
        return { ...this.stats };
    }

    /**
     * Get total object count
     */
    getObjectCount(): number {
        return this.states.size;
    }

    /**
     * Get LOD level info
     */
    getLevelInfo(level: number): LODLevel | undefined {
        return this.levels[level];
    }

    /**
     * Clear all states
     */
    clear(): void {
        this.states.clear();
    }
}

// Singleton instance
export const lodManager = new LODManager();

/**
 * Calculate effective geometry for LOD level
 */
export function getGeometryForLOD(
    baseGeometry: THREE.BufferGeometry,
    level: number,
    cache: Map<string, THREE.BufferGeometry>
): THREE.BufferGeometry {
    const levelInfo = lodManager.getLevelInfo(level);
    if (!levelInfo || levelInfo.geometryScale >= 1) {
        return baseGeometry;
    }

    const cacheKey = `${baseGeometry.uuid}_lod${level}`;

    if (cache.has(cacheKey)) {
        return cache.get(cacheKey)!;
    }

    // For impostors, return simple plane
    if (levelInfo.useImpostor) {
        const plane = new THREE.PlaneGeometry(1, 1);
        cache.set(cacheKey, plane);
        return plane;
    }

    // For reduced geometry, simplify (basic version - just scale down box)
    // In production, use actual mesh decimation
    if (baseGeometry.type === 'BoxGeometry') {
        const params = (baseGeometry as THREE.BoxGeometry).parameters;
        const simplified = new THREE.BoxGeometry(
            params.width,
            params.height,
            params.depth,
            Math.max(1, Math.floor(params.widthSegments * levelInfo.geometryScale)),
            Math.max(1, Math.floor(params.heightSegments * levelInfo.geometryScale)),
            Math.max(1, Math.floor(params.depthSegments * levelInfo.geometryScale))
        );
        cache.set(cacheKey, simplified);
        return simplified;
    }

    return baseGeometry;
}
