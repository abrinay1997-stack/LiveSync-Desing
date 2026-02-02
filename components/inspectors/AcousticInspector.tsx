import React from 'react';
import { SceneObject } from '../../types';
import { ASSETS } from '../../data/library';
import { Section } from './Section';

export const AcousticInspector = ({ object }: { object: SceneObject }) => {
    const specs = ASSETS[object.model];
    if (!specs) return null;

    return (
        <Section title="Acoustic Data">
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Max SPL (1m)</span>
                    <span className="text-xs font-mono text-aether-accent">{specs.maxSPL ? `${specs.maxSPL} dB` : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Dispersion (HxV)</span>
                    <span className="text-xs font-mono text-white">{specs.dispersion ? `${specs.dispersion.h}° x ${specs.dispersion.v}°` : 'Omni'}</span>
                </div>
            </div>
        </Section>
    );
}