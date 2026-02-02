import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export const Section = ({ title, children, defaultOpen = true }: { title: string, children?: React.ReactNode, defaultOpen?: boolean }) => {
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
};