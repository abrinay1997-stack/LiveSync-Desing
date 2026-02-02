import React, { useState, useEffect, useRef } from 'react';
import { MousePointer2 } from 'lucide-react';

interface NumericInputProps {
    value: number;
    onChange: (val: number) => void;
    step?: number;
    label?: string;
    sensitivity?: number;
}

export const NumericInput: React.FC<NumericInputProps> = ({ value, onChange, step = 0.1, label, sensitivity = 0.05 }) => {
    const [localValue, setLocalValue] = useState(value.toString());
    const [isScrubbing, setIsScrubbing] = useState(false);
    const startX = useRef<number>(0);
    const startValue = useRef<number>(0);

    useEffect(() => {
        if (!isScrubbing) {
            setLocalValue(value.toFixed(2));
        }
    }, [value, isScrubbing]);

    const handleBlur = () => {
        const num = parseFloat(localValue);
        if (!isNaN(num)) {
            onChange(num);
            setLocalValue(num.toFixed(2));
        } else {
            setLocalValue(value.toFixed(2));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
            (e.currentTarget as HTMLInputElement).blur();
        }
    };

    // Scrubbing Logic
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsScrubbing(true);
        startX.current = e.clientX;
        startValue.current = value;
        
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - startX.current;
        const newValue = startValue.current + (deltaX * sensitivity);
        // Round to avoid floating point weirdness
        const rounded = Math.round(newValue * 100) / 100;
        onChange(rounded);
        setLocalValue(rounded.toFixed(2));
    };

    const handleMouseUp = () => {
        setIsScrubbing(false);
        document.body.style.cursor = 'auto';
        document.body.style.userSelect = 'auto';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    return (
        <div className="flex flex-col group">
             {label && (
                 <label 
                    className={`text-[10px] mb-1 cursor-ew-resize select-none flex items-center gap-1 transition-colors ${isScrubbing ? 'text-aether-accent' : 'text-aether-500 group-hover:text-gray-300'}`}
                    onMouseDown={handleMouseDown}
                    title="Drag to adjust"
                >
                    {label}
                 </label>
             )}
             <input 
                type="text" 
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={`bg-black/20 border rounded px-2 py-1.5 text-xs text-right font-mono focus:outline-none transition-colors ${
                    isScrubbing 
                    ? 'border-aether-accent text-aether-accent bg-aether-accent/10' 
                    : 'border-white/10 text-gray-300 focus:border-aether-accent/50 focus:bg-white/5'
                }`}
             />
        </div>
    )
};