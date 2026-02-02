import React, { useMemo } from 'react';
import { useStore } from '../../store';
import { ASSETS } from '../../types';
import { Box, Speaker, ArrowUpFromLine, Cuboid } from 'lucide-react';

interface AssetCardProps {
    id: string;
    data: any;
    isActive: boolean;
    onClick: () => void;
}

const AssetCard: React.FC<AssetCardProps> = ({ id, data, isActive, onClick }) => {
    // Icon selection based on type
    const Icon = useMemo(() => {
        if (data.type === 'speaker' || data.type === 'sub') return Speaker;
        if (data.type === 'truss' || data.type === 'motor') return ArrowUpFromLine;
        return Box;
    }, [data.type]);

    return (
        <button 
            onClick={onClick}
            className={`group flex flex-col w-32 shrink-0 text-left bg-[#18181b] hover:bg-[#27272a] border rounded-md p-2 transition-all ${
                isActive ? 'border-aether-accent ring-1 ring-aether-accent' : 'border-white/5 hover:border-white/20'
            }`}
        >
            <div className="h-20 w-full bg-black/40 rounded mb-2 flex items-center justify-center relative overflow-hidden">
                <div className={`w-2 h-2 rounded-full absolute top-1.5 right-1.5 ${data.type.includes('speaker') ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
                <Icon className={`transition opacity-80 ${isActive ? 'text-aether-accent' : 'text-gray-500 group-hover:text-gray-300'}`} size={24} />
            </div>
            <span className={`text-[11px] font-medium truncate w-full ${isActive ? 'text-aether-accent' : 'text-gray-300'}`}>{data.name}</span>
            <span className="text-[9px] text-gray-600 truncate w-full">{data.description}</span>
        </button>
    )
}

export const LibraryPanel = () => {
    const setPlacementAsset = useStore(state => state.setPlacementAsset);
    const activePlacementAsset = useStore(state => state.activePlacementAsset);
    const showToolbar = useStore(state => state.ui.showToolbar);
    const showInspector = useStore(state => state.ui.showInspector);
    
    // Dynamic positioning based on other panels
    const leftMargin = showToolbar ? 'left-12' : 'left-0';
    const rightMargin = showInspector ? 'right-80' : 'right-0';

    // Group assets by broad category
    const categories = useMemo(() => {
        const entries = Object.entries(ASSETS);
        return {
            'Audio Sources': entries.filter(([_, v]) => v.type === 'speaker' || v.type === 'sub'),
            'Rigging': entries.filter(([_, v]) => v.type === 'truss' || v.type === 'motor' || v.type === 'bumper'),
            'Venue': entries.filter(([_, v]) => v.type === 'stage'),
        };
    }, []);

    return (
        <div className={`absolute bottom-0 ${leftMargin} ${rightMargin} h-48 bg-[#09090b] border-t border-white/5 pointer-events-auto flex flex-col z-30 transition-all duration-200`}>
            <div className="px-4 py-1.5 bg-[#18181b] border-b border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Browser</span>
            </div>
            
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 custom-scrollbar">
                <div className="flex gap-8">
                    {Object.entries(categories).map(([category, items]) => (
                        <div key={category} className="flex flex-col gap-2">
                             <h4 className="text-[10px] font-semibold text-gray-500 uppercase">{category}</h4>
                             <div className="flex gap-2">
                                {(items as [string, typeof ASSETS[keyof typeof ASSETS]][]).map(([key, value]) => (
                                    <AssetCard 
                                        key={key}
                                        id={key} 
                                        data={value} 
                                        isActive={activePlacementAsset === key}
                                        onClick={() => setPlacementAsset(activePlacementAsset === key ? null : key)}
                                    />
                                ))}
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
};