import React, { useRef, useState, useEffect } from 'react';
import { TransformControls, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store';
import { SceneObject } from '../../types';
import { AssetGeometry } from './AssetGeometry';

interface RenderObjectProps {
    data: SceneObject;
    isSelected: boolean;
    showGizmo: boolean;
}

export const RenderObject: React.FC<RenderObjectProps> = ({ data, isSelected, showGizmo }) => {
  const selectObject = useStore(state => state.selectObject);
  const updateObject = useStore(state => state.updateObject);
  const activeTool = useStore(state => state.activeTool);
  const setCameraLocked = useStore(state => state.setCameraLocked);
  
  const objectRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Cursor pointer logic
  useEffect(() => {
    if (hovered) document.body.style.cursor = 'pointer';
    else document.body.style.cursor = 'auto';
    return () => { document.body.style.cursor = 'auto'; }
  }, [hovered]);

  const isTransformMode = activeTool === 'select' || activeTool === 'move' || activeTool === 'rotate';
  const transformMode = activeTool === 'rotate' ? 'rotate' : 'translate';

  // Dimensions for selection box
  const w = data.dimensions?.w || 1;
  const h = data.dimensions?.h || 1;
  const d = data.dimensions?.d || 1;

  return (
    <>
        <group
            ref={objectRef}
            position={data.position}
            rotation={new THREE.Euler(...data.rotation)}
            scale={data.scale}
            onClick={(e) => {
                e.stopPropagation();
                selectObject(data.id, e.shiftKey);
            }}
            onPointerOver={(e) => {
                e.stopPropagation();
                setHovered(true);
            }}
            onPointerOut={(e) => {
                e.stopPropagation();
                setHovered(false);
            }}
        >
            <AssetGeometry type={data.type} dimensions={data.dimensions} color={data.color} />
            
            {/* 
               FIX: Edges must be children of a Mesh with geometry.
               We use an invisible box that matches the object dimensions to host the Edges.
            */}
            {(isSelected || hovered) && (
                <mesh visible={false}>
                    <boxGeometry args={[w, h, d]} />
                    {isSelected && (
                        <Edges 
                            scale={1.0} 
                            threshold={15} 
                            color="#06b6d4" 
                        />
                    )}

                    {hovered && !isSelected && (
                        <Edges 
                            scale={1.0} 
                            threshold={15} 
                            color="#ffffff" 
                            opacity={0.3}
                            transparent
                        />
                    )}
                </mesh>
            )}
        </group>

        {showGizmo && isTransformMode && objectRef.current && (
            <TransformControls
                object={objectRef.current}
                mode={transformMode}
                space="local"
                size={0.8}
                lineWidth={2}
                onMouseDown={() => setCameraLocked(true)}
                onMouseUp={() => {
                    setCameraLocked(false);
                    if (objectRef.current) {
                        const { position, rotation } = objectRef.current;
                        
                        const minHeight = (data.dimensions?.h || 0) / 2;
                        const clampedY = Math.max(position.y, minHeight);

                        objectRef.current.position.y = clampedY;

                        updateObject(data.id, {
                            position: [position.x, clampedY, position.z],
                            rotation: [rotation.x, rotation.y, rotation.z]
                        });
                    }
                }}
            />
        )}
    </>
  );
};