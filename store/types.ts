import { StateCreator } from 'zustand';
import { SceneObject, Layer, ViewMode, ToolType, Measurement, Cable } from '../types';

// Data types specific to Store operations
export type LightingPreset = 'studio' | 'stage' | 'outdoor';

export interface UIState {
    showToolbar: boolean;
    showLibrary: boolean;
    showInspector: boolean;
    activeRightTab: 'inspector' | 'layers';
}

export interface ProjectData {
    objects: SceneObject[];
    measurements: Measurement[];
    cables: Cable[];
    cameraTarget: [number, number, number];
    layers?: Layer[];
    lightingPreset?: LightingPreset;
}

// --- SLICE INTERFACES ---

export interface HistorySlice {
    history: {
        past: ProjectData[];
        future: ProjectData[];
    };
    pushHistory: () => void;
    undo: () => void;
    redo: () => void;
}

export interface UISlice {
    ui: UIState;
    toggleUI: (element: keyof Omit<UIState, 'activeRightTab'>) => void;
    setRightTab: (tab: 'inspector' | 'layers') => void;
}

export interface InteractionSlice {
    // Selection
    selectedIds: string[];
    selectObject: (id: string, multi: boolean) => void;
    clearSelection: () => void;

    // Tools & Modes
    activeTool: ToolType;
    setTool: (tool: ToolType) => void;
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    snappingEnabled: boolean;
    toggleSnapping: () => void;
    continuousPlacement: boolean;
    toggleContinuousPlacement: () => void;
    activePlacementAsset: string | null;
    setPlacementAsset: (assetKey: string | null) => void;

    // Camera
    isCameraLocked: boolean;
    setCameraLocked: (locked: boolean) => void;
    cameraTarget: [number, number, number];
    setCameraTarget: (target: [number, number, number]) => void;
}

export interface SceneSlice {
    // Data
    objects: SceneObject[];
    layers: Layer[];
    cables: Cable[];
    measurements: Measurement[];
    lightingPreset: LightingPreset;

    // Object Actions
    addObject: (assetKey: string, position: [number, number, number]) => void;
    cloneObject: (id: string) => void;
    updateObject: (id: string, updates: Partial<SceneObject>) => void;
    updateObjectFinal: (id: string, updates: Partial<SceneObject>) => void;
    removeObject: (id: string) => void;

    // Layer Actions
    toggleLayerVisibility: (id: string) => void;

    // Cable Actions
    pendingCableStartId: string | null;
    startCable: (objectId: string) => void;
    completeCable: (endObjectId: string) => void;
    cancelCable: () => void;
    removeCable: (id: string) => void;

    // Measurement Actions
    addMeasurement: (measurement: Measurement) => void;
    removeMeasurement: (id: string) => void;

    // Scene Actions
    setLightingPreset: (preset: LightingPreset) => void;
    loadProject: (data: Partial<CombinedState>) => void;
}

// The complete Store type
export type CombinedState = SceneSlice & InteractionSlice & UISlice & HistorySlice;

// Helper type for creating slices
export type StoreSlice<T> = StateCreator<CombinedState, [], [], T>;