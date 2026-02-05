/**
 * Spatial Index - BVH-based Acceleration Structure
 *
 * Uses Bounding Volume Hierarchy for O(log n) raycasting and spatial queries.
 * Essential for scenes with thousands of objects.
 *
 * Features:
 * - Fast raycasting for selection and snapping
 * - Frustum culling acceleration
 * - Nearest neighbor queries
 * - Range queries for connection points
 */

import * as THREE from 'three';
import { SceneObject } from '../../types';

// AABB (Axis-Aligned Bounding Box) for BVH
interface AABB {
    min: THREE.Vector3;
    max: THREE.Vector3;
}

// BVH Node
interface BVHNode {
    bounds: AABB;
    left: BVHNode | null;
    right: BVHNode | null;
    objectIds: string[]; // Leaf nodes contain object IDs
    isLeaf: boolean;
}

// Spatial query result
export interface SpatialQueryResult {
    id: string;
    distance: number;
    point: THREE.Vector3;
}

// Object bounds cache
interface ObjectBounds {
    id: string;
    bounds: AABB;
    center: THREE.Vector3;
    radius: number; // Bounding sphere radius
}

class SpatialIndex {
    private root: BVHNode | null = null;
    private objectBounds: Map<string, ObjectBounds> = new Map();
    private needsRebuild: boolean = false;

    // Object pools
    private tempRay = new THREE.Ray();
    private tempBox = new THREE.Box3();
    private tempVec = new THREE.Vector3();
    private tempVec2 = new THREE.Vector3();
    private tempMatrix = new THREE.Matrix4();
    private tempInverse = new THREE.Matrix4();

    // Configuration
    private maxLeafSize = 4;

    /**
     * Build/rebuild the BVH from scene objects
     */
    build(objects: SceneObject[]): void {
        // Calculate bounds for all objects
        this.objectBounds.clear();

        for (const obj of objects) {
            const bounds = this.calculateObjectBounds(obj);
            this.objectBounds.set(obj.id, bounds);
        }

        // Build BVH
        const allIds = objects.map(o => o.id);
        this.root = this.buildNode(allIds);
        this.needsRebuild = false;
    }

    /**
     * Update a single object's bounds (call when object moves)
     */
    updateObject(obj: SceneObject): void {
        const bounds = this.calculateObjectBounds(obj);
        this.objectBounds.set(obj.id, bounds);
        this.needsRebuild = true;
    }

    /**
     * Mark index as needing rebuild
     */
    markDirty(): void {
        this.needsRebuild = true;
    }

    /**
     * Check if rebuild is needed
     */
    needsUpdate(): boolean {
        return this.needsRebuild;
    }

    /**
     * Raycast against all objects, returns sorted by distance
     */
    raycast(
        origin: THREE.Vector3,
        direction: THREE.Vector3,
        maxDistance: number = Infinity
    ): SpatialQueryResult[] {
        if (!this.root) return [];

        this.tempRay.set(origin, direction.clone().normalize());
        const results: SpatialQueryResult[] = [];

        this.raycastNode(this.root, this.tempRay, maxDistance, results);

        // Sort by distance
        results.sort((a, b) => a.distance - b.distance);

        return results;
    }

    /**
     * Find objects within a sphere
     */
    queryRadius(center: THREE.Vector3, radius: number): string[] {
        if (!this.root) return [];

        const results: string[] = [];
        this.queryRadiusNode(this.root, center, radius, results);

        return results;
    }

    /**
     * Find the nearest object to a point
     */
    nearest(point: THREE.Vector3, maxDistance: number = Infinity): SpatialQueryResult | null {
        if (!this.root) return null;

        let nearest: SpatialQueryResult | null = null;
        let nearestDist = maxDistance;

        for (const [id, bounds] of this.objectBounds) {
            const dist = bounds.center.distanceTo(point);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = {
                    id,
                    distance: dist,
                    point: bounds.center.clone()
                };
            }
        }

        return nearest;
    }

    /**
     * Find K nearest objects
     */
    kNearest(point: THREE.Vector3, k: number, maxDistance: number = Infinity): SpatialQueryResult[] {
        if (!this.root) return [];

        const results: SpatialQueryResult[] = [];

        for (const [id, bounds] of this.objectBounds) {
            const dist = bounds.center.distanceTo(point);
            if (dist <= maxDistance) {
                results.push({
                    id,
                    distance: dist,
                    point: bounds.center.clone()
                });
            }
        }

        results.sort((a, b) => a.distance - b.distance);
        return results.slice(0, k);
    }

    /**
     * Frustum culling - returns visible object IDs
     */
    frustumCull(frustum: THREE.Frustum): string[] {
        if (!this.root) return [];

        const visible: string[] = [];
        this.frustumCullNode(this.root, frustum, visible);

        return visible;
    }

    /**
     * Get all objects within an AABB
     */
    queryBox(box: THREE.Box3): string[] {
        if (!this.root) return [];

        const results: string[] = [];
        const aabb: AABB = {
            min: box.min.clone(),
            max: box.max.clone()
        };

        this.queryBoxNode(this.root, aabb, results);
        return results;
    }

    /**
     * Get object count
     */
    getObjectCount(): number {
        return this.objectBounds.size;
    }

    /**
     * Clear the index
     */
    clear(): void {
        this.root = null;
        this.objectBounds.clear();
        this.needsRebuild = false;
    }

    // --- Private Methods ---

    private calculateObjectBounds(obj: SceneObject): ObjectBounds {
        const dims = obj.dimensions || { w: 1, h: 1, d: 1 };
        const halfW = dims.w / 2;
        const halfH = dims.h / 2;
        const halfD = dims.d / 2;

        // Create local bounds
        const localMin = new THREE.Vector3(-halfW, -halfH, -halfD);
        const localMax = new THREE.Vector3(halfW, halfH, halfD);

        // Transform to world space
        this.tempMatrix.makeRotationFromEuler(new THREE.Euler(...obj.rotation));
        this.tempMatrix.setPosition(new THREE.Vector3(...obj.position));
        this.tempMatrix.scale(new THREE.Vector3(...obj.scale));

        // Transform 8 corners and find world AABB
        const corners = [
            new THREE.Vector3(localMin.x, localMin.y, localMin.z),
            new THREE.Vector3(localMax.x, localMin.y, localMin.z),
            new THREE.Vector3(localMin.x, localMax.y, localMin.z),
            new THREE.Vector3(localMax.x, localMax.y, localMin.z),
            new THREE.Vector3(localMin.x, localMin.y, localMax.z),
            new THREE.Vector3(localMax.x, localMin.y, localMax.z),
            new THREE.Vector3(localMin.x, localMax.y, localMax.z),
            new THREE.Vector3(localMax.x, localMax.y, localMax.z)
        ];

        const worldMin = new THREE.Vector3(Infinity, Infinity, Infinity);
        const worldMax = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

        for (const corner of corners) {
            corner.applyMatrix4(this.tempMatrix);
            worldMin.min(corner);
            worldMax.max(corner);
        }

        const center = new THREE.Vector3().addVectors(worldMin, worldMax).multiplyScalar(0.5);
        const radius = worldMin.distanceTo(worldMax) / 2;

        return {
            id: obj.id,
            bounds: { min: worldMin, max: worldMax },
            center,
            radius
        };
    }

    private buildNode(objectIds: string[]): BVHNode | null {
        if (objectIds.length === 0) return null;

        // Calculate combined bounds
        const bounds = this.combineBounds(objectIds);

        // Leaf node
        if (objectIds.length <= this.maxLeafSize) {
            return {
                bounds,
                left: null,
                right: null,
                objectIds,
                isLeaf: true
            };
        }

        // Find split axis (longest)
        const size = this.tempVec.subVectors(bounds.max, bounds.min);
        let axis: 'x' | 'y' | 'z' = 'x';
        if (size.y > size.x && size.y > size.z) axis = 'y';
        else if (size.z > size.x && size.z > size.y) axis = 'z';

        // Sort by center on split axis
        const sorted = [...objectIds].sort((a, b) => {
            const boundsA = this.objectBounds.get(a)!;
            const boundsB = this.objectBounds.get(b)!;
            return boundsA.center[axis] - boundsB.center[axis];
        });

        // Split at median
        const mid = Math.floor(sorted.length / 2);
        const leftIds = sorted.slice(0, mid);
        const rightIds = sorted.slice(mid);

        return {
            bounds,
            left: this.buildNode(leftIds),
            right: this.buildNode(rightIds),
            objectIds: [],
            isLeaf: false
        };
    }

    private combineBounds(objectIds: string[]): AABB {
        const min = new THREE.Vector3(Infinity, Infinity, Infinity);
        const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

        for (const id of objectIds) {
            const bounds = this.objectBounds.get(id);
            if (bounds) {
                min.min(bounds.bounds.min);
                max.max(bounds.bounds.max);
            }
        }

        return { min, max };
    }

    private aabbIntersectsRay(aabb: AABB, ray: THREE.Ray, maxDist: number): boolean {
        this.tempBox.set(aabb.min, aabb.max);
        const hit = ray.intersectBox(this.tempBox, this.tempVec2);
        return hit !== null && this.tempVec2.distanceTo(ray.origin) <= maxDist;
    }

    private raycastNode(
        node: BVHNode,
        ray: THREE.Ray,
        maxDist: number,
        results: SpatialQueryResult[]
    ): void {
        // Test node bounds
        if (!this.aabbIntersectsRay(node.bounds, ray, maxDist)) return;

        if (node.isLeaf) {
            // Test individual objects
            for (const id of node.objectIds) {
                const bounds = this.objectBounds.get(id);
                if (!bounds) continue;

                this.tempBox.set(bounds.bounds.min, bounds.bounds.max);
                const hit = ray.intersectBox(this.tempBox, this.tempVec);

                if (hit) {
                    const dist = hit.distanceTo(ray.origin);
                    if (dist <= maxDist) {
                        results.push({
                            id,
                            distance: dist,
                            point: hit.clone()
                        });
                    }
                }
            }
        } else {
            if (node.left) this.raycastNode(node.left, ray, maxDist, results);
            if (node.right) this.raycastNode(node.right, ray, maxDist, results);
        }
    }

    private queryRadiusNode(
        node: BVHNode,
        center: THREE.Vector3,
        radius: number,
        results: string[]
    ): void {
        // Quick AABB-sphere test
        this.tempBox.set(node.bounds.min, node.bounds.max);
        if (this.tempBox.distanceToPoint(center) > radius) return;

        if (node.isLeaf) {
            for (const id of node.objectIds) {
                const bounds = this.objectBounds.get(id);
                if (bounds && bounds.center.distanceTo(center) <= radius + bounds.radius) {
                    results.push(id);
                }
            }
        } else {
            if (node.left) this.queryRadiusNode(node.left, center, radius, results);
            if (node.right) this.queryRadiusNode(node.right, center, radius, results);
        }
    }

    private frustumCullNode(
        node: BVHNode,
        frustum: THREE.Frustum,
        visible: string[]
    ): void {
        this.tempBox.set(node.bounds.min, node.bounds.max);

        if (!frustum.intersectsBox(this.tempBox)) return;

        if (node.isLeaf) {
            for (const id of node.objectIds) {
                const bounds = this.objectBounds.get(id);
                if (bounds) {
                    this.tempBox.set(bounds.bounds.min, bounds.bounds.max);
                    if (frustum.intersectsBox(this.tempBox)) {
                        visible.push(id);
                    }
                }
            }
        } else {
            if (node.left) this.frustumCullNode(node.left, frustum, visible);
            if (node.right) this.frustumCullNode(node.right, frustum, visible);
        }
    }

    private queryBoxNode(node: BVHNode, queryBox: AABB, results: string[]): void {
        // AABB-AABB intersection test
        if (
            node.bounds.max.x < queryBox.min.x || node.bounds.min.x > queryBox.max.x ||
            node.bounds.max.y < queryBox.min.y || node.bounds.min.y > queryBox.max.y ||
            node.bounds.max.z < queryBox.min.z || node.bounds.min.z > queryBox.max.z
        ) {
            return;
        }

        if (node.isLeaf) {
            for (const id of node.objectIds) {
                const bounds = this.objectBounds.get(id);
                if (bounds) {
                    if (
                        bounds.bounds.max.x >= queryBox.min.x && bounds.bounds.min.x <= queryBox.max.x &&
                        bounds.bounds.max.y >= queryBox.min.y && bounds.bounds.min.y <= queryBox.max.y &&
                        bounds.bounds.max.z >= queryBox.min.z && bounds.bounds.min.z <= queryBox.max.z
                    ) {
                        results.push(id);
                    }
                }
            }
        } else {
            if (node.left) this.queryBoxNode(node.left, queryBox, results);
            if (node.right) this.queryBoxNode(node.right, queryBox, results);
        }
    }
}

// Singleton instance
export const spatialIndex = new SpatialIndex();
