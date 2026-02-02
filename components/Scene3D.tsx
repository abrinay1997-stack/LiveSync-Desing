import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid, Environment, ContactShadows, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { useStore } from '../store';
import { RenderObject } from './scene/RenderObject';
import { GhostObject } from './scene/GhostObject';
import { ViewportController } from './scene/ViewportController';

export const Scene3D = () => {
  const objects = useStore(state => state.objects);
  const layers = useStore(state => state.layers);
  const selectedIds = useStore(state => state.selectedIds);
  const clearSelection = useStore(state => state.clearSelection);

  const visibleObjects = useMemo(() => {
    return objects.filter(obj => {
        const layer = layers.find(l => l.id === obj.layerId);
        return layer ? layer.visible : true;
    });
  }, [objects, layers]);

  return (
    <div className="w-full h-full bg-[#09090b]">
      <Canvas shadows dpr={[1, 2]} onPointerMissed={clearSelection}>
        <ViewportController />
        
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
        <Environment preset="city" />

        <Grid 
            infiniteGrid 
            fadeDistance={50} 
            cellThickness={0.4} 
            sectionThickness={1}
            cellSize={1} 
            sectionSize={5} 
            cellColor="#27272a" 
            sectionColor="#3f3f46" 
        />
        
        <GhostObject />

        {visibleObjects.map(obj => (
          <RenderObject 
            key={obj.id} 
            data={obj} 
            isSelected={selectedIds.includes(obj.id)}
            showGizmo={selectedIds.includes(obj.id) && selectedIds.length === 1}
          />
        ))}

        <ContactShadows position={[0, -0.01, 0]} opacity={0.4} scale={50} blur={2} far={4} resolution={256} color="#000000" />
        
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
            <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="white" />
        </GizmoHelper>
      </Canvas>
    </div>
  );
};