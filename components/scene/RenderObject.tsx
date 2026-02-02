import React, { useRef, useState, useEffect, useMemo } from 'react';
import { TransformControls, Edges } from '@react-three/drei';
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

export const RenderObject: React.FC<RenderObjectProps> = ({ data, isSelected, showGizmo }) => {
  const selectObject = useStore(state => state.selectObject);
  const updateObject = useStore(state => state.updateObject);
  const activeTool = useStore(state => state.activeTool);
  const setCameraLocked = useStore(state => state.setCameraLocked);
  
  const objectRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Cursor pointer logic
  useEffect(() => {
    if (activeTool === 'tape') {
        document.body.style.cursor = 'crosshair';
        return;
    }

    if (hovered) document.body.style.cursor = 'pointer';
    else document.body.style.cursor = 'auto';
    return () => { document.body.style.cursor = 'auto'; }
  }, [hovered, activeTool]);

  const isTransformMode = activeTool === 'select' || activeTool === 'move' || activeTool === 'rotate';
  const transformMode = activeTool === 'rotate' ? 'rotate' : 'translate';

  // Dimensions for selection box
  // If array, the box is bigger, but for simple selection we keep the origin box 
  // or we could calculate bounding box of array (complex). 
  // Staying simple: Selection box is just the top element/origin.
  const w = data.dimensions?.w || 1;
  const h = data.dimensions?.h || 1;
  const d = data.dimensions?.d || 1;

  // Memoize geometry to prevent "undefined reading array" errors in Edges
  // caused by race conditions when accessing parent geometry via context.
  // Explicitly passing geometry to Edges is the most robust fix.
  const selectionGeometry = useMemo(() => new THREE.BoxGeometry(w, h, d), [w, h, d]);

  // Clean up geometry on unmount
  useEffect(() => {
    return () => selectionGeometry.dispose();
  }, [selectionGeometry]);

  return (
    <>
        <group
            ref={objectRef}
            position={data.position}
            rotation={new THREE.Euler(...data.rotation)}
            scale={data.scale}
            onClick={(e) => {
                // If using tape measure, we want the global click handler to take precedence
                // but we also want the raycaster to hit this object.
                // Stopping propagation here would prevent measuring on top of objects if logic was global only.
                // But RenderObject logic is: "Clicking ME selects ME".
                // So we stop propagation if we are selecting.
                if (activeTool === 'tape') return; 

                e.stopPropagation();
                selectObject(data.id, e.shiftKey);
            }}
            onPointerOver={(e) => {
                if (activeTool === 'tape') return;
                e.stopPropagation();
                setHovered(true);
            }}
            onPointerOut={(e) => {
                if (activeTool === 'tape') return;
                e.stopPropagation();
                setHovered(false);
            }}
        >
            {/* Logic Branch: Array vs Single Asset */}
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
            
            {/* 
               Selection Highlight
            */}
            {(isSelected || (hovered && activeTool !== 'tape')) && (
                <mesh geometry={selectionGeometry} visible={false}>
                    {isSelected && (
                        <Edges 
                            geometry={selectionGeometry}
                            scale={1.0} 
                            threshold={15} 
                            color="#06b6d4" 
                        />
                    )}

                    {hovered && !isSelected && (
                        <Edges 
                            geometry={selectionGeometry}
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
                onMouseDown={() => setCameraLocked(true)}
                onMouseUp={() => {
                    setCameraLocked(false);
                    if (objectRef.current) {
                        const { position, rotation } = objectRef.current;
                        
                        // For arrays, we don't clamp Y as strictly because they hang
                        updateObject(data.id, {
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