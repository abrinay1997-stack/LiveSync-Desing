import React from 'react';
import { 
    SpeakerRenderer, 
    TrussRenderer, 
    MotorRenderer, 
    ZoneRenderer, 
    GhostRenderer,
    GenericRenderer 
} from '../renderers/AssetRenderers';

interface AssetGeometryProps {
    type: string;
    dimensions?: { w: number; h: number; d: number };
    color: string;
    isGhost?: boolean;
}

export const AssetGeometry: React.FC<AssetGeometryProps> = ({ type, dimensions, color, isGhost = false }) => {
    const dims = dimensions || { w: 1, h: 1, d: 1 };

    if (isGhost) {
        return <GhostRenderer dimensions={dims} color={color} />;
    }

    switch (type) {
        case 'audience':
        case 'stage': // Reuse Zone logic for stage decks for now, or create StageRenderer later
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