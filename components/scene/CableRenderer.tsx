import React, { useMemo, useRef } from 'react';
import { useStore } from '../../store';
import { QuadraticBezierLine } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CableSegmentProps {
    startId: string;
    endId: string;
    color: string;
}

// Renders a single cable that stays connected to objects
const CableSegment: React.FC<CableSegmentProps> = ({ startId, endId, color }) => {
    const objects = useStore(state => state.objects);
    
    // Find objects in the store
    // Note: In a high-performance scenario, we might subscribe to individual object changes,
    // but for < 1000 objects, filtering on every render or using store selectors is acceptable in React Three Fiber
    const startObj = objects.find(o => o.id === startId);
    const endObj = objects.find(o => o.id === endId);

    if (!startObj || !endObj) return null;

    const startPos = new THREE.Vector3(...startObj.position);
    const endPos = new THREE.Vector3(...endObj.position);

    // Calculate a mid-point that sags slightly based on distance to simulate gravity
    const mid = startPos.clone().add(endPos).multiplyScalar(0.5);
    mid.y -= startPos.distanceTo(endPos) * 0.2; // Sag factor

    return (
        <QuadraticBezierLine 
            start={startPos}
            end={endPos}
            mid={mid}
            color={color}
            lineWidth={2}
        />
    );
};

export const CableRenderer = () => {
    const cables = useStore(state => state.cables);
    const pendingCableStartId = useStore(state => state.pendingCableStartId);
    const objects = useStore(state => state.objects);
    const activeTool = useStore(state => state.activeTool);
    
    const { raycaster, camera, scene, pointer } = useThree();
    const ghostEndRef = useRef(new THREE.Vector3());
    const ghostRef = useRef<any>(null);

    // Update ghost line end point to follow mouse
    useFrame(() => {
        if (activeTool === 'cable' && pendingCableStartId) {
             raycaster.setFromCamera(pointer, camera);
             
             // Intersect with a virtual plane at the start object's height or simple ground plane
             // For better UX, we just project into space or hit other objects
             const intersects = raycaster.intersectObjects(scene.children, true);
             
             let target = new THREE.Vector3();
             const hit = intersects.find(i => i.object.type === 'Mesh' && !i.object.userData.isHelper);
             
             if (hit) {
                 target.copy(hit.point);
             } else {
                 // Fallback plane
                 const startObj = objects.find(o => o.id === pendingCableStartId);
                 const y = startObj ? startObj.position[1] : 0;
                 const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -y);
                 raycaster.ray.intersectPlane(plane, target);
             }

             ghostEndRef.current.copy(target);
             
             // Force update of the line if ref exists
             if (ghostRef.current) {
                 ghostRef.current.setPoints(
                     new THREE.Vector3(...(objects.find(o => o.id === pendingCableStartId)!.position)),
                     ghostEndRef.current
                 );
             }
        }
    });

    const startObj = pendingCableStartId ? objects.find(o => o.id === pendingCableStartId) : null;

    return (
        <group>
            {/* Render saved cables */}
            {cables.map(cable => (
                <CableSegment 
                    key={cable.id} 
                    startId={cable.startObjectId} 
                    endId={cable.endObjectId} 
                    color={cable.color} 
                />
            ))}

            {/* Render active connection line (Ghost) */}
            {activeTool === 'cable' && pendingCableStartId && startObj && (
                <QuadraticBezierLine
                    ref={ghostRef}
                    start={new THREE.Vector3(...startObj.position)}
                    end={new THREE.Vector3(...startObj.position)} // Initial, updated by useFrame
                    mid={new THREE.Vector3(...startObj.position)} // Initial
                    color="#10b981"
                    lineWidth={2}
                    dashed
                />
            )}
        </group>
    );
};