import React, { useMemo } from 'react';
import { useStore } from '../../store';
import { ASSETS } from '../../data/library';
import { calculateChannelImpedance, calculateHeadroom } from '../../utils/system/electricalAnalysis';
import { AlertTriangle, CheckCircle, Zap } from 'lucide-react';

export const SystemMonitorPanel = () => {
    const objects = useStore(state => state.objects);
    const cables = useStore(state => state.system.cables);

    // Filter only amplifiers
    const amplifiers = useMemo(() => objects.filter(o => {
        const asset = ASSETS[o.model];
        return asset && asset.type === 'amplifier';
    }), [objects]);

    if (amplifiers.length === 0) return null;

    // Helper to calculate load per channel for an amp
    const getAmpStats = (ampObject: any) => {
        const asset = ASSETS[ampObject.model];
        if (!asset || !asset.channels) return [];

        const channels = [];
        for (let i = 1; i <= asset.channels; i++) {
            // Find speakers connected to this channel (via Output ports)
            // Simplified logic: trace cables starting from this Amp's Output ports
            // For MVP, we assume port ID convention "out-1", "out-2" etc or label matching
            // We need to trace the graph. For now, let's find cables directly connecting Amp -> Speaker
            // Phase 6 TODO: Full graph traversal. Here we check direct connections.

            const connectedCables = cables.filter(c => c.startObjectId === ampObject.id); // && c.startPortId === `out-${i}`

            // Find speakers at the end of these cables
            const speakers = connectedCables.map(c => objects.find(o => o.id === c.endObjectId)).filter(o => o);

            // Get impedance of each speaker
            const loads = speakers.map(s => {
                const sAsset = ASSETS[s!.model];
                return sAsset?.impedance || 0;
            });

            // Calculate total Z
            const totalZ = calculateChannelImpedance(loads); // Parallel

            // Check headroom
            // Taking max RMS of connected speakers? Or sum?
            // Usually speakers in parallel share voltage. Power = V^2/R.
            // If Amp provides 1000W @ 4Ohm -> V = sqrt(1000*4) = 63V.
            // Power delivered to speaker = 63^2 / 8 = 500W.
            // Simplified check: Total RMS handling vs Amp Power
            const totalRMS = speakers.reduce((acc, s) => acc + (ASSETS[s!.model]?.rmsPower || 0), 0);

            // Amp power at this load? Interpolate linearly between 8 and 4 ohms?
            // P_load = P_4 * (4/Z)? Approx.
            let availablePower = asset.powerAt4Ohms || 2000;
            if (totalZ > 4) {
                // rough approx
                availablePower = availablePower * (4 / totalZ);
            }

            const { headroomDB, status } = calculateHeadroom(availablePower, totalRMS, totalRMS * 2);

            channels.push({
                id: i,
                impedance: totalZ,
                speakerCount: speakers.length,
                headroom: headroomDB,
                status,
                power: availablePower
            });
        }
        return channels;
    };

    return (
        <div className="bg-[#09090b] border-t border-white/10 mt-4 p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Zap size={14} className="text-yellow-500" /> System Monitor
            </h3>

            <div className="space-y-4">
                {amplifiers.map(amp => {
                    const stats = getAmpStats(amp);
                    return (
                        <div key={amp.id} className="bg-white/5 rounded border border-white/10 p-3">
                            <div className="text-xs font-bold text-gray-200 mb-2">{amp.name}</div>

                            <div className="space-y-2">
                                {stats.map(ch => (
                                    <div key={ch.id} className="flex items-center justify-between text-[10px] bg-black/20 p-1.5 rounded">
                                        <div className="flex items-center gap-2 w-1/3">
                                            <span className="text-gray-500">CH {ch.id}</span>
                                            <span className="text-gray-300">{ch.speakerCount} Spk</span>
                                        </div>

                                        <div className="w-1/3 text-center">
                                            {ch.speakerCount > 0 ? (
                                                <span className={`${ch.impedance < 2.5 ? 'text-red-500 font-bold' : 'text-emerald-400'}`}>
                                                    {ch.impedance.toFixed(1)} Ω
                                                </span>
                                            ) : (
                                                <span className="text-gray-600">-</span>
                                            )}
                                        </div>

                                        <div className="w-1/3 flex justify-end">
                                            {ch.speakerCount > 0 && (
                                                <span className={`flex items-center gap-1 ${ch.status === 'clip' ? 'text-red-500' : 'text-emerald-500'}`}>
                                                    {ch.status === 'clip' ? <AlertTriangle size={10} /> : <CheckCircle size={10} />}
                                                    {ch.headroom.toFixed(1)} dB
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
