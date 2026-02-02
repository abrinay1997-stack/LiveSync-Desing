import React, { useRef, useMemo, useState, useEffect } from 'react';
import { TransformControls } from '@react-three/drei';
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
  
  // Material para selección
  const selectionMaterial = useMemo(() => new THREE.MeshBasicMaterial({
      color: '#06b6d4',
      wireframe: true,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      opacity: 0.5
  }), []);

  // Material para hover (más sutil)
  const hoverMaterial = useMemo(() => new THREE.MeshBasicMaterial({
      color: '#ffffff',
      wireframe: true,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      opacity: 0.2
  }), []);

  // Cursor pointer logic
  useEffect(() => {
    if (hovered) document.body.style.cursor = 'pointer';
    else document.body.style.cursor = 'auto';
    return () => { document.body.style.cursor = 'auto'; }
  }, [hovered]);

  // UX Decision: Permitir mover si la herramienta es 'move' O 'select' (default behavior)
  const isTransformMode = activeTool === 'select' || activeTool === 'move' || activeTool === 'rotate';
  const transformMode = activeTool === 'rotate' ? 'rotate' : 'translate';

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
            
            {/* Visual Feedback: Selection Box */}
            {isSelected && (
                 <mesh>
                    <boxGeometry args={[(data.dimensions?.w || 1) + 0.05, (data.dimensions?.h || 1) + 0.05, (data.dimensions?.d || 1) + 0.05]} />
                    <primitive object={selectionMaterial} attach="material" />
                 </mesh>
            )}

            {/* Visual Feedback: Hover Box (Only if not selected) */}
            {hovered && !isSelected && (
                 <mesh>
                    <boxGeometry args={[(data.dimensions?.w || 1) + 0.02, (data.dimensions?.h || 1) + 0.02, (data.dimensions?.d || 1) + 0.02]} />
                    <primitive object={hoverMaterial} attach="material" />
                 </mesh>
            )}
        </group>

        {/* GIZMO: Ahora se muestra siempre que está seleccionado y en una herramienta compatible */}
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
                        
                        // UX FIX: Floor Clamping (Gravedad)
                        const minHeight = (data.dimensions?.h || 0) / 2;
                        const clampedY = Math.max(position.y, minHeight);

                        // Snap visual correction
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