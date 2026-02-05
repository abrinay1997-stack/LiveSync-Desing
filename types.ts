import { Vector3, Euler } from 'three';
import React from 'react';

// System Engineering Types
export type ViewMode = 'perspective' | 'top' | 'side';
export type ToolType = 'select' | 'box-select' | 'lasso-select' | 'move' | 'rotate' | 'tape' | 'label' | 'cable' | 'eraser';

export type PortType = 'xlr' | 'speakon' | 'powercon' | 'ethercon' | 'generic';
export type PortDirection = 'in' | 'out' | 'bi';

export interface PortDefinition {
  id: string;
  name: string;
  type: PortType;
  direction: PortDirection;
  label?: string; // e.g. "Ch 1" or "Link Out"
}

export type AssetType = 'speaker' | 'sub' | 'bumper' | 'truss' | 'motor' | 'stage' | 'audience' | 'amplifier' | 'processor' | 'console';

export interface ArrayConfig {
  enabled: boolean;
  boxCount: number;
  siteAngle: number; // The tilt of the bumper/top grid
  splayAngles: number[]; // Angles between boxes
  showThrowLines: boolean;
  throwDistance: number;
}

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

  // Audio Engineering Data
  arrayConfig?: ArrayConfig;

  // Phase 6: System State
  // We might store patch state here or in a separate Connection Store
  // For now, let's assume cables define the state, but objects might need override settings
  customLabel?: string;
}

export interface Cable {
  id: string;
  startObjectId: string;
  startPortId?: string; // Phase 6: Specific port
  endObjectId: string;
  endPortId?: string;   // Phase 6: Specific port
  color: string;
  type: 'signal' | 'power' | 'network';
  length?: number;      // Calculated length
  slack?: number;       // Extra length for draping
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

export interface AssetDefinition {
  name: string;
  type: AssetType;
  dimensions: { w: number; h: number; d: number };
  color: string;
  description: string;
  // Technical Specs for Engineering
  weight: number; // kg
  capacity?: number; // Working Load Limit (WLL) in kg, for rigging equipment
  maxSPL?: number; // dB
  dispersion?: { h: number; v: number }; // degrees
  power?: number; // Watts (General consumption or capacity)

  // Phase 6: Electrical & Connectivity
  impedance?: number;     // Ohms (Nominal)
  rmsPower?: number;      // Watts (Continuous)
  peakPower?: number;     // Watts (Peak)
  ports?: PortDefinition[]; // Connectivity points

  // Amplifier Specifics
  channels?: number;
  powerAt4Ohms?: number;  // Watts per channel
  powerAt8Ohms?: number;  // Watts per channel

  // Restrictions

  // Restrictions
  maxSplay?: number;
  isLineArray?: boolean; // New flag for auto-configuration
  isResizable?: boolean; // Allows W/D/H modification in Inspector

  // Multi-frequency support (Phase 4)
  frequencyResponse?: Partial<Record<125 | 250 | 500 | 1000 | 2000 | 4000 | 8000, number>>;
  directivityByFreq?: Partial<Record<125 | 250 | 500 | 1000 | 2000 | 4000 | 8000, { h: number; v: number }>>;
}