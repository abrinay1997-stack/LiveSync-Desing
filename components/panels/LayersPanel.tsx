import React from 'react';
import { useStore } from '../../store';
import { Eye, EyeOff, Settings } from 'lucide-react';

export const LayersPanel = () => {
    const layers = useStore(state => state.layers);
    const toggleLayer = useStore(state => state.toggleLayerVisibility);

    return (
        <div className="p-4 animate-in slide-in-from-right-4 fade-in duration-200">
             <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Scene Layers</h3>
                <Settings size={14} className="text-aether-500 cursor-pointer hover:text-white" />
            </div>
            <div className="space-y-1">
                {layers.map(layer => (
                    <div key={layer.id} className="flex items-center justify-between group py-2 px-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]`} style={{ color: layer.color, backgroundColor: layer.color }}></div>
                            <span className={`text-sm font-medium ${layer.visible ? 'text-gray-200' : 'text-gray-600'}`}>{layer.name}</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); toggleLayer(layer.id); }} className="text-aether-600 hover:text-aether-accent transition">
                                {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
};