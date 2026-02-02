import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface LODWrapperProps {
    children: React.ReactNode;
    dimensions: { w: number; h: number; d: number };
    color: string;
    distanceThreshold?: number;
}

export const LODWrapper: React.FC<LODWrapperProps> = ({ 
    children, 
    dimensions, 
    color, 
    distanceThreshold = 30 // Meters
}) => {
    const ref = useRef<THREE.Group>(null);
    const [isDetailed, setIsDetailed] = useState(true);
    
    // Simple Box Geometry for Low Detail Mode (cached)
    const lowDetailGeo = useMemo(() => new THREE.BoxGeometry(dimensions.w, dimensions.h, dimensions.d), [dimensions.w, dimensions.h, dimensions.d]);
    const lowDetailMat = useMemo(() => new THREE.MeshBasicMaterial({ color: color, wireframe: true }), [color]);

    useFrame((state) => {
        if (!ref.current) return;
        
        // Calculate distance to camera
        const distance = state.camera.position.distanceTo(ref.current.getWorldPosition(new THREE.Vector3()));
        
        // Hysteresis to prevent flickering at the threshold
        if (isDetailed && distance > distanceThreshold + 2) {
            setIsDetailed(false);
        } else if (!isDetailed && distance < distanceThreshold) {
            setIsDetailed(true);
        }
    });

    return (
        <group ref={ref}>
            {isDetailed ? (
                children
            ) : (
                <mesh geometry={lowDetailGeo} material={lowDetailMat} />
            )}
        </group>
    );
};