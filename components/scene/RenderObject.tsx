import React, { useRef, useState, useEffect, useMemo } from 'react';
import { TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store';
import { SceneObject } from '../../types';
import { AssetGeometry } from './AssetGeometry';
import { ArrayGeometry } from './ArrayGeometry';

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
  const updateObject = useStore(state => state.updateObject);
  const removeObject = useStore(state => state.removeObject);
  
  // Cable Actions
  const startCable = useStore(state => state.startCable);
  const completeCable = useStore(state => state.completeCable);
  const pendingCableStartId = useStore(state => state.pendingCableStartId);
  
  // We use this for final commits to history (onMouseUp)
  // @ts-ignore
  const updateObjectFinal = useStore(state => state.updateObjectFinal) || updateObject; 
  const activeTool = useStore(state => state.activeTool);
  const setCameraLocked = useStore(state => state.setCameraLocked);
  
  const objectRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

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
      selectObject(data.id, e.shiftKey);
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
                space="local"
                size={0.8}
                onMouseDown={() => setCameraLocked(true)}
                onMouseUp={() => {
                    setCameraLocked(false);
                    if (objectRef.current) {
                        const { position, rotation } = objectRef.current;
                        
                        updateObjectFinal(data.id, {
                            position: [position.x, position.y, position.z],
                            rotation: [rotation.x, rotation.y, rotation.z]
                        });
                    }
                }}
            />
        )}
    </>
  );
};