import React, { useMemo, useRef, useLayoutEffect, useEffect } from 'react';
import * as THREE from 'three';

interface TapeLineProps {
    start: THREE.Vector3;
    end: THREE.Vector3;
    color: string;
    dashed?: boolean;
}

// Visual Primitive for the Tape Measure tool
export const TapeLine: React.FC<TapeLineProps> = ({ start, end, color, dashed }) => {
    const lineRef = useRef<THREE.LineSegments>(null);
    
    // Create geometry using useMemo for performance
    const geometry = useMemo(() => {
        return new THREE.BufferGeometry().setFromPoints([start, end]);
    }, [start, end]);

    // Proper disposal of geometry
    useEffect(() => {
        return () => geometry.dispose();
    }, [geometry]);

    // Compute distances for dashed lines (ThreeJS requirement for LineDashedMaterial)
    useLayoutEffect(() => {
        if (dashed && lineRef.current) {
            lineRef.current.computeLineDistances();
        }
    }, [geometry, dashed]);

    return (
        <lineSegments ref={lineRef} geometry={geometry}>
            {dashed ? (
                <lineDashedMaterial color={color} dashSize={0.2} gapSize={0.2} />
            ) : (
                <lineBasicMaterial color={color} />
            )}
        </lineSegments>
    );
};