/**
 * Enhanced Load Distribution Calculations with Geometric Analysis
 * 
 * Analyzes how weight is distributed across rigging points
 * NOW considers real cable angles and tension vectors
 */

const GRAVITY = 9.81; // m/s²
const DYNAMIC_FACTOR = 1.5; // BGV-C1 dynamic load multiplier

export interface RiggingPoint {
    id: string;
    position: [number, number, number];
    type: 'motor' | 'truss' | 'fixed';
    capacity?: number; // kg (Working Load Limit)
}

export interface SuspendedLoad {
    id: string;
    weight: number; // kg
    position: [number, number, number];
    attachedTo: string[]; // IDs of rigging points
}

export interface LoadDistributionParams {
    riggingPoints: RiggingPoint[];
    loads: SuspendedLoad[];
}

export interface PointLoad {
    pointId: string;
    staticLoad: number;     // kg
    dynamicLoad: number;    // kg (with safety factor)
    tension: number;        // Newtons
    utilization: number;    // % of capacity (if known)
    angle: number;          // degrees from vertical
}

export interface LoadDistributionResult {
    pointLoads: PointLoad[];
    totalWeight: number;
    maxUtilization: number;
    safetyFactor: number;
    warnings: string[];
    safe: boolean;
}

/**
 * Calculate load distribution across rigging points with REAL GEOMETRY
 */
export function calculateLoadDistribution(params: LoadDistributionParams): LoadDistributionResult {
    const { riggingPoints, loads } = params;
    const warnings: string[] = [];

    // Initialize load tracking with geometric data
    const pointLoads = new Map<string, {
        static: number;
        tension: number;
        angle: number;
    }>();

    riggingPoints.forEach(p => pointLoads.set(p.id, {
        static: 0,
        tension: 0,
        angle: 0
    }));

    let totalWeight = 0;

    // Distribute each load using geometric analysis
    loads.forEach(load => {
        totalWeight += load.weight;

        if (load.attachedTo.length === 0) {
            warnings.push(`Load ${load.id} (${load.weight}kg) has no rigging points`);
            return;
        }

        // Get rigging points for this load
        const attachedPoints = riggingPoints.filter(p => load.attachedTo.includes(p.id));

        if (attachedPoints.length === 0) {
            warnings.push(`Load ${load.id} has invalid rigging point references`);
            return;
        }

        // Calculate tension in each cable based on geometry
        attachedPoints.forEach(point => {
            const current = pointLoads.get(point.id);
            if (!current) return;

            // Calculate angle from vertical
            const dx = point.position[0] - load.position[0];
            const dy = point.position[1] - load.position[1];
            const dz = point.position[2] - load.position[2];

            const horizontalDist = Math.sqrt(dx * dx + dz * dz);
            const angleRad = Math.atan2(horizontalDist, Math.abs(dy));
            const angleDeg = (angleRad * 180) / Math.PI;

            // For multiple attachments, assume load shares based on vertical components
            const numAttachments = attachedPoints.length;
            const weightPerPoint = load.weight / numAttachments;

            // Tension calculation: T = W / (n * cos(θ))
            // This accounts for the increased tension at steep angles
            const tensionN = (weightPerPoint * GRAVITY) / Math.cos(angleRad);

            current.static += weightPerPoint;
            current.tension += tensionN;
            current.angle = Math.max(current.angle, angleDeg); // Track worst angle

            // Validate angle safety
            if (angleDeg > 60) {
                warnings.push(`⚠️ CRITICAL: ${point.id} angle ${angleDeg.toFixed(1)}° from vertical (>60°)`);
            } else if (angleDeg > 45) {
                const tensionMultiplier = 1 / Math.cos(angleRad);
                warnings.push(`${point.id}: Steep angle ${angleDeg.toFixed(1)}° increases tension by ${tensionMultiplier.toFixed(2)}x`);
            }
        });
    });

    // Calculate final point loads with safety factors
    const results: PointLoad[] = [];
    let maxUtilization = 0;

    riggingPoints.forEach(point => {
        const load = pointLoads.get(point.id);
        if (!load) return;

        const staticLoad = load.static;
        const dynamicLoad = staticLoad * DYNAMIC_FACTOR;
        const tension = load.tension * DYNAMIC_FACTOR; // Apply dynamic factor to tension

        // Use calculated angle from geometry
        const angle = load.angle;

        // Calculate utilization if capacity is known
        let utilization = 0;
        if (point.capacity) {
            utilization = (dynamicLoad / point.capacity) * 100;
            maxUtilization = Math.max(maxUtilization, utilization);

            if (utilization > 100) {
                warnings.push(`${point.id} OVERLOADED: ${utilization.toFixed(1)}% capacity`);
            } else if (utilization > 80) {
                warnings.push(`${point.id} near capacity: ${utilization.toFixed(1)}%`);
            }
        }

        results.push({
            pointId: point.id,
            staticLoad,
            dynamicLoad,
            tension,
            utilization,
            angle
        });
    });

    // Calculate overall safety factor
    const minCapacity = Math.min(...riggingPoints
        .filter(p => p.capacity)
        .map(p => p.capacity!));

    const maxLoad = Math.max(...results.map(r => r.dynamicLoad));
    const safetyFactor = minCapacity ? minCapacity / maxLoad : 0;

    const safe = safetyFactor >= 5 && maxUtilization <= 100;

    if (safetyFactor < 5 && safetyFactor > 0) {
        warnings.push(`Overall safety factor ${safetyFactor.toFixed(2)}:1 below BGV-C1 requirement (5:1)`);
    }

    return {
        pointLoads: results,
        totalWeight,
        maxUtilization,
        safetyFactor,
        warnings,
        safe
    };
}

/**
 * Calculate beam deflection for truss under load
 * (Simplified - assumes uniform distribution)
 */
export function calculateDeflection(
    span: number,           // meters
    load: number,           // kg
    beamStiffness: number   // N⋅m² (EI - Young's modulus × moment of inertia)
): number {
    // Simple beam deflection: δ = (5 * w * L^4) / (384 * E * I)
    const force = load * GRAVITY;
    const deflection = (5 * force * Math.pow(span, 3)) / (384 * beamStiffness);

    return deflection; // meters
}
