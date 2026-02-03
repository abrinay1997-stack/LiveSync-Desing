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
import { InstancedRigging } from './scene/InstancedRigging';
import { CatenaryVisualization } from './scene/CatenaryVisualization';
import { SPLVisualization } from './scene/SPLVisualization';

export const Scene3D = () => {
  const objects = useStore(state => state.objects);
  const layers = useStore(state => state.layers);
  const selectedIds = useStore(state => state.selectedIds);
  const clearSelection = useStore(state => state.clearSelection);

  // Filter for objects that MUST be rendered individually:
  // 1. Complex objects (Speakers/Arrays) that have custom geometry logic (splay angles)
  // 2. Any object that is currently SELECTED (so it gets a Gizmo and high-res highlight)
  // 3. Objects that are NOT rigging (e.g. Stage, Audience)
  // 4. Objects in hidden layers are filtered out entirely
  const individualObjects = useMemo(() => {
    return objects.filter(obj => {
      const layer = layers.find(l => l.id === obj.layerId);
      if (layer && !layer.visible) return false;

      const isRigging = obj.type === 'truss' || obj.type === 'motor';
      const isSelected = selectedIds.includes(obj.id);

      // If it's rigging and NOT selected, it goes to the Instanced Renderer, so return false here
      if (isRigging && !isSelected) return false;

      return true;
    });
  }, [objects, layers, selectedIds]);

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
        <CatenaryVisualization />
        <SPLVisualization />

        {/* High Performance Batch Renderer for static Truss/Motors */}
        <InstancedRigging />

        {/* Interactive Renderer for Selected Items & Complex Geometry */}
        {individualObjects.map(obj => (
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