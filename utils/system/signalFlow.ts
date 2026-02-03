import { PortDefinition, PortType, PortDirection } from '../../types';

export interface ConnectionRequest {
    sourcePort: PortDefinition;
    targetPort: PortDefinition;
}

export interface ValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * Validates if two ports can constitute a valid connection
 */
export function validateConnection(source: PortDefinition, target: PortDefinition): ValidationResult {
    // 1. Check connector type compatibility
    if (source.type !== target.type) {
        // Exception: generic can connect to anything? No, let's differ for now
        // Or maybe 'speakon' connects to 'speakon'
        return { valid: false, error: `Incompatible connector types: ${source.type} vs ${target.type}` };
    }

    // 2. Check signal direction
    // Valid: OUT -> IN
    // Valid: BI -> IN, BI -> OUT, BI -> BI
    // Invalid: IN -> IN, OUT -> OUT

    if (source.direction === 'in' && target.direction === 'in') {
        return { valid: false, error: 'Cannot connect Input to Input' };
    }

    if (source.direction === 'out' && target.direction === 'out') {
        return { valid: false, error: 'Cannot connect Output to Output' };
    }

    return { valid: true };
}

/**
 * Helper to check if a port accepts a specific cable type
 */
export function isPortCompatible(port: PortDefinition, cableType: string): boolean {
    if (cableType === 'power' && port.type === 'powercon') return true;
    if (cableType === 'signal' && (port.type === 'xlr' || port.type === 'speakon')) return true;
    if (cableType === 'network' && port.type === 'ethercon') return true;
    return false;
}
