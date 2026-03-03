/**
 * Performance Module - High-Performance Rendering System
 *
 * This module provides tools for achieving 60 FPS with 10,000+ objects:
 *
 * - TransientStore: Decouples React from Three.js updates
 * - SpatialIndex: BVH for O(log n) spatial queries
 * - InstanceManager: Smart instanced rendering
 * - LODManager: Distance-based level of detail
 * - PerformanceMonitor: Real-time performance tracking
 */

export { transientStore, useTransientTransform } from './transientStore';
export type { TransientTransform } from './transientStore';
export { spatialIndex } from './spatialIndex';
export type { SpatialQueryResult } from './spatialIndex';
export { instanceManager } from './instanceManager';
export type { InstanceData, InstanceBatch } from './instanceManager';
export { lodManager, DEFAULT_LOD_LEVELS, getGeometryForLOD } from './lodManager';
export type { LODLevel } from './lodManager';
export { performanceMonitor, createRenderTracker } from './performanceMonitor';
export type { PerformanceMetrics } from './performanceMonitor';

// Re-export the performance context hook
export { usePerformanceSystem, PerformanceProvider } from './usePerformanceSystem';
