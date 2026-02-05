import { v4 as uuidv4 } from 'uuid';
import { StoreSlice } from '../types';
import { createSceneObject, cloneSceneObject } from '../../utils/factory';
import { Cable } from '../../types';

export const createSceneSlice: StoreSlice<import('../types').SceneSlice> = (set, get) => ({
    // Initial State
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
    measurements: [],
    groups: [],
    lightingPreset: 'studio',
    pendingCableStartId: null,

    // --- OBJECT ACTIONS ---
    addObject: (assetKey, position) => {
        get().pushHistory();
        set((state) => {
            const existingCount = state.objects.filter(o => o.model === assetKey).length;
            const newObj = createSceneObject(assetKey, position, existingCount);

            if (!newObj) return state;

            return {
                objects: [...state.objects, newObj],
                selectedIds: state.continuousPlacement ? [] : [newObj.id],
                activePlacementAsset: state.continuousPlacement ? state.activePlacementAsset : null,
                activeTool: state.continuousPlacement ? state.activeTool : 'select'
            };
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

    // Multi-selection batch operations
    updateObjects: (ids, updates) => {
        get().pushHistory();
        set((state) => ({
            objects: state.objects.map(o => ids.includes(o.id) ? { ...o, ...updates } : o)
        }));
    },

    updateObjectsWithTransform: (ids, transformer) => {
        get().pushHistory();
        set((state) => ({
            objects: state.objects.map(o => ids.includes(o.id) ? { ...o, ...transformer(o) } : o)
        }));
    },

    removeObjects: (ids) => {
        get().pushHistory();
        set((state) => ({
            objects: state.objects.filter(o => !ids.includes(o.id)),
            cables: state.cables.filter(c => !ids.includes(c.startObjectId) && !ids.includes(c.endObjectId)),
            selectedIds: state.selectedIds.filter(sid => !ids.includes(sid))
        }));
    },

    toggleLayerVisibility: (id) => set((state) => ({
        layers: state.layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l)
    })),

    // --- GROUP ACTIONS ---
    createGroup: (objectIds, name) => {
        if (objectIds.length < 2) return null; // Need at least 2 objects to form a group

        get().pushHistory();
        const groupId = uuidv4();
        const groupName = name || `Group ${get().groups.length + 1}`;

        // Remove these objects from any existing groups first
        set((state) => {
            const updatedGroups = state.groups.map(g => ({
                ...g,
                objectIds: g.objectIds.filter(id => !objectIds.includes(id))
            })).filter(g => g.objectIds.length > 0); // Remove empty groups

            return {
                groups: [...updatedGroups, {
                    id: groupId,
                    name: groupName,
                    objectIds: objectIds,
                    color: '#8b5cf6' // Default purple color for groups
                }]
            };
        });

        return groupId;
    },

    dissolveGroup: (groupId) => {
        get().pushHistory();
        set((state) => ({
            groups: state.groups.filter(g => g.id !== groupId)
        }));
    },

    addToGroup: (groupId, objectIds) => {
        get().pushHistory();
        set((state) => {
            // First remove from any existing groups
            let updatedGroups = state.groups.map(g => ({
                ...g,
                objectIds: g.objectIds.filter(id => !objectIds.includes(id))
            }));

            // Then add to target group
            updatedGroups = updatedGroups.map(g => {
                if (g.id === groupId) {
                    return {
                        ...g,
                        objectIds: [...new Set([...g.objectIds, ...objectIds])]
                    };
                }
                return g;
            }).filter(g => g.objectIds.length > 0);

            return { groups: updatedGroups };
        });
    },

    removeFromGroup: (groupId, objectIds) => {
        get().pushHistory();
        set((state) => ({
            groups: state.groups.map(g => {
                if (g.id === groupId) {
                    const remainingIds = g.objectIds.filter(id => !objectIds.includes(id));
                    return { ...g, objectIds: remainingIds };
                }
                return g;
            }).filter(g => g.objectIds.length > 0) // Remove empty groups
        }));
    },

    renameGroup: (groupId, name) => {
        set((state) => ({
            groups: state.groups.map(g => g.id === groupId ? { ...g, name } : g)
        }));
    },

    getGroupForObject: (objectId) => {
        return get().groups.find(g => g.objectIds.includes(objectId));
    },

    selectGroup: (groupId) => {
        const group = get().groups.find(g => g.id === groupId);
        if (group) {
            set({ selectedIds: [...group.objectIds] });
        }
    },

    // --- CABLE ACTIONS ---
    startCable: (objectId) => set({ pendingCableStartId: objectId }),

    completeCable: (endObjectId) => {
        get().pushHistory();
        set((state) => {
            if (!state.pendingCableStartId || state.pendingCableStartId === endObjectId) {
                return { pendingCableStartId: null };
            }

            // Phase 6: Use SystemSlice
            const result = get().addCable({
                startObjectId: state.pendingCableStartId,
                endObjectId: endObjectId,
                color: '#10b981',
                type: 'signal'
            });

            if (!result.success) {
                console.warn('Cable creation failed:', result.error);
                return { pendingCableStartId: null };
            }

            return {
                pendingCableStartId: null
            };
        });
    },

    cancelCable: () => set({ pendingCableStartId: null }),

    removeCable: (id) => {
        get().pushHistory();
        // Phase 6: Proxy to system slice
        get().removeCable(id);
        // We also need to update this slice if we were keeping a local copy, but we are moving away from it.
        // However, Zustand setters merge state, so we don't return anything here, just side effect?
        // Wait, removeCable in systemSlice updates 'system', but this function is expected to update... what?
        // It's a void function in the interface.
        // But for consistency let's clear the deprecated array if it has anything.
        set(state => ({ cables: state.cables.filter(c => c.id !== id) }));
    },

    // --- MEASUREMENT ACTIONS ---
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

    setLightingPreset: (preset) => set({ lightingPreset: preset }),

    loadProject: (data) => set((state) => ({
        ...state,
        objects: data.objects || state.objects,
        layers: data.layers || state.layers,
        cables: data.cables || [],
        measurements: data.measurements || [],
        groups: (data as any).groups || [],
        cameraTarget: data.cameraTarget || state.cameraTarget,
        lightingPreset: data.lightingPreset || state.lightingPreset,
        history: { past: [], future: [] },
        selectedIds: [],
        activeTool: 'select',
        activePlacementAsset: null
    })),
});