import React, { useMemo, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
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
import { GroundPlane } from './scene/GroundPlane';
import { ConnectionPointsOverlay } from './scene/ConnectionPointsOverlay';
import { BoxSelection, BoxSelectionOverlay } from './scene/BoxSelection';
import { LassoSelection, LassoSelectionOverlay } from './scene/LassoSelection';
import { registerRenderer, unregisterRenderer } from '../utils/export/screenshotExport';
import { PerformanceOverlay } from './ui/PerformanceOverlay';
import {
    transientStore,
    spatialIndex,
    performanceMonitor
} from '../utils/performance';

/**
 * Helper component to register the WebGL renderer for screenshots and performance monitoring
 */
const RendererRegistration = () => {
    const { gl } = useThree();

    useEffect(() => {
        registerRenderer(gl);
        performanceMonitor.setRenderer(gl);
        performanceMonitor.start();

        return () => {
            unregisterRenderer();
            performanceMonitor.stop();
        };
    }, [gl]);

    return null;
};

/**
 * Performance tracking component - records frame metrics
 */
const PerformanceTracker = () => {
    useFrame(() => {
        performanceMonitor.recordFrame();
    });

    return null;
};

/**
 * Syncs scene objects with performance subsystems
 */
const PerformanceSync: React.FC<{ objects: any[]; layers: any[] }> = ({ objects, layers }) => {
    useEffect(() => {
        // Filter visible objects
        const visibleObjects = objects.filter(obj => {
            const layer = layers.find((l: any) => l.id === obj.layerId);
            return layer ? layer.visible : true;
        });

        // Sync to transient store
        transientStore.initFromObjects(visibleObjects);

        // Rebuild spatial index
        spatialIndex.build(visibleObjects);

        // Update stats
        performanceMonitor.setCustomStats({
            objectCount: objects.length,
            visibleCount: visibleObjects.length
        });
    }, [objects, layers]);

    return null;
};

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

  // Check for debug mode (dev tools open or URL param)
  const showPerformance = typeof window !== 'undefined' &&
    (window.location.search.includes('perf=1') ||
     (window as any).__LIVESYNC_DEBUG__);

  return (
    <div className="w-full h-full bg-[#09090b] relative">
      {/* Performance Overlay (outside Canvas for proper DOM rendering) */}
      {showPerformance && (
        <PerformanceOverlay position="top-left" compact={false} />
      )}

      {/* Selection Overlays (DOM elements for visual feedback) */}
      <BoxSelectionOverlay />
      <LassoSelectionOverlay />

      <Canvas shadows dpr={[1, 2]} onPointerMissed={clearSelection} gl={{ preserveDrawingBuffer: true }}>
        <RendererRegistration />
        <PerformanceTracker />
        <PerformanceSync objects={objects} layers={layers} />
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

        <GroundPlane />
        <GhostObject />
        <ConnectionPointsOverlay />
        <BoxSelection enabled={true} />
        <LassoSelection enabled={true} />
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