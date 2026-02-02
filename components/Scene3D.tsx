import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid, ContactShadows, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { useStore } from '../store';
import { RenderObject } from './scene/RenderObject';
import { GhostObject } from './scene/GhostObject';
import { ViewportController } from './scene/ViewportController';
import { TapeMeasure } from './scene/TapeMeasure';
import { CableRenderer } from './scene/CableRenderer';
import { StageEnvironment } from './scene/StageEnvironment';

export const Scene3D = () => {
  const objects = useStore(state => state.objects);
  const layers = useStore(state => state.layers);
  const selectedIds = useStore(state => state.selectedIds);
  const clearSelection = useStore(state => state.clearSelection);

  // Memoize visible objects calculation to prevent unnecessary iterations
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
        <StageEnvironment />

        {/* Improved Grid for Scale Reference */}
        <Grid 
            infiniteGrid 
            fadeDistance={60} 
            cellThickness={0.4} 
            sectionThickness={1}
            cellSize={1} 
            sectionSize={5} 
            cellColor="#3f3f46" 
            sectionColor="#52525b" 
            position={[0, -0.01, 0]}
        />
        
        <GhostObject />
        <TapeMeasure />
        <CableRenderer />

        {visibleObjects.map(obj => (
          <RenderObject 
            key={obj.id} 
            data={obj} 
            isSelected={selectedIds.includes(obj.id)}
            showGizmo={selectedIds.includes(obj.id) && selectedIds.length === 1}
          />
        ))}

        <ContactShadows position={[0, -0.02, 0]} opacity={0.6} scale={60} blur={2.5} far={5} resolution={512} color="#000000" />
        
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
            <GizmoViewport 
                axisColors={['#ef4444', '#22c55e', '#3b82f6']} 
                labelColor="white" 
                hideNegativeAxes 
            />
        </GizmoHelper>
      </Canvas>
    </div>
  );
};