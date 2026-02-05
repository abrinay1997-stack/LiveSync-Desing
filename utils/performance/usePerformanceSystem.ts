/**
 * Performance System Hook - Integrates all performance subsystems
 *
 * This hook manages the lifecycle and synchronization of:
 * - TransientStore (imperative transforms)
 * - SpatialIndex (BVH raycasting)
 * - InstanceManager (batched rendering)
 * - LODManager (level of detail)
 * - PerformanceMonitor (FPS tracking)
 */

import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store';
import { transientStore } from './transientStore';
import { spatialIndex } from './spatialIndex';
import { instanceManager } from './instanceManager';
import { lodManager } from './lodManager';
import { performanceMonitor } from './performanceMonitor';

// Context for performance system state
interface PerformanceContextValue {
    // Status
    isInitialized: boolean;
    fps: number;
    objectCount: number;
    visibleCount: number;

    // Methods
    rebuildSpatialIndex: () => void;
    forceUpdate: () => void;
}

const PerformanceContext = createContext<PerformanceContextValue | null>(null);

/**
 * Performance System Provider - Wrap your Canvas content with this
 */
export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { gl, camera } = useThree();
    const objects = useStore(state => state.objects);
    const layers = useStore(state => state.layers);
    const selectedIds = useStore(state => state.selectedIds);

    const isInitialized = useRef(false);
    const frameCount = useRef(0);
    const lastSyncTime = useRef(0);

    // Initialize systems on mount
    useEffect(() => {
        performanceMonitor.setRenderer(gl);
        performanceMonitor.start();

        isInitialized.current = true;

        return () => {
            performanceMonitor.stop();
            transientStore.clear();
            spatialIndex.clear();
            instanceManager.clear();
            lodManager.clear();
        };
    }, [gl]);

    // Sync objects to transient store when they change
    useEffect(() => {
        // Filter visible objects
        const visibleObjects = objects.filter(obj => {
            const layer = layers.find(l => l.id === obj.layerId);
            return layer ? layer.visible : true;
        });

        // Update transient store
        transientStore.initFromObjects(visibleObjects);

        // Rebuild spatial index
        spatialIndex.build(visibleObjects);

        // Initialize LOD states
        for (const obj of visibleObjects) {
            lodManager.initObject(obj.id);
        }

        // Update custom stats
        performanceMonitor.setCustomStats({
            objectCount: objects.length,
            visibleCount: visibleObjects.length
        });
    }, [objects, layers]);

    // Update selection states
    useEffect(() => {
        for (const [id, _] of transientStore.getAllTransforms()) {
            const isSelected = selectedIds.includes(id);
            instanceManager.setSelected(id, isSelected);
        }
    }, [selectedIds]);

    // Per-frame updates
    useFrame((state, delta) => {
        frameCount.current++;

        // Record frame for performance monitoring
        performanceMonitor.recordFrame();

        // Update transient store tick (for any registered callbacks)
        transientStore.tick();

        // Update dirty matrices
        transientStore.updateAllDirtyMatrices();

        // Update LOD levels (every 3 frames to reduce overhead)
        if (frameCount.current % 3 === 0) {
            const lodResults = lodManager.updateAll(camera);

            // Update instance visibility based on LOD and frustum
            for (const [id, result] of lodResults) {
                instanceManager.setVisible(id, result.visible);
                instanceManager.setLODLevel(id, result.level);
            }

            // Update stats
            const lodStats = lodManager.getStats();
            performanceMonitor.setCustomStats({
                objectCount: lodManager.getObjectCount(),
                visibleCount: lodStats.level0 + lodStats.level1 + lodStats.level2 + lodStats.level3,
                culledCount: lodStats.culled
            });
        }

        // Batch update instances (every frame for smooth motion)
        instanceManager.updateBatches();

        // Rebuild spatial index if needed (deferred)
        if (spatialIndex.needsUpdate() && frameCount.current % 30 === 0) {
            const objects = useStore.getState().objects;
            spatialIndex.build(objects);
        }
    });

    // Context value
    const contextValue: PerformanceContextValue = {
        isInitialized: isInitialized.current,
        fps: performanceMonitor.getMetrics().fps,
        objectCount: lodManager.getObjectCount(),
        visibleCount: lodManager.getStats().level0 + lodManager.getStats().level1,

        rebuildSpatialIndex: useCallback(() => {
            const objects = useStore.getState().objects;
            spatialIndex.build(objects);
        }, []),

        forceUpdate: useCallback(() => {
            instanceManager.updateBatches();
        }, [])
    };

    return (
        <PerformanceContext.Provider value={contextValue}>
            {children}
        </PerformanceContext.Provider>
    );
};

/**
 * Hook to access performance system
 */
export function usePerformanceSystem(): PerformanceContextValue {
    const context = useContext(PerformanceContext);

    if (!context) {
        // Return a default context if not wrapped in provider
        return {
            isInitialized: false,
            fps: 60,
            objectCount: 0,
            visibleCount: 0,
            rebuildSpatialIndex: () => {},
            forceUpdate: () => {}
        };
    }

    return context;
}

/**
 * Hook for imperative object transforms (no re-renders)
 */
export function useImperativeTransform(id: string) {
    const transformRef = useRef(transientStore.getTransform(id));

    useEffect(() => {
        return transientStore.subscribe(id, (transform) => {
            transformRef.current = transform;
        });
    }, [id]);

    return {
        getTransform: () => transformRef.current,

        setPosition: (x: number, y: number, z: number) => {
            transientStore.setPosition(id, x, y, z);
        },

        setRotation: (x: number, y: number, z: number) => {
            transientStore.setRotation(id, x, y, z);
        },

        setScale: (x: number, y: number, z: number) => {
            transientStore.setScale(id, x, y, z);
        }
    };
}

/**
 * Hook for fast raycasting using BVH
 */
export function useSpatialQuery() {
    return {
        raycast: (origin: THREE.Vector3, direction: THREE.Vector3, maxDistance?: number) => {
            return spatialIndex.raycast(origin, direction, maxDistance);
        },

        queryRadius: (center: THREE.Vector3, radius: number) => {
            return spatialIndex.queryRadius(center, radius);
        },

        nearest: (point: THREE.Vector3, maxDistance?: number) => {
            return spatialIndex.nearest(point, maxDistance);
        },

        kNearest: (point: THREE.Vector3, k: number, maxDistance?: number) => {
            return spatialIndex.kNearest(point, k, maxDistance);
        },

        frustumCull: (frustum: THREE.Frustum) => {
            return spatialIndex.frustumCull(frustum);
        }
    };
}

/**
 * Hook for performance metrics
 */
export function usePerformanceMetrics() {
    const [metrics, setMetrics] = React.useState(performanceMonitor.getMetrics());

    useEffect(() => {
        return performanceMonitor.subscribe(setMetrics);
    }, []);

    return metrics;
}
