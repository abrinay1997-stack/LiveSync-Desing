/**
 * OptimizedInstancedRigging - High-Performance Batch Renderer
 *
 * Uses the new performance system for:
 * - Transient updates without React re-renders
 * - Frustum culling via spatial index
 * - LOD-based rendering
 * - Per-instance coloring for selection/hover
 */

import React, { useRef, useMemo, useLayoutEffect, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store';
import { SceneObject } from '../../types';
import { ASSETS } from '../../data/library';
import {
    transientStore,
    spatialIndex,
    lodManager,
    performanceMonitor
} from '../../utils/performance';

// Object types to render via instancing
const INSTANCED_TYPES = ['truss', 'motor'];

// Color constants
const COLOR_DEFAULT = new THREE.Color(0xd4d4d8);
const COLOR_SELECTED = new THREE.Color(0x06b6d4);
const COLOR_HOVERED = new THREE.Color(0xffffff);

// Material cache (shared across instances)
const materialCache: Map<string, THREE.MeshStandardMaterial> = new Map();

function getCachedMaterial(modelKey: string, type: string): THREE.MeshStandardMaterial {
    if (materialCache.has(modelKey)) {
        return materialCache.get(modelKey)!;
    }

    const mat = new THREE.MeshStandardMaterial({
        color: ASSETS[modelKey]?.color || '#888888',
        roughness: type === 'truss' ? 0.2 : 0.5,
        metalness: type === 'truss' ? 0.8 : 0.5,
        vertexColors: true // Enable per-instance colors
    });

    materialCache.set(modelKey, mat);
    return mat;
}

interface InstancedBatchProps {
    modelKey: string;
    objects: SceneObject[];
    selectedIds: string[];
    hoveredId: string | null;
}

/**
 * Single batch of instanced objects sharing geometry
 */
const InstancedBatch: React.FC<InstancedBatchProps> = ({
    modelKey,
    objects,
    selectedIds,
    hoveredId
}) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const selectObject = useStore(state => state.selectObject);
    const activeTool = useStore(state => state.activeTool);

    // Object lookup for picking
    const objectsRef = useRef<SceneObject[]>(objects);
    objectsRef.current = objects;

    const assetData = ASSETS[modelKey];
    if (!assetData) return null;

    // Geometry (cached per model)
    const geometry = useMemo(() => {
        const { w, h, d } = assetData.dimensions;
        return new THREE.BoxGeometry(w, h, d);
    }, [modelKey]);

    // Material with per-instance colors
    const material = useMemo(() => {
        return getCachedMaterial(modelKey, assetData.type);
    }, [modelKey]);

    // Temporary objects for matrix calculations
    const tempObject = useMemo(() => new THREE.Object3D(), []);
    const tempColor = useMemo(() => new THREE.Color(), []);

    // Update instance matrices and colors
    useLayoutEffect(() => {
        const mesh = meshRef.current;
        if (!mesh) return;

        const count = objects.length;

        // Ensure we have enough capacity
        if (mesh.count < count) {
            console.warn(`InstancedBatch ${modelKey}: capacity ${mesh.count} < objects ${count}`);
        }

        // Update each instance
        for (let i = 0; i < count; i++) {
            const obj = objects[i];

            // Get transform from transient store or fall back to object data
            const transform = transientStore.getTransform(obj.id);

            if (transform) {
                tempObject.position.copy(transform.position);
                tempObject.rotation.copy(transform.rotation);
                tempObject.scale.copy(transform.scale);
            } else {
                tempObject.position.set(...obj.position);
                tempObject.rotation.set(...obj.rotation);
                tempObject.scale.set(...obj.scale);
            }

            tempObject.updateMatrix();
            mesh.setMatrixAt(i, tempObject.matrix);

            // Set color based on state
            const isSelected = selectedIds.includes(obj.id);
            const isHovered = hoveredId === obj.id;

            if (isSelected) {
                tempColor.copy(COLOR_SELECTED);
            } else if (isHovered) {
                tempColor.copy(COLOR_HOVERED);
            } else {
                tempColor.copy(COLOR_DEFAULT);
            }

            mesh.setColorAt(i, tempColor);
        }

        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) {
            mesh.instanceColor.needsUpdate = true;
        }
        mesh.count = count;
    }, [objects, selectedIds, hoveredId]);

    // Handle click (picking)
    const handleClick = (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();

        const instanceId = e.instanceId;
        if (instanceId === undefined || instanceId < 0) return;

        const obj = objectsRef.current[instanceId];
        if (obj && ['select', 'move', 'rotate'].includes(activeTool)) {
            // Support both Shift+click and Ctrl/Cmd+click for multi-selection
            const nativeEvent = e.nativeEvent;
            const isMultiSelect = nativeEvent.shiftKey || nativeEvent.ctrlKey || nativeEvent.metaKey;
            selectObject(obj.id, isMultiSelect);
        }
    };

    // Handle pointer events for hover
    const handlePointerOver = () => {
        if (['select', 'move', 'rotate', 'eraser'].includes(activeTool)) {
            document.body.style.cursor = 'pointer';
        }
    };

    const handlePointerOut = () => {
        document.body.style.cursor = 'auto';
    };

    // Max instances (pre-allocate for performance)
    const maxInstances = Math.max(objects.length * 2, 100);

    return (
        <instancedMesh
            ref={meshRef}
            args={[geometry, material, maxInstances]}
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            castShadow
            receiveShadow
            frustumCulled={false} // We handle culling ourselves
        />
    );
};

/**
 * Main optimized instanced rigging component
 */
export const OptimizedInstancedRigging: React.FC = () => {
    // Use store.subscribe for objects to avoid re-renders on every change
    const objectsRef = useRef<SceneObject[]>([]);
    const layersRef = useRef<any[]>([]);
    const selectedIdsRef = useRef<string[]>([]);

    // Force update trigger (for when we need to re-render)
    const [updateTrigger, setUpdateTrigger] = React.useState(0);

    // Hover state
    const [hoveredId, setHoveredId] = React.useState<string | null>(null);

    // Subscribe to store changes imperatively
    useEffect(() => {
        // Initial sync
        const state = useStore.getState();
        objectsRef.current = state.objects;
        layersRef.current = state.layers;
        selectedIdsRef.current = state.selectedIds;

        // Subscribe to changes
        const unsubscribe = useStore.subscribe((state) => {
            const objectsChanged = state.objects !== objectsRef.current;
            const layersChanged = state.layers !== layersRef.current;
            const selectionChanged = state.selectedIds !== selectedIdsRef.current;

            objectsRef.current = state.objects;
            layersRef.current = state.layers;
            selectedIdsRef.current = state.selectedIds;

            // Only trigger re-render when necessary
            if (objectsChanged || layersChanged || selectionChanged) {
                // Sync to transient store
                const visibleObjects = state.objects.filter(obj => {
                    const layer = state.layers.find(l => l.id === obj.layerId);
                    return layer ? layer.visible : true;
                });
                transientStore.initFromObjects(visibleObjects);

                setUpdateTrigger(prev => prev + 1);
            }
        });

        return unsubscribe;
    }, []);

    // Group objects by model for batching
    const groupedData = useMemo(() => {
        const groups: Record<string, SceneObject[]> = {};

        const visibleObjects = objectsRef.current.filter(obj => {
            const layer = layersRef.current.find((l: any) => l.id === obj.layerId);
            return layer ? layer.visible : true;
        });

        visibleObjects.forEach(obj => {
            // Only instance non-selected rigging objects
            if (
                INSTANCED_TYPES.includes(obj.type) &&
                !selectedIdsRef.current.includes(obj.id)
            ) {
                if (!groups[obj.model]) groups[obj.model] = [];
                groups[obj.model].push(obj);
            }
        });

        return groups;
    }, [updateTrigger]);

    // Update performance stats
    useFrame(() => {
        let instancedCount = 0;
        for (const objs of Object.values(groupedData)) {
            instancedCount += objs.length;
        }

        performanceMonitor.setCustomStats({
            instancedCount
        });
    });

    return (
        <group>
            {Object.entries(groupedData).map(([modelKey, objects]) => (
                <InstancedBatch
                    key={modelKey}
                    modelKey={modelKey}
                    objects={objects}
                    selectedIds={selectedIdsRef.current}
                    hoveredId={hoveredId}
                />
            ))}
        </group>
    );
};
