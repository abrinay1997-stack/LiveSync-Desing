import * as THREE from 'three';
import { ArrayConfig, ASSETS } from '../types';

interface BoxTransform {
    index: number;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    idLabelPos: THREE.Vector3;
}

/**
 * Calculates the mechanical shape of a line array based on splay angles and bumper tilt.
 * This mimics the behavior of software like SoundVision or ArrayCalc.
 */
export const calculateArrayMechanicalShape = (
    config: ArrayConfig, 
    boxHeight: number
): BoxTransform[] => {
    const { boxCount, splayAngles, siteAngle } = config;
    const items: BoxTransform[] = [];
    
    // Start at the bumper position (0,0,0 local space)
    let currentPos = new THREE.Vector3(0, 0, 0);
    
    // Initial angle (Site Angle / Bumper Tilt)
    // Inverted logic: Positive site angle usually means tilting DOWN in system design, 
    // but in 3D rotation X, positive is UP. We map standard convention here.
    let currentAngleRad = THREE.MathUtils.degToRad(siteAngle); 

    for (let i = 0; i < boxCount; i++) {
        // Get splay for this box (angle between previous box and this one)
        const splay = splayAngles[i] || 0;
        const splayRad = THREE.MathUtils.degToRad(splay);
        
        // Accumulate angle (simplified hinge model)
        // In a real mechanical simulation, this depends on front/rear rigging points.
        // For visual simulation, simple addition is sufficient.
        currentAngleRad += splayRad;

        const rotation = new THREE.Euler(currentAngleRad, 0, 0);

        items.push({
            index: i,
            position: currentPos.clone(),
            rotation: rotation,
            // Calculate label position relative to box
            idLabelPos: new THREE.Vector3(0.6, 0, 0).applyEuler(rotation).add(currentPos)
        });

        // Calculate position of the NEXT box hinge
        // Assuming hinge is at the bottom-back of the current box for simple stacking
        const yOffset = -boxHeight * Math.cos(currentAngleRad);
        const zOffset = boxHeight * Math.sin(currentAngleRad); 
        
        currentPos.add(new THREE.Vector3(0, yOffset, zOffset));
    }

    return items;
};

/**
 * Generates the geometry for a dispersion cone (coverage visualizer)
 */
export const generateDispersionGeometry = (
    dispersion: { h: number, v: number }, 
    distance: number
): THREE.BufferGeometry => {
    const hRad = THREE.MathUtils.degToRad(dispersion.h / 2);
    const vRad = THREE.MathUtils.degToRad(dispersion.v / 2);

    const halfWidth = Math.tan(hRad) * distance;
    const halfHeight = Math.tan(vRad) * distance;
    const z = distance;
    
    const vertices = new Float32Array([
        0, 0, 0, // Tip
        -halfWidth, halfHeight, z,  // Top Left
        halfWidth, halfHeight, z,   // Top Right
        halfWidth, -halfHeight, z,  // Bottom Right
        -halfWidth, -halfHeight, z, // Bottom Left
        -halfWidth, halfHeight, z,  // Loop back
    ]);

    const indices = [
        0, 1, 0, 2, 0, 3, 0, 4,
        1, 2, 2, 3, 3, 4, 4, 1
    ];

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    return geo;
};