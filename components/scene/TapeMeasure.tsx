import React, { useState, useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store';
import { v4 as uuidv4 } from 'uuid';
import { X } from 'lucide-react';

export const TapeMeasure = () => {
    const activeTool = useStore(state => state.activeTool);
    const snappingEnabled = useStore(state => state.snappingEnabled);
    const addMeasurement = useStore(state => state.addMeasurement);
    const measurements = useStore(state => state.measurements);
    const removeMeasurement = useStore(state => state.removeMeasurement);

    const { raycaster, camera, scene, pointer } = useThree();
    
    // Measuring State
    const [startPoint, setStartPoint] = useState<THREE.Vector3 | null>(null);
    const [currentPoint, setCurrentPoint] = useState<THREE.Vector3 | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // Raycast Logic
    const getIntersection = () => {
        raycaster.setFromCamera(pointer, camera);
        
        // Raycast against all meshes in the scene
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        // Filter out helpers, existing tape lines, and grid if possible
        const validIntersects = intersects.filter(hit => 
            hit.object.type === 'Mesh' && 
            hit.object.visible && 
            !hit.object.userData.isHelper
        );

        if (validIntersects.length > 0) {
            return validIntersects[0].point;
        }

        // Fallback to ground plane at Y=0 if no object hit
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const target = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, target);
        return target || null;
    };

    const handlePointerMove = () => {
        if (activeTool !== 'tape') return;
        
        const point = getIntersection();
        if (point) {
            // Snapping Logic
            if (snappingEnabled) {
                point.x = Math.round(point.x * 4) / 4;
                point.y = Math.round(point.y * 4) / 4;
                point.z = Math.round(point.z * 4) / 4;
            }
            setCurrentPoint(point);
        }
    };

    const handleClick = () => {
        if (activeTool !== 'tape' || !currentPoint) return;

        if (!isDrawing) {
            // Start measuring
            setStartPoint(currentPoint.clone());
            setIsDrawing(true);
        } else {
            // Finish measuring
            if (startPoint) {
                const dist = startPoint.distanceTo(currentPoint);
                addMeasurement({
                    id: uuidv4(),
                    start: [startPoint.x, startPoint.y, startPoint.z],
                    end: [currentPoint.x, currentPoint.y, currentPoint.z],
                    distance: parseFloat(dist.toFixed(3))
                });
            }
            setStartPoint(null);
            setIsDrawing(false);
        }
    };

    // Global event listeners for the measuring tool
    useEffect(() => {
        const handleGlobalClick = (e: MouseEvent) => {
            // Only trigger if clicking on canvas
            if ((e.target as HTMLElement).nodeName === 'CANVAS') {
                handleClick();
            }
        };

        if (activeTool === 'tape') {
            window.addEventListener('click', handleGlobalClick);
        }
        return () => window.removeEventListener('click', handleGlobalClick);
    }, [activeTool, currentPoint, isDrawing, startPoint]);

    // Update current point on every frame to ensure smooth snapping visuals
    useFrame(() => {
        if (activeTool === 'tape') {
            handlePointerMove();
        } else {
            // Reset if tool changed
            if (isDrawing) {
                setIsDrawing(false);
                setStartPoint(null);
            }
        }
    });

    return (
        <group>
            {/* Existing Saved Measurements */}
            {measurements.map(m => {
                 const start = new THREE.Vector3(...m.start);
                 const end = new THREE.Vector3(...m.end);
                 const mid = start.clone().add(end).multiplyScalar(0.5);
                 
                 return (
                    <group key={m.id}>
                        <Line 
                            points={[start, end]} 
                            color="#f59e0b" 
                            lineWidth={2} 
                            dashed={false}
                        />
                         <mesh position={start}><sphereGeometry args={[0.03]} /><meshBasicMaterial color="#f59e0b" /></mesh>
                         <mesh position={end}><sphereGeometry args={[0.03]} /><meshBasicMaterial color="#f59e0b" /></mesh>
                         
                         <Html position={mid}>
                            <div className="bg-black/80 backdrop-blur border border-amber-500/50 rounded px-2 py-1 flex items-center gap-2 transform -translate-x-1/2 -translate-y-1/2 shadow-lg cursor-default pointer-events-auto">
                                <span className="text-amber-500 text-xs font-mono font-bold whitespace-nowrap">{m.distance}m</span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); removeMeasurement(m.id); }}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <X size={10} />
                                </button>
                            </div>
                         </Html>
                    </group>
                 )
            })}

            {/* Active Drawing Line */}
            {activeTool === 'tape' && isDrawing && startPoint && currentPoint && (
                <>
                    <Line 
                        points={[startPoint, currentPoint]} 
                        color="#06b6d4" 
                        lineWidth={2} 
                        dashed={true}
                        dashScale={10}
                        dashSize={0.5}
                    />
                    <mesh position={startPoint}><sphereGeometry args={[0.04]} /><meshBasicMaterial color="#06b6d4" /></mesh>
                    <mesh position={currentPoint}><sphereGeometry args={[0.04]} /><meshBasicMaterial color="#06b6d4" /></mesh>
                    
                    <Html position={currentPoint.clone().add(new THREE.Vector3(0, 0.2, 0))}>
                        <div className="bg-aether-accent/90 text-black px-2 py-0.5 rounded text-[10px] font-bold font-mono transform -translate-x-1/2 pointer-events-none">
                            {startPoint.distanceTo(currentPoint).toFixed(3)}m
                        </div>
                    </Html>
                </>
            )}

            {/* Cursor Helper */}
            {activeTool === 'tape' && currentPoint && !isDrawing && (
                 <mesh position={currentPoint}>
                    <sphereGeometry args={[0.05]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
                 </mesh>
            )}
        </group>
    );
};