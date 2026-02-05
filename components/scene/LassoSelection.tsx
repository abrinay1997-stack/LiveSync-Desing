/**
 * Lasso Selection Component
 *
 * Allows users to draw a freeform polygon to select multiple objects.
 * Works with the 3D scene by projecting object positions to screen coordinates.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store';

interface LassoSelectionProps {
    enabled: boolean;
}

interface Point {
    x: number;
    y: number;
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
function isPointInPolygon(point: Point, polygon: Point[]): boolean {
    if (polygon.length < 3) return false;

    let inside = false;
    const { x, y } = point;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x;
        const yi = polygon[i].y;
        const xj = polygon[j].x;
        const yj = polygon[j].y;

        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }

    return inside;
}

export const LassoSelection: React.FC<LassoSelectionProps> = ({ enabled }) => {
    const { camera, gl } = useThree();
    const objects = useStore(state => state.objects);
    const selectedIds = useStore(state => state.selectedIds);
    const activeTool = useStore(state => state.activeTool);

    const [isDrawing, setIsDrawing] = useState(false);
    const [lassoPoints, setLassoPoints] = useState<Point[]>([]);
    const lastPointRef = useRef<Point | null>(null);

    // Only enable lasso selection when lasso-select tool is active
    const isActive = enabled && activeTool === 'lasso-select';

    // Project 3D position to 2D screen coordinates
    const projectToScreen = useCallback((position: [number, number, number]): Point => {
        const vector = new THREE.Vector3(...position);
        vector.project(camera);

        const canvas = gl.domElement;
        const widthHalf = canvas.clientWidth / 2;
        const heightHalf = canvas.clientHeight / 2;

        return {
            x: (vector.x * widthHalf) + widthHalf,
            y: -(vector.y * heightHalf) + heightHalf
        };
    }, [camera, gl]);

    // Get objects within lasso polygon
    const getObjectsInLasso = useCallback((polygon: Point[]): string[] => {
        if (polygon.length < 3) return [];

        const selectedObjectIds: string[] = [];

        for (const obj of objects) {
            const screenPos = projectToScreen(obj.position);
            if (isPointInPolygon(screenPos, polygon)) {
                selectedObjectIds.push(obj.id);
            }
        }

        return selectedObjectIds;
    }, [objects, projectToScreen]);

    // Handle mouse down - start lasso
    const handleMouseDown = useCallback((e: MouseEvent) => {
        if (!isActive) return;
        if (e.button !== 0) return; // Only left click
        if (e.target !== gl.domElement) return; // Only on canvas

        const rect = gl.domElement.getBoundingClientRect();
        const point = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        setIsDrawing(true);
        setLassoPoints([point]);
        lastPointRef.current = point;
    }, [isActive, gl]);

    // Handle mouse move - add points to lasso
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDrawing) return;

        const rect = gl.domElement.getBoundingClientRect();
        const point = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        // Only add point if moved enough (reduces points for smoother path)
        if (lastPointRef.current) {
            const distance = Math.sqrt(
                Math.pow(point.x - lastPointRef.current.x, 2) +
                Math.pow(point.y - lastPointRef.current.y, 2)
            );

            if (distance > 5) {
                setLassoPoints(prev => [...prev, point]);
                lastPointRef.current = point;
            }
        }
    }, [isDrawing, gl]);

    // Handle mouse up - complete selection
    const handleMouseUp = useCallback((e: MouseEvent) => {
        if (!isDrawing || lassoPoints.length < 3) {
            setIsDrawing(false);
            setLassoPoints([]);
            return;
        }

        // Get objects in lasso
        const objectsInLasso = getObjectsInLasso(lassoPoints);

        if (objectsInLasso.length > 0) {
            // Check if shift/ctrl is held for additive selection
            const isAdditive = e.shiftKey || e.ctrlKey || e.metaKey;

            if (isAdditive) {
                // Add to existing selection
                const newSelection = [...new Set([...selectedIds, ...objectsInLasso])];
                useStore.setState({ selectedIds: newSelection });
            } else {
                // Replace selection
                useStore.setState({ selectedIds: objectsInLasso });
            }
        }

        // Reset state
        setIsDrawing(false);
        setLassoPoints([]);
    }, [isDrawing, lassoPoints, getObjectsInLasso, selectedIds]);

    // Handle escape to cancel
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape' && isDrawing) {
            setIsDrawing(false);
            setLassoPoints([]);
        }
    }, [isDrawing]);

    // Add event listeners
    useEffect(() => {
        if (!isActive) return;

        const canvas = gl.domElement;
        canvas.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isActive, handleMouseDown, handleMouseMove, handleMouseUp, handleKeyDown, gl]);

    // Don't render anything in 3D space - the lasso is rendered as HTML overlay
    return null;
};

// Separate component for the HTML overlay (rendered outside R3F)
export const LassoSelectionOverlay: React.FC = () => {
    const activeTool = useStore(state => state.activeTool);
    const [lassoPoints, setLassoPoints] = useState<Point[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const lastPointRef = useRef<Point | null>(null);

    const isActive = activeTool === 'lasso-select';

    // Set cursor style when lasso-select tool is active
    useEffect(() => {
        if (isActive) {
            document.body.style.cursor = 'crosshair';
        }
        return () => {
            document.body.style.cursor = 'auto';
        };
    }, [isActive]);

    // Handle mouse events for the overlay
    useEffect(() => {
        if (!isActive) return;

        const handleMouseDown = (e: MouseEvent) => {
            // Only start on canvas (check by excluding UI elements)
            const target = e.target as HTMLElement;
            if (target.closest('.ui-panel') || target.closest('button') || target.closest('input')) {
                return;
            }

            if (e.button !== 0) return;

            const point = { x: e.clientX, y: e.clientY };
            setIsDrawing(true);
            setLassoPoints([point]);
            lastPointRef.current = point;
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDrawing) return;

            const point = { x: e.clientX, y: e.clientY };

            if (lastPointRef.current) {
                const distance = Math.sqrt(
                    Math.pow(point.x - lastPointRef.current.x, 2) +
                    Math.pow(point.y - lastPointRef.current.y, 2)
                );

                if (distance > 5) {
                    setLassoPoints(prev => [...prev, point]);
                    lastPointRef.current = point;
                }
            }
        };

        const handleMouseUp = () => {
            setIsDrawing(false);
            setLassoPoints([]);
        };

        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isActive, isDrawing]);

    if (!isDrawing || lassoPoints.length < 2) return null;

    // Create SVG path from points
    const pathData = lassoPoints.reduce((acc, point, i) => {
        if (i === 0) return `M ${point.x} ${point.y}`;
        return `${acc} L ${point.x} ${point.y}`;
    }, '');

    // Close the path if we have enough points
    const closedPath = lassoPoints.length > 2 ? `${pathData} Z` : pathData;

    return (
        <svg
            className="fixed inset-0 pointer-events-none z-50"
            style={{ width: '100vw', height: '100vh' }}
        >
            {/* Filled polygon */}
            <path
                d={closedPath}
                fill="rgba(6, 182, 212, 0.1)"
                stroke="#06b6d4"
                strokeWidth="2"
                strokeDasharray="5,5"
            />
            {/* Draw points for visual feedback */}
            {lassoPoints.map((point, i) => (
                <circle
                    key={i}
                    cx={point.x}
                    cy={point.y}
                    r="2"
                    fill="#06b6d4"
                />
            ))}
        </svg>
    );
};
