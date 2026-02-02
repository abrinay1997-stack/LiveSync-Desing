import React from 'react';
import { useStore, LightingPreset } from '../../store';
import { ASSETS } from '../../data/library';
import { BoxSelect, Plus, Trash2, Sun, Globe } from 'lucide-react';

import { Section } from '../inspectors/Section';
import { TransformInspector } from '../inspectors/TransformInspector';
import { GeometryInspector } from '../inspectors/GeometryInspector';
import { ArrayInspector } from '../inspectors/ArrayInspector';
import { AcousticInspector } from '../inspectors/AcousticInspector';

// --- MAIN PANEL ---

export const PropertiesPanel = () => {
    const selectedIds = useStore(state => state.selectedIds);
    const objects = useStore(state => state.objects);
    
    // Now explicitly typed in store interface, no fallback needed
    const updateObjectFinal = useStore(state => state.updateObjectFinal);
    
    const removeObject = useStore(state => state.removeObject);
    const cloneObject = useStore(state => state.cloneObject);
    const lightingPreset = useStore(state => state.lightingPreset);
    const setLightingPreset = useStore(state => state.setLightingPreset);
    
    const selection = objects.filter(o => selectedIds.includes(o.id));
    const singleSelection = selection.length === 1 ? selection[0] : null;

    // Use updateObjectFinal for property panel edits (treating them as committed changes)
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