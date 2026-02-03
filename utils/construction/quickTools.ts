/**
 * Quick Construction Tools
 *
 * Functions for rapid truss construction:
 * - Extend: Add truss in the direction of extension
 * - Duplicate: Copy truss in its facing direction
 * - Fill Gap: Calculate and fill space between two trusses
 * - Quick Rotate: Rotate by fixed increments
 */

import * as THREE from 'three';
import { SceneObject } from '../../types';
import { ASSETS } from '../../data/library';
import { getTrussConnectionPoints, ConnectionPoint } from './connectionPoints';

export interface ExtendResult {
    success: boolean;
    newObject?: Partial<SceneObject>;
    error?: string;
}

export interface FillGapResult {
    success: boolean;
    pieces: Array<{
        model: string;
        position: [number, number, number];
        rotation: [number, number, number];
    }>;
    totalLength: number;
    error?: string;
}

/**
 * Get available truss lengths sorted by size
 */
export function getAvailableTrussLengths(): Array<{ model: string; length: number }> {
    const trussAssets = Object.entries(ASSETS)
        .filter(([key, asset]) => asset.type === 'truss' && !key.includes('corner'))
        .map(([model, asset]) => ({
            model,
            length: asset.dimensions.w
        }))
        .sort((a, b) => b.length - a.length); // Sort descending

    return trussAssets;
}

/**
 * Find the best truss size for a given length
 */
export function findBestTrussForLength(targetLength: number): string | null {
    const available = getAvailableTrussLengths();

    // Find exact match first
    const exact = available.find(t => Math.abs(t.length - targetLength) < 0.01);
    if (exact) return exact.model;

    // Find closest that doesn't exceed
    const smaller = available.filter(t => t.length <= targetLength + 0.01);
    if (smaller.length > 0) return smaller[0].model;

    // Return smallest available
    return available[available.length - 1]?.model || null;
}

/**
 * Extend a truss by adding another truss at its unconnected end
 */
export function extendTruss(
    truss: SceneObject,
    allObjects: SceneObject[],
    preferredLength?: number
): ExtendResult {
    if (truss.type !== 'truss') {
        return { success: false, error: 'Can only extend truss objects' };
    }

    const connectionPoints = getTrussConnectionPoints(truss);

    // Find an unconnected point
    // Check which points are near other trusses
    const otherTrusses = allObjects.filter(o => o.type === 'truss' && o.id !== truss.id);

    let extendPoint: ConnectionPoint | null = null;

    for (const point of connectionPoints) {
        let isConnected = false;

        for (const other of otherTrusses) {
            const otherPoints = getTrussConnectionPoints(other);
            for (const op of otherPoints) {
                if (point.position.distanceTo(op.position) < 0.1) {
                    isConnected = true;
                    break;
                }
            }
            if (isConnected) break;
        }

        if (!isConnected) {
            extendPoint = point;
            break;
        }
    }

    if (!extendPoint) {
        // Both ends connected, use right end by default
        extendPoint = connectionPoints[1];
    }

    // Determine the new truss model
    const newModel = preferredLength
        ? findBestTrussForLength(preferredLength)
        : truss.model; // Same as current

    if (!newModel) {
        return { success: false, error: 'No suitable truss found' };
    }

    const newAsset = ASSETS[newModel];
    if (!newAsset) {
        return { success: false, error: 'Asset not found' };
    }

    // Calculate new position
    // The new truss should be placed so its opposite end connects to extendPoint
    const newLength = newAsset.dimensions.w;
    const offset = extendPoint.direction.clone().multiplyScalar(newLength / 2);
    const newPosition = extendPoint.position.clone().add(offset);

    // Calculate rotation to align with current truss
    const newRotation: [number, number, number] = [...truss.rotation] as [number, number, number];

    return {
        success: true,
        newObject: {
            model: newModel,
            type: 'truss',
            position: [newPosition.x, newPosition.y, newPosition.z],
            rotation: newRotation,
            dimensions: { ...newAsset.dimensions },
            color: newAsset.color,
            layerId: 'rigging'
        }
    };
}

/**
 * Duplicate a truss in a specified direction
 */
export function duplicateTrussInDirection(
    truss: SceneObject,
    direction: 'forward' | 'backward' | 'left' | 'right',
    spacing: number = 0
): ExtendResult {
    if (truss.type !== 'truss') {
        return { success: false, error: 'Can only duplicate truss objects' };
    }

    const dims = truss.dimensions || { w: 1, h: 0.29, d: 0.29 };
    const rotation = new THREE.Euler(...truss.rotation);
    const rotMatrix = new THREE.Matrix4().makeRotationFromEuler(rotation);

    let localOffset: THREE.Vector3;

    switch (direction) {
        case 'forward':
            localOffset = new THREE.Vector3(dims.w + spacing, 0, 0);
            break;
        case 'backward':
            localOffset = new THREE.Vector3(-(dims.w + spacing), 0, 0);
            break;
        case 'left':
            localOffset = new THREE.Vector3(0, 0, dims.d + spacing);
            break;
        case 'right':
            localOffset = new THREE.Vector3(0, 0, -(dims.d + spacing));
            break;
    }

    localOffset.applyMatrix4(rotMatrix);

    const newPosition: [number, number, number] = [
        truss.position[0] + localOffset.x,
        truss.position[1] + localOffset.y,
        truss.position[2] + localOffset.z
    ];

    return {
        success: true,
        newObject: {
            model: truss.model,
            type: 'truss',
            position: newPosition,
            rotation: [...truss.rotation] as [number, number, number],
            dimensions: { ...dims },
            color: truss.color,
            layerId: truss.layerId
        }
    };
}

/**
 * Calculate pieces needed to fill a gap between two points
 */
export function calculateFillPieces(
    startPos: THREE.Vector3,
    endPos: THREE.Vector3,
    direction: THREE.Vector3
): FillGapResult {
    const gap = startPos.distanceTo(endPos);
    const available = getAvailableTrussLengths();

    if (gap < 0.4) {
        return { success: false, pieces: [], totalLength: 0, error: 'Gap too small' };
    }

    // Greedy algorithm to fill the gap
    const pieces: Array<{
        model: string;
        position: [number, number, number];
        rotation: [number, number, number];
    }> = [];

    let remaining = gap;
    let currentPos = startPos.clone();

    // Calculate rotation from direction
    const angle = Math.atan2(direction.z, direction.x);
    const rotation: [number, number, number] = [0, -angle, 0];

    while (remaining > 0.05) {
        // Find largest piece that fits
        let bestFit = available.find(t => t.length <= remaining + 0.05);

        if (!bestFit) {
            // Use smallest piece
            bestFit = available[available.length - 1];
        }

        if (!bestFit) break;

        const asset = ASSETS[bestFit.model];
        if (!asset) break;

        // Position at center of this piece
        const pieceCenter = currentPos.clone().add(
            direction.clone().normalize().multiplyScalar(bestFit.length / 2)
        );

        pieces.push({
            model: bestFit.model,
            position: [pieceCenter.x, pieceCenter.y, pieceCenter.z],
            rotation
        });

        // Move current position
        currentPos.add(direction.clone().normalize().multiplyScalar(bestFit.length));
        remaining -= bestFit.length;
    }

    const totalLength = pieces.reduce((sum, p) => {
        const asset = ASSETS[p.model];
        return sum + (asset?.dimensions.w || 0);
    }, 0);

    return {
        success: pieces.length > 0,
        pieces,
        totalLength
    };
}

/**
 * Fill the gap between two selected trusses
 */
export function fillGapBetweenTrusses(
    truss1: SceneObject,
    truss2: SceneObject
): FillGapResult {
    if (truss1.type !== 'truss' || truss2.type !== 'truss') {
        return { success: false, pieces: [], totalLength: 0, error: 'Both objects must be trusses' };
    }

    const points1 = getTrussConnectionPoints(truss1);
    const points2 = getTrussConnectionPoints(truss2);

    // Find the closest pair of connection points
    let minDist = Infinity;
    let closestPair: [ConnectionPoint, ConnectionPoint] | null = null;

    for (const p1 of points1) {
        for (const p2 of points2) {
            const dist = p1.position.distanceTo(p2.position);
            if (dist < minDist) {
                minDist = dist;
                closestPair = [p1, p2];
            }
        }
    }

    if (!closestPair || minDist < 0.5) {
        return {
            success: false,
            pieces: [],
            totalLength: 0,
            error: minDist < 0.5 ? 'Trusses already connected' : 'Could not find connection points'
        };
    }

    const [start, end] = closestPair;
    const direction = end.position.clone().sub(start.position).normalize();

    return calculateFillPieces(start.position, end.position, direction);
}

/**
 * Rotate object by a fixed increment
 */
export function quickRotate(
    obj: SceneObject,
    axis: 'y',
    degrees: number
): [number, number, number] {
    const radians = (degrees * Math.PI) / 180;
    const newRotation: [number, number, number] = [...obj.rotation] as [number, number, number];

    switch (axis) {
        case 'y':
            newRotation[1] += radians;
            break;
    }

    return newRotation;
}

/**
 * Snap rotation to nearest increment
 */
export function snapRotation(
    rotation: [number, number, number],
    increment: number = 15
): [number, number, number] {
    const incRad = (increment * Math.PI) / 180;

    return [
        Math.round(rotation[0] / incRad) * incRad,
        Math.round(rotation[1] / incRad) * incRad,
        Math.round(rotation[2] / incRad) * incRad
    ];
}
