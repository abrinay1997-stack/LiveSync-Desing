import React, { useMemo } from 'react';
import { Box, Speaker, Anchor, Component, Users } from 'lucide-react';

interface AssetCardProps {
    id: string;
    data: any;
    isActive: boolean;
    onClick: () => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({ id, data, isActive, onClick }) => {
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
};