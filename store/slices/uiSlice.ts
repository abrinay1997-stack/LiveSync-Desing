import { StoreSlice } from '../types';

export const createUISlice: StoreSlice<import('../types').UISlice> = (set) => ({
    ui: {
        showToolbar: true,
        showLibrary: true,
        showInspector: true,
        activeRightTab: 'inspector'
    },

    // SPL Coverage controls
    showSPLCoverage: false,
    splMeasurementHeight: 1.7,  // 1.7m (ear height)
    splResolution: 1.0,          // 1m grid
    splFrequency: 1000,          // 1kHz

    toggleUI: (element) => set((state) => ({
        ui: { ...state.ui, [element]: !state.ui[element] }
    })),

    setRightTab: (tab) => set((state) => ({
        ui: { ...state.ui, showInspector: true, activeRightTab: tab }
    })),

    toggleSPLCoverage: () => set((state) => ({
        showSPLCoverage: !state.showSPLCoverage
    })),

    setSPLMeasurementHeight: (height: number) => set({ splMeasurementHeight: height }),
    setSPLResolution: (resolution: number) => set({ splResolution: resolution }),
    setSPLFrequency: (frequency: number) => set({ splFrequency: frequency }),
});