import React, { useLayoutEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { useStore } from '../../store';
import { SceneObject } from '../../types';
import { ASSETS } from '../../data/library';

// We process these types via InstancedMesh
const INSTANCED_TYPES = ['truss', 'motor'];

// --- GLOBAL MATERIAL CACHE ---
// Prevents recreating materials on every re-render of the component tree
const materialCache: Record<string, THREE.Material> = {};

const getCachedMaterial = (modelKey: string, color: string, type: string) => {
    const cacheKey = `${modelKey}-${color}`;
    if (materialCache[cacheKey]) return materialCache[cacheKey];

    // Create new
    let mat;
    if (type === 'truss') {
        mat = new THREE.MeshStandardMaterial({ 
            color: color, 
            roughness: 0.2, 
            metalness: 0.8 
        });
    } else {
        mat = new THREE.MeshStandardMaterial({ 
            color: color, 
            roughness: 0.5, 
            metalness: 0.5 
        });
    }
    
    materialCache[cacheKey] = mat;
    return mat;
};

interface InstancedGroupProps {
    modelKey: string;
    objects: SceneObject[];
}

const InstancedGroup: React.FC<InstancedGroupProps> = ({ modelKey, objects }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const selectObject = useStore(state => state.selectObject);
    const activeTool = useStore(state => state.activeTool);

    const assetData = ASSETS[modelKey];
    
    // Geometry is lightweight, can be memoized locally
    const geometry = useMemo(() => {
        const { w, h, d } = assetData.dimensions;
        return new THREE.BoxGeometry(w, h, d);
    }, [modelKey, assetData]);

    // Use Global Material Cache
    const material = getCachedMaterial(modelKey, assetData.color, assetData.type);

    // Update Matrix (Position/Rotation/Scale) efficiently
    useLayoutEffect(() => {
        if (!meshRef.current) return;

        const tempObject = new THREE.Object3D();
        
        objects.forEach((obj, i) => {
            tempObject.position.set(...obj.position);
            tempObject.rotation.set(...obj.rotation);
            tempObject.scale.set(...obj.scale);
            tempObject.updateMatrix();
            
            meshRef.current!.setMatrixAt(i, tempObject.matrix);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
    }, [objects]);

    const handleClick = (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        
        const instanceId = e.instanceId;
        if (instanceId === undefined) return;

        const obj = objects[instanceId];
        if (obj) {
            // Support both Shift+click and Ctrl/Cmd+click for multi-selection
            const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
            selectObject(obj.id, isMultiSelect);
        }
    };

    const handlePointerOver = () => {
        if (['select', 'move', 'rotate', 'eraser'].includes(activeTool)) {
            document.body.style.cursor = 'pointer';
        }
    };
    
    const handlePointerOut = () => {
        document.body.style.cursor = 'auto';
    };

    return (
        <instancedMesh
            ref={meshRef}
            args={[geometry, material, objects.length]}
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            castShadow
            receiveShadow
        />
    );
};

export const InstancedRigging = () => {
    const objects = useStore(state => state.objects);
    const layers = useStore(state => state.layers);
    const selectedIds = useStore(state => state.selectedIds);

    const visibleObjects = useMemo(() => {
        return objects.filter(obj => {
            const layer = layers.find(l => l.id === obj.layerId);
            return layer ? layer.visible : true;
        });
    }, [objects, layers]);

    const groupedData = useMemo(() => {
        const groups: Record<string, SceneObject[]> = {};

        visibleObjects.forEach(obj => {
            if (INSTANCED_TYPES.includes(obj.type) && !selectedIds.includes(obj.id)) {
                if (!groups[obj.model]) groups[obj.model] = [];
                groups[obj.model].push(obj);
            }
        });

        return groups;
    }, [visibleObjects, selectedIds]);

    return (
        <group>
            {Object.entries(groupedData).map(([modelKey, groupObjects]) => (
                <InstancedGroup 
                    key={modelKey} 
                    modelKey={modelKey} 
                    objects={groupObjects} 
                />
            ))}
        </group>
    );
};