import React from 'react';
import { SceneObject } from '../../types';
import { NumericInput } from '../ui/NumericInput';
import { Section } from './Section';
import { Layers, Target } from 'lucide-react';

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

    return (
        <Section title="Array Design">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-300 flex items-center gap-2">
                        <Layers size={12} className="text-aether-accent"/> Array Mode
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={object.arrayConfig.enabled} 
                            onChange={(e) => updateConfig({ enabled: e.target.checked })}
                            className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-aether-accent"></div>
                    </label>
                </div>

                {object.arrayConfig.enabled && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-[10px] text-gray-500 block mb-1">Box Count</span>
                                <div className="flex items-center">
                                    <NumericInput 
                                        value={object.arrayConfig.boxCount} 
                                        onChange={(v) => updateConfig({ boxCount: Math.max(1, Math.round(v)) })}
                                        step={1}
                                    />
                                </div>
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-500 block mb-1">Site Angle</span>
                                <NumericInput 
                                    value={object.arrayConfig.siteAngle} 
                                    onChange={(v) => updateConfig({ siteAngle: v })}
                                    step={0.5}
                                    label="Tilt"
                                />
                            </div>
                        </div>

                        <div className="bg-black/20 rounded border border-white/5 p-2">
                            <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] text-gray-400 font-mono uppercase">Inter-element Angles</span>
                                    <span className="text-[9px] text-aether-500 bg-aether-accent/10 px-1 rounded">Total: {(object.arrayConfig.splayAngles.slice(0, object.arrayConfig.boxCount).reduce((a,b) => a+b, 0) + object.arrayConfig.siteAngle).toFixed(1)}°</span>
                            </div>
                            <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                                {Array.from({ length: object.arrayConfig.boxCount }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 text-[9px] text-gray-600 font-mono text-right">{i+1}</div>
                                            <div className="w-1 h-1 rounded-full bg-gray-700"></div>
                                        </div>
                                        <div className="w-20">
                                            <NumericInput 
                                                value={object.arrayConfig!.splayAngles[i] || 0} 
                                                onChange={(v) => setSplay(i, v)}
                                                step={0.5}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-white/5 pt-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                    <Target size={10} /> Show Coverage
                                </span>
                                <input 
                                    type="checkbox" 
                                    checked={object.arrayConfig.showThrowLines}
                                    onChange={(e) => updateConfig({ showThrowLines: e.target.checked })}
                                    className="w-3 h-3 accent-aether-accent"
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