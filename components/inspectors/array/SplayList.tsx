import React from 'react';
import { NumericInput } from '../../ui/NumericInput';

interface SplayListProps {
    boxCount: number;
    splayAngles: number[];
    siteAngle: number;
    onUpdateSplay: (index: number, angle: number) => void;
}

export const SplayList: React.FC<SplayListProps> = ({ boxCount, splayAngles, siteAngle, onUpdateSplay }) => {
    // Calculate Total Angle safely
    const totalAngle = (splayAngles.slice(0, boxCount).reduce((a, b) => a + b, 0) + siteAngle).toFixed(1);

    return (
        <div className="bg-black/20 rounded border border-white/5 p-2">
            <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-gray-400 font-mono uppercase">Inter-element Angles</span>
                    <span className="text-[9px] text-aether-500 bg-aether-accent/10 px-1 rounded">Total: {totalAngle}°</span>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                {Array.from({ length: boxCount }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-2">
                            <div className="w-4 text-[9px] text-gray-600 font-mono text-right">{i+1}</div>
                            <div className="w-1 h-1 rounded-full bg-gray-700"></div>
                        </div>
                        <div className="w-20">
                            <NumericInput 
                                value={splayAngles[i] || 0} 
                                onChange={(v) => onUpdateSplay(i, v)}
                                step={0.5}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};