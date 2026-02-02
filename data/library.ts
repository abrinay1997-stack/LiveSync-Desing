import { AssetDefinition } from '../types';

export const ASSETS: Record<string, AssetDefinition> = {
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

  // --- LARGE FORMAT ---
  'la-k1': {
    name: 'K1 Stadium',
    type: 'speaker',
    dimensions: { w: 1.34, h: 0.43, d: 0.52 },
    color: '#1a1a1a',
    description: 'Large Format WST®',
    weight: 106,
    maxSPL: 149,
    dispersion: { h: 90, v: 5 },
    maxSplay: 5,
    isLineArray: true
  },
  'la-k2': {
    name: 'K2 Line Source',
    type: 'speaker',
    dimensions: { w: 1.33, h: 0.35, d: 0.40 }, 
    color: '#27272a',
    description: 'Active WST® system',
    weight: 56,
    maxSPL: 147,
    dispersion: { h: 110, v: 10 },
    maxSplay: 10,
    isLineArray: true
  },
  'la-k3': {
    name: 'K3 Long Throw',
    type: 'speaker',
    dimensions: { w: 0.95, h: 0.38, d: 0.40 },
    color: '#27272a',
    description: 'Full Range WST®',
    weight: 43,
    maxSPL: 143,
    dispersion: { h: 110, v: 10 },
    maxSplay: 10,
    isLineArray: true
  },
  'la-ks28': {
    name: 'KS28 Subwoofer',
    type: 'sub',
    dimensions: { w: 1.34, h: 0.55, d: 0.70 },
    color: '#18181b',
    description: 'Flyable dual 18"',
    weight: 79,
    maxSPL: 143,
    dispersion: { h: 360, v: 360 },
    isLineArray: true
  },
  
  // --- MEDIUM FORMAT ---
  'la-kara2': {
    name: 'Kara II',
    type: 'speaker',
    dimensions: { w: 0.73, h: 0.25, d: 0.48 },
    color: '#27272a',
    description: 'Modular Line Source',
    weight: 26,
    maxSPL: 142,
    dispersion: { h: 110, v: 10 },
    maxSplay: 10,
    isLineArray: true
  },
  'la-sb18': {
    name: 'SB18 Sub',
    type: 'sub',
    dimensions: { w: 0.75, h: 0.54, d: 0.71 },
    color: '#18181b',
    description: 'Compact 18" sub',
    weight: 52,
    maxSPL: 138,
    dispersion: { h: 360, v: 360 }
  },
  
  // --- COLUMN / INSTALL ---
  'la-syva': {
    name: 'Syva Colinear',
    type: 'speaker',
    dimensions: { w: 0.14, h: 1.30, d: 0.20 },
    color: '#202022',
    description: 'Colinear Source',
    weight: 21,
    maxSPL: 137,
    dispersion: { h: 140, v: 26 }
  },
  'la-syva-low': {
    name: 'Syva Low',
    type: 'sub',
    dimensions: { w: 0.33, h: 0.85, d: 0.35 },
    color: '#18181b',
    description: 'High Power Sub',
    weight: 29
  },

  // --- MONITORS ---
  'la-x15': {
    name: 'X15 HiQ',
    type: 'speaker',
    dimensions: { w: 0.43, h: 0.58, d: 0.37 },
    color: '#3f3f46',
    description: 'Active Stage Monitor',
    weight: 21,
    maxSPL: 138,
    dispersion: { h: 40, v: 60 }
  },
  'la-x12': {
    name: 'X12 Monitor',
    type: 'speaker',
    dimensions: { w: 0.43, h: 0.49, d: 0.37 },
    color: '#3f3f46',
    description: 'Multi-purpose',
    weight: 20,
    maxSPL: 136,
    dispersion: { h: 90, v: 60 }
  },

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