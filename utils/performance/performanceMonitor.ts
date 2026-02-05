/**
 * Performance Monitor - Real-time Performance Tracking
 *
 * Tracks FPS, frame times, memory usage, and render statistics.
 * Provides alerts when performance drops below thresholds.
 */

// Frame timing data
interface FrameData {
    timestamp: number;
    deltaTime: number;
    fps: number;
}

// Performance metrics
export interface PerformanceMetrics {
    // Frame rate
    fps: number;
    avgFps: number;
    minFps: number;
    maxFps: number;

    // Frame timing
    frameTime: number;
    avgFrameTime: number;
    maxFrameTime: number;

    // Memory (if available)
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;

    // Render stats
    triangles: number;
    drawCalls: number;
    points: number;
    lines: number;

    // Custom stats
    objectCount: number;
    visibleCount: number;
    instancedCount: number;
    culledCount: number;

    // Warnings
    warnings: string[];
}

// Performance thresholds
interface PerformanceThresholds {
    minFps: number;
    maxFrameTime: number;
    maxDrawCalls: number;
    maxTriangles: number;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
    minFps: 30,
    maxFrameTime: 33.33, // 30fps target
    maxDrawCalls: 1000,
    maxTriangles: 5000000
};

// Subscription callback
type MetricsCallback = (metrics: PerformanceMetrics) => void;

class PerformanceMonitor {
    private isRunning = false;
    private frameHistory: FrameData[] = [];
    private historySize = 60; // Keep 60 frames of history
    private lastFrameTime = 0;
    private thresholds = DEFAULT_THRESHOLDS;
    private subscribers: Set<MetricsCallback> = new Set();

    // Cached metrics
    private currentMetrics: PerformanceMetrics = this.createEmptyMetrics();

    // Custom stats (set by other systems)
    private customStats = {
        objectCount: 0,
        visibleCount: 0,
        instancedCount: 0,
        culledCount: 0
    };

    // Three.js renderer reference
    private renderer: THREE.WebGLRenderer | null = null;

    /**
     * Start monitoring
     */
    start(): void {
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.frameHistory = [];

        console.log('Performance monitor started');
    }

    /**
     * Stop monitoring
     */
    stop(): void {
        this.isRunning = false;
        console.log('Performance monitor stopped');
    }

    /**
     * Set Three.js renderer for GPU stats
     */
    setRenderer(renderer: THREE.WebGLRenderer): void {
        this.renderer = renderer;
    }

    /**
     * Set performance thresholds
     */
    setThresholds(thresholds: Partial<PerformanceThresholds>): void {
        this.thresholds = { ...this.thresholds, ...thresholds };
    }

    /**
     * Update custom stats
     */
    setCustomStats(stats: Partial<typeof this.customStats>): void {
        this.customStats = { ...this.customStats, ...stats };
    }

    /**
     * Record frame (call once per frame in render loop)
     */
    recordFrame(): void {
        if (!this.isRunning) return;

        const now = performance.now();
        const deltaTime = now - this.lastFrameTime;
        this.lastFrameTime = now;

        // Avoid division by zero and skip first frame
        if (deltaTime <= 0) return;

        const fps = 1000 / deltaTime;

        this.frameHistory.push({
            timestamp: now,
            deltaTime,
            fps
        });

        // Trim history
        while (this.frameHistory.length > this.historySize) {
            this.frameHistory.shift();
        }

        // Update metrics every few frames to reduce overhead
        if (this.frameHistory.length % 5 === 0) {
            this.updateMetrics();
        }
    }

    /**
     * Get current metrics
     */
    getMetrics(): PerformanceMetrics {
        return { ...this.currentMetrics };
    }

    /**
     * Subscribe to metrics updates
     */
    subscribe(callback: MetricsCallback): () => void {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    /**
     * Get frame history for visualization
     */
    getFrameHistory(): FrameData[] {
        return [...this.frameHistory];
    }

    /**
     * Check if performance is good
     */
    isPerformanceGood(): boolean {
        return (
            this.currentMetrics.fps >= this.thresholds.minFps &&
            this.currentMetrics.warnings.length === 0
        );
    }

    /**
     * Get performance grade (A-F)
     */
    getPerformanceGrade(): string {
        const fps = this.currentMetrics.avgFps;

        if (fps >= 58) return 'A';
        if (fps >= 50) return 'B';
        if (fps >= 40) return 'C';
        if (fps >= 30) return 'D';
        return 'F';
    }

    /**
     * Create formatted performance report
     */
    getReport(): string {
        const m = this.currentMetrics;

        return `
Performance Report
==================
FPS: ${m.fps.toFixed(1)} (avg: ${m.avgFps.toFixed(1)}, min: ${m.minFps.toFixed(1)}, max: ${m.maxFps.toFixed(1)})
Frame Time: ${m.frameTime.toFixed(2)}ms (avg: ${m.avgFrameTime.toFixed(2)}ms, max: ${m.maxFrameTime.toFixed(2)}ms)
Draw Calls: ${m.drawCalls}
Triangles: ${m.triangles.toLocaleString()}
Objects: ${m.objectCount} (visible: ${m.visibleCount}, instanced: ${m.instancedCount}, culled: ${m.culledCount})
Memory: ${(m.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB / ${(m.totalJSHeapSize / 1024 / 1024).toFixed(1)}MB
Grade: ${this.getPerformanceGrade()}
${m.warnings.length > 0 ? '\nWarnings:\n' + m.warnings.map(w => '  - ' + w).join('\n') : ''}
        `.trim();
    }

    // --- Private Methods ---

    private createEmptyMetrics(): PerformanceMetrics {
        return {
            fps: 60,
            avgFps: 60,
            minFps: 60,
            maxFps: 60,
            frameTime: 16.67,
            avgFrameTime: 16.67,
            maxFrameTime: 16.67,
            usedJSHeapSize: 0,
            totalJSHeapSize: 0,
            jsHeapSizeLimit: 0,
            triangles: 0,
            drawCalls: 0,
            points: 0,
            lines: 0,
            objectCount: 0,
            visibleCount: 0,
            instancedCount: 0,
            culledCount: 0,
            warnings: []
        };
    }

    private updateMetrics(): void {
        const history = this.frameHistory;
        if (history.length === 0) return;

        // Calculate FPS stats
        const fpsValues = history.map(f => f.fps);
        const frameTimeValues = history.map(f => f.deltaTime);

        const currentFps = fpsValues[fpsValues.length - 1];
        const avgFps = fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length;
        const minFps = Math.min(...fpsValues);
        const maxFps = Math.max(...fpsValues);

        const currentFrameTime = frameTimeValues[frameTimeValues.length - 1];
        const avgFrameTime = frameTimeValues.reduce((a, b) => a + b, 0) / frameTimeValues.length;
        const maxFrameTime = Math.max(...frameTimeValues);

        // Get memory stats (if available)
        let memoryStats = { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 };
        if ((performance as any).memory) {
            const memory = (performance as any).memory;
            memoryStats = {
                usedJSHeapSize: memory.usedJSHeapSize,
                totalJSHeapSize: memory.totalJSHeapSize,
                jsHeapSizeLimit: memory.jsHeapSizeLimit
            };
        }

        // Get render stats
        let renderStats = { triangles: 0, drawCalls: 0, points: 0, lines: 0 };
        if (this.renderer) {
            const info = this.renderer.info;
            renderStats = {
                triangles: info.render.triangles,
                drawCalls: info.render.calls,
                points: info.render.points,
                lines: info.render.lines
            };
        }

        // Check for warnings
        const warnings: string[] = [];

        if (avgFps < this.thresholds.minFps) {
            warnings.push(`Low FPS: ${avgFps.toFixed(1)} (target: ${this.thresholds.minFps})`);
        }

        if (maxFrameTime > this.thresholds.maxFrameTime) {
            warnings.push(`Frame spike: ${maxFrameTime.toFixed(1)}ms (limit: ${this.thresholds.maxFrameTime}ms)`);
        }

        if (renderStats.drawCalls > this.thresholds.maxDrawCalls) {
            warnings.push(`High draw calls: ${renderStats.drawCalls} (limit: ${this.thresholds.maxDrawCalls})`);
        }

        if (renderStats.triangles > this.thresholds.maxTriangles) {
            warnings.push(`High triangle count: ${renderStats.triangles.toLocaleString()} (limit: ${this.thresholds.maxTriangles.toLocaleString()})`);
        }

        // Update current metrics
        this.currentMetrics = {
            fps: currentFps,
            avgFps,
            minFps,
            maxFps,
            frameTime: currentFrameTime,
            avgFrameTime,
            maxFrameTime,
            ...memoryStats,
            ...renderStats,
            ...this.customStats,
            warnings
        };

        // Notify subscribers
        for (const callback of this.subscribers) {
            callback(this.currentMetrics);
        }
    }
}

// Type import for THREE (avoiding circular deps)
import * as THREE from 'three';

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook for React components to track re-renders
 */
export function createRenderTracker(componentName: string) {
    let renderCount = 0;
    const renderTimes: number[] = [];

    return {
        track: () => {
            renderCount++;
            renderTimes.push(performance.now());

            // Keep only last 100
            if (renderTimes.length > 100) {
                renderTimes.shift();
            }
        },
        getStats: () => ({
            name: componentName,
            renderCount,
            avgTimeBetweenRenders: renderTimes.length > 1
                ? (renderTimes[renderTimes.length - 1] - renderTimes[0]) / (renderTimes.length - 1)
                : 0
        }),
        reset: () => {
            renderCount = 0;
            renderTimes.length = 0;
        }
    };
}
