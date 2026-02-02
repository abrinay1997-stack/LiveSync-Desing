import React from 'react';
import { SpeakerRenderer } from '../renderers/SpeakerRenderer';
import { TrussRenderer, MotorRenderer } from '../renderers/StructureRenderer';
import { ZoneRenderer } from '../renderers/ZoneRenderer';
import { GhostRenderer, GenericRenderer } from '../renderers/GhostRenderer';
import { LODWrapper } from './LODWrapper';

interface AssetGeometryProps {
    type: string;
    dimensions?: { w: number; h: number; d: number };
    color: string;
    isGhost?: boolean;
}

export const AssetGeometry: React.FC<AssetGeometryProps> = ({ type, dimensions, color, isGhost = false }) => {
    const dims = dimensions || { w: 1, h: 1, d: 1 };

    // Ghosts are always simple, no LOD needed
    if (isGhost) {
        return <GhostRenderer dimensions={dims} color={color} />;
    }

    const renderDetailed = () => {
        switch (type) {
            case 'audience':
            case 'stage': 
                return <ZoneRenderer dimensions={dims} color={color} />;
            
            case 'truss':
                return <TrussRenderer dimensions={dims} color={color} />;
            
            case 'motor':
                return <MotorRenderer dimensions={dims} color={color} />;
                
            case 'speaker':
            case 'sub':
                return <SpeakerRenderer dimensions={dims} color={color} />;
                
            default:
                return <GenericRenderer dimensions={dims} color={color} />;
        }
    };

    // Apply LOD only to complex objects (Speakers/Structures)
    // Zones (Audience/Stage) are usually large and simple, so we keep them detailed
    const shouldUseLOD = ['speaker', 'sub', 'truss', 'motor'].includes(type);

    if (shouldUseLOD) {
        return (
            <LODWrapper dimensions={dims} color={color}>
                {renderDetailed()}
            </LODWrapper>
        );
    }

    return renderDetailed();
};