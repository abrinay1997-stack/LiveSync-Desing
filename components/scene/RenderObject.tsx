import React, { useRef, useState, useEffect, useMemo } from 'react';
import { TransformControls, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store';
import { SceneObject } from '../../types';
import { AssetGeometry } from './AssetGeometry';
import { ArrayGeometry } from './ArrayGeometry';
import { HeightIndicator } from './HeightIndicator';
import { getAllConnectionPoints, calculateSnapToConnection, ConnectionPoint } from '../../utils/construction/connectionPoints';

interface RenderObjectProps {
    data: SceneObject;
    isSelected: boolean;
    showGizmo: boolean;
}

// Custom Edge Visualizer to replace Drei Edges which can be unstable with dynamic geometry
const SelectionEdges = ({ geometry, color, opacity = 1, threshold = 15 }: { geometry: THREE.BufferGeometry, color: string, opacity?: number, threshold?: number }) => {
    const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(geometry, threshold), [geometry, threshold]);
    
    useEffect(() => {
        return () => edgesGeometry.dispose();
    }, [edgesGeometry]);

    return (
        <lineSegments geometry={edgesGeometry}>
            <lineBasicMaterial color={color} opacity={opacity} transparent={opacity < 1} toneMapped={false} />
        </lineSegments>
    );
};

export const RenderObject: React.FC<RenderObjectProps> = ({ data, isSelected, showGizmo }) => {
  const selectObject = useStore(state => state.selectObject);
  const removeObject = useStore(state => state.removeObject);
  const objects = useStore(state => state.objects);
  const snappingEnabled = useStore(state => state.snappingEnabled);

  // Cable Actions
  const startCable = useStore(state => state.startCable);
  const completeCable = useStore(state => state.completeCable);
  const pendingCableStartId = useStore(state => state.pendingCableStartId);

  // We use this for final commits to history (onMouseUp)
  // Now strictly typed from store
  const updateObjectFinal = useStore(state => state.updateObjectFinal);
  const activeTool = useStore(state => state.activeTool);
  const setCameraLocked = useStore(state => state.setCameraLocked);
  const transformAxisConstraint = useStore(state => state.transformAxisConstraint);
  const setTransformAxisConstraint = useStore(state => state.setTransformAxisConstraint);

  const objectRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<[number, number, number]>(data.position);
  const [snapTarget, setSnapTarget] = useState<ConnectionPoint | null>(null);

  // Get connection points for snapping (excluding this object)
  const connectionPoints = useMemo(() => {
    if (data.type !== 'truss') return [];
    return getAllConnectionPoints(objects.filter(o => o.id !== data.id));
  }, [objects, data.id, data.type]);

  // Logic Decoupling: Defines if the object allows selection based on tool state
  const isSelectable = ['select', 'move', 'rotate'].includes(activeTool);
  const isTransformMode = isSelectable;
  const transformMode = activeTool === 'rotate' ? 'rotate' : 'translate';
  const isEraser = activeTool === 'eraser';
  const isCableTool = activeTool === 'cable';

  // Cursor pointer logic
  useEffect(() => {
    if (isEraser) {
        if (hovered) document.body.style.cursor = 'crosshair'; 
        return;
    }

    if (isCableTool) {
        if (hovered) document.body.style.cursor = 'alias'; // Show connection cursor
        return;
    }

    if (!isSelectable) {
        if (hovered && activeTool !== 'tape') document.body.style.cursor = 'not-allowed';
        return;
    }

    if (hovered) document.body.style.cursor = 'pointer';
    else document.body.style.cursor = 'auto';
    return () => { document.body.style.cursor = 'auto'; }
  }, [hovered, activeTool, isSelectable, isEraser, isCableTool]);

  const w = data.dimensions?.w || 1;
  const h = data.dimensions?.h || 1;
  const d = data.dimensions?.d || 1;

  // Geometry for selection box (bounding box)
  const selectionGeometry = useMemo(() => new THREE.BoxGeometry(w, h, d), [w, h, d]);

  useEffect(() => {
    return () => selectionGeometry.dispose();
  }, [selectionGeometry]);

  const handleInteraction = (e: any) => {
      e.stopPropagation();

      if (isEraser) {
          removeObject(data.id);
          return;
      }

      if (isCableTool) {
          if (!pendingCableStartId) {
              startCable(data.id);
          } else {
              completeCable(data.id);
          }
          return;
      }

      if (!isSelectable) return;
      // Support both Shift+click and Ctrl/Cmd+click for multi-selection
      const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
      selectObject(data.id, isMultiSelect);
  };

  return (
    <>
        <group
            ref={objectRef}
            position={data.position}
            rotation={new THREE.Euler(...data.rotation)}
            scale={data.scale}
            onClick={handleInteraction}
            onPointerOver={(e) => {
                if (!isSelectable && !isEraser && !isCableTool) return;
                e.stopPropagation();
                setHovered(true);
            }}
            onPointerOut={(e) => {
                e.stopPropagation();
                setHovered(false);
            }}
        >
            {data.arrayConfig && data.arrayConfig.enabled ? (
                <ArrayGeometry 
                    type={data.type}
                    dimensions={data.dimensions}
                    color={data.color}
                    arrayConfig={data.arrayConfig}
                />
            ) : (
                <AssetGeometry type={data.type} dimensions={data.dimensions} color={data.color} />
            )}
            
            {/* Hover/Selection Highlight */}
            {(isSelected || (hovered && (isSelectable || isEraser || isCableTool))) && (
                <group>
                     {/* Selection Blue Outline */}
                    {isSelected && !isEraser && !isCableTool && (
                        <SelectionEdges 
                            geometry={selectionGeometry}
                            color="#06b6d4" 
                        />
                    )}

                    {/* Hover White Outline */}
                    {hovered && !isSelected && !isEraser && !isCableTool && (
                        <SelectionEdges 
                            geometry={selectionGeometry}
                            color="#ffffff" 
                            opacity={0.3}
                        />
                    )}

                    {/* Eraser Red Outline */}
                    {hovered && isEraser && (
                        <SelectionEdges 
                            geometry={selectionGeometry}
                            color="#ef4444" 
                            opacity={0.8}
                        />
                    )}
                    
                    {/* Cable Green Outline */}
                    {hovered && isCableTool && (
                        <SelectionEdges 
                            geometry={selectionGeometry}
                            color="#10b981" 
                            opacity={0.8}
                        />
                    )}
                </group>
            )}
        </group>

        {showGizmo && isTransformMode && !isEraser && !isCableTool && objectRef.current && (
            <TransformControls
                object={objectRef.current}
                mode={transformMode}
                space={transformMode === 'rotate' ? 'world' : 'local'}
                size={0.8}
                axis={transformAxisConstraint?.toUpperCase() || undefined}
                showX={!transformAxisConstraint || transformAxisConstraint === 'x'}
                showY={!transformAxisConstraint || transformAxisConstraint === 'y'}
                showZ={!transformAxisConstraint || transformAxisConstraint === 'z'}
                onMouseDown={() => {
                    setCameraLocked(true);
                    setIsDragging(true);
                    setSnapTarget(null);
                }}
                onMouseUp={() => {
                    setCameraLocked(false);
                    setIsDragging(false);
                    if (objectRef.current) {
                        let finalPos = objectRef.current.position;
                        let finalRot = objectRef.current.rotation;

                        // Apply snap if we found a valid snap target
                        if (snappingEnabled && data.type === 'truss' && connectionPoints.length > 0) {
                            const dims = data.dimensions || { w: 1, h: 0.29, d: 0.29 };
                            const snapResult = calculateSnapToConnection(
                                finalPos,
                                finalRot,
                                dims,
                                connectionPoints,
                                1.5 // Generous snap threshold
                            );

                            if (snapResult.snapped) {
                                finalPos = snapResult.position;
                                finalRot = snapResult.rotation;
                            }
                        }

                        // Prevent going below ground
                        if (finalPos.y < 0) {
                            const halfHeight = (data.dimensions?.h || 1) / 2;
                            finalPos.y = Math.max(halfHeight, 0);
                        }

                        updateObjectFinal(data.id, {
                            position: [finalPos.x, finalPos.y, finalPos.z],
                            rotation: [finalRot.x, finalRot.y, finalRot.z]
                        });
                    }
                    setSnapTarget(null);
                    // Clear axis constraint after transform completes
                    if (transformAxisConstraint) {
                        setTransformAxisConstraint(null);
                    }
                }}
                onChange={() => {
                    if (objectRef.current && isDragging) {
                        const { position, rotation } = objectRef.current;
                        setDragPosition([position.x, position.y, position.z]);

                        // Check for snap targets during drag (for visual feedback)
                        if (snappingEnabled && data.type === 'truss' && connectionPoints.length > 0) {
                            const dims = data.dimensions || { w: 1, h: 0.29, d: 0.29 };
                            const snapResult = calculateSnapToConnection(
                                position,
                                rotation,
                                dims,
                                connectionPoints,
                                1.5
                            );
                            setSnapTarget(snapResult.snapped ? (snapResult.targetPoint || null) : null);
                        }
                    }
                }}
            />
        )}

        {/* Snap indicator during drag */}
        {isDragging && snapTarget && (
            <group position={snapTarget.position.toArray()}>
                <mesh>
                    <sphereGeometry args={[0.2, 16, 16]} />
                    <meshBasicMaterial color="#22c55e" transparent opacity={0.8} />
                </mesh>
                <Line
                    points={[
                        snapTarget.position.toArray(),
                        dragPosition
                    ]}
                    color="#22c55e"
                    lineWidth={2}
                    dashed
                />
            </group>
        )}

        {/* Height indicator during dragging */}
        <HeightIndicator
            position={isDragging ? dragPosition : data.position}
            visible={isDragging && transformMode === 'translate'}
        />
    </>
  );
};