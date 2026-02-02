import { AssetDefinition } from '../../types';

export const VENUE_ASSETS: Record<string, AssetDefinition> = {
  // --- AUDIENCE SURFACES ---
  'audience-zone': {
    name: 'Audience Zone',
    type: 'audience',
    dimensions: { w: 10, h: 0.2, d: 10 },
    color: '#3b82f6',
    description: 'Listening Plane',
    weight: 0,
    isResizable: true
  },
  // --- VENUE ---
  'stage-deck': {
    name: 'Stage Deck 2x1',
    type: 'stage',
    dimensions: { w: 2.0, h: 0.1, d: 1.0 },
    color: '#52525b',
    description: 'Standard platform',
    weight: 35
  }
};