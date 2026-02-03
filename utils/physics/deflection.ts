/**
 * Deflection Calculations for Trusses
 * 
 * Calculates beam deflection under distributed and point loads
 */

const GRAVITY = 9.81; // m/s²

export interface TrussProperties {
    length: number;           // meters
    material: 'aluminum' | 'steel';
    crossSection: 'F34' | 'F44' | 'F54'; // Common truss sizes
}

export interface DeflectionResult {
    maxDeflection: number;    // meters (at midpoint)
    safetyOk: boolean;        // Based on span/deflection ratio
    deflectionRatio: number;  // L/δ ratio (should be > 200 for rigging)
    warnings: string[];
}

/**
 * Material properties database
 */
const MATERIAL_PROPERTIES = {
    aluminum: {
        youngsModulus: 69e9,  // Pa (Pascals)
        density: 2700         // kg/m³
    },
    steel: {
        youngsModulus: 200e9,
        density: 7850
    }
};

/**
 * Truss cross-section properties (moment of inertia)
 * These are approximate values for common square trusses
 */
const CROSS_SECTIONS = {
    'F34': {
        momentOfInertia: 1.2e-5,  // m⁴ (290mm square)
        weight: 6.0                // kg/m
    },
    'F44': {
        momentOfInertia: 3.5e-5,  // m⁴ (400mm square)
        weight: 12.0
    },
    'F54': {
        momentOfInertia: 8.0e-5,  // m⁴ (500mm square)
        weight: 18.0
    }
};

/**
 * Calculate maximum deflection for simply supported beam with uniform load
 * Formula: δ = (5 * w * L⁴) / (384 * E * I)
 */
export function calculateUniformLoadDeflection(
    trussProps: TrussProperties,
    uniformLoad: number  // kg/m (distributed load)
): DeflectionResult {
    const { length, material, crossSection } = trussProps;

    const E = MATERIAL_PROPERTIES[material].youngsModulus;
    const I = CROSS_SECTIONS[crossSection].momentOfInertia;

    // Convert kg/m to N/m
    const w = uniformLoad * GRAVITY;

    // Deflection formula
    const deflection = (5 * w * Math.pow(length, 4)) / (384 * E * I);

    return evaluateDeflection(deflection, length);
}

/**
 * Calculate maximum deflection for point load at center
 * Formula: δ = (P * L³) / (48 * E * I)
 */
export function calculatePointLoadDeflection(
    trussProps: TrussProperties,
    pointLoad: number  // kg (concentrated at center)
): DeflectionResult {
    const { length, material, crossSection } = trussProps;

    const E = MATERIAL_PROPERTIES[material].youngsModulus;
    const I = CROSS_SECTIONS[crossSection].momentOfInertia;

    // Convert kg to N
    const P = pointLoad * GRAVITY;

    // Deflection formula
    const deflection = (P * Math.pow(length, 3)) / (48 * E * I);

    return evaluateDeflection(deflection, length);
}

/**
 * Calculate combined deflection from multiple loads
 */
export function calculateCombinedDeflection(
    trussProps: TrussProperties,
    uniformLoad: number,  // kg/m
    pointLoads: number[]  // kg (multiple point loads)
): DeflectionResult {
    const uniformResult = calculateUniformLoadDeflection(trussProps, uniformLoad);

    // Sum all point load deflections
    const pointDeflections = pointLoads.map(load =>
        calculatePointLoadDeflection(trussProps, load).maxDeflection
    );

    const totalPointDeflection = pointDeflections.reduce((sum, d) => sum + d, 0);
    const totalDeflection = uniformResult.maxDeflection + totalPointDeflection;

    return evaluateDeflection(totalDeflection, trussProps.length);
}

/**
 * Evaluate if deflection is within acceptable limits
 */
function evaluateDeflection(deflection: number, length: number): DeflectionResult {
    const deflectionRatio = length / deflection;
    const warnings: string[] = [];

    // Industry standard: L/δ should be > 200 for rigging applications
    let safetyOk = true;

    if (deflectionRatio < 150) {
        safetyOk = false;
        warnings.push(`CRITICAL: Excessive deflection (L/${deflectionRatio.toFixed(0)})`);
        warnings.push('Truss may fail or be visibly sagging');
    } else if (deflectionRatio < 200) {
        warnings.push(`Warning: High deflection (L/${deflectionRatio.toFixed(0)})`);
        warnings.push('Consider using larger truss or reducing load');
    } else if (deflectionRatio < 300) {
        warnings.push(`Acceptable deflection (L/${deflectionRatio.toFixed(0)})`);
    }

    // Additional check: absolute deflection
    if (deflection > 0.05) { // 5cm visible sag
        warnings.push(`Visible sag: ${(deflection * 100).toFixed(1)}cm at midpoint`);
    }

    return {
        maxDeflection: deflection,
        safetyOk,
        deflectionRatio,
        warnings
    };
}

/**
 * Get recommended truss size for given load and span
 */
export function recommendTrussSize(
    span: number,     // meters
    totalLoad: number, // kg
    material: 'aluminum' | 'steel' = 'aluminum'
): {
    recommended: 'F34' | 'F44' | 'F54';
    reason: string;
} {
    const crossSections: Array<'F34' | 'F44' | 'F54'> = ['F34', 'F44', 'F54'];

    for (const crossSection of crossSections) {
        const result = calculatePointLoadDeflection(
            { length: span, material, crossSection },
            totalLoad
        );

        if (result.safetyOk && result.deflectionRatio > 250) {
            return {
                recommended: crossSection,
                reason: `L/${result.deflectionRatio.toFixed(0)} deflection ratio`
            };
        }
    }

    return {
        recommended: 'F54',
        reason: 'Maximum size recommended - consider reducing span or load'
    };
}
