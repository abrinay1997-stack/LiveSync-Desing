import { AssetDefinition } from '../types';
import { AUDIO_ASSETS } from './assets/audio';
import { RIGGING_ASSETS } from './assets/rigging';
import { VENUE_ASSETS } from './assets/venue';
import { AMPLIFIER_ASSETS } from './assets/amplifiers';

export const ASSETS: Record<string, AssetDefinition> = {
    ...AUDIO_ASSETS,
    ...RIGGING_ASSETS,
    ...VENUE_ASSETS,
    ...AMPLIFIER_ASSETS
};