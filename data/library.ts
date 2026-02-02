import { AssetDefinition } from '../types';
import { AUDIO_ASSETS } from './assets/audio';
import { RIGGING_ASSETS } from './assets/rigging';
import { VENUE_ASSETS } from './assets/venue';

export const ASSETS: Record<string, AssetDefinition> = {
    ...AUDIO_ASSETS,
    ...RIGGING_ASSETS,
    ...VENUE_ASSETS
};