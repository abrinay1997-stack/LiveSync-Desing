import { StateCreator } from 'zustand';
import { Cable, SceneObject } from '../../types';
import { validateConnection } from '../../utils/system/signalFlow';
import { v4 as uuidv4 } from 'uuid';

export interface SystemState {
    cables: Cable[];
}

export interface SystemSlice {
    system: SystemState;
    addCable: (cable: Omit<Cable, 'id'>) => { success: boolean; error?: string };
    removeCable: (cableId: string) => void;
    getCablesForObject: (objectId: string) => Cable[];
}

export const createSystemSlice: StateCreator<
    SystemSlice,
    [],
    [],
    SystemSlice
> = (set, get) => ({
    system: {
        cables: []
    },

    addCable: (cableDef) => {
        // In a real implementation, we would look up the objects and ports here
        // and run validateConnection(source, target).
        // For MVP, we maintain the state provided by the UI.

        const newCable: Cable = {
            ...cableDef,
            id: uuidv4()
        };

        set((state) => ({
            system: {
                ...state.system,
                cables: [...state.system.cables, newCable]
            }
        }));

        return { success: true };
    },

    removeCable: (cableId) => {
        set((state) => ({
            system: {
                ...state.system,
                cables: state.system.cables.filter(c => c.id !== cableId)
            }
        }));
    },

    getCablesForObject: (objectId) => {
        return get().system.cables.filter(
            c => c.startObjectId === objectId || c.endObjectId === objectId
        );
    }
});
