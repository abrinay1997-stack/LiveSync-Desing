import React, { useEffect, useRef, useMemo } from 'react';
import { PerspectiveCamera, OrthographicCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store';

export const ViewportController = () => {
    const viewMode = useStore(state => state.viewMode);
    const isCameraLocked = useStore(state => state.isCameraLocked);
    const activeTool = useStore(state => state.activeTool);
    const setCameraTarget = useStore(state => state.setCameraTarget);
    const cameraTarget = useStore(state => state.cameraTarget);

    const controlsRef = useRef<any>(null);

    // Lock camera when using selection tools that require dragging on the canvas
    const isSelectionToolActive = ['box-select', 'lasso-select'].includes(activeTool);
    const shouldLockCamera = isCameraLocked || isSelectionToolActive;

    // Sync controls target with store when it changes externally
    useEffect(() => {
        if (controlsRef.current) {
            controlsRef.current.target.set(...cameraTarget);
            controlsRef.current.update();
        }
    }, [viewMode]); // Re-apply when view mode changes

    // Memoize the target vector to prevent OrbitControls from glitching due to prop churn
    const targetVector = useMemo(() => new THREE.Vector3(...cameraTarget), [cameraTarget[0], cameraTarget[1], cameraTarget[2]]);

    // Save target to store on unmount or change
    const handleChange = () => {
        if (controlsRef.current) {
            const t = controlsRef.current.target;
            // Prevent dispatch loops by checking distance or relying on event
            // Note: In production we might debounce this
            setCameraTarget([t.x, t.y, t.z]);
        }
    }

    return (
        <>
            {viewMode === 'perspective' && (
                <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={50} />
            )}
            
            {viewMode === 'top' && (
                <OrthographicCamera makeDefault position={[cameraTarget[0], 20, cameraTarget[2]]} zoom={40} rotation={[-Math.PI / 2, 0, 0]} />
            )}
            
            {viewMode === 'side' && (
                <OrthographicCamera makeDefault position={[20, cameraTarget[1], cameraTarget[2]]} zoom={40} rotation={[0, Math.PI / 2, 0]} />
            )}
            
            <OrbitControls
                ref={controlsRef}
                makeDefault
                enabled={!shouldLockCamera}
                enableRotate={viewMode === 'perspective' && !shouldLockCamera}
                enablePan={!shouldLockCamera}
                enableZoom={!isSelectionToolActive} // Allow zoom even with selection tools
                enableDamping={true}
                dampingFactor={0.1}
                maxPolarAngle={Math.PI / 1.8}
                target={targetVector}
                onChange={handleChange}
            />
        </>
    )
};