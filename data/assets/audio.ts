import { AssetDefinition } from '../../types';

export const AUDIO_ASSETS: Record<string, AssetDefinition> = {
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
    power: 3600,
    maxSplay: 5,
    isLineArray: true,
    frequencyResponse: {
      125: 138, 250: 144, 500: 148, 1000: 149, 2000: 148, 4000: 146, 8000: 142
    },
    directivityByFreq: {
      125: { h: 140, v: 80 }, 500: { h: 100, v: 20 }, 1000: { h: 90, v: 5 }, 4000: { h: 80, v: 4 }
    }
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
    power: 2000,
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
    power: 1200,
    maxSplay: 10,
    isLineArray: true,
    frequencyResponse: {
      125: 130, 250: 137, 500: 141, 1000: 143, 2000: 142, 4000: 140, 8000: 136
    },
    directivityByFreq: {
      125: { h: 140, v: 50 }, 500: { h: 120, v: 25 }, 1000: { h: 110, v: 10 }, 4000: { h: 100, v: 8 }
    }
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
  }
};