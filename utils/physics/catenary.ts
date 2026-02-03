/**
 * Catenary Curve Calculations
 * 
 * A catenary is the curve formed by a hanging cable under its own weight.
 * Critical for calculating sag in rigging cables and load distribution.
 * 
 * Mathematical basis: y = a * cosh(x/a) where a = T_h / (ρ * g)
 * T_h = horizontal tension, ρ = linear density, g = gravity
 */

export interface CatenaryParams {
    span: number;           // Horizontal distance between supports (meters)
    weight: number;         // Total suspended weight (kg)
    cableWeight: number;    // Cable linear density (kg/m)
    heightDiff?: number;    // Height difference between supports (meters), default 0
    maxSag?: number;        // Maximum allowed sag (meters), optional
}

export interface CatenaryResult {
    sag: number;            // Maximum vertical sag at midpoint (meters)
    cableLength: number;    // Actual cable length (meters)
    maxTension: number;     // Maximum tension in cable (Newtons)
    minTension: number;     // Minimum tension (at lowest point) (Newtons)
    curve: Array<{ x: number; y: number }>; // Points along curve for visualization
}

const GRAVITY = 9.81; // m/s²

/**
 * Calculate catenary curve for a suspended cable
 */
export function calculateCatenary(params: CatenaryParams): CatenaryResult {
    const { span, weight, cableWeight, heightDiff = 0 } = params;

    // Linear density of cable + suspended load
    const totalLinearDensity = cableWeight + (weight / span);

    // For small sags (common in rigging), use parabolic approximation
    // This is accurate within 1% for sag < span/8
    // Formula: sag = (w * L²) / (8 * T_h)

    // Initial estimate: assume horizontal tension = 50% of total weight
    const estimatedTension = (weight + cableWeight * span) * GRAVITY * 0.5;

    // Calculate sag using parabolic approximation
    const sag = (totalLinearDensity * GRAVITY * Math.pow(span, 2)) / (8 * estimatedTension);

    // Actual cable length (Pythagoras + arc length)
    const cableLength = span * Math.sqrt(1 + (8 * Math.pow(sag / span, 2) / 3));

    // Tension at supports (includes vertical component)
    const verticalTension = (totalLinearDensity * GRAVITY * span) / 2;
    const maxTension = Math.sqrt(Math.pow(estimatedTension, 2) + Math.pow(verticalTension, 2));

    // Minimum tension (at lowest point, purely horizontal)
    const minTension = estimatedTension;

    // Generate curve points for visualization (21 points)
    const curve: Array<{ x: number; y: number }> = [];
    const numPoints = 21;

    for (let i = 0; i < numPoints; i++) {
        const x = (i / (numPoints - 1)) * span - (span / 2); // Center at origin

        // Parabolic approximation: y = (sag / (span/2)²) * x²
        const y = -(sag / Math.pow(span / 2, 2)) * Math.pow(x, 2);

        curve.push({ x, y: y + heightDiff * (x / span + 0.5) });
    }

    return {
        sag,
        cableLength,
        maxTension,
        minTension,
        curve
    };
}

/**
 * Calculate required cable strength for safety factor
 */
export function calculateRequiredCableStrength(
    maxTension: number,
    safetyFactor: number = 5 // BGV-C1 requires 5:1 for dynamic loads
): number {
    return maxTension * safetyFactor;
}

/**
 * Validate if cable meets safety requirements
 */
export function validateCableSafety(
    cableBreakingLoad: number, // Newtons
    maxTension: number,
    requiredSafetyFactor: number = 5
): { safe: boolean; actualSafetyFactor: number; warnings: string[] } {
    const actualSafetyFactor = cableBreakingLoad / maxTension;
    const warnings: string[] = [];

    if (actualSafetyFactor < requiredSafetyFactor) {
        warnings.push(`Safety factor ${actualSafetyFactor.toFixed(2)}:1 is below required ${requiredSafetyFactor}:1`);
    }

    if (actualSafetyFactor < 3) {
        warnings.push('CRITICAL: Safety factor below 3:1 - immediate failure risk');
    }

    return {
        safe: actualSafetyFactor >= requiredSafetyFactor,
        actualSafetyFactor,
        warnings
    };
}
