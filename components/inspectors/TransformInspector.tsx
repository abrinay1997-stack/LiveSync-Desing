import React from 'react';
import { SceneObject } from '../../types';
import { NumericInput } from '../ui/NumericInput';
import { Section } from './Section';

export const TransformInspector = ({ object, onUpdate }: { object: SceneObject, onUpdate: (id: string, data: any) => void }) => (
    <Section title="Transform">
        <div className="grid grid-cols-1 gap-3">
             <div>
                 <div className="text-[10px] text-gray-500 mb-1.5 flex justify-between">
                    <span>Position</span>
                    <span className="text-gray-700">Meters</span>
                 </div>
                 <div className="grid grid-cols-3 gap-2">
                    <NumericInput label="X" value={object.position[0]} onChange={(v) => onUpdate(object.id, { position: [v, object.position[1], object.position[2]] })} />
                    <NumericInput label="Y" value={object.position[1]} onChange={(v) => onUpdate(object.id, { position: [object.position[0], v, object.position[2]] })} />
                    <NumericInput label="Z" value={object.position[2]} onChange={(v) => onUpdate(object.id, { position: [object.position[0], object.position[1], v] })} />
                 </div>
             </div>
             <div>
                 <div className="text-[10px] text-gray-500 mb-1.5 flex justify-between">
                    <span>Rotation</span>
                    <span className="text-gray-700">Radians</span>
                 </div>
                 <div className="grid grid-cols-3 gap-2">
                    <NumericInput label="X" value={object.rotation[0]} onChange={(v) => onUpdate(object.id, { rotation: [v, object.rotation[1], object.rotation[2]] })} />
                    <NumericInput label="Y" value={object.rotation[1]} onChange={(v) => onUpdate(object.id, { rotation: [object.rotation[0], v, object.rotation[2]] })} />
                    <NumericInput label="Z" value={object.rotation[2]} onChange={(v) => onUpdate(object.id, { rotation: [object.rotation[0], object.rotation[1], v] })} />
                 </div>
             </div>
        </div>
    </Section>
);