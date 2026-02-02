import React, { useMemo, useState } from 'react';
import { useStore } from '../../store';
import { ASSETS } from '../../data/library';
import { Box, Speaker, Anchor, Component, Users, Search, Component as ComponentIcon } from 'lucide-react';

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
        if (data.type === 'truss') return Component; // Trussing
        if (data.type === 'motor') return Anchor; // Rigging/Motors
        if (data.type === 'audience') return Users;
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
                <div className={`w-1.5 h-1.5 rounded-full absolute top-1.5 right-1.5 ${data.type.includes('speaker') ? 'bg-blue-500' : data.type.includes('motor') ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
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
    
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('All');
    
    // Dynamic positioning based on other panels
    const leftMargin = showToolbar ? 'left-16' : 'left-0';
    const rightMargin = showInspector ? 'right-80' : 'right-0';

    // Group assets by broad category
    const categories = useMemo(() => {
        const entries = Object.entries(ASSETS).filter(([key, val]) => {
            const matchesSearch = val.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  val.description.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch;
        });

        const grouped = {
            'Geometry': entries.filter(([_, v]) => v.type === 'audience' || v.type === 'stage'),
            'Audio Sources': entries.filter(([_, v]) => v.type === 'speaker' || v.type === 'sub'),
            'Rigging': entries.filter(([_, v]) => v.type === 'truss' || v.type === 'motor' || v.type === 'bumper'),
        };

        return grouped;
    }, [searchTerm]);

    const availableCategories = ['All', 'Audio Sources', 'Rigging', 'Geometry'];

    return (
        <div className={`absolute bottom-4 ${leftMargin} ${rightMargin} h-48 pointer-events-none flex flex-col z-30 transition-all duration-300`}>
             {/* Floating Container */}
            <div className="mx-4 h-full bg-[#09090b]/90 backdrop-blur-md border border-white/5 rounded-xl pointer-events-auto flex flex-col shadow-2xl overflow-hidden">
                <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                             Asset Browser
                        </span>
                        
                        {/* Categories Filter */}
                        <div className="flex gap-1">
                            {availableCategories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-2 py-0.5 rounded text-[10px] transition-colors ${activeCategory === cat ? 'bg-aether-accent text-black font-semibold' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-48">
                        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500"/>
                        <input 
                            type="text" 
                            placeholder="Filter..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-full py-1 pl-7 pr-2 text-[10px] text-white focus:outline-none focus:border-aether-accent/30"
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-x-auto overflow-y-hidden p-3 custom-scrollbar bg-[#0c0c0e]">
                    <div className="flex gap-6">
                        {Object.entries(categories).map(([category, rawItems]) => {
                             const items = rawItems as [string, typeof ASSETS[keyof typeof ASSETS]][];

                             if (activeCategory !== 'All' && activeCategory !== category) return null;
                             if (items.length === 0) return null;

                             return (
                                <div key={category} className="flex flex-col gap-2 relative">
                                    <h4 className="text-[9px] font-semibold text-gray-500 uppercase sticky left-0 mb-1">{category}</h4>
                                    <div className="flex gap-2">
                                        {items.map(([key, value]) => (
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
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
};