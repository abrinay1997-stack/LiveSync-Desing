/**
 * Transient Store - High-Performance State Updates
 *
 * This store maintains a parallel copy of transform data that can be updated
 * imperatively without triggering React re-renders. Components subscribe
 * to this store using refs and useFrame, not React state.
 *
 * Pattern: React state for "source of truth" commits, transient for real-time updates.
 */

import * as THREE from 'three';
import { SceneObject } from '../../types';

// Transform data optimized for GPU updates
export interface TransientTransform {
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: THREE.Vector3;
    matrix: THREE.Matrix4;
    matrixNeedsUpdate: boolean;
    visible: boolean;
}

// Subscription callback type
type TransformCallback = (transform: TransientTransform) => void;
type BulkCallback = () => void;

class TransientStore {
    private transforms: Map<string, TransientTransform> = new Map();
    private subscribers: Map<string, Set<TransformCallback>> = new Map();
    private bulkSubscribers: Set<BulkCallback> = new Set();
    private dirty: Set<string> = new Set();
    private frameCallbacks: Set<() => void> = new Set();

    // Object pool for reuse
    private tempMatrix = new THREE.Matrix4();
    private tempPosition = new THREE.Vector3();
    private tempQuaternion = new THREE.Quaternion();
    private tempScale = new THREE.Vector3();
    private tempEuler = new THREE.Euler();

    /**
     * Initialize or update transform from SceneObject
     */
    initFromObject(obj: SceneObject): void {
        const existing = this.transforms.get(obj.id);

        if (existing) {
            existing.position.set(...obj.position);
            existing.rotation.set(...obj.rotation);
            existing.scale.set(...obj.scale);
            existing.matrixNeedsUpdate = true;
            existing.visible = true;
        } else {
            this.transforms.set(obj.id, {
                position: new THREE.Vector3(...obj.position),
                rotation: new THREE.Euler(...obj.rotation),
                scale: new THREE.Vector3(...obj.scale),
                matrix: new THREE.Matrix4(),
                matrixNeedsUpdate: true,
                visible: true
            });
        }

        this.dirty.add(obj.id);
    }

    /**
     * Bulk initialize from objects array
     */
    initFromObjects(objects: SceneObject[]): void {
        const currentIds = new Set(objects.map(o => o.id));

        // Remove transforms for deleted objects
        for (const id of this.transforms.keys()) {
            if (!currentIds.has(id)) {
                this.transforms.delete(id);
                this.subscribers.delete(id);
            }
        }

        // Update/add transforms
        for (const obj of objects) {
            this.initFromObject(obj);
        }

        // Notify bulk subscribers
        this.notifyBulkSubscribers();
    }

    /**
     * Get transform by ID (no copy, direct reference for performance)
     */
    getTransform(id: string): TransientTransform | undefined {
        return this.transforms.get(id);
    }

    /**
     * Get all transforms as array (for batch processing)
     */
    getAllTransforms(): Map<string, TransientTransform> {
        return this.transforms;
    }

    /**
     * Update position imperatively (no React re-render)
     */
    setPosition(id: string, x: number, y: number, z: number): void {
        const transform = this.transforms.get(id);
        if (!transform) return;

        transform.position.set(x, y, z);
        transform.matrixNeedsUpdate = true;
        this.dirty.add(id);
        this.notifySubscribers(id);
    }

    /**
     * Update rotation imperatively
     */
    setRotation(id: string, x: number, y: number, z: number): void {
        const transform = this.transforms.get(id);
        if (!transform) return;

        transform.rotation.set(x, y, z);
        transform.matrixNeedsUpdate = true;
        this.dirty.add(id);
        this.notifySubscribers(id);
    }

    /**
     * Update scale imperatively
     */
    setScale(id: string, x: number, y: number, z: number): void {
        const transform = this.transforms.get(id);
        if (!transform) return;

        transform.scale.set(x, y, z);
        transform.matrixNeedsUpdate = true;
        this.dirty.add(id);
        this.notifySubscribers(id);
    }

    /**
     * Set visibility (for culling)
     */
    setVisible(id: string, visible: boolean): void {
        const transform = this.transforms.get(id);
        if (!transform) return;

        transform.visible = visible;
        this.dirty.add(id);
        this.notifySubscribers(id);
    }

    /**
     * Update matrix if needed (call before GPU upload)
     */
    updateMatrix(id: string): THREE.Matrix4 | null {
        const transform = this.transforms.get(id);
        if (!transform) return null;

        if (transform.matrixNeedsUpdate) {
            transform.matrix.compose(
                transform.position,
                this.tempQuaternion.setFromEuler(transform.rotation),
                transform.scale
            );
            transform.matrixNeedsUpdate = false;
        }

        return transform.matrix;
    }

    /**
     * Batch update all dirty matrices (call once per frame)
     */
    updateAllDirtyMatrices(): string[] {
        const updated: string[] = [];

        for (const id of this.dirty) {
            if (this.updateMatrix(id)) {
                updated.push(id);
            }
        }

        this.dirty.clear();
        return updated;
    }

    /**
     * Subscribe to transform changes (returns unsubscribe function)
     */
    subscribe(id: string, callback: TransformCallback): () => void {
        if (!this.subscribers.has(id)) {
            this.subscribers.set(id, new Set());
        }
        this.subscribers.get(id)!.add(callback);

        // Immediately call with current value
        const transform = this.transforms.get(id);
        if (transform) {
            callback(transform);
        }

        return () => {
            this.subscribers.get(id)?.delete(callback);
        };
    }

    /**
     * Subscribe to bulk changes (object added/removed)
     */
    subscribeBulk(callback: BulkCallback): () => void {
        this.bulkSubscribers.add(callback);
        return () => {
            this.bulkSubscribers.delete(callback);
        };
    }

    /**
     * Register a per-frame callback (for continuous updates)
     */
    registerFrameCallback(callback: () => void): () => void {
        this.frameCallbacks.add(callback);
        return () => {
            this.frameCallbacks.delete(callback);
        };
    }

    /**
     * Call all frame callbacks (invoke from useFrame)
     */
    tick(): void {
        for (const callback of this.frameCallbacks) {
            callback();
        }
    }

    private notifySubscribers(id: string): void {
        const transform = this.transforms.get(id);
        const subs = this.subscribers.get(id);

        if (transform && subs) {
            for (const callback of subs) {
                callback(transform);
            }
        }
    }

    private notifyBulkSubscribers(): void {
        for (const callback of this.bulkSubscribers) {
            callback();
        }
    }

    /**
     * Get dirty count (for performance monitoring)
     */
    getDirtyCount(): number {
        return this.dirty.size;
    }

    /**
     * Get total transform count
     */
    getTransformCount(): number {
        return this.transforms.size;
    }

    /**
     * Clear all data
     */
    clear(): void {
        this.transforms.clear();
        this.subscribers.clear();
        this.bulkSubscribers.clear();
        this.dirty.clear();
        this.frameCallbacks.clear();
    }
}

// Singleton instance
export const transientStore = new TransientStore();

// Helper hook for subscribing in components
export function useTransientTransform(id: string): React.MutableRefObject<TransientTransform | null> {
    const ref = { current: transientStore.getTransform(id) || null };
    return ref;
}
