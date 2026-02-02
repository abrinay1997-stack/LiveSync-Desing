import { create } from 'zustand';
import { SceneObject, Layer, ViewMode, ToolType, ASSETS, Measurement } from './types';
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
    cameraTarget: [number, number, number];
}

interface AppState {
  objects: SceneObject[];
  layers: Layer[];
  selectedIds: string[];
  measurements: Measurement[];
  viewMode: ViewMode;
  activeTool: ToolType;
  snappingEnabled: boolean;
  activePlacementAsset: string | null;
  isCameraLocked: boolean;
  
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
  removeObject: (id: string) => void;
  selectObject: (id: string, multi: boolean) => void;
  clearSelection: () => void;
  setViewMode: (mode: ViewMode) => void;
  setTool: (tool: ToolType) => void;
  toggleLayerVisibility: (id: string) => void;
  setPlacementAsset: (assetKey: string | null) => void;
  toggleSnapping: () => void;
  setCameraLocked: (locked: boolean) => void;
  setCameraTarget: (target: [number, number, number]) => void;
  setLightingPreset: (preset: LightingPreset) => void;
  
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
  selectedIds: [],
  measurements: [],
  viewMode: 'perspective',
  activeTool: 'select',
  snappingEnabled: true,
  activePlacementAsset: null,
  isCameraLocked: false,
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
      // Limit history to 50 steps to save memory
      const newPast = [...state.history.past, snapshot].slice(-50);
      return {
          history: {
              past: newPast,
              future: [] // Clear future on new action
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
          cameraTarget: previous.cameraTarget,
          history: {
              past: newPast,
              future: [currentSnapshot, ...state.history.future]
          },
          // Clear selection on undo to avoid ghost IDs
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
          cameraTarget: next.cameraTarget,
          history: {
              past: [...state.history.past, currentSnapshot],
              future: newFuture
          },
          selectedIds: []
      };
  }),

  // --- OBJECT ACTIONS (Wrapped with pushHistory) ---

  addObject: (assetKey, position) => {
      get().pushHistory(); // SNAPSHOT BEFORE CHANGE
      set((state) => {
        const template = ASSETS[assetKey];
        if (!template) return state;

        let arrayConfig = undefined;
        if (template.type === 'speaker' || template.type === 'sub') {
            const isLineArray = template.isLineArray;
            const defaultCount = isLineArray ? 6 : 1;
            
            arrayConfig = {
                enabled: true,
                boxCount: defaultCount,
                siteAngle: 0,
                splayAngles: Array(defaultCount).fill(0),
                showThrowLines: isLineArray || false,
                throwDistance: 20
            };
        }

        const newObj: SceneObject = {
          id: uuidv4(),
          name: `${template.name} ${state.objects.filter(o => o.type === template.type).length + 1}`,
          model: assetKey, 
          type: template.type!,
          position: position,
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          layerId: template.type === 'truss' || template.type === 'motor' ? 'rigging' : 'audio',
          color: template.color || '#fff',
          dimensions: template.dimensions,
          arrayConfig: arrayConfig
        };
        
        return { 
            objects: [...state.objects, newObj], 
            selectedIds: [newObj.id],
            activePlacementAsset: null,
            activeTool: 'select'
        };
    })
  },

  cloneObject: (id) => {
    get().pushHistory();
    set((state) => {
        const original = state.objects.find(o => o.id === id);
        if (!original) return state;

        const arrayConfigClone = original.arrayConfig ? {
            ...original.arrayConfig,
            splayAngles: [...original.arrayConfig.splayAngles]
        } : undefined;

        const newObj: SceneObject = {
            ...original,
            id: uuidv4(),
            name: `${original.name} (Copy)`,
            position: [original.position[0] + 2, original.position[1], original.position[2]],
            arrayConfig: arrayConfigClone
        };

        return {
            objects: [...state.objects, newObj],
            selectedIds: [newObj.id]
        };
    })
  },

  updateObject: (id, updates) => {
      // NOTE: For dragging, this might create too many history steps. 
      // In a real app, we'd use 'onDragStart' and 'onDragEnd' to snapshot.
      // For now, we assume this is called on "End" of interactions mostly.
      // Optimization: We could check if we are 'dragging' via a transient state.
      // For property panel updates, this is fine.
      set((state) => {
          // If the update is purely transient (like dragging preview), we might skip history,
          // but detecting that here is complex without more flags.
          // We will rely on the UI components to call updateObject only when committed (e.g. onBlur or onMouseUp).
          return {
             objects: state.objects.map(o => o.id === id ? { ...o, ...updates } : o)
          }
      })
  },

  // Special action for committed updates (to use with onMouseUp/onBlur)
  // This explicitly creates a history entry
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
        selectedIds: state.selectedIds.filter(sid => sid !== id)
      }))
  },

  selectObject: (id, multi) => set((state) => {
    if (state.activeTool !== 'select' && state.activeTool !== 'move' && state.activeTool !== 'rotate' && state.selectedIds.includes(id)) {
        return state;
    }
    // Prevent selection if measuring
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
  setTool: (tool) => set({ activeTool: tool }),
  toggleLayerVisibility: (id) => set((state) => ({
    layers: state.layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l)
  })),
  setPlacementAsset: (assetKey) => set({ activePlacementAsset: assetKey }),
  toggleSnapping: () => set((state) => ({ snappingEnabled: !state.snappingEnabled })),
  setCameraLocked: (locked) => set({ isCameraLocked: locked }),
  setCameraTarget: (target) => set({ cameraTarget: target }),
  setLightingPreset: (preset) => set({ lightingPreset: preset }),

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
      measurements: data.measurements || [],
      cameraTarget: data.cameraTarget || state.cameraTarget,
      lightingPreset: data.lightingPreset || state.lightingPreset,
      history: { past: [], future: [] }, // Reset history on load
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