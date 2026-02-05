/**
 * Box Selection Component
 *
 * Allows users to drag a selection box to select multiple objects at once.
 * Works with the 3D scene by projecting object positions to screen coordinates.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store';

interface BoxSelectionProps {
    enabled: boolean;
}

interface SelectionBox {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

export const BoxSelection: React.FC<BoxSelectionProps> = ({ enabled }) => {
    const { camera, gl } = useThree();
    const objects = useStore(state => state.objects);
    const selectedIds = useStore(state => state.selectedIds);
    const activeTool = useStore(state => state.activeTool);

    const [isDragging, setIsDragging] = useState(false);
    const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

    // Only enable box selection when select tool is active
    const isActive = enabled && activeTool === 'select';

    // Project 3D position to 2D screen coordinates
    const projectToScreen = useCallback((position: [number, number, number]): { x: number; y: number } => {
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

    // Check if a point is inside the selection box
    const isInSelectionBox = useCallback((point: { x: number; y: number }, box: SelectionBox): boolean => {
        const minX = Math.min(box.startX, box.endX);
        const maxX = Math.max(box.startX, box.endX);
        const minY = Math.min(box.startY, box.endY);
        const maxY = Math.max(box.startY, box.endY);

        return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
    }, []);

    // Get objects within selection box
    const getObjectsInBox = useCallback((box: SelectionBox): string[] => {
        const selectedObjectIds: string[] = [];

        for (const obj of objects) {
            const screenPos = projectToScreen(obj.position);
            if (isInSelectionBox(screenPos, box)) {
                selectedObjectIds.push(obj.id);
            }
        }

        return selectedObjectIds;
    }, [objects, projectToScreen, isInSelectionBox]);

    // Handle mouse down - start selection
    const handleMouseDown = useCallback((e: MouseEvent) => {
        if (!isActive) return;
        if (e.button !== 0) return; // Only left click
        if (e.target !== gl.domElement) return; // Only on canvas

        // Don't start box selection if clicking on an object (let click-to-select work)
        // We detect this by checking if shift/ctrl isn't held - regular clicks should select individual objects
        // Box selection starts only when dragging from empty space

        const rect = gl.domElement.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setStartPoint({ x, y });
        setIsDragging(false); // Will become true on mouse move
    }, [isActive, gl]);

    // Handle mouse move - update selection box
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!startPoint) return;

        const rect = gl.domElement.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Only start dragging if moved more than 5 pixels (prevents accidental box select on click)
        const distance = Math.sqrt(Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2));
        if (distance > 5) {
            setIsDragging(true);
            setSelectionBox({
                startX: startPoint.x,
                startY: startPoint.y,
                endX: x,
                endY: y
            });
        }
    }, [startPoint, gl]);

    // Handle mouse up - complete selection
    const handleMouseUp = useCallback((e: MouseEvent) => {
        if (!isDragging || !selectionBox) {
            setStartPoint(null);
            setIsDragging(false);
            setSelectionBox(null);
            return;
        }

        // Get objects in selection box
        const objectsInBox = getObjectsInBox(selectionBox);

        if (objectsInBox.length > 0) {
            // Check if shift/ctrl is held for additive selection
            const isAdditive = e.shiftKey || e.ctrlKey || e.metaKey;

            if (isAdditive) {
                // Add to existing selection
                const newSelection = [...new Set([...selectedIds, ...objectsInBox])];
                useStore.setState({ selectedIds: newSelection });
            } else {
                // Replace selection
                useStore.setState({ selectedIds: objectsInBox });
            }
        }

        // Reset state
        setStartPoint(null);
        setIsDragging(false);
        setSelectionBox(null);
    }, [isDragging, selectionBox, getObjectsInBox, selectedIds]);

    // Handle escape to cancel
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape' && isDragging) {
            setStartPoint(null);
            setIsDragging(false);
            setSelectionBox(null);
        }
    }, [isDragging]);

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

    // Don't render anything in 3D space - the selection box is rendered as HTML overlay
    return null;
};

// Separate component for the HTML overlay (rendered outside R3F)
export const BoxSelectionOverlay: React.FC = () => {
    const activeTool = useStore(state => state.activeTool);
    const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

    const isActive = activeTool === 'select';

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

            setStartPoint({ x: e.clientX, y: e.clientY });
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!startPoint) return;

            const distance = Math.sqrt(
                Math.pow(e.clientX - startPoint.x, 2) +
                Math.pow(e.clientY - startPoint.y, 2)
            );

            if (distance > 5) {
                setSelectionBox({
                    startX: startPoint.x,
                    startY: startPoint.y,
                    endX: e.clientX,
                    endY: e.clientY
                });
            }
        };

        const handleMouseUp = () => {
            setStartPoint(null);
            setSelectionBox(null);
        };

        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isActive, startPoint]);

    if (!selectionBox) return null;

    const left = Math.min(selectionBox.startX, selectionBox.endX);
    const top = Math.min(selectionBox.startY, selectionBox.endY);
    const width = Math.abs(selectionBox.endX - selectionBox.startX);
    const height = Math.abs(selectionBox.endY - selectionBox.startY);

    return (
        <div
            className="fixed pointer-events-none z-50"
            style={{
                left: `${left}px`,
                top: `${top}px`,
                width: `${width}px`,
                height: `${height}px`,
                border: '1px solid #06b6d4',
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
            }}
        />
    );
};
