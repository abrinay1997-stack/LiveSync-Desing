import { create } from 'zustand';
import { CombinedState } from './store/types';
import { createSceneSlice } from './store/slices/sceneSlice';
import { createInteractionSlice } from './store/slices/interactionSlice';
import { createUISlice } from './store/slices/uiSlice';
import { createHistorySlice } from './store/slices/historySlice';

// Exports types for consumers
export * from './store/types';

export const useStore = create<CombinedState>()((...a) => ({
  ...createHistorySlice(...a),
  ...createSceneSlice(...a),
  ...createInteractionSlice(...a),
  ...createUISlice(...a),
}));