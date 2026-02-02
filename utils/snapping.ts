import * as THREE from 'three';

// Default grid size. In the future, this could be dynamic from the Store.
const GRID_SIZE = 0.5;
const FINE_GRID_SIZE = 0.1;

/**
 * Snaps a scalar value to the nearest step
 */
export const snapValue = (val: number, step: number = GRID_SIZE): number => {
    return Math.round(val / step) * step;
};

/**
 * Snaps a Vector3 to the grid. 
 * Preserves Y usually, unless specified, as we often snap only on the horizontal plane.
 */
export const snapVector = (
    vec: THREE.Vector3, 
    enabled: boolean = true, 
    snapY: boolean = false
): THREE.Vector3 => {
    if (!enabled) return vec;

    const x = snapValue(vec.x);
    const z = snapValue(vec.z);
    const y = snapY ? snapValue(vec.y) : vec.y;

    return new THREE.Vector3(x, y, z);
};

/**
 * Helper for snapping raw coordinate arrays
 */
export const snapCoords = (
    x: number, 
    y: number, 
    z: number, 
    enabled: boolean
): [number, number, number] => {
    if (!enabled) return [x, y, z];
    return [snapValue(x), y, snapValue(z)];
};