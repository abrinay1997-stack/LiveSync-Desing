/**
 * PerformanceOverlay - Real-time Performance Display
 *
 * Shows FPS, frame time, and render statistics.
 * Can be toggled on/off for debugging.
 */

import React, { useState, useEffect } from 'react';
import { performanceMonitor, PerformanceMetrics } from '../../utils/performance';

interface PerformanceOverlayProps {
    visible?: boolean;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    compact?: boolean;
}

export const PerformanceOverlay: React.FC<PerformanceOverlayProps> = ({
    visible = true,
    position = 'top-left',
    compact = false
}) => {
    const [metrics, setMetrics] = useState<PerformanceMetrics>(performanceMonitor.getMetrics());

    useEffect(() => {
        const unsubscribe = performanceMonitor.subscribe(setMetrics);
        return unsubscribe;
    }, []);

    if (!visible) return null;

    const positionStyles: Record<string, React.CSSProperties> = {
        'top-left': { top: 8, left: 8 },
        'top-right': { top: 8, right: 8 },
        'bottom-left': { bottom: 8, left: 8 },
        'bottom-right': { bottom: 8, right: 8 }
    };

    const getFPSColor = (fps: number): string => {
        if (fps >= 55) return '#22c55e'; // Green
        if (fps >= 40) return '#eab308'; // Yellow
        if (fps >= 25) return '#f97316'; // Orange
        return '#ef4444'; // Red
    };

    const getGradeColor = (grade: string): string => {
        const colors: Record<string, string> = {
            'A': '#22c55e',
            'B': '#84cc16',
            'C': '#eab308',
            'D': '#f97316',
            'F': '#ef4444'
        };
        return colors[grade] || '#888';
    };

    const grade = performanceMonitor.getPerformanceGrade();

    if (compact) {
        return (
            <div
                style={{
                    position: 'absolute',
                    ...positionStyles[position],
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontFamily: 'monospace',
                    fontSize: 11,
                    zIndex: 1000,
                    userSelect: 'none',
                    pointerEvents: 'none'
                }}
            >
                <span style={{ color: getFPSColor(metrics.fps) }}>
                    {metrics.fps.toFixed(0)} FPS
                </span>
                {' | '}
                <span style={{ color: getGradeColor(grade) }}>{grade}</span>
            </div>
        );
    }

    return (
        <div
            style={{
                position: 'absolute',
                ...positionStyles[position],
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                color: 'white',
                padding: 12,
                borderRadius: 6,
                fontFamily: 'monospace',
                fontSize: 11,
                zIndex: 1000,
                userSelect: 'none',
                minWidth: 200,
                border: '1px solid #333'
            }}
        >
            <div style={{ marginBottom: 8, borderBottom: '1px solid #444', paddingBottom: 8 }}>
                <span style={{ fontWeight: 'bold', fontSize: 12 }}>Performance</span>
                <span
                    style={{
                        float: 'right',
                        fontWeight: 'bold',
                        color: getGradeColor(grade),
                        fontSize: 14
                    }}
                >
                    {grade}
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px 12px' }}>
                <span style={{ color: '#888' }}>FPS:</span>
                <span style={{ color: getFPSColor(metrics.fps), textAlign: 'right' }}>
                    {metrics.fps.toFixed(1)}
                </span>

                <span style={{ color: '#888' }}>Avg FPS:</span>
                <span style={{ textAlign: 'right' }}>{metrics.avgFps.toFixed(1)}</span>

                <span style={{ color: '#888' }}>Frame Time:</span>
                <span style={{ textAlign: 'right' }}>{metrics.frameTime.toFixed(2)}ms</span>

                <span style={{ color: '#888' }}>Draw Calls:</span>
                <span style={{ textAlign: 'right' }}>{metrics.drawCalls}</span>

                <span style={{ color: '#888' }}>Triangles:</span>
                <span style={{ textAlign: 'right' }}>{metrics.triangles.toLocaleString()}</span>

                <span style={{ color: '#888' }}>Objects:</span>
                <span style={{ textAlign: 'right' }}>
                    {metrics.visibleCount}/{metrics.objectCount}
                </span>

                <span style={{ color: '#888' }}>Instanced:</span>
                <span style={{ textAlign: 'right' }}>{metrics.instancedCount}</span>

                <span style={{ color: '#888' }}>Culled:</span>
                <span style={{ textAlign: 'right' }}>{metrics.culledCount}</span>

                {metrics.usedJSHeapSize > 0 && (
                    <>
                        <span style={{ color: '#888' }}>Memory:</span>
                        <span style={{ textAlign: 'right' }}>
                            {(metrics.usedJSHeapSize / 1024 / 1024).toFixed(0)}MB
                        </span>
                    </>
                )}
            </div>

            {metrics.warnings.length > 0 && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #444' }}>
                    <div style={{ color: '#f97316', fontSize: 10, marginBottom: 4 }}>
                        Warnings:
                    </div>
                    {metrics.warnings.map((warning, i) => (
                        <div key={i} style={{ color: '#fbbf24', fontSize: 9 }}>
                            • {warning}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PerformanceOverlay;
