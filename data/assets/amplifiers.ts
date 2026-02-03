import { AssetDefinition } from '../../types';

export const AMPLIFIER_ASSETS: Record<string, AssetDefinition> = {
    'la-12x': {
        name: 'LA12X Amplified Controller',
        type: 'amplifier',
        dimensions: { w: 0.48, h: 0.09, d: 0.46 }, // 2U Rack
        color: '#0f0f0f',
        description: '4-channel amplified controller',
        weight: 14.5,
        channels: 4,
        powerAt4Ohms: 2600,
        powerAt8Ohms: 1400,
        impedance: 10000, // Input Z

        ports: [
            // Outputs
            { id: 'out-1', name: 'Out 1', type: 'speakon', direction: 'out', label: 'NL4 1/2' },
            { id: 'out-2', name: 'Out 2', type: 'speakon', direction: 'out', label: 'NL4 3/4' },
            { id: 'out-3', name: 'Out 3', type: 'speakon', direction: 'out', label: 'NL4 1/2' },
            { id: 'out-4', name: 'Out 4', type: 'speakon', direction: 'out', label: 'NL4 3/4' },

            // Inputs
            { id: 'in-a', name: 'In A', type: 'xlr', direction: 'in', label: 'Analog A' },
            { id: 'in-b', name: 'In B', type: 'xlr', direction: 'in', label: 'Analog B' },
            { id: 'in-c', name: 'In C', type: 'xlr', direction: 'in', label: 'Analog C' },
            { id: 'in-d', name: 'In D', type: 'xlr', direction: 'in', label: 'Analog D' },

            // Network
            { id: 'net-p', name: 'AVB Pri', type: 'ethercon', direction: 'bi', label: 'AVB' }
        ]
    },
    'la-4x': {
        name: 'LA4X Amplified Controller',
        type: 'amplifier',
        dimensions: { w: 0.48, h: 0.09, d: 0.46 }, // 2U
        color: '#0f0f0f',
        description: '4-channel system amp',
        weight: 12.5,
        channels: 4,
        powerAt4Ohms: 1000,
        powerAt8Ohms: 1000,

        ports: [
            { id: 'out-1', name: 'Out 1', type: 'speakon', direction: 'out' },
            { id: 'out-2', name: 'Out 2', type: 'speakon', direction: 'out' },
            { id: 'out-3', name: 'Out 3', type: 'speakon', direction: 'out' },
            { id: 'out-4', name: 'Out 4', type: 'speakon', direction: 'out' },
            { id: 'in-a', name: 'In A', type: 'xlr', direction: 'in' },
            { id: 'in-b', name: 'In B', type: 'xlr', direction: 'in' }
        ]
    }
};
