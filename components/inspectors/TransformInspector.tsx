import React from 'react';
import { SceneObject } from '../../types';
import { NumericInput } from '../ui/NumericInput';
import { Section } from './Section';
import { RotateCw } from 'lucide-react';

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

    // Flip vertical (rotate 90° on X axis)
    const flipVertical = () => {
        const current = object.rotation[0];
        const newX = Math.abs(current) < 0.01 ? Math.PI / 2 : 0;
        onUpdate(object.id, { rotation: [newX, object.rotation[1], object.rotation[2]] });
    };

    return (
        <Section title="Transform">
            <div className="grid grid-cols-1 gap-3">
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
                                    Math.abs(object.rotation[0]) > 0.1
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
