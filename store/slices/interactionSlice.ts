import { StoreSlice } from '../types';

export const createInteractionSlice: StoreSlice<import('../types').InteractionSlice> = (set) => ({
    selectedIds: [],
    activeTool: 'select',
    viewMode: 'perspective',
    snappingEnabled: true,
    continuousPlacement: false,
    activePlacementAsset: null,
    isCameraLocked: false,
    cameraTarget: [0, 0, 0],
    transformAxisConstraint: null,

    // --- SELECTION ---
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

    // --- TOOLS ---
    setTool: (tool) => set((state) => ({ 
        activeTool: tool,
        pendingCableStartId: null, // Reset pending cable if tool changes
        activePlacementAsset: null // Reset placement
    })),

    setViewMode: (mode) => set({ viewMode: mode }),
    toggleSnapping: () => set((state) => ({ snappingEnabled: !state.snappingEnabled })),
    toggleContinuousPlacement: () => set((state) => ({ continuousPlacement: !state.continuousPlacement })),
    setPlacementAsset: (assetKey) => set({ activePlacementAsset: assetKey }),

    // --- AXIS CONSTRAINT ---
    setTransformAxisConstraint: (axis) => set({ transformAxisConstraint: axis }),

    // --- CAMERA ---
    setCameraLocked: (locked) => set({ isCameraLocked: locked }),
    setCameraTarget: (target) => set({ cameraTarget: target }),
});