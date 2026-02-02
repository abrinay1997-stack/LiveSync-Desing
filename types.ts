import { Vector3, Euler } from 'three';
import React from 'react';

export type ViewMode = 'perspective' | 'top' | 'side';
export type ToolType = 'select' | 'move' | 'rotate' | 'tape' | 'label' | 'cable';
export type AssetType = 'speaker' | 'sub' | 'bumper' | 'truss' | 'motor' | 'stage';

export interface SceneObject {
  id: string;
  name: string;
  model: string; // Reference to the ASSETS key (e.g., 'la-k2')
  type: AssetType;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  layerId: string;
  color: string;
  dimensions?: { w: number; h: number; d: number };
  locked?: boolean;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  color: string;
}

export interface Measurement {
    id: string;
    start: [number, number, number];
    end: [number, number, number];
    distance: number;
}

interface AssetDefinition {
    name: string;
    type: AssetType;
    dimensions: { w: number; h: number; d: number };
    color: string;
    description: string;
    // Technical Specs for Engineering
    weight: number; // kg
    maxSPL?: number; // dB
    dispersion?: { h: number; v: number }; // degrees
    power?: number; // Watts
}

export const ASSETS: Record<string, AssetDefinition> = {
  // --- LARGE FORMAT ---
  'la-k2': {
    name: 'K2 Line Source',
    type: 'speaker',
    dimensions: { w: 1.33, h: 0.35, d: 0.40 }, 
    color: '#27272a',
    description: 'Active WST® system',
    weight: 56,
    maxSPL: 147,
    dispersion: { h: 110, v: 10 }
  },
  'la-ks28': {
    name: 'KS28 Subwoofer',
    type: 'sub',
    dimensions: { w: 1.34, h: 0.55, d: 0.70 },
    color: '#18181b',
    description: 'Flyable dual 18"',
    weight: 79,
    maxSPL: 143,
    dispersion: { h: 360, v: 360 }
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
    dispersion: { h: 110, v: 10 }
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

  // --- RIGGING ---
  'truss-30': {
    name: 'Global Truss F34 (3m)',
    type: 'truss',
    dimensions: { w: 3.0, h: 0.29, d: 0.29 },
    color: '#d4d4d8',
    description: 'Square truss 3m',
    weight: 18
  },
  'truss-20': {
    name: 'Global Truss F34 (2m)',
    type: 'truss',
    dimensions: { w: 2.0, h: 0.29, d: 0.29 },
    color: '#d4d4d8',
    description: 'Square truss 2m',
    weight: 12
  },
  'truss-10': {
    name: 'Global Truss F34 (1m)',
    type: 'truss',
    dimensions: { w: 1.0, h: 0.29, d: 0.29 },
    color: '#d4d4d8',
    description: 'Square truss 1m',
    weight: 6
  },
  'motor-1t': {
    name: 'Chainmaster 1T',
    type: 'motor',
    dimensions: { w: 0.3, h: 0.4, d: 0.2 },
    color: '#facc15',
    description: 'D8+ Chain Hoist',
    weight: 45 // Motor body weight
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

// Augment global JSX namespace for backward compatibility and R3F support
declare global {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      pointLight: any;
      directionalLight: any;
      spotLight: any;
      mesh: any;
      group: any;
      position: any;
      boxGeometry: any;
      planeGeometry: any;
      sphereGeometry: any;
      cylinderGeometry: any;
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      primitive: any;
      bufferGeometry: any;
      lineBasicMaterial: any;
      [elemName: string]: any;
    }
  }
}