import React, { useState } from 'react';
import { useStore, LightingPreset } from '../../store';
import { ASSETS, SceneObject } from '../../types';
import { NumericInput } from '../ui/NumericInput';
import { BoxSelect, Plus, Trash2, ChevronDown, ChevronRight, Sun, Globe, Layers, Target, LayoutTemplate } from 'lucide-react';

const Section = ({ title, children, defaultOpen = true }: { title: string, children?: React.ReactNode, defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-white/5 last:border-0">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="w-full flex items-center justify-between py-3 px-1 text-xs font-semibold text-gray-400 hover:text-white transition-colors uppercase tracking-wider"
            >
                {title}
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {isOpen && <div className="pb-4 px-1 space-y-3 animate-in slide-in-from-top-1 fade-in duration-200">{children}</div>}
        </div>
    )
}

// --- SUB-INSPECTORS ---

const TransformInspector = ({ object, onUpdate }: { object: SceneObject, onUpdate: (id: string, data: any) => void }) => (
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
                    <span className="text-gray-700">Radians</span>
                 </div>
                 <div className="grid grid-cols-3 gap-2">
                    <NumericInput label="X" value={object.rotation[0]} onChange={(v) => onUpdate(object.id, { rotation: [v, object.rotation[1], object.rotation[2]] })} />
                    <NumericInput label="Y" value={object.rotation[1]} onChange={(v) => onUpdate(object.id, { rotation: [object.rotation[0], v, object.rotation[2]] })} />
                    <NumericInput label="Z" value={object.rotation[2]} onChange={(v) => onUpdate(object.id, { rotation: [object.rotation[0], object.rotation[1], v] })} />
                 </div>
             </div>
        </div>
    </Section>
);

const GeometryInspector = ({ object, onUpdate }: { object: SceneObject, onUpdate: (id: string, data: any) => void }) => {
    if (!object.dimensions) return null;
    return (
        <Section title="Geometry Dimensions">
            <div className="space-y-2">
                <div className="text-[10px] text-gray-500 flex items-center gap-2 mb-2">
                    <LayoutTemplate size={12} className="text-aether-accent"/>
                    Plane Size
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <NumericInput 
                        label="Width (X)" 
                        value={object.dimensions.w} 
                        onChange={(v) => onUpdate(object.id, { dimensions: { ...object.dimensions!, w: Math.max(0.1, v) } })}
                        step={0.5}
                    />
                    <NumericInput 
                        label="Depth (Z)" 
                        value={object.dimensions.d} 
                        onChange={(v) => onUpdate(object.id, { dimensions: { ...object.dimensions!, d: Math.max(0.1, v) } })}
                        step={0.5}
                    />
                </div>
                <div className="mt-2">
                    <div className="text-[10px] text-gray-400 mb-1">Tip: Use Rotation X to create Raked Seating</div>
                </div>
            </div>
        </Section>
    );
};

const ArrayInspector = ({ object, onUpdate }: { object: SceneObject, onUpdate: (id: string, data: any) => void }) => {
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

const AcousticInspector = ({ object }: { object: SceneObject }) => {
    const specs = ASSETS[object.model];
    if (!specs) return null;

    return (
        <Section title="Acoustic Data">
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Max SPL (1m)</span>
                    <span className="text-xs font-mono text-aether-accent">{specs.maxSPL ? `${specs.maxSPL} dB` : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Dispersion (HxV)</span>
                    <span className="text-xs font-mono text-white">{specs.dispersion ? `${specs.dispersion.h}° x ${specs.dispersion.v}°` : 'Omni'}</span>
                </div>
            </div>
        </Section>
    );
}

// --- MAIN PANEL ---

export const PropertiesPanel = () => {
    const selectedIds = useStore(state => state.selectedIds);
    const objects = useStore(state => state.objects);
    const updateObject = useStore(state => state.updateObject);
    // @ts-ignore
    const updateObjectFinal = useStore(state => state.updateObjectFinal) || updateObject;
    const removeObject = useStore(state => state.removeObject);
    const cloneObject = useStore(state => state.cloneObject);
    const lightingPreset = useStore(state => state.lightingPreset);
    const setLightingPreset = useStore(state => state.setLightingPreset);
    
    const selection = objects.filter(o => selectedIds.includes(o.id));
    const singleSelection = selection.length === 1 ? selection[0] : null;

    // Use updateObjectFinal for property panel edits (treating them as committed changes)
    // In a stricter app, NumericInput would have "onCommit" vs "onChange".
    // Here we treat all property panel inputs as significant.
    const handleUpdate = updateObjectFinal;

    // --- STATE: NO SELECTION (GLOBAL SETTINGS) ---
    if (selection.length === 0) return (
        <div className="p-4 space-y-6">
             <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-gray-400">
                    <Globe size={18} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white">Scene Settings</h3>
                    <p className="text-[10px] text-gray-500">Global Environment Config</p>
                </div>
            </div>

            <Section title="Lighting & Environment">
                <div className="grid grid-cols-3 gap-2">
                    {['studio', 'stage', 'outdoor'].map((preset) => (
                        <button 
                            key={preset}
                            onClick={() => setLightingPreset(preset as LightingPreset)}
                            className={`flex flex-col items-center justify-center p-3 rounded border transition-all ${
                                lightingPreset === preset 
                                ? 'bg-aether-accent/10 border-aether-accent/50 text-aether-accent' 
                                : 'bg-black/20 border-white/5 text-gray-500 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <Sun size={16} className="mb-2" />
                            <span className="text-[10px] capitalize">{preset}</span>
                        </button>
                    ))}
                </div>
            </Section>

            <Section title="Project Stats">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/20 p-2 rounded">
                        <span className="text-[10px] text-gray-500 block">Object Count</span>
                        <span className="text-xl font-mono text-white">{objects.length}</span>
                    </div>
                </div>
            </Section>
        </div>
    );

    // --- STATE: SELECTION ACTIVE ---
    const assetSpec = singleSelection ? ASSETS[singleSelection.model] : null;
    const isArrayCapable = singleSelection && (singleSelection.type === 'speaker' || singleSelection.type === 'sub');
    const isResizable = assetSpec?.isResizable;

    return (
        <div className="p-4 space-y-2 animate-in slide-in-from-right-4 fade-in duration-200">
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded flex items-center justify-center text-black" style={{ backgroundColor: singleSelection?.color || '#333' }}>
                        <BoxSelect size={18} />
                    </div>
                    <div className="flex flex-col">
                        <input 
                            type="text" 
                            value={singleSelection?.name || 'Multiple Objects'}
                            onChange={(e) => singleSelection && handleUpdate(singleSelection.id, { name: e.target.value })}
                            disabled={selection.length > 1}
                            className="bg-transparent text-sm font-bold text-white focus:outline-none focus:border-b focus:border-aether-accent w-32"
                        />
                        <span className="text-[10px] text-aether-500 uppercase font-mono">{selection.length > 1 ? `${selection.length} Items` : singleSelection?.type}</span>
                    </div>
                </div>
            </div>

            {singleSelection && (
                <>
                    {/* STANDARD TRANSFORM */}
                    <TransformInspector object={singleSelection} onUpdate={handleUpdate} />

                    {/* CONDITIONAL INSPECTORS */}
                    {isResizable && <GeometryInspector object={singleSelection} onUpdate={handleUpdate} />}
                    {isArrayCapable && <ArrayInspector object={singleSelection} onUpdate={handleUpdate} />}
                    {(singleSelection.type === 'speaker' || singleSelection.type === 'sub') && <AcousticInspector object={singleSelection} />}

                    {/* ACTIONS */}
                    <div className="pt-4 mt-2">
                         <div className="grid grid-cols-2 gap-2">
                             <button 
                                onClick={() => cloneObject(singleSelection.id)}
                                className="py-2 bg-white/5 border border-white/5 text-gray-300 text-xs rounded hover:bg-white/10 hover:text-white transition flex items-center justify-center gap-2"
                             >
                                <Plus size={12} /> Clone
                             </button>
                             <button 
                                onClick={() => removeObject(singleSelection.id)}
                                className="col-span-1 py-2 bg-red-500/5 border border-red-500/10 text-red-400 text-xs rounded hover:bg-red-500/20 transition flex items-center justify-center gap-2"
                            >
                                <Trash2 size={12} /> Remove
                             </button>
                         </div>
                    </div>
                </>
            )}
        </div>
    )
};