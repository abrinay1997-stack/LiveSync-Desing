import { Vector3, Euler } from 'three';
import React from 'react';

export type ViewMode = 'perspective' | 'top' | 'side';
export type ToolType = 'select' | 'move' | 'rotate' | 'tape' | 'label' | 'cable' | 'eraser';
export type AssetType = 'speaker' | 'sub' | 'bumper' | 'truss' | 'motor' | 'stage' | 'audience';

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
}

export interface Cable {
  id: string;
  startObjectId: string;
  endObjectId: string;
  color: string;
  type: 'signal' | 'power' | 'network';
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
  power?: number; // Watts
  // Restrictions
  maxSplay?: number;
  isLineArray?: boolean; // New flag for auto-configuration
  isResizable?: boolean; // Allows W/D/H modification in Inspector
}