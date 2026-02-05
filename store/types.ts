import { StateCreator } from 'zustand';
import { SceneObject, Layer, ViewMode, ToolType, Measurement, Cable, ObjectGroup } from '../types';

// Data types specific to Store operations
export type LightingPreset = 'studio' | 'stage' | 'outdoor';

export interface UIState {
    showToolbar: boolean;
    showLibrary: boolean;
    showInspector: boolean;
    activeRightTab: 'inspector' | 'layers' | 'patch';
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
    setRightTab: (tab: 'inspector' | 'layers' | 'patch') => void;

    // SPL Visualization
    showSPLCoverage: boolean;
    splMeasurementHeight: number;
    splResolution: number;
    splFrequency: number;
    showReflections: boolean;
    showOcclusion: boolean;

    // Visual helpers
    showGroundPlane: boolean;
    showObjectLabels: boolean;

    toggleSPLCoverage: () => void;
    setSPLMeasurementHeight: (height: number) => void;
    setSPLResolution: (resolution: number) => void;
    setSPLFrequency: (frequency: number) => void;
    toggleReflections: () => void;
    toggleOcclusion: () => void;
    toggleGroundPlane: () => void;
    toggleObjectLabels: () => void;
}

export type AxisConstraint = 'x' | 'y' | 'z' | null;

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

    // Transform axis constraint (Blender-style X/Y/Z locking)
    transformAxisConstraint: AxisConstraint;
    setTransformAxisConstraint: (axis: AxisConstraint) => void;

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
    groups: ObjectGroup[];
    lightingPreset: LightingPreset;

    // Object Actions
    addObject: (assetKey: string, position: [number, number, number]) => void;
    cloneObject: (id: string) => void;
    updateObject: (id: string, updates: Partial<SceneObject>) => void;
    updateObjectFinal: (id: string, updates: Partial<SceneObject>) => void;
    removeObject: (id: string) => void;

    // Multi-selection batch operations
    updateObjects: (ids: string[], updates: Partial<SceneObject>) => void;
    updateObjectsWithTransform: (ids: string[], transformer: (obj: SceneObject) => Partial<SceneObject>) => void;
    removeObjects: (ids: string[]) => void;

    // Layer Actions
    toggleLayerVisibility: (id: string) => void;

    // Group Actions
    createGroup: (objectIds: string[], name?: string) => string | null; // Returns group ID or null if failed
    dissolveGroup: (groupId: string) => void;
    addToGroup: (groupId: string, objectIds: string[]) => void;
    removeFromGroup: (groupId: string, objectIds: string[]) => void;
    renameGroup: (groupId: string, name: string) => void;
    getGroupForObject: (objectId: string) => ObjectGroup | undefined;
    selectGroup: (groupId: string) => void;

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

import { SystemSlice } from './slices/systemSlice';

// The complete Store type
export type CombinedState = SceneSlice & InteractionSlice & UISlice & HistorySlice & SystemSlice;

// Helper type for creating slices
export type StoreSlice<T> = StateCreator<CombinedState, [], [], T>;