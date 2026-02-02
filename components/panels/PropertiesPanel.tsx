import React from 'react';
import { useStore } from '../../store';
import { NumericInput } from '../ui/NumericInput';
import { BoxSelect, Plus, Trash2 } from 'lucide-react';

export const PropertiesPanel = () => {
    const selectedIds = useStore(state => state.selectedIds);
    const objects = useStore(state => state.objects);
    const updateObject = useStore(state => state.updateObject);
    const removeObject = useStore(state => state.removeObject);
    
    const selection = objects.filter(o => selectedIds.includes(o.id));
    const singleSelection = selection.length === 1 ? selection[0] : null;

    if (selection.length === 0) return (
        <div className="h-full flex flex-col items-center justify-center text-aether-600 p-8 text-center">
            <BoxSelect size={48} className="mb-4 opacity-20" />
            <span className="text-sm">Select an object to inspect properties</span>
        </div>
    );

    return (
        <div className="p-4 space-y-6 animate-in slide-in-from-right-4 fade-in duration-200">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex flex-col">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Properties</h3>
                    <span className="text-xs text-aether-500">{selection.length} Item{selection.length > 1 ? 's' : ''} Selected</span>
                </div>
                {singleSelection && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: singleSelection.color }}></div>}
            </div>

            {singleSelection && (
                <>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-aether-500 block mb-1">Asset Name</label>
                            <input 
                                type="text" 
                                value={singleSelection.name}
                                onChange={(e) => updateObject(singleSelection.id, { name: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-aether-accent/50 focus:bg-white/5 transition-all"
                            />
                        </div>
                        
                        <div>
                             <div className="text-xs text-aether-500 mb-2">Transform</div>
                             <div className="grid grid-cols-3 gap-2">
                                <NumericInput label="X" value={singleSelection.position[0]} onChange={(v) => updateObject(singleSelection.id, { position: [v, singleSelection.position[1], singleSelection.position[2]] })} />
                                <NumericInput label="Y" value={singleSelection.position[1]} onChange={(v) => updateObject(singleSelection.id, { position: [singleSelection.position[0], v, singleSelection.position[2]] })} />
                                <NumericInput label="Z" value={singleSelection.position[2]} onChange={(v) => updateObject(singleSelection.id, { position: [singleSelection.position[0], singleSelection.position[1], v] })} />
                             </div>
                        </div>

                        <div>
                             <div className="text-xs text-aether-500 mb-2">Rotation (Rad)</div>
                             <div className="grid grid-cols-3 gap-2">
                                <NumericInput label="X" value={singleSelection.rotation[0]} onChange={(v) => updateObject(singleSelection.id, { rotation: [v, singleSelection.rotation[1], singleSelection.rotation[2]] })} />
                                <NumericInput label="Y" value={singleSelection.rotation[1]} onChange={(v) => updateObject(singleSelection.id, { rotation: [singleSelection.rotation[0], v, singleSelection.rotation[2]] })} />
                                <NumericInput label="Z" value={singleSelection.rotation[2]} onChange={(v) => updateObject(singleSelection.id, { rotation: [singleSelection.rotation[0], singleSelection.rotation[1], v] })} />
                             </div>
                        </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-white/5 space-y-3">
                         <span className="text-xs font-bold text-aether-500 uppercase">Actions</span>
                         <div className="grid grid-cols-2 gap-2">
                             <button className="py-2 bg-white/5 border border-white/10 text-gray-300 text-xs rounded hover:bg-white/10 transition flex items-center justify-center gap-2">
                                <Plus size={12} /> Duplicate
                             </button>
                             <button 
                                onClick={() => removeObject(singleSelection.id)}
                                className="col-span-1 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded hover:bg-red-500/20 transition flex items-center justify-center gap-2"
                            >
                                <Trash2 size={12} /> Delete
                             </button>
                         </div>
                    </div>
                </>
            )}
        </div>
    )
};