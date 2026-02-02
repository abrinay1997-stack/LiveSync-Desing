import { StoreSlice, ProjectData } from '../types';
import { SceneObject } from '../../types';

// Simple Delta Interface
// In a full implementation we would use JSON-Patch or Immer, but this
// lightweight approach covers 90% of cases (Object Updates) efficiently.
interface Patch {
    type: 'update' | 'add' | 'remove' | 'multi';
    ids: string[];
    // For updates: stores previous full object state to revert
    undoData: Partial<SceneObject>[]; 
    // For redos: stores the new state
    redoData: Partial<SceneObject>[]; 
}

const HISTORY_LIMIT = 50;

export const createHistorySlice: StoreSlice<import('../types').HistorySlice> = (set, get) => ({
    // We repurpose the existing structure. 
    // 'past' now holds generic snapshots OR patches. 
    // For compatibility with the current interface, we will stick to snapshots 
    // BUT optimize the logic to not deep-clone everything if possible in future.
    // 
    // CRITICAL: Since refactoring the entire app to use Patches requires changing every
    // reducer in sceneSlice, we will implement a Hybrid approach here:
    // We enforce a hard limit on history size to prevent crashes immediately.
    
    history: {
        past: [],
        future: []
    },

    pushHistory: () => set((state) => {
        // Optimized Snapshot: 
        // We only store the arrays. Objects inside are references unless modified.
        // JS Handles this efficiently via structural sharing.
        const snapshot: ProjectData = {
            objects: state.objects, // Reference copy of the array
            measurements: state.measurements,
            cables: state.cables,
            cameraTarget: state.cameraTarget
        };

        const newPast = [...state.history.past, snapshot].slice(-HISTORY_LIMIT);
        
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
        
        // Save current state to future
        const currentSnapshot: ProjectData = {
            objects: state.objects,
            measurements: state.measurements,
            cables: state.cables,
            cameraTarget: state.cameraTarget
        };

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
        
        const currentSnapshot: ProjectData = {
            objects: state.objects,
            measurements: state.measurements,
            cables: state.cables,
            cameraTarget: state.cameraTarget
        };

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
});