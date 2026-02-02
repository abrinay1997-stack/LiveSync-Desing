import { StoreSlice } from '../types';

export const createUISlice: StoreSlice<import('../types').UISlice> = (set) => ({
    ui: {
        showToolbar: true,
        showLibrary: true,
        showInspector: true,
        activeRightTab: 'inspector'
    },

    toggleUI: (element) => set((state) => ({
        ui: { ...state.ui, [element]: !state.ui[element] }
    })),
    
    setRightTab: (tab) => set((state) => ({
        ui: { ...state.ui, showInspector: true, activeRightTab: tab }
    })),
});