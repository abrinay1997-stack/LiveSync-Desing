import React, { useState } from 'react';
import { useStore, LightingPreset } from '../../store';
import { ASSETS } from '../../types';
import { NumericInput } from '../ui/NumericInput';
import { BoxSelect, Plus, Trash2, ChevronDown, ChevronRight, Sun, Globe, Zap } from 'lucide-react';

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

export const PropertiesPanel = () => {
    const selectedIds = useStore(state => state.selectedIds);
    const objects = useStore(state => state.objects);
    const updateObject = useStore(state => state.updateObject);
    const removeObject = useStore(state => state.removeObject);
    const lightingPreset = useStore(state => state.lightingPreset);
    const setLightingPreset = useStore(state => state.setLightingPreset);
    
    const selection = objects.filter(o => selectedIds.includes(o.id));
    const singleSelection = selection.length === 1 ? selection[0] : null;

    // Helper to get technical data from the ASSET definition
    const getTechSpec = (obj: typeof selection[0]) => {
        return ASSETS[obj.model || ''];
    }

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
                    <div className="bg-black/20 p-2 rounded">
                        <span className="text-[10px] text-gray-500 block">Total Weight</span>
                        <span className="text-xl font-mono text-amber-500">
                            {objects.reduce((acc, obj) => acc + (ASSETS[obj.model]?.weight || 0), 0)} kg
                        </span>
                    </div>
                </div>
            </Section>
        </div>
    );

    // --- STATE: SELECTION ACTIVE ---
    const specs = singleSelection ? getTechSpec(singleSelection) : null;
    const totalSelectedWeight = selection.reduce((acc, obj) => acc + (ASSETS[obj.model]?.weight || 0), 0);

    return (
        <div className="p-4 space-y-2 animate-in slide-in-from-right-4 fade-in duration-200">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded flex items-center justify-center text-black" style={{ backgroundColor: singleSelection?.color || '#333' }}>
                        <BoxSelect size={18} />
                    </div>
                    <div className="flex flex-col">
                        <input 
                            type="text" 
                            value={singleSelection?.name || 'Multiple Objects'}
                            onChange={(e) => singleSelection && updateObject(singleSelection.id, { name: e.target.value })}
                            disabled={selection.length > 1}
                            className="bg-transparent text-sm font-bold text-white focus:outline-none focus:border-b focus:border-aether-accent w-32"
                        />
                        <span className="text-[10px] text-aether-500 uppercase font-mono">{selection.length > 1 ? `${selection.length} Items` : singleSelection?.type}</span>
                    </div>
                </div>
            </div>

            {singleSelection && (
                <>
                    <Section title="Transform">
                        <div className="grid grid-cols-1 gap-3">
                             <div>
                                 <div className="text-[10px] text-gray-500 mb-1.5 flex justify-between">
                                    <span>Position</span>
                                    <span className="text-gray-700">Meters</span>
                                 </div>
                                 <div className="grid grid-cols-3 gap-2">
                                    <NumericInput label="X" value={singleSelection.position[0]} onChange={(v) => updateObject(singleSelection.id, { position: [v, singleSelection.position[1], singleSelection.position[2]] })} />
                                    <NumericInput label="Y" value={singleSelection.position[1]} onChange={(v) => updateObject(singleSelection.id, { position: [singleSelection.position[0], v, singleSelection.position[2]] })} />
                                    <NumericInput label="Z" value={singleSelection.position[2]} onChange={(v) => updateObject(singleSelection.id, { position: [singleSelection.position[0], singleSelection.position[1], v] })} />
                                 </div>
                             </div>
                             <div>
                                 <div className="text-[10px] text-gray-500 mb-1.5 flex justify-between">
                                    <span>Rotation</span>
                                    <span className="text-gray-700">Radians</span>
                                 </div>
                                 <div className="grid grid-cols-3 gap-2">
                                    <NumericInput label="X" value={singleSelection.rotation[0]} onChange={(v) => updateObject(singleSelection.id, { rotation: [v, singleSelection.rotation[1], singleSelection.rotation[2]] })} />
                                    <NumericInput label="Y" value={singleSelection.rotation[1]} onChange={(v) => updateObject(singleSelection.id, { rotation: [singleSelection.rotation[0], v, singleSelection.rotation[2]] })} />
                                    <NumericInput label="Z" value={singleSelection.rotation[2]} onChange={(v) => updateObject(singleSelection.id, { rotation: [singleSelection.rotation[0], singleSelection.rotation[1], v] })} />
                                 </div>
                             </div>
                        </div>
                    </Section>

                    {/* CONTEXTUAL SECTION: AUDIO */}
                    {(singleSelection.type === 'speaker' || singleSelection.type === 'sub') && specs && (
                        <Section title="Acoustic Data">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">Max SPL</span>
                                    <span className="text-xs font-mono text-aether-accent">{specs.maxSPL ? `${specs.maxSPL} dB` : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">Dispersion (HxV)</span>
                                    <span className="text-xs font-mono text-white">{specs.dispersion ? `${specs.dispersion.h}° x ${specs.dispersion.v}°` : 'Omni'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">Unit Weight</span>
                                    <span className="text-xs font-mono text-gray-300">{specs.weight} kg</span>
                                </div>
                            </div>
                        </Section>
                    )}

                    {/* CONTEXTUAL SECTION: RIGGING */}
                    <Section title="Rigging Calculator">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Selected Weight</span>
                                <span className="text-xs font-mono text-amber-500">{totalSelectedWeight} kg</span>
                            </div>
                            {(singleSelection.type === 'motor' || singleSelection.type === 'truss') && (
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">Est. Safety Factor</span>
                                    <span className="text-xs font-mono text-green-500">{(1000 / (totalSelectedWeight || 1)).toFixed(1)}:1 (1T)</span>
                                </div>
                            )}
                        </div>
                    </Section>

                    <div className="pt-4 mt-2">
                         <div className="grid grid-cols-2 gap-2">
                             <button className="py-2 bg-white/5 border border-white/5 text-gray-300 text-xs rounded hover:bg-white/10 hover:text-white transition flex items-center justify-center gap-2">
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