import { create } from 'zustand';
import { SceneObject, Layer, ViewMode, ToolType, Measurement, Cable } from './types';
import { createSceneObject, cloneSceneObject } from './utils/factory';
import { v4 as uuidv4 } from 'uuid';

export type LightingPreset = 'studio' | 'stage' | 'outdoor';

interface UIState {
    showToolbar: boolean;
    showLibrary: boolean;
    showInspector: boolean;
    activeRightTab: 'inspector' | 'layers';
}

// Data that needs to be tracked in history
interface ProjectData {
    objects: SceneObject[];
    measurements: Measurement[];
    cables: Cable[];
    cameraTarget: [number, number, number];
}

interface AppState {
  objects: SceneObject[];
  layers: Layer[];
  cables: Cable[];
  selectedIds: string[];
  measurements: Measurement[];
  viewMode: ViewMode;
  activeTool: ToolType;
  snappingEnabled: boolean;
  continuousPlacement: boolean; // Pencil Mode
  activePlacementAsset: string | null;
  isCameraLocked: boolean;
  
  // Cable Tool State
  pendingCableStartId: string | null;

  // Scene Settings
  cameraTarget: [number, number, number];
  lightingPreset: LightingPreset;
  
  // UI State
  ui: UIState;

  // History State
  history: {
      past: ProjectData[];
      future: ProjectData[];
  };

  // Actions
  addObject: (assetKey: string, position: [number, number, number]) => void;
  cloneObject: (id: string) => void;
  updateObject: (id: string, updates: Partial<SceneObject>) => void;
  updateObjectFinal: (id: string, updates: Partial<SceneObject>) => void;
  removeObject: (id: string) => void;
  selectObject: (id: string, multi: boolean) => void;
  clearSelection: () => void;
  setViewMode: (mode: ViewMode) => void;
  setTool: (tool: ToolType) => void;
  toggleLayerVisibility: (id: string) => void;
  setPlacementAsset: (assetKey: string | null) => void;
  toggleSnapping: () => void;
  toggleContinuousPlacement: () => void;
  setCameraLocked: (locked: boolean) => void;
  setCameraTarget: (target: [number, number, number]) => void;
  setLightingPreset: (preset: LightingPreset) => void;
  
  // Cable Actions
  startCable: (objectId: string) => void;
  completeCable: (endObjectId: string) => void;
  cancelCable: () => void;
  removeCable: (id: string) => void;

  // Measurement Actions
  addMeasurement: (measurement: Measurement) => void;
  removeMeasurement: (id: string) => void;

  // Project Actions
  loadProject: (data: Partial<AppState>) => void;
  
  // UI Actions
  toggleUI: (element: keyof Omit<UIState, 'activeRightTab'>) => void;
  setRightTab: (tab: 'inspector' | 'layers') => void;

  // History Actions
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
}

// Helper to snapshot current critical state
const createSnapshot = (state: AppState): ProjectData => ({
    objects: state.objects,
    measurements: state.measurements,
    cables: state.cables,
    cameraTarget: state.cameraTarget
});

export const useStore = create<AppState>((set, get) => ({
  objects: [
    {
      id: '1',
      name: 'Main Truss Left',
      model: 'truss-30',
      type: 'truss',
      position: [-5, 6, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      layerId: 'rigging',
      color: '#d4d4d8',
      dimensions: { w: 3, h: 0.3, d: 0.3 }
    },
    {
      id: '2',
      name: 'K2 Array L',
      model: 'la-k2',
      type: 'speaker',
      position: [-5, 5, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      layerId: 'audio',
      color: '#27272a',
      dimensions: { w: 1.3, h: 0.35, d: 0.4 },
      arrayConfig: {
          enabled: true,
          boxCount: 6,
          siteAngle: -2,
          splayAngles: [0, 1, 2, 3, 4, 5],
          showThrowLines: true,
          throwDistance: 20
      }
    }
  ],
  layers: [
    { id: 'audio', name: 'Audio System', visible: true, locked: false, color: '#06b6d4' },
    { id: 'rigging', name: 'Rigging & Motors', visible: true, locked: false, color: '#f59e0b' },
    { id: 'venue', name: 'Venue Geometry', visible: true, locked: true, color: '#71717a' },
  ],
  cables: [],
  selectedIds: [],
  measurements: [],
  viewMode: 'perspective',
  activeTool: 'select',
  snappingEnabled: true,
  continuousPlacement: false,
  activePlacementAsset: null,
  isCameraLocked: false,
  pendingCableStartId: null,
  cameraTarget: [0, 0, 0],
  lightingPreset: 'studio',

  ui: {
      showToolbar: true,
      showLibrary: true,
      showInspector: true,
      activeRightTab: 'inspector'
  },

  history: {
      past: [],
      future: []
  },

  // --- HISTORY ACTIONS ---
  pushHistory: () => set((state) => {
      const snapshot = createSnapshot(state);
      const newPast = [...state.history.past, snapshot].slice(-50);
      return {
          history: {
              past: newPast,
              future: []
          }
      };
  }),

  undo: () => set((state) => {
      if (state.history.past.length === 0) return state;

      const previous = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(0, -1);
      const currentSnapshot = createSnapshot(state);

      return {
          ...state,
          objects: previous.objects,
          measurements: previous.measurements,
          cables: previous.cables,
          cameraTarget: previous.cameraTarget,
          history: {
              past: newPast,
              future: [currentSnapshot, ...state.history.future]
          },
          selectedIds: [] 
      };
  }),

  redo: () => set((state) => {
      if (state.history.future.length === 0) return state;

      const next = state.history.future[0];
      const newFuture = state.history.future.slice(1);
      const currentSnapshot = createSnapshot(state);

      return {
          ...state,
          objects: next.objects,
          measurements: next.measurements,
          cables: next.cables,
          cameraTarget: next.cameraTarget,
          history: {
              past: [...state.history.past, currentSnapshot],
              future: newFuture
          },
          selectedIds: []
      };
  }),

  // --- OBJECT ACTIONS ---

  addObject: (assetKey, position) => {
      get().pushHistory();
      set((state) => {
        const existingCount = state.objects.filter(o => o.model === assetKey).length;
        const newObj = createSceneObject(assetKey, position, existingCount);

        if (!newObj) return state;
        
        // Logic for Pencil/Continuous Mode
        const newState = { 
            objects: [...state.objects, newObj],
            // If continuous is OFF, we select the new object and switch tool.
            // If continuous is ON, we keep the asset active and DO NOT select the new object (so we can keep clicking)
            selectedIds: state.continuousPlacement ? [] : [newObj.id],
            activePlacementAsset: state.continuousPlacement ? state.activePlacementAsset : null,
            activeTool: state.continuousPlacement ? state.activeTool : 'select'
        };

        return newState;
    })
  },

  cloneObject: (id) => {
    get().pushHistory();
    set((state) => {
        const original = state.objects.find(o => o.id === id);
        if (!original) return state;
        const newObj = cloneSceneObject(original);
        return {
            objects: [...state.objects, newObj],
            selectedIds: [newObj.id]
        };
    })
  },

  updateObject: (id, updates) => {
      set((state) => {
          return {
             objects: state.objects.map(o => o.id === id ? { ...o, ...updates } : o)
          }
      })
  },

  updateObjectFinal: (id, updates) => {
      get().pushHistory();
      set((state) => ({
         objects: state.objects.map(o => o.id === id ? { ...o, ...updates } : o)
      }));
  },

  removeObject: (id) => {
      get().pushHistory();
      set((state) => ({
        objects: state.objects.filter(o => o.id !== id),
        cables: state.cables.filter(c => c.startObjectId !== id && c.endObjectId !== id),
        selectedIds: state.selectedIds.filter(sid => sid !== id)
      }))
  },

  selectObject: (id, multi) => set((state) => {
    // If Eraser is active, do not select
    if (state.activeTool === 'eraser') return state;
    
    // Prevent selection if we are in the middle of placing something (unless tool is select)
    if (state.activePlacementAsset && state.continuousPlacement) return state;
    
    // Prevent selection if we are cabling
    if (state.activeTool === 'cable') return state;

    if (state.activeTool !== 'select' && state.activeTool !== 'move' && state.activeTool !== 'rotate' && state.selectedIds.includes(id)) {
        return state;
    }
    if (state.activeTool === 'tape') return state;

    const shouldOpenInspector = !state.ui.showInspector; 
    
    return {
        selectedIds: multi 
        ? (state.selectedIds.includes(id) ? state.selectedIds.filter(i => i !== id) : [...state.selectedIds, id])
        : [id],
        ui: shouldOpenInspector ? { ...state.ui, showInspector: true, activeRightTab: 'inspector' } : state.ui
    };
  }),

  clearSelection: () => set({ selectedIds: [] }),
  setViewMode: (mode) => set({ viewMode: mode }),
  
  setTool: (tool) => set((state) => ({ 
      activeTool: tool,
      pendingCableStartId: null, // Reset pending cable if tool changes
      activePlacementAsset: null // Reset placement
  })),

  toggleLayerVisibility: (id) => set((state) => ({
    layers: state.layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l)
  })),
  setPlacementAsset: (assetKey) => set({ activePlacementAsset: assetKey }),
  toggleSnapping: () => set((state) => ({ snappingEnabled: !state.snappingEnabled })),
  toggleContinuousPlacement: () => set((state) => ({ continuousPlacement: !state.continuousPlacement })),
  setCameraLocked: (locked) => set({ isCameraLocked: locked }),
  setCameraTarget: (target) => set({ cameraTarget: target }),
  setLightingPreset: (preset) => set({ lightingPreset: preset }),

  // --- CABLE ACTIONS ---
  startCable: (objectId) => set({ pendingCableStartId: objectId }),
  
  completeCable: (endObjectId) => {
      get().pushHistory();
      set((state) => {
          if (!state.pendingCableStartId || state.pendingCableStartId === endObjectId) {
              return { pendingCableStartId: null };
          }
          
          const newCable: Cable = {
              id: uuidv4(),
              startObjectId: state.pendingCableStartId,
              endObjectId: endObjectId,
              color: '#10b981', // Emerald green for signal default
              type: 'signal'
          };

          return {
              cables: [...state.cables, newCable],
              pendingCableStartId: null
          };
      });
  },

  cancelCable: () => set({ pendingCableStartId: null }),

  removeCable: (id) => {
      get().pushHistory();
      set((state) => ({
          cables: state.cables.filter(c => c.id !== id)
      }));
  },

  addMeasurement: (measurement) => {
      get().pushHistory();
      set((state) => ({
          measurements: [...state.measurements, measurement]
      }))
  },
  
  removeMeasurement: (id) => {
      get().pushHistory();
      set((state) => ({
          measurements: state.measurements.filter(m => m.id !== id)
      }))
  },

  loadProject: (data) => set((state) => ({
      ...state,
      objects: data.objects || state.objects,
      layers: data.layers || state.layers,
      cables: data.cables || [],
      measurements: data.measurements || [],
      cameraTarget: data.cameraTarget || state.cameraTarget,
      lightingPreset: data.lightingPreset || state.lightingPreset,
      history: { past: [], future: [] },
      selectedIds: [],
      activeTool: 'select',
      activePlacementAsset: null
  })),

  toggleUI: (element) => set((state) => ({
      ui: { ...state.ui, [element]: !state.ui[element] }
  })),
  setRightTab: (tab) => set((state) => ({
      ui: { ...state.ui, showInspector: true, activeRightTab: tab }
  })),
}));