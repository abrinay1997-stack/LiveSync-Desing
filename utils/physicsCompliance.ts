/**
 * Physics Compliance Constants & Helpers
 * 
 * Shared module for BGV-C1 rigging safety calculations.
 * All safety-critical thresholds are defined here as single-source-of-truth
 * constants to prevent magic-number drift across the codebase.
 * 
 * References:
 * - BGV-C1 (German regulation for event rigging safety)
 * - RULE-003 in .ai_rules.md
 * 
 * @module utils/physicsCompliance
 */

// ─── BGV-C1 Safety Constants ─────────────────────────────────────────────────

/**
 * BGV-C1 mandated safety factor for overhead rigging loads.
 * All dynamic loads must remain below WLL / BGV_C1_SAFETY_FACTOR.
 */
export const BGV_C1_SAFETY_FACTOR = 5;

/**
 * Standard gravitational acceleration (m/s²).
 * Used for weight-to-force conversions throughout the physics engine.
 */
export const GRAVITY = 9.80665;

/**
 * Default Working Load Limit (WLL) in kilograms for a single motor point.
 * Typical 1-ton chain hoist rating. Override per-asset when available.
 */
export const DEFAULT_WLL_KG = 1000;

/**
 * Maximum allowable dynamic load in kg, computed from the default WLL
 * and the BGV-C1 safety factor.
 * 
 * Formula: MAX_DYNAMIC_LOAD = WLL / SAFETY_FACTOR
 */
export const MAX_DYNAMIC_LOAD_KG = DEFAULT_WLL_KG / BGV_C1_SAFETY_FACTOR;

/**
 * Maximum allowable dynamic force in Newtons, derived from
 * MAX_DYNAMIC_LOAD_KG and gravitational acceleration.
 */
export const MAX_DYNAMIC_LOAD_N = MAX_DYNAMIC_LOAD_KG * GRAVITY;

// ─── Rigging Geometry Constants ──────────────────────────────────────────────

/**
 * Maximum allowable bridle angle from vertical (degrees).
 * Beyond this angle the horizontal force component becomes excessive.
 */
export const MAX_BRIDLE_ANGLE_DEG = 60;

/**
 * Minimum sling included angle (degrees) for basket hitches.
 * Below this, the sling capacity reduction factor becomes unsafe.
 */
export const MIN_SLING_ANGLE_DEG = 30;

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Compute the maximum dynamic load for a given WLL and safety factor.
 * 
 * @param wll - Working Load Limit in kg
 * @param safetyFactor - Safety factor (defaults to BGV_C1_SAFETY_FACTOR)
 * @returns Maximum allowable dynamic load in kg
 */
export function computeMaxDynamicLoad(
  wll: number,
  safetyFactor: number = BGV_C1_SAFETY_FACTOR
): number {
  if (wll <= 0) {
    throw new RangeError('WLL must be a positive number');
  }
  if (safetyFactor <= 0) {
    throw new RangeError('Safety factor must be a positive number');
  }
  return wll / safetyFactor;
}

/**
 * Check whether a given dynamic load (kg) is within the safe limit
 * for the specified WLL.
 * 
 * @param dynamicLoadKg - The actual dynamic load in kilograms
 * @param wll - Working Load Limit in kg (defaults to DEFAULT_WLL_KG)
 * @param safetyFactor - Safety factor (defaults to BGV_C1_SAFETY_FACTOR)
 * @returns true if the load is within safe limits
 */
export function isLoadSafe(
  dynamicLoadKg: number,
  wll: number = DEFAULT_WLL_KG,
  safetyFactor: number = BGV_C1_SAFETY_FACTOR
): boolean {
  const maxLoad = computeMaxDynamicLoad(wll, safetyFactor);
  return dynamicLoadKg <= maxLoad;
}

/**
 * Compute the sling capacity reduction factor for a given basket-hitch angle.
 * As the included angle decreases from 180° (vertical), the effective
 * capacity of each sling leg decreases.
 * 
 * Formula: factor = sin(angle / 2)
 * At 120° → factor ≈ 0.866 (Math.sqrt(3)/2)
 * At 90°  → factor ≈ 0.707 (Math.SQRT2/2)
 * At 60°  → factor = 0.5
 * 
 * @param includedAngleDeg - The included angle between sling legs in degrees
 * @returns Capacity reduction factor (0–1)
 */
export function slingCapacityFactor(includedAngleDeg: number): number {
  if (includedAngleDeg <= 0 || includedAngleDeg > 180) {
    throw new RangeError('Included angle must be between 0 (exclusive) and 180 (inclusive) degrees');
  }
  const halfAngleRad = (includedAngleDeg / 2) * (Math.PI / 180);
  return Math.sin(halfAngleRad);
}

/**
 * Convert weight in kilograms to force in Newtons.
 * 
 * @param kg - Mass in kilograms
 * @returns Force in Newtons
 */
export function kgToNewtons(kg: number): number {
  return kg * GRAVITY;
}

/**
 * Convert force in Newtons to weight in kilograms.
 * 
 * @param newtons - Force in Newtons
 * @returns Mass in kilograms
 */
export function newtonsToKg(newtons: number): number {
  return newtons / GRAVITY;
}
