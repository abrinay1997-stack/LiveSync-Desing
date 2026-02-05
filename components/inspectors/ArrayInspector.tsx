import React from 'react';
import { SceneObject } from '../../types';
import { NumericInput } from '../ui/NumericInput';
import { Section } from './Section';
import { Layers, Target, ChevronUp, ChevronDown } from 'lucide-react';
import { SplayList } from './array/SplayList';

export const ArrayInspector = ({ object, onUpdate }: { object: SceneObject, onUpdate: (id: string, data: any) => void }) => {
    if (!object.arrayConfig) return null;

    const updateConfig = (updates: any) => {
        onUpdate(object.id, { arrayConfig: { ...object.arrayConfig, ...updates } });
    };

    const setSplay = (index: number, angle: number) => {
        const newSplays = [...object.arrayConfig!.splayAngles];
        while(newSplays.length <= index) newSplays.push(0);
        newSplays[index] = angle;
        updateConfig({ splayAngles: newSplays });
    };

    // Apply preset to all splay angles
    const applyPreset = (preset: 'longThrow' | 'jShape' | 'constantArc') => {
        const count = object.arrayConfig!.boxCount;
        let angles: number[] = [];

        switch (preset) {
            case 'longThrow':
                // 0° for all - tight coupling for maximum throw
                angles = Array(count).fill(0);
                updateConfig({ splayAngles: angles, siteAngle: 0 });
                break;
            case 'jShape':
                // Tighter at top, opens up at bottom (typical J-shape)
                angles = Array(count).fill(0).map((_, i) => {
                    if (i < Math.floor(count * 0.4)) return 0.5; // Top 40%: tight
                    if (i < Math.floor(count * 0.7)) return 1.5; // Mid 30%: medium
                    return 3; // Bottom 30%: open
                });
                updateConfig({ splayAngles: angles, siteAngle: -5 });
                break;
            case 'constantArc':
                // Equal spacing for even coverage
                const evenAngle = 2; // 2° between each box
                angles = Array(count).fill(evenAngle);
                updateConfig({ splayAngles: angles, siteAngle: -3 });
                break;
        }
    };

    // Increment/decrement box count
    const adjustBoxCount = (delta: number) => {
        const newCount = Math.max(1, Math.min(24, object.arrayConfig!.boxCount + delta));
        updateConfig({ boxCount: newCount });
    };

    return (
        <Section title="Array Design">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-300 flex items-center gap-2">
                        <Layers size={12} className="text-cyan-500"/> Array Mode
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={object.arrayConfig.enabled}
                            onChange={(e) => updateConfig({ enabled: e.target.checked })}
                            className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                </div>

                {object.arrayConfig.enabled && (
                    <>
                        {/* Box Count & Site Angle - Improved Design */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Box Count */}
                            <div className="bg-black/30 rounded-lg p-2 border border-white/5">
                                <span className="text-[10px] text-gray-500 block mb-1.5">Box Count</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => adjustBoxCount(-1)}
                                        className="w-6 h-6 flex items-center justify-center rounded bg-black/30 border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors"
                                    >
                                        <ChevronDown size={12} />
                                    </button>
                                    <div className="flex-1 text-center text-lg font-mono text-cyan-400 font-bold">
                                        {object.arrayConfig.boxCount}
                                    </div>
                                    <button
                                        onClick={() => adjustBoxCount(1)}
                                        className="w-6 h-6 flex items-center justify-center rounded bg-black/30 border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors"
                                    >
                                        <ChevronUp size={12} />
                                    </button>
                                </div>
                            </div>

                            {/* Site Angle (Tilt) */}
                            <div className="bg-black/30 rounded-lg p-2 border border-white/5">
                                <span className="text-[10px] text-gray-500 block mb-1.5">Site Angle (Tilt)</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => updateConfig({ siteAngle: object.arrayConfig!.siteAngle - 1 })}
                                        className="w-6 h-6 flex items-center justify-center rounded bg-black/30 border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors"
                                    >
                                        <ChevronDown size={12} />
                                    </button>
                                    <input
                                        type="number"
                                        value={object.arrayConfig.siteAngle}
                                        onChange={(e) => updateConfig({ siteAngle: parseFloat(e.target.value) || 0 })}
                                        step={0.5}
                                        className="flex-1 w-full text-center text-lg font-mono text-cyan-400 font-bold bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button
                                        onClick={() => updateConfig({ siteAngle: object.arrayConfig!.siteAngle + 1 })}
                                        className="w-6 h-6 flex items-center justify-center rounded bg-black/30 border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors"
                                    >
                                        <ChevronUp size={12} />
                                    </button>
                                </div>
                                <span className="text-[9px] text-gray-600 block text-center mt-1">degrees</span>
                            </div>
                        </div>

                        {/* Quick Presets */}
                        <div className="space-y-2">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wide">Quick Presets</span>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => applyPreset('longThrow')}
                                    className="px-2 py-1.5 text-[10px] rounded border bg-black/20 border-white/10 text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors"
                                >
                                    0° Long Throw
                                </button>
                                <button
                                    onClick={() => applyPreset('jShape')}
                                    className="px-2 py-1.5 text-[10px] rounded border bg-black/20 border-white/10 text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors"
                                >
                                    J-Shape
                                </button>
                                <button
                                    onClick={() => applyPreset('constantArc')}
                                    className="px-2 py-1.5 text-[10px] rounded border bg-black/20 border-white/10 text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors"
                                >
                                    Constant Arc
                                </button>
                            </div>
                        </div>

                        <SplayList
                            boxCount={object.arrayConfig.boxCount}
                            splayAngles={object.arrayConfig.splayAngles}
                            siteAngle={object.arrayConfig.siteAngle}
                            onUpdateSplay={setSplay}
                        />

                        <div className="border-t border-white/5 pt-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                    <Target size={10} /> Show Coverage
                                </span>
                                <input
                                    type="checkbox"
                                    checked={object.arrayConfig.showThrowLines}
                                    onChange={(e) => updateConfig({ showThrowLines: e.target.checked })}
                                    className="w-3 h-3 accent-cyan-500"
                                />
                            </div>
                            {object.arrayConfig.showThrowLines && (
                                <div className="mt-2">
                                    <NumericInput
                                        label="Throw Dist (m)"
                                        value={object.arrayConfig.throwDistance}
                                        onChange={(v) => updateConfig({ throwDistance: v })}
                                        step={1}
                                    />
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Section>
    );
};
