import React from 'react';
import { SceneObject } from '../../types';
import { NumericInput } from '../ui/NumericInput';
import { Section } from './Section';
import { LayoutTemplate } from 'lucide-react';

export const GeometryInspector = ({ object, onUpdate }: { object: SceneObject, onUpdate: (id: string, data: any) => void }) => {
    if (!object.dimensions) return null;
    return (
        <Section title="Geometry Dimensions">
            <div className="space-y-2">
                <div className="text-[10px] text-gray-500 flex items-center gap-2 mb-2">
                    <LayoutTemplate size={12} className="text-aether-accent"/>
                    Plane Size
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <NumericInput 
                        label="Width (X)" 
                        value={object.dimensions.w} 
                        onChange={(v) => onUpdate(object.id, { dimensions: { ...object.dimensions!, w: Math.max(0.1, v) } })}
                        step={0.5}
                    />
                    <NumericInput 
                        label="Depth (Z)" 
                        value={object.dimensions.d} 
                        onChange={(v) => onUpdate(object.id, { dimensions: { ...object.dimensions!, d: Math.max(0.1, v) } })}
                        step={0.5}
                    />
                </div>
                <div className="mt-2">
                    <div className="text-[10px] text-gray-400 mb-1">Tip: Use Rotation X to create Raked Seating</div>
                </div>
            </div>
        </Section>
    );
};