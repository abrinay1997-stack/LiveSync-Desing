import React from 'react';
import * as THREE from 'three';
import { SceneObject } from '../../types';
import { NumericInput } from '../ui/NumericInput';
import { Section } from './Section';
import { RotateCw, ArrowDownToLine, AlertTriangle } from 'lucide-react';
import { snapToGround, isObjectBelowGround } from '../../utils/construction';

// Rotation presets in radians
const ROTATION_PRESETS = [
    { label: '0°', value: 0 },
    { label: '90°', value: Math.PI / 2 },
    { label: '180°', value: Math.PI },
    { label: '-90°', value: -Math.PI / 2 },
];

// Convert radians to degrees for display
const radToDeg = (rad: number) => (rad * 180 / Math.PI);
const degToRad = (deg: number) => (deg * Math.PI / 180);

export const TransformInspector = ({ object, onUpdate }: { object: SceneObject, onUpdate: (id: string, data: any) => void }) => {
    const isTruss = object.type === 'truss';
    const isRigging = isTruss || object.type === 'motor';

    // Check if object is below ground
    const dims = object.dimensions || { w: 1, h: 1, d: 1 };
    const groundCheck = isObjectBelowGround(
        new THREE.Vector3(...object.position),
        dims,
        new THREE.Euler(...object.rotation)
    );

    // Quick rotation handler
    const setQuickRotation = (axis: 'x' | 'y' | 'z', value: number) => {
        const newRotation: [number, number, number] = [...object.rotation];
        const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
        newRotation[idx] = value;
        onUpdate(object.id, { rotation: newRotation });
    };

    // Flip horizontal (rotate 90° on Y axis)
    const flipHorizontal = () => {
        const current = object.rotation[1];
        const newY = Math.abs(current) < 0.01 ? Math.PI / 2 : 0;
        onUpdate(object.id, { rotation: [object.rotation[0], newY, object.rotation[2]] });
    };

    // Flip vertical (rotate 90° on Z axis for trusses)
    const flipVertical = () => {
        const current = object.rotation[2];
        const newZ = Math.abs(current - Math.PI / 2) < 0.01 ? 0 : Math.PI / 2;
        onUpdate(object.id, { rotation: [object.rotation[0], object.rotation[1], newZ] });
    };

    // Snap object to ground
    const handleSnapToGround = () => {
        const pos = new THREE.Vector3(...object.position);
        const rot = new THREE.Euler(...object.rotation);
        const newPos = snapToGround(pos, dims, rot);
        onUpdate(object.id, { position: [newPos.x, newPos.y, newPos.z] });
    };

    // Reset Y to 0
    const resetToGround = () => {
        const pos = new THREE.Vector3(...object.position);
        const rot = new THREE.Euler(...object.rotation);
        const newPos = snapToGround(pos, dims, rot);
        onUpdate(object.id, { position: [object.position[0], newPos.y, object.position[2]] });
    };

    return (
        <Section title="Transform">
            <div className="grid grid-cols-1 gap-3">
                {/* Below Ground Warning */}
                {groundCheck.belowGround && (
                    <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400 text-[10px]">
                        <AlertTriangle size={12} />
                        <span>Object is {Math.abs(groundCheck.lowestPoint).toFixed(2)}m below ground</span>
                        <button
                            onClick={handleSnapToGround}
                            className="ml-auto px-2 py-0.5 bg-amber-500/20 rounded text-amber-300 hover:bg-amber-500/30 transition-colors"
                        >
                            Fix
                        </button>
                    </div>
                )}

                <div>
                    <div className="text-[10px] text-gray-500 mb-1.5 flex justify-between">
                        <span>Position</span>
                        <span className="text-gray-700">Meters</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <NumericInput label="X" value={object.position[0]} onChange={(v) => onUpdate(object.id, { position: [v, object.position[1], object.position[2]] })} />
                        <NumericInput label="Y" value={object.position[1]} onChange={(v) => onUpdate(object.id, { position: [object.position[0], v, object.position[2]] })} />
                        <NumericInput label="Z" value={object.position[2]} onChange={(v) => onUpdate(object.id, { position: [object.position[0], object.position[1], v] })} />
                    </div>
                </div>

                <div>
                    <div className="text-[10px] text-gray-500 mb-1.5 flex justify-between">
                        <span>Rotation</span>
                        <span className="text-gray-700">Degrees</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <NumericInput
                            label="X"
                            value={radToDeg(object.rotation[0])}
                            onChange={(v) => onUpdate(object.id, { rotation: [degToRad(v), object.rotation[1], object.rotation[2]] })}
                            step={15}
                            sensitivity={0.5}
                        />
                        <NumericInput
                            label="Y"
                            value={radToDeg(object.rotation[1])}
                            onChange={(v) => onUpdate(object.id, { rotation: [object.rotation[0], degToRad(v), object.rotation[2]] })}
                            step={15}
                            sensitivity={0.5}
                        />
                        <NumericInput
                            label="Z"
                            value={radToDeg(object.rotation[2])}
                            onChange={(v) => onUpdate(object.id, { rotation: [object.rotation[0], object.rotation[1], degToRad(v)] })}
                            step={15}
                            sensitivity={0.5}
                        />
                    </div>
                </div>

                {/* Ground Alignment */}
                <div className="border-t border-white/5 pt-3">
                    <button
                        onClick={handleSnapToGround}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-black/20 border border-white/10 rounded text-[10px] text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors"
                    >
                        <ArrowDownToLine size={12} />
                        Snap to Ground
                    </button>
                </div>

                {/* Quick Rotation for Trusses and Rigging */}
                {isRigging && (
                    <div className="border-t border-white/5 pt-3">
                        <div className="text-[10px] text-gray-500 mb-2 flex items-center gap-1">
                            <RotateCw size={10} />
                            <span>Quick Orientation</span>
                        </div>

                        {/* Horizontal/Vertical Toggle */}
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <button
                                onClick={flipHorizontal}
                                className={`px-2 py-1.5 text-[10px] rounded border transition-colors ${
                                    Math.abs(object.rotation[1]) > 0.1
                                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                                        : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/30'
                                }`}
                            >
                                Horizontal
                            </button>
                            <button
                                onClick={flipVertical}
                                className={`px-2 py-1.5 text-[10px] rounded border transition-colors ${
                                    Math.abs(object.rotation[2] - Math.PI / 2) < 0.1
                                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                                        : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/30'
                                }`}
                            >
                                Vertical
                            </button>
                        </div>

                        {/* Quick Angle Presets */}
                        <div className="grid grid-cols-4 gap-1">
                            {ROTATION_PRESETS.map((preset) => (
                                <button
                                    key={preset.label}
                                    onClick={() => setQuickRotation('y', preset.value)}
                                    className={`px-1 py-1 text-[9px] rounded border transition-colors ${
                                        Math.abs(object.rotation[1] - preset.value) < 0.1
                                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                                            : 'bg-black/20 border-white/10 text-gray-500 hover:border-white/30 hover:text-gray-300'
                                    }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Section>
    );
};
