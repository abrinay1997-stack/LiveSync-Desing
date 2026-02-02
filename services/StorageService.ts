import { CombinedState, ProjectData } from '../store/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * StorageService
 * 
 * Abstraction layer for Project Persistence.
 * Currently implements Local File I/O (JSON).
 * 
 * ARCHITECTURE NOTE:
 * In the future, replace the internal methods here with API calls 
 * to Supabase/Firebase without breaking the UI components.
 */

export const StorageService = {
    
    /**
     * Serializes the current store state into a portable JSON format
     */
    serializeProject: (state: CombinedState): ProjectData & { meta: any } => {
        return {
            objects: state.objects,
            layers: state.layers,
            cables: state.cables,
            measurements: state.measurements,
            cameraTarget: state.cameraTarget,
            lightingPreset: state.lightingPreset,
            meta: {
                version: "1.1.0",
                timestamp: new Date().toISOString(),
                generator: "LiveSync Design Engine"
            }
        };
    },

    /**
     * Trigger a browser download of the project
     */
    downloadProject: (data: any, filename?: string) => {
        const name = filename || `livesync-project-${new Date().toISOString().slice(0,10)}.json`;
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    /**
     * Parse a file input into ProjectData
     */
    importProject: async (file: File): Promise<ProjectData> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target?.result as string);
                    // Validate minimal structure
                    if (!json.objects || !Array.isArray(json.objects)) {
                        throw new Error("Invalid project file structure");
                    }
                    resolve(json);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = (err) => reject(err);
            reader.readAsText(file);
        });
    },

    /**
     * Future-proof stub for Cloud Saving
     */
    saveToCloud: async (data: ProjectData): Promise<string> => {
        console.log("Simulating Cloud Save...", data);
        // await api.post('/projects', data);
        return uuidv4(); // Return fake project ID
    }
};