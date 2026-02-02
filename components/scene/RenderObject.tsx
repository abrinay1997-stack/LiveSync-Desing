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
  // We use this for final commits to history (onMouseUp)
  // @ts-ignore - We know this exists from the store update but TS might lag behind without full restart
  const updateObjectFinal = useStore(state => state.updateObjectFinal) || updateObject; 
  const activeTool = useStore(state => state.activeTool);
  const setCameraLocked = useStore(state => state.setCameraLocked);
  
  const objectRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Logic Decoupling: Defines if the object allows selection based on tool state
  const isSelectable = ['select', 'move', 'rotate'].includes(activeTool);
  const isTransformMode = isSelectable;
  const transformMode = activeTool === 'rotate' ? 'rotate' : 'translate';

  // Cursor pointer logic
  useEffect(() => {
    if (!isSelectable) {
        // If we are in 'tape' or 'cable' mode, we might want crosshair, managed globally or by that tool
        // RenderObject shouldn't force 'auto' if another tool wants 'crosshair'
        if (hovered && activeTool !== 'tape') document.body.style.cursor = 'not-allowed';
        return;
    }

    if (hovered) document.body.style.cursor = 'pointer';
    else document.body.style.cursor = 'auto';
    return () => { document.body.style.cursor = 'auto'; }
  }, [hovered, activeTool, isSelectable]);

  const w = data.dimensions?.w || 1;
  const h = data.dimensions?.h || 1;
  const d = data.dimensions?.d || 1;

  const selectionGeometry = useMemo(() => new THREE.BoxGeometry(w, h, d), [w, h, d]);

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
                // Decoupled Logic: We only react if we are in a selection-compatible mode.
                // We do NOT check for 'tape' specifically.
                if (!isSelectable) return;

                e.stopPropagation();
                selectObject(data.id, e.shiftKey);
            }}
            onPointerOver={(e) => {
                if (!isSelectable) return;
                e.stopPropagation();
                setHovered(true);
            }}
            onPointerOut={(e) => {
                // Always clear hover
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
            
            {(isSelected || (hovered && isSelectable)) && (
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
                        
                        // Use updateObjectFinal to commit to history only when drag ends
                        updateObjectFinal(data.id, {
                            position: [position.x, position.y, position.z],
                            rotation: [rotation.x, rotation.y, rotation.z]
                        });
                    }
                }}
                onChange={() => {
                    // While dragging, update without history (transient)
                    // We don't trigger store updates here to avoid React render loop lag, 
                    // relying on TransformControls internal visual update.
                    // But if we wanted UI to update live, we would use updateObject here.
                }}
            />
        )}
    </>
  );
};