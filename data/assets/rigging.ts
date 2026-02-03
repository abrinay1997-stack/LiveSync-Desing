import { AssetDefinition } from '../../types';

export const RIGGING_ASSETS: Record<string, AssetDefinition> = {
  // --- TRUSS SECTIONS (F34 Square) ---
  'truss-05': {
    name: 'Truss Sq 0.5m',
    type: 'truss',
    dimensions: { w: 0.5, h: 0.29, d: 0.29 },
    color: '#d4d4d8',
    description: 'F34 Square Truss - 0.5m',
    weight: 3,
    capacity: 500
  },
  'truss-10': {
    name: 'Truss Sq 1m',
    type: 'truss',
    dimensions: { w: 1.0, h: 0.29, d: 0.29 },
    color: '#d4d4d8',
    description: 'F34 Square Truss - 1m',
    weight: 6,
    capacity: 500
  },
  'truss-15': {
    name: 'Truss Sq 1.5m',
    type: 'truss',
    dimensions: { w: 1.5, h: 0.29, d: 0.29 },
    color: '#d4d4d8',
    description: 'F34 Square Truss - 1.5m',
    weight: 9,
    capacity: 500
  },
  'truss-20': {
    name: 'Truss Sq 2m',
    type: 'truss',
    dimensions: { w: 2.0, h: 0.29, d: 0.29 },
    color: '#d4d4d8',
    description: 'F34 Square Truss - 2m',
    weight: 12,
    capacity: 500
  },
  'truss-25': {
    name: 'Truss Sq 2.5m',
    type: 'truss',
    dimensions: { w: 2.5, h: 0.29, d: 0.29 },
    color: '#d4d4d8',
    description: 'F34 Square Truss - 2.5m',
    weight: 15,
    capacity: 500
  },
  'truss-30': {
    name: 'Truss Sq 3m',
    type: 'truss',
    dimensions: { w: 3.0, h: 0.29, d: 0.29 },
    color: '#d4d4d8',
    description: 'F34 Square Truss - 3m',
    weight: 18,
    capacity: 500
  },
  'truss-40': {
    name: 'Truss Sq 4m',
    type: 'truss',
    dimensions: { w: 4.0, h: 0.29, d: 0.29 },
    color: '#d4d4d8',
    description: 'F34 Square Truss - 4m',
    weight: 24,
    capacity: 500
  },

  // --- CORNER PIECES ---
  'truss-corner-2way': {
    name: 'Corner 2-Way 90°',
    type: 'truss',
    dimensions: { w: 0.29, h: 0.29, d: 0.29 },
    color: '#a1a1aa',
    description: 'F34 90° Corner - 2 Way',
    weight: 4,
    capacity: 400
  },
  'truss-corner-3way': {
    name: 'Corner 3-Way',
    type: 'truss',
    dimensions: { w: 0.29, h: 0.29, d: 0.29 },
    color: '#a1a1aa',
    description: 'F34 T-Junction - 3 Way',
    weight: 5,
    capacity: 400
  },
  'truss-corner-4way': {
    name: 'Corner 4-Way',
    type: 'truss',
    dimensions: { w: 0.29, h: 0.29, d: 0.29 },
    color: '#a1a1aa',
    description: 'F34 Cross - 4 Way',
    weight: 6,
    capacity: 400
  },
  'truss-corner-6way': {
    name: 'Corner 6-Way',
    type: 'truss',
    dimensions: { w: 0.29, h: 0.29, d: 0.29 },
    color: '#a1a1aa',
    description: 'F34 Cube Corner - 6 Way',
    weight: 8,
    capacity: 400
  },
  'motor-1t': {
    name: 'Motor 1T D8+',
    type: 'motor',
    dimensions: { w: 0.3, h: 0.4, d: 0.2 },
    color: '#facc15',
    description: 'Chainmaster 1T',
    weight: 45, // Motor body weight
    capacity: 1000 // kg WLL (1 ton motor)
  },
  'motor-2t': {
    name: 'Motor 2T D8',
    type: 'motor',
    dimensions: { w: 0.35, h: 0.5, d: 0.25 },
    color: '#ca8a04',
    description: 'Heavy Duty 2T',
    weight: 65,
    capacity: 2000 // kg WLL (2 ton motor)
  },
  'bumper-k2': {
    name: 'K2-BUMPER',
    type: 'bumper',
    dimensions: { w: 1.3, h: 0.15, d: 1.2 },
    color: '#3f3f46',
    description: 'Flying frame',
    weight: 85,
    capacity: 800 // kg WLL for array bumper
  }
};