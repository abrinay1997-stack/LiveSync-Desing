/**
 * Keyboard Shortcuts Hook
 *
 * Handles keyboard shortcuts for construction and editing tools.
 */

import { useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { ASSETS } from '../data/library';
import {
    extendTruss,
    duplicateTrussInDirection,
    fillGapBetweenTrusses,
    quickRotate
} from '../utils/construction/quickTools';

interface ShortcutConfig {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    action: () => void;
    description: string;
}

export function useKeyboardShortcuts() {
    const objects = useStore(state => state.objects);
    const selectedIds = useStore(state => state.selectedIds);
    const activeTool = useStore(state => state.activeTool);
    const setTool = useStore(state => state.setTool);
    const selectObject = useStore(state => state.selectObject);
    const clearSelection = useStore(state => state.clearSelection);
    const removeObject = useStore(state => state.removeObject);
    const updateObjectFinal = useStore(state => state.updateObjectFinal);
    const undo = useStore(state => state.undo);
    const redo = useStore(state => state.redo);
    const transformAxisConstraint = useStore(state => state.transformAxisConstraint);
    const setTransformAxisConstraint = useStore(state => state.setTransformAxisConstraint);
    const createGroup = useStore(state => state.createGroup);
    const dissolveGroup = useStore(state => state.dissolveGroup);
    const groups = useStore(state => state.groups);
    const getGroupForObject = useStore(state => state.getGroupForObject);

    // Get selected objects
    const selectedObjects = objects.filter(o => selectedIds.includes(o.id));
    const selectedTruss = selectedObjects.find(o => o.type === 'truss');

    // Extend truss forward
    const handleExtend = useCallback(() => {
        if (!selectedTruss) return;

        const result = extendTruss(selectedTruss, objects);
        if (result.success && result.newObject) {
            const store = useStore.getState();
            store.pushHistory();

            const existingCount = objects.filter(o => o.model === result.newObject!.model).length;
            const asset = ASSETS[result.newObject.model!];

            const newObj = {
                id: crypto.randomUUID(),
                name: `${asset?.name || 'Truss'} ${existingCount + 1}`,
                model: result.newObject.model!,
                type: result.newObject.type!,
                position: result.newObject.position!,
                rotation: result.newObject.rotation!,
                scale: [1, 1, 1] as [number, number, number],
                layerId: result.newObject.layerId!,
                color: result.newObject.color!,
                dimensions: result.newObject.dimensions,
                locked: false
            };

            useStore.setState(state => ({
                objects: [...state.objects, newObj],
                selectedIds: [newObj.id]
            }));
        }
    }, [selectedTruss, objects]);

    // Duplicate truss
    const handleDuplicate = useCallback((direction: 'forward' | 'backward' = 'forward') => {
        if (!selectedTruss) return;

        const result = duplicateTrussInDirection(selectedTruss, direction);
        if (result.success && result.newObject) {
            const store = useStore.getState();
            store.pushHistory();

            const existingCount = objects.filter(o => o.model === result.newObject!.model).length;
            const asset = ASSETS[result.newObject.model!];

            const newObj = {
                id: crypto.randomUUID(),
                name: `${asset?.name || 'Truss'} ${existingCount + 1}`,
                model: result.newObject.model!,
                type: result.newObject.type!,
                position: result.newObject.position!,
                rotation: result.newObject.rotation!,
                scale: [1, 1, 1] as [number, number, number],
                layerId: result.newObject.layerId!,
                color: result.newObject.color!,
                dimensions: result.newObject.dimensions,
                locked: false
            };

            useStore.setState(state => ({
                objects: [...state.objects, newObj],
                selectedIds: [newObj.id]
            }));
        }
    }, [selectedTruss, objects]);

    // Fill gap between two trusses
    const handleFillGap = useCallback(() => {
        if (selectedObjects.length !== 2) return;

        const [truss1, truss2] = selectedObjects;
        if (truss1.type !== 'truss' || truss2.type !== 'truss') return;

        const result = fillGapBetweenTrusses(truss1, truss2);
        if (result.success && result.pieces.length > 0) {
            const store = useStore.getState();
            store.pushHistory();

            const newObjects = result.pieces.map((piece, i) => {
                const asset = ASSETS[piece.model];
                const existingCount = objects.filter(o => o.model === piece.model).length;

                return {
                    id: crypto.randomUUID(),
                    name: `${asset?.name || 'Truss'} ${existingCount + i + 1}`,
                    model: piece.model,
                    type: 'truss' as const,
                    position: piece.position,
                    rotation: piece.rotation,
                    scale: [1, 1, 1] as [number, number, number],
                    layerId: 'rigging',
                    color: asset?.color || '#d4d4d8',
                    dimensions: asset?.dimensions ? { ...asset.dimensions } : { w: 1, h: 0.29, d: 0.29 },
                    locked: false
                };
            });

            useStore.setState(state => ({
                objects: [...state.objects, ...newObjects],
                selectedIds: newObjects.map(o => o.id)
            }));
        }
    }, [selectedObjects, objects]);

    // Quick rotate
    const handleQuickRotate = useCallback((degrees: number) => {
        if (selectedIds.length === 0) return;

        for (const id of selectedIds) {
            const obj = objects.find(o => o.id === id);
            if (obj) {
                const newRotation = quickRotate(obj, 'y', degrees);
                updateObjectFinal(id, { rotation: newRotation });
            }
        }
    }, [selectedIds, objects, updateObjectFinal]);

    // Delete selected
    const handleDelete = useCallback(() => {
        if (selectedIds.length === 0) return;

        const store = useStore.getState();
        store.pushHistory();

        for (const id of selectedIds) {
            removeObject(id);
        }
    }, [selectedIds, removeObject]);

    // Main keyboard handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            const key = e.key.toLowerCase();
            const ctrl = e.ctrlKey || e.metaKey;
            const shift = e.shiftKey;

            // --- GLOBAL SHORTCUTS ---

            // Undo: Ctrl+Z
            if (ctrl && key === 'z' && !shift) {
                e.preventDefault();
                undo();
                return;
            }

            // Redo: Ctrl+Shift+Z or Ctrl+Y
            if ((ctrl && shift && key === 'z') || (ctrl && key === 'y')) {
                e.preventDefault();
                redo();
                return;
            }

            // Ctrl+D: Deselect all
            if (ctrl && key === 'd') {
                e.preventDefault();
                clearSelection();
                return;
            }

            // Ctrl+A: Select all objects
            if (ctrl && key === 'a') {
                e.preventDefault();
                const allIds = useStore.getState().objects.map(o => o.id);
                useStore.setState({ selectedIds: allIds });
                return;
            }

            // Ctrl+G: Group selected objects
            if (ctrl && key === 'g' && !shift) {
                e.preventDefault();
                if (selectedIds.length >= 2) {
                    createGroup(selectedIds);
                }
                return;
            }

            // Ctrl+Shift+G: Ungroup / Dissolve group
            if (ctrl && shift && key === 'g') {
                e.preventDefault();
                // Find groups that contain any of the selected objects
                const state = useStore.getState();
                const affectedGroups = new Set<string>();
                for (const id of selectedIds) {
                    const group = state.groups.find(g => g.objectIds.includes(id));
                    if (group) {
                        affectedGroups.add(group.id);
                    }
                }
                // Dissolve all affected groups
                for (const groupId of affectedGroups) {
                    dissolveGroup(groupId);
                }
                return;
            }

            // Escape: Clear selection / Cancel
            if (key === 'escape') {
                e.preventDefault();
                clearSelection();
                useStore.setState({ activePlacementAsset: null });
                setTool('select');
                return;
            }

            // Delete/Backspace: Delete selected
            if (key === 'delete' || key === 'backspace') {
                e.preventDefault();
                handleDelete();
                return;
            }

            // --- TOOL SHORTCUTS ---

            // V: Select tool
            if (key === 'v' && !ctrl) {
                e.preventDefault();
                setTool('select');
                return;
            }

            // M: Move tool
            if (key === 'm' && !ctrl) {
                e.preventDefault();
                setTool('move');
                return;
            }

            // R: Rotate tool
            if (key === 'r' && !ctrl) {
                e.preventDefault();
                setTool('rotate');
                return;
            }

            // T: Tape measure
            if (key === 't' && !ctrl) {
                e.preventDefault();
                setTool('tape');
                return;
            }

            // X: Axis constraint or Eraser (X for axis only when move/rotate tool is active and has selection)
            if (key === 'x' && !ctrl) {
                // If move or rotate tool is active with selection, use as axis constraint
                if ((activeTool === 'move' || activeTool === 'rotate') && selectedIds.length > 0) {
                    e.preventDefault();
                    setTransformAxisConstraint(transformAxisConstraint === 'x' ? null : 'x');
                    return;
                }
                // Otherwise, switch to eraser
                e.preventDefault();
                setTool('eraser');
                return;
            }

            // Y: Y-axis constraint (only when move/rotate tool is active)
            if (key === 'y' && !ctrl && (activeTool === 'move' || activeTool === 'rotate') && selectedIds.length > 0) {
                e.preventDefault();
                setTransformAxisConstraint(transformAxisConstraint === 'y' ? null : 'y');
                return;
            }

            // Z: Z-axis constraint (only when move/rotate tool is active)
            if (key === 'z' && !ctrl && (activeTool === 'move' || activeTool === 'rotate') && selectedIds.length > 0) {
                e.preventDefault();
                setTransformAxisConstraint(transformAxisConstraint === 'z' ? null : 'z');
                return;
            }

            // C: Cable tool
            if (key === 'c' && !ctrl) {
                e.preventDefault();
                setTool('cable');
                return;
            }

            // B: Box select tool
            if (key === 'b' && !ctrl) {
                e.preventDefault();
                setTool('box-select');
                return;
            }

            // L: Lasso select tool
            if (key === 'l' && !ctrl) {
                e.preventDefault();
                setTool('lasso-select');
                return;
            }

            // F: Frame selected (focus camera on selected objects)
            if (key === 'f' && !ctrl && selectedIds.length > 0) {
                e.preventDefault();
                // Calculate center of selected objects
                const selectedObjs = objects.filter(o => selectedIds.includes(o.id));
                if (selectedObjs.length > 0) {
                    const center = selectedObjs.reduce(
                        (acc, obj) => ({
                            x: acc.x + obj.position[0] / selectedObjs.length,
                            y: acc.y + obj.position[1] / selectedObjs.length,
                            z: acc.z + obj.position[2] / selectedObjs.length
                        }),
                        { x: 0, y: 0, z: 0 }
                    );
                    useStore.getState().setCameraTarget([center.x, center.y, center.z]);
                }
                return;
            }

            // --- CONSTRUCTION SHORTCUTS ---

            // E: Extend truss
            if (key === 'e' && !ctrl && selectedTruss) {
                e.preventDefault();
                handleExtend();
                return;
            }

            // D: Duplicate truss forward
            if (key === 'd' && !ctrl && selectedTruss) {
                e.preventDefault();
                if (shift) {
                    // Shift+D: Duplicate 3 times
                    for (let i = 0; i < 3; i++) {
                        setTimeout(() => handleDuplicate('forward'), i * 50);
                    }
                } else {
                    handleDuplicate('forward');
                }
                return;
            }

            // F: Fill gap (when 2 trusses selected)
            if (key === 'f' && !ctrl && selectedObjects.length === 2) {
                e.preventDefault();
                handleFillGap();
                return;
            }

            // Q: Rotate -15°
            if (key === 'q' && !ctrl && selectedIds.length > 0) {
                e.preventDefault();
                handleQuickRotate(-15);
                return;
            }

            // W: Rotate +15°  (using W instead of E since E is extend)
            if (key === 'w' && !ctrl && selectedIds.length > 0 && !selectedTruss) {
                e.preventDefault();
                handleQuickRotate(15);
                return;
            }

            // If we have a truss selected, Shift+Q/Shift+E for rotation
            if (shift && key === 'q' && selectedIds.length > 0) {
                e.preventDefault();
                handleQuickRotate(-15);
                return;
            }

            if (shift && key === 'e' && selectedIds.length > 0) {
                e.preventDefault();
                handleQuickRotate(15);
                return;
            }

            // --- SELECT BY TYPE SHORTCUTS ---
            // Shift+1: Select all trusses
            if (shift && key === '1') {
                e.preventDefault();
                const trussIds = objects.filter(o => o.type === 'truss').map(o => o.id);
                useStore.setState({ selectedIds: trussIds });
                return;
            }

            // Shift+2: Select all speakers
            if (shift && key === '2') {
                e.preventDefault();
                const speakerIds = objects.filter(o => o.type === 'speaker').map(o => o.id);
                useStore.setState({ selectedIds: speakerIds });
                return;
            }

            // Shift+3: Select all motors
            if (shift && key === '3') {
                e.preventDefault();
                const motorIds = objects.filter(o => o.type === 'motor').map(o => o.id);
                useStore.setState({ selectedIds: motorIds });
                return;
            }

            // Shift+4: Select all stage elements
            if (shift && key === '4') {
                e.preventDefault();
                const stageIds = objects.filter(o => o.type === 'stage').map(o => o.id);
                useStore.setState({ selectedIds: stageIds });
                return;
            }

            // Shift+5: Select all audience areas
            if (shift && key === '5') {
                e.preventDefault();
                const audienceIds = objects.filter(o => o.type === 'audience').map(o => o.id);
                useStore.setState({ selectedIds: audienceIds });
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        selectedIds,
        selectedTruss,
        selectedObjects,
        objects,
        activeTool,
        handleExtend,
        handleDuplicate,
        handleFillGap,
        handleQuickRotate,
        handleDelete,
        undo,
        redo,
        clearSelection,
        setTool,
        transformAxisConstraint,
        setTransformAxisConstraint,
        createGroup,
        dissolveGroup,
        groups
    ]);
}

// Export shortcuts list for help display
export const KEYBOARD_SHORTCUTS = [
    { key: 'V', description: 'Click Select tool' },
    { key: 'B', description: 'Box Select tool' },
    { key: 'L', description: 'Lasso Select tool' },
    { key: 'M', description: 'Move tool' },
    { key: 'R', description: 'Rotate tool' },
    { key: 'T', description: 'Tape measure' },
    { key: 'X', description: 'Eraser tool / X-axis constraint' },
    { key: 'Y', description: 'Y-axis constraint (when transforming)' },
    { key: 'Z', description: 'Z-axis constraint (when transforming)' },
    { key: 'C', description: 'Cable tool' },
    { key: 'F', description: 'Frame selected (focus camera)' },
    { key: 'E', description: 'Extend truss (with truss selected)' },
    { key: 'D', description: 'Duplicate truss forward' },
    { key: 'Shift+D', description: 'Duplicate truss 3×' },
    { key: 'Q', description: 'Rotate -15°' },
    { key: 'Shift+E', description: 'Rotate +15°' },
    { key: 'Delete', description: 'Delete selected' },
    { key: 'Escape', description: 'Clear selection / Cancel' },
    { key: 'Ctrl+A', description: 'Select all objects' },
    { key: 'Ctrl+D', description: 'Deselect all' },
    { key: 'Ctrl+G', description: 'Group selected objects' },
    { key: 'Ctrl+Shift+G', description: 'Ungroup selected objects' },
    { key: 'Ctrl+Z', description: 'Undo' },
    { key: 'Ctrl+Shift+Z', description: 'Redo' },
    { key: 'Shift+1', description: 'Select all trusses' },
    { key: 'Shift+2', description: 'Select all speakers' },
    { key: 'Shift+3', description: 'Select all motors' },
    { key: 'Shift+4', description: 'Select all stage elements' },
    { key: 'Shift+5', description: 'Select all audience areas' }
];
