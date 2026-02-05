import React, { useMemo } from 'react';
import * as THREE from 'three';
import { SceneObject } from '../../types';
import { Section } from './Section';
import { ASSETS } from '../../data/library';
import { snapToGround } from '../../utils/construction';
import {
    ArrowDownToLine,
    AlignVerticalJustifyCenter,
    AlignHorizontalJustifyCenter,
    Trash2,
    Copy,
    MoveVertical,
    MoveHorizontal,
    RotateCw
} from 'lucide-react';

interface MultiSelectionInspectorProps {
    selection: SceneObject[];
    onUpdateTransform: (ids: string[], transformer: (obj: SceneObject) => Partial<SceneObject>) => void;
    onRemove: (ids: string[]) => void;
}

export const MultiSelectionInspector: React.FC<MultiSelectionInspectorProps> = ({
    selection,
    onUpdateTransform,
    onRemove
}) => {
    const ids = useMemo(() => selection.map(o => o.id), [selection]);

    // Calculate stats
    const stats = useMemo(() => {
        let totalWeight = 0;
        const types = new Set<string>();
        let minY = Infinity;
        let maxY = -Infinity;
        let minX = Infinity;
        let maxX = -Infinity;
        let minZ = Infinity;
        let maxZ = -Infinity;

        selection.forEach(obj => {
            const asset = ASSETS[obj.model];
            if (asset?.weight) totalWeight += asset.weight;
            types.add(obj.type);

            minY = Math.min(minY, obj.position[1]);
            maxY = Math.max(maxY, obj.position[1]);
            minX = Math.min(minX, obj.position[0]);
            maxX = Math.max(maxX, obj.position[0]);
            minZ = Math.min(minZ, obj.position[2]);
            maxZ = Math.max(maxZ, obj.position[2]);
        });

        return {
            totalWeight,
            types: Array.from(types),
            bounds: { minX, maxX, minY, maxY, minZ, maxZ },
            center: {
                x: (minX + maxX) / 2,
                y: (minY + maxY) / 2,
                z: (minZ + maxZ) / 2
            }
        };
    }, [selection]);

    // Snap all objects to ground
    const handleSnapAllToGround = () => {
        onUpdateTransform(ids, (obj) => {
            const dims = obj.dimensions || { w: 1, h: 1, d: 1 };
            const pos = new THREE.Vector3(...obj.position);
            const rot = new THREE.Euler(...obj.rotation);
            const newPos = snapToGround(pos, dims, rot);
            return { position: [newPos.x, newPos.y, newPos.z] as [number, number, number] };
        });
    };

    // Align all objects to the same Y position (average or min)
    const handleAlignY = (mode: 'min' | 'max' | 'average') => {
        let targetY: number;
        if (mode === 'min') targetY = stats.bounds.minY;
        else if (mode === 'max') targetY = stats.bounds.maxY;
        else targetY = stats.center.y;

        onUpdateTransform(ids, (obj) => ({
            position: [obj.position[0], targetY, obj.position[2]] as [number, number, number]
        }));
    };

    // Align X positions
    const handleAlignX = (mode: 'min' | 'max' | 'average') => {
        let targetX: number;
        if (mode === 'min') targetX = stats.bounds.minX;
        else if (mode === 'max') targetX = stats.bounds.maxX;
        else targetX = stats.center.x;

        onUpdateTransform(ids, (obj) => ({
            position: [targetX, obj.position[1], obj.position[2]] as [number, number, number]
        }));
    };

    // Align Z positions
    const handleAlignZ = (mode: 'min' | 'max' | 'average') => {
        let targetZ: number;
        if (mode === 'min') targetZ = stats.bounds.minZ;
        else if (mode === 'max') targetZ = stats.bounds.maxZ;
        else targetZ = stats.center.z;

        onUpdateTransform(ids, (obj) => ({
            position: [obj.position[0], obj.position[1], targetZ] as [number, number, number]
        }));
    };

    // Distribute evenly along an axis
    const handleDistribute = (axis: 'x' | 'y' | 'z') => {
        const sorted = [...selection].sort((a, b) => {
            const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
            return a.position[idx] - b.position[idx];
        });

        if (sorted.length < 3) return;

        const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
        const first = sorted[0].position[idx];
        const last = sorted[sorted.length - 1].position[idx];
        const step = (last - first) / (sorted.length - 1);

        const positionMap = new Map<string, number>();
        sorted.forEach((obj, i) => {
            positionMap.set(obj.id, first + step * i);
        });

        onUpdateTransform(ids, (obj) => {
            const newVal = positionMap.get(obj.id);
            if (newVal === undefined) return {};
            const newPos = [...obj.position] as [number, number, number];
            newPos[idx] = newVal;
            return { position: newPos };
        });
    };

    // Rotate all objects by a fixed amount
    const handleRotateAll = (axis: 'x' | 'y' | 'z', degrees: number) => {
        const radians = degrees * Math.PI / 180;
        const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;

        onUpdateTransform(ids, (obj) => {
            const newRot = [...obj.rotation] as [number, number, number];
            newRot[idx] += radians;
            return { rotation: newRot };
        });
    };

    // Move all objects by a delta
    const handleMoveAll = (axis: 'x' | 'y' | 'z', delta: number) => {
        const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;

        onUpdateTransform(ids, (obj) => {
            const newPos = [...obj.position] as [number, number, number];
            newPos[idx] += delta;
            return { position: newPos };
        });
    };

    return (
        <div className="space-y-4">
            {/* Selection Summary */}
            <Section title="Selection Summary">
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-black/30 p-2 rounded border border-white/5">
                        <span className="text-gray-500 block text-[10px]">Objects</span>
                        <span className="text-lg font-mono text-cyan-400">{selection.length}</span>
                    </div>
                    <div className="bg-black/30 p-2 rounded border border-white/5">
                        <span className="text-gray-500 block text-[10px]">Total Weight</span>
                        <span className="text-lg font-mono text-amber-400">{stats.totalWeight.toFixed(1)}kg</span>
                    </div>
                </div>
                <div className="mt-2 text-[10px] text-gray-500">
                    Types: {stats.types.join(', ')}
                </div>
            </Section>

            {/* Alignment Tools */}
            <Section title="Alignment">
                <div className="space-y-2">
                    {/* Snap to Ground */}
                    <button
                        onClick={handleSnapAllToGround}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded text-[11px] text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                    >
                        <ArrowDownToLine size={14} />
                        Snap All to Ground
                    </button>

                    {/* Vertical Alignment */}
                    <div className="grid grid-cols-3 gap-1">
                        <button
                            onClick={() => handleAlignY('min')}
                            className="flex flex-col items-center gap-1 px-2 py-2 bg-black/30 border border-white/10 rounded text-[9px] text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors"
                            title="Align to bottom"
                        >
                            <AlignVerticalJustifyCenter size={12} />
                            <span>Bottom</span>
                        </button>
                        <button
                            onClick={() => handleAlignY('average')}
                            className="flex flex-col items-center gap-1 px-2 py-2 bg-black/30 border border-white/10 rounded text-[9px] text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors"
                            title="Align to center height"
                        >
                            <AlignVerticalJustifyCenter size={12} />
                            <span>Center Y</span>
                        </button>
                        <button
                            onClick={() => handleAlignY('max')}
                            className="flex flex-col items-center gap-1 px-2 py-2 bg-black/30 border border-white/10 rounded text-[9px] text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors"
                            title="Align to top"
                        >
                            <AlignVerticalJustifyCenter size={12} />
                            <span>Top</span>
                        </button>
                    </div>

                    {/* Horizontal Alignment */}
                    <div className="grid grid-cols-3 gap-1">
                        <button
                            onClick={() => handleAlignX('min')}
                            className="flex flex-col items-center gap-1 px-2 py-2 bg-black/30 border border-white/10 rounded text-[9px] text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors"
                        >
                            <AlignHorizontalJustifyCenter size={12} />
                            <span>Left X</span>
                        </button>
                        <button
                            onClick={() => handleAlignX('average')}
                            className="flex flex-col items-center gap-1 px-2 py-2 bg-black/30 border border-white/10 rounded text-[9px] text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors"
                        >
                            <AlignHorizontalJustifyCenter size={12} />
                            <span>Center X</span>
                        </button>
                        <button
                            onClick={() => handleAlignX('max')}
                            className="flex flex-col items-center gap-1 px-2 py-2 bg-black/30 border border-white/10 rounded text-[9px] text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors"
                        >
                            <AlignHorizontalJustifyCenter size={12} />
                            <span>Right X</span>
                        </button>
                    </div>

                    {/* Z Alignment */}
                    <div className="grid grid-cols-3 gap-1">
                        <button
                            onClick={() => handleAlignZ('min')}
                            className="flex flex-col items-center gap-1 px-2 py-2 bg-black/30 border border-white/10 rounded text-[9px] text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors"
                        >
                            <AlignHorizontalJustifyCenter size={12} className="rotate-90" />
                            <span>Back Z</span>
                        </button>
                        <button
                            onClick={() => handleAlignZ('average')}
                            className="flex flex-col items-center gap-1 px-2 py-2 bg-black/30 border border-white/10 rounded text-[9px] text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors"
                        >
                            <AlignHorizontalJustifyCenter size={12} className="rotate-90" />
                            <span>Center Z</span>
                        </button>
                        <button
                            onClick={() => handleAlignZ('max')}
                            className="flex flex-col items-center gap-1 px-2 py-2 bg-black/30 border border-white/10 rounded text-[9px] text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors"
                        >
                            <AlignHorizontalJustifyCenter size={12} className="rotate-90" />
                            <span>Front Z</span>
                        </button>
                    </div>
                </div>
            </Section>

            {/* Distribute Tools */}
            {selection.length >= 3 && (
                <Section title="Distribute">
                    <div className="grid grid-cols-3 gap-1">
                        <button
                            onClick={() => handleDistribute('x')}
                            className="flex flex-col items-center gap-1 px-2 py-2 bg-black/30 border border-white/10 rounded text-[9px] text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors"
                        >
                            <MoveHorizontal size={12} />
                            <span>X Axis</span>
                        </button>
                        <button
                            onClick={() => handleDistribute('y')}
                            className="flex flex-col items-center gap-1 px-2 py-2 bg-black/30 border border-white/10 rounded text-[9px] text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors"
                        >
                            <MoveVertical size={12} />
                            <span>Y Axis</span>
                        </button>
                        <button
                            onClick={() => handleDistribute('z')}
                            className="flex flex-col items-center gap-1 px-2 py-2 bg-black/30 border border-white/10 rounded text-[9px] text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors"
                        >
                            <MoveHorizontal size={12} className="rotate-90" />
                            <span>Z Axis</span>
                        </button>
                    </div>
                </Section>
            )}

            {/* Transform Tools */}
            <Section title="Transform All">
                <div className="space-y-2">
                    {/* Move Buttons */}
                    <div className="text-[10px] text-gray-500 mb-1">Move</div>
                    <div className="grid grid-cols-3 gap-1">
                        {(['x', 'y', 'z'] as const).map(axis => (
                            <div key={axis} className="flex gap-0.5">
                                <button
                                    onClick={() => handleMoveAll(axis, -0.5)}
                                    className="flex-1 px-1 py-1.5 bg-black/30 border border-white/10 rounded-l text-[9px] text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors"
                                >
                                    -{axis.toUpperCase()}
                                </button>
                                <button
                                    onClick={() => handleMoveAll(axis, 0.5)}
                                    className="flex-1 px-1 py-1.5 bg-black/30 border border-white/10 rounded-r text-[9px] text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors"
                                >
                                    +{axis.toUpperCase()}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Rotate Buttons */}
                    <div className="text-[10px] text-gray-500 mb-1 mt-2">Rotate (90°)</div>
                    <div className="grid grid-cols-3 gap-1">
                        {(['x', 'y', 'z'] as const).map(axis => (
                            <button
                                key={axis}
                                onClick={() => handleRotateAll(axis, 90)}
                                className="flex items-center justify-center gap-1 px-2 py-1.5 bg-black/30 border border-white/10 rounded text-[9px] text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors"
                            >
                                <RotateCw size={10} />
                                {axis.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </Section>

            {/* Actions */}
            <Section title="Actions">
                <button
                    onClick={() => onRemove(ids)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded text-[11px] text-red-400 hover:bg-red-500/20 transition-colors"
                >
                    <Trash2 size={14} />
                    Delete All ({selection.length})
                </button>
            </Section>
        </div>
    );
};
