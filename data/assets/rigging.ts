import { AssetDefinition } from '../../types';

export const RIGGING_ASSETS: Record<string, AssetDefinition> = {
  // --- RIGGING ---
  'truss-30': {
    name: 'Truss Sq 3m',
    type: 'truss',
    dimensions: { w: 3.0, h: 0.29, d: 0.29 },
    color: '#d4d4d8',
    description: 'F34 Square Truss',
    weight: 18
  },
  'truss-20': {
    name: 'Truss Sq 2m',
    type: 'truss',
    dimensions: { w: 2.0, h: 0.29, d: 0.29 },
    color: '#d4d4d8',
    description: 'F34 Square Truss',
    weight: 12
  },
  'truss-10': {
    name: 'Truss Sq 1m',
    type: 'truss',
    dimensions: { w: 1.0, h: 0.29, d: 0.29 },
    color: '#d4d4d8',
    description: 'F34 Square Truss',
    weight: 6
  },
  'truss-corner': {
     name: 'Truss Corner 3-Way',
     type: 'truss',
     dimensions: { w: 0.5, h: 0.5, d: 0.5 },
     color: '#d4d4d8',
     description: 'Corner Block',
     weight: 8
  },
  'motor-1t': {
    name: 'Motor 1T D8+',
    type: 'motor',
    dimensions: { w: 0.3, h: 0.4, d: 0.2 },
    color: '#facc15',
    description: 'Chainmaster 1T',
    weight: 45 // Motor body weight
  },
  'motor-2t': {
    name: 'Motor 2T D8',
    type: 'motor',
    dimensions: { w: 0.35, h: 0.5, d: 0.25 },
    color: '#ca8a04',
    description: 'Heavy Duty 2T',
    weight: 65 
  },
  'bumper-k2': {
    name: 'K2-BUMPER',
    type: 'bumper',
    dimensions: { w: 1.3, h: 0.15, d: 1.2 },
    color: '#3f3f46',
    description: 'Flying frame',
    weight: 85
  }
};