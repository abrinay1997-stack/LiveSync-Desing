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
            className={`group flex flex-col w-28 shrink-0 text-left bg-[#18181b] hover:bg-[#202022] border rounded-lg p-1.5 transition-all ${
                isActive ? 'border-aether-accent/50 ring-1 ring-aether-accent/20 bg-aether-accent/5' : 'border-white/5 hover:border-white/20'
            }`}
        >
            <div className="h-16 w-full bg-black/40 rounded mb-2 flex items-center justify-center relative overflow-hidden group-hover:bg-black/60 transition-colors">
                <div className={`w-1.5 h-1.5 rounded-full absolute top-1.5 right-1.5 ${data.type.includes('speaker') ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
                <Icon className={`transition opacity-60 group-hover:opacity-100 group-hover:scale-110 duration-300 ${isActive ? 'text-aether-accent' : 'text-gray-400'}`} size={20} />
            </div>
            <span className={`text-[10px] font-semibold truncate w-full mb-0.5 ${isActive ? 'text-aether-accent' : 'text-gray-200'}`}>{data.name}</span>
            <span className="text-[9px] text-gray-500 truncate w-full">{data.description}</span>
        </button>
    )
}

export const LibraryPanel = () => {
    const setPlacementAsset = useStore(state => state.setPlacementAsset);
    const activePlacementAsset = useStore(state => state.activePlacementAsset);
    const showToolbar = useStore(state => state.ui.showToolbar);
    const showInspector = useStore(state => state.ui.showInspector);
    
    // Dynamic positioning based on other panels
    const leftMargin = showToolbar ? 'left-16' : 'left-0';
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
        <div className={`absolute bottom-4 ${leftMargin} ${rightMargin} h-40 pointer-events-none flex flex-col z-30 transition-all duration-300`}>
             {/* Floating Container */}
            <div className="mx-4 h-full bg-[#09090b]/90 backdrop-blur-md border border-white/5 rounded-xl pointer-events-auto flex flex-col shadow-2xl overflow-hidden">
                <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Asset Browser</span>
                    <span className="text-[9px] text-gray-600">v2.1.0 Library</span>
                </div>
                
                <div className="flex-1 overflow-x-auto overflow-y-hidden p-3 custom-scrollbar">
                    <div className="flex gap-6">
                        {Object.entries(categories).map(([category, items]) => (
                            <div key={category} className="flex flex-col gap-2 relative">
                                <h4 className="text-[9px] font-semibold text-gray-500 uppercase sticky left-0">{category}</h4>
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
                                <div className="absolute right-0 top-6 bottom-0 w-px bg-white/5"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
};