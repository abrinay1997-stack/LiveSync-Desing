import { v4 as uuidv4 } from 'uuid';
import { SceneObject, ArrayConfig } from '../types';
import { ASSETS } from '../data/library';

/**
 * Creates a default Array Configuration based on the asset capabilities
 */
const createDefaultArrayConfig = (isLineArray: boolean): ArrayConfig => {
    const count = isLineArray ? 6 : 1;
    return {
        enabled: true,
        boxCount: count,
        siteAngle: 0,
        splayAngles: Array(count).fill(0),
        showThrowLines: isLineArray,
        throwDistance: 20
    };
};

/**
 * Factory function to instantiate a new Scene Object.
 * Encapsulates all default logic, layer assignment, and initial state.
 */
export const createSceneObject = (
    assetKey: string, 
    position: [number, number, number],
    existingCount: number = 0
): SceneObject | null => {
    const template = ASSETS[assetKey];
    if (!template) {
        console.error(`Asset key not found: ${assetKey}`);
        return null;
    }

    // Auto-determine Layer
    let layerId = 'venue';
    if (['speaker', 'sub'].includes(template.type)) layerId = 'audio';
    if (['truss', 'motor', 'bumper'].includes(template.type)) layerId = 'rigging';

    // Auto-configure Arrays
    let arrayConfig: ArrayConfig | undefined = undefined;
    if (template.type === 'speaker' || template.type === 'sub') {
        // Only add array config if it's explicitly a line array or capable of being one
        // For simplicity in this demo, we add it to all speakers but enable based on flag
        arrayConfig = createDefaultArrayConfig(template.isLineArray || false);
        
        // Disable array mode by default for point sources (monitors)
        if (!template.isLineArray) {
            arrayConfig.enabled = false;
        }
    }

    return {
        id: uuidv4(),
        name: `${template.name} ${existingCount + 1}`,
        model: assetKey,
        type: template.type,
        position: position,
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        layerId: layerId,
        color: template.color || '#fff',
        dimensions: { ...template.dimensions }, // Clone to avoid ref issues
        arrayConfig: arrayConfig,
        locked: false
    };
};

/**
 * Factory to clone an existing object
 */
export const cloneSceneObject = (original: SceneObject): SceneObject => {
    // Deep clone array config if exists
    const arrayConfigClone = original.arrayConfig ? {
        ...original.arrayConfig,
        splayAngles: [...original.arrayConfig.splayAngles]
    } : undefined;

    return {
        ...original,
        id: uuidv4(),
        name: `${original.name} (Copy)`,
        position: [original.position[0] + 1, original.position[1], original.position[2]], // Slight offset
        arrayConfig: arrayConfigClone
    };
};