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

export { transientStore, TransientTransform, useTransientTransform } from './transientStore';
export { spatialIndex, SpatialQueryResult } from './spatialIndex';
export { instanceManager, InstanceData, InstanceBatch } from './instanceManager';
export { lodManager, LODLevel, DEFAULT_LOD_LEVELS, getGeometryForLOD } from './lodManager';
export { performanceMonitor, PerformanceMetrics, createRenderTracker } from './performanceMonitor';

// Re-export the performance context hook
export { usePerformanceSystem, PerformanceProvider } from './usePerformanceSystem';
