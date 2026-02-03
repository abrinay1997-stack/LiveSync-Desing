import { describe, test, expect } from 'vitest';
import { ASSETS } from '../library';

const OCTAVE_BANDS = [125, 250, 500, 1000, 2000, 4000, 8000] as const;

const speakers = Object.entries(ASSETS).filter(([, a]) => a.type === 'speaker');
const subs = Object.entries(ASSETS).filter(([, a]) => a.type === 'sub');

describe('Asset library - speakers', () => {
  test.each(speakers)(
    '%s has required fields (name, type, dimensions, weight)',
    (key, asset) => {
      expect(asset.name).toBeDefined();
      expect(asset.type).toBe('speaker');
      expect(asset.dimensions).toBeDefined();
      expect(asset.dimensions.w).toBeGreaterThan(0);
      expect(asset.dimensions.h).toBeGreaterThan(0);
      expect(asset.dimensions.d).toBeGreaterThan(0);
      expect(asset.weight).toBeGreaterThan(0);
    }
  );

  test.each(speakers)(
    '%s has frequencyResponse and directivityByFreq',
    (key, asset) => {
      expect(asset.frequencyResponse).toBeDefined();
      expect(asset.directivityByFreq).toBeDefined();
    }
  );

  test.each(speakers)(
    '%s frequencyResponse has all 7 octave bands',
    (key, asset) => {
      for (const band of OCTAVE_BANDS) {
        expect(asset.frequencyResponse![band]).toBeDefined();
      }
    }
  );

  test.each(speakers)(
    '%s maxSPL matches the 1kHz band in frequencyResponse',
    (key, asset) => {
      if (asset.maxSPL !== undefined) {
        expect(asset.maxSPL).toBe(asset.frequencyResponse![1000]);
      }
    }
  );

  test.each(speakers)(
    '%s has positive dispersion values',
    (key, asset) => {
      if (asset.dispersion) {
        expect(asset.dispersion.h).toBeGreaterThan(0);
        expect(asset.dispersion.v).toBeGreaterThan(0);
      }
    }
  );
});

describe('Asset library - line array speakers', () => {
  const lineArrays = speakers.filter(([, a]) => a.isLineArray);

  test.each(lineArrays)(
    '%s has isLineArray=true and maxSplay defined',
    (key, asset) => {
      expect(asset.isLineArray).toBe(true);
      expect(asset.maxSplay).toBeDefined();
      expect(asset.maxSplay).toBeGreaterThan(0);
    }
  );
});

describe('Asset library - subs', () => {
  test.each(subs)(
    '%s has frequencyResponse',
    (key, asset) => {
      expect(asset.frequencyResponse).toBeDefined();
    }
  );

  test.each(subs)(
    '%s frequencyResponse has all 7 octave bands',
    (key, asset) => {
      for (const band of OCTAVE_BANDS) {
        expect(asset.frequencyResponse![band]).toBeDefined();
      }
    }
  );
});
