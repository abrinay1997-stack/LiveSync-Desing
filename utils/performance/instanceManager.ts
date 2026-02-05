/**
 * Instance Manager - High-Performance Instanced Rendering
 *
 * Manages InstancedMesh objects for rendering thousands of similar objects efficiently.
 * Features:
 * - Automatic batching by model type
 * - Frustum culling per instance
 * - LOD support per instance
 * - Dynamic show/hide without buffer rebuild
 * - Picking support via instanceId
 */

import * as THREE from 'three';
import { SceneObject } from '../../types';
import { transientStore, TransientTransform } from './transientStore';

// Instance data for a single object
export interface InstanceData {
    id: string;
    modelKey: string;
    visible: boolean;
    lodLevel: number; // 0 = full, 1 = medium, 2 = low/billboard
    selected: boolean;
    hovered: boolean;
}

// Batch of instances sharing the same geometry/material
export interface InstanceBatch {
    modelKey: string;
    geometry: THREE.BufferGeometry;
    material: THREE.Material;
    mesh: THREE.InstancedMesh | null;
    instances: InstanceData[];
    maxInstances: number;
    needsUpdate: boolean;
    colorAttribute: THREE.InstancedBufferAttribute | null;
}

// Color modes for instances
const COLORS = {
    default: new THREE.Color(0xd4d4d8),
    selected: new THREE.Color(0x06b6d4),
    hovered: new THREE.Color(0xffffff),
    hidden: new THREE.Color(0x000000)
};

class InstanceManager {
    private batches: Map<string, InstanceBatch> = new Map();
    private instanceToModel: Map<string, string> = new Map();
    private geometryCache: Map<string, THREE.BufferGeometry> = new Map();
    private materialCache: Map<string, THREE.Material> = new Map();

    // Object pools
    private tempObject = new THREE.Object3D();
    private tempMatrix = new THREE.Matrix4();
    private tempColor = new THREE.Color();
    private tempQuaternion = new THREE.Quaternion();
    private tempScale = new THREE.Vector3();

    // Configuration
    private initialBatchSize = 1000;
    private batchGrowthFactor = 1.5;

    /**
     * Get or create a batch for a model
     */
    getBatch(modelKey: string): InstanceBatch | undefined {
        return this.batches.get(modelKey);
    }

    /**
     * Create a new batch for a model type
     */
    createBatch(
        modelKey: string,
        geometry: THREE.BufferGeometry,
        material: THREE.Material,
        initialSize: number = this.initialBatchSize
    ): InstanceBatch {
        // Create instanced mesh
        const mesh = new THREE.InstancedMesh(geometry, material, initialSize);
        mesh.frustumCulled = false; // We do our own culling
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Create color attribute for per-instance coloring
        const colors = new Float32Array(initialSize * 3);
        const colorAttribute = new THREE.InstancedBufferAttribute(colors, 3);
        mesh.instanceColor = colorAttribute;

        // Initialize all instances to invisible (scale 0)
        this.tempMatrix.makeScale(0, 0, 0);
        for (let i = 0; i < initialSize; i++) {
            mesh.setMatrixAt(i, this.tempMatrix);
        }
        mesh.instanceMatrix.needsUpdate = true;

        const batch: InstanceBatch = {
            modelKey,
            geometry,
            material,
            mesh,
            instances: [],
            maxInstances: initialSize,
            needsUpdate: false,
            colorAttribute
        };

        this.batches.set(modelKey, batch);
        return batch;
    }

    /**
     * Add an instance to a batch
     */
    addInstance(id: string, modelKey: string): boolean {
        let batch = this.batches.get(modelKey);

        if (!batch) {
            console.warn(`No batch for model: ${modelKey}`);
            return false;
        }

        // Check if we need to grow the batch
        if (batch.instances.length >= batch.maxInstances) {
            this.growBatch(batch);
        }

        const instance: InstanceData = {
            id,
            modelKey,
            visible: true,
            lodLevel: 0,
            selected: false,
            hovered: false
        };

        batch.instances.push(instance);
        this.instanceToModel.set(id, modelKey);
        batch.needsUpdate = true;

        return true;
    }

    /**
     * Remove an instance
     */
    removeInstance(id: string): boolean {
        const modelKey = this.instanceToModel.get(id);
        if (!modelKey) return false;

        const batch = this.batches.get(modelKey);
        if (!batch) return false;

        const index = batch.instances.findIndex(i => i.id === id);
        if (index === -1) return false;

        // Remove from array
        batch.instances.splice(index, 1);
        this.instanceToModel.delete(id);
        batch.needsUpdate = true;

        return true;
    }

    /**
     * Update instance visibility
     */
    setVisible(id: string, visible: boolean): void {
        const modelKey = this.instanceToModel.get(id);
        if (!modelKey) return;

        const batch = this.batches.get(modelKey);
        if (!batch) return;

        const instance = batch.instances.find(i => i.id === id);
        if (instance) {
            instance.visible = visible;
            batch.needsUpdate = true;
        }
    }

    /**
     * Update instance selection state
     */
    setSelected(id: string, selected: boolean): void {
        const modelKey = this.instanceToModel.get(id);
        if (!modelKey) return;

        const batch = this.batches.get(modelKey);
        if (!batch) return;

        const instance = batch.instances.find(i => i.id === id);
        if (instance) {
            instance.selected = selected;
            batch.needsUpdate = true;
        }
    }

    /**
     * Update instance hover state
     */
    setHovered(id: string, hovered: boolean): void {
        const modelKey = this.instanceToModel.get(id);
        if (!modelKey) return;

        const batch = this.batches.get(modelKey);
        if (!batch) return;

        const instance = batch.instances.find(i => i.id === id);
        if (instance) {
            instance.hovered = hovered;
            batch.needsUpdate = true;
        }
    }

    /**
     * Update instance LOD level
     */
    setLODLevel(id: string, level: number): void {
        const modelKey = this.instanceToModel.get(id);
        if (!modelKey) return;

        const batch = this.batches.get(modelKey);
        if (!batch) return;

        const instance = batch.instances.find(i => i.id === id);
        if (instance) {
            instance.lodLevel = level;
            batch.needsUpdate = true;
        }
    }

    /**
     * Batch update: apply all pending changes to GPU
     */
    updateBatches(): void {
        for (const [_, batch] of this.batches) {
            if (!batch.needsUpdate || !batch.mesh) continue;

            this.updateBatchMatrices(batch);
            batch.needsUpdate = false;
        }
    }

    /**
     * Update matrices for a specific batch
     */
    private updateBatchMatrices(batch: InstanceBatch): void {
        const mesh = batch.mesh;
        if (!mesh) return;

        // First, hide all instances by setting scale to 0
        this.tempMatrix.makeScale(0, 0, 0);
        for (let i = 0; i < batch.maxInstances; i++) {
            mesh.setMatrixAt(i, this.tempMatrix);
        }

        // Then set visible instances
        for (let i = 0; i < batch.instances.length; i++) {
            const instance = batch.instances[i];

            if (!instance.visible) continue;

            // Get transform from transient store
            const transform = transientStore.getTransform(instance.id);

            if (transform) {
                // Build matrix from transform
                this.tempObject.position.copy(transform.position);
                this.tempObject.rotation.copy(transform.rotation);
                this.tempObject.scale.copy(transform.scale);

                // Apply LOD scaling (reduce detail at distance)
                if (instance.lodLevel > 0) {
                    // For now, just keep full scale - LOD geometry swap happens elsewhere
                }

                this.tempObject.updateMatrix();
                mesh.setMatrixAt(i, this.tempObject.matrix);

                // Update color based on state
                if (instance.selected) {
                    this.tempColor.copy(COLORS.selected);
                } else if (instance.hovered) {
                    this.tempColor.copy(COLORS.hovered);
                } else {
                    this.tempColor.copy(COLORS.default);
                }

                if (batch.colorAttribute) {
                    batch.colorAttribute.setXYZ(i, this.tempColor.r, this.tempColor.g, this.tempColor.b);
                }
            }
        }

        mesh.instanceMatrix.needsUpdate = true;
        if (batch.colorAttribute) {
            batch.colorAttribute.needsUpdate = true;
        }
        mesh.count = batch.instances.filter(i => i.visible).length;
    }

    /**
     * Grow a batch when it runs out of space
     */
    private growBatch(batch: InstanceBatch): void {
        const newSize = Math.ceil(batch.maxInstances * this.batchGrowthFactor);
        console.log(`Growing batch ${batch.modelKey} from ${batch.maxInstances} to ${newSize}`);

        if (batch.mesh) {
            // Create new mesh with larger capacity
            const newMesh = new THREE.InstancedMesh(
                batch.geometry,
                batch.material,
                newSize
            );
            newMesh.frustumCulled = false;
            newMesh.castShadow = true;
            newMesh.receiveShadow = true;

            // Create new color attribute
            const colors = new Float32Array(newSize * 3);
            const colorAttribute = new THREE.InstancedBufferAttribute(colors, 3);
            newMesh.instanceColor = colorAttribute;

            // Initialize all to invisible
            this.tempMatrix.makeScale(0, 0, 0);
            for (let i = 0; i < newSize; i++) {
                newMesh.setMatrixAt(i, this.tempMatrix);
            }

            // Copy existing instances
            for (let i = 0; i < batch.instances.length; i++) {
                batch.mesh.getMatrixAt(i, this.tempMatrix);
                newMesh.setMatrixAt(i, this.tempMatrix);

                if (batch.colorAttribute) {
                    colors[i * 3] = batch.colorAttribute.getX(i);
                    colors[i * 3 + 1] = batch.colorAttribute.getY(i);
                    colors[i * 3 + 2] = batch.colorAttribute.getZ(i);
                }
            }

            // Dispose old mesh
            batch.mesh.dispose();

            // Replace
            batch.mesh = newMesh;
            batch.colorAttribute = colorAttribute;
            batch.maxInstances = newSize;
        }
    }

    /**
     * Get instance ID from instanceId (for picking)
     */
    getObjectIdFromInstanceId(modelKey: string, instanceId: number): string | null {
        const batch = this.batches.get(modelKey);
        if (!batch) return null;

        // Find visible instances and map index
        const visibleInstances = batch.instances.filter(i => i.visible);
        if (instanceId >= 0 && instanceId < visibleInstances.length) {
            return visibleInstances[instanceId].id;
        }

        return null;
    }

    /**
     * Get all meshes for adding to scene
     */
    getMeshes(): THREE.InstancedMesh[] {
        const meshes: THREE.InstancedMesh[] = [];

        for (const [_, batch] of this.batches) {
            if (batch.mesh) {
                meshes.push(batch.mesh);
            }
        }

        return meshes;
    }

    /**
     * Get batch statistics
     */
    getStats(): { batches: number; totalInstances: number; visibleInstances: number } {
        let totalInstances = 0;
        let visibleInstances = 0;

        for (const [_, batch] of this.batches) {
            totalInstances += batch.instances.length;
            visibleInstances += batch.instances.filter(i => i.visible).length;
        }

        return {
            batches: this.batches.size,
            totalInstances,
            visibleInstances
        };
    }

    /**
     * Clear all batches
     */
    clear(): void {
        for (const [_, batch] of this.batches) {
            if (batch.mesh) {
                batch.mesh.dispose();
            }
        }

        this.batches.clear();
        this.instanceToModel.clear();
    }

    /**
     * Dispose of resources
     */
    dispose(): void {
        this.clear();

        for (const [_, geo] of this.geometryCache) {
            geo.dispose();
        }
        this.geometryCache.clear();

        for (const [_, mat] of this.materialCache) {
            mat.dispose();
        }
        this.materialCache.clear();
    }
}

// Singleton instance
export const instanceManager = new InstanceManager();
