/**
 * Acoustic Control Panel
 * 
 * UI controls for SPL coverage visualization
 */

import React, { useMemo } from 'react';
import { useStore } from '../../store';
import { Activity, Volume2, Waves } from 'lucide-react';
import { ASSETS } from '../../data/library';
import { FrequencyResponseChart } from './FrequencyResponseChart';

export const AcousticControlPanel = () => {
    const showSPLCoverage = useStore(state => state.showSPLCoverage);
    const splMeasurementHeight = useStore(state => state.splMeasurementHeight);
    const splResolution = useStore(state => state.splResolution);
    const splFrequency = useStore(state => state.splFrequency);

    const toggleSPLCoverage = useStore(state => state.toggleSPLCoverage);
    const setSPLMeasurementHeight = useStore(state => state.setSPLMeasurementHeight);
    const setSPLResolution = useStore(state => state.setSPLResolution);
    const setSPLFrequency = useStore(state => state.setSPLFrequency);

    // Feature toggles
    const showReflections = useStore(state => state.showReflections);
    const showOcclusion = useStore(state => state.showOcclusion);
    const toggleReflections = useStore(state => state.toggleReflections);
    const toggleOcclusion = useStore(state => state.toggleOcclusion);

    const objects = useStore(state => state.objects);
    const speakerCount = objects.filter(o => o.type === 'speaker' || o.type === 'sub').length;

    // Build frequency response data for chart
    const SPEAKER_COLORS = ['#3b82f6', '#f59e0b', '#22c55e', '#ef4444', '#a855f7', '#06b6d4', '#ec4899', '#84cc16'];
    const chartData = useMemo(() => {
        return objects
            .filter(o => o.type === 'speaker' || o.type === 'sub')
            .map((obj, i) => {
                const asset = ASSETS[obj.model];
                const freqResp = asset?.frequencyResponse;
                return {
                    label: asset?.name || obj.model,
                    color: SPEAKER_COLORS[i % SPEAKER_COLORS.length],
                    values: freqResp || {}
                };
            })
            .filter(d => Object.keys(d.values).length > 0);
    }, [objects]);

    return (
        <div className="p-4 space-y-4 border-t border-white/5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Waves size={18} className="text-blue-400" />
                    <h3 className="text-sm font-bold text-white">Acoustic Coverage</h3>
                </div>
                <button
                    onClick={toggleSPLCoverage}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${showSPLCoverage
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                        }`}
                    disabled={speakerCount === 0}
                >
                    {showSPLCoverage ? 'Hide' : 'Show'} Coverage
                </button>
            </div>

            {speakerCount === 0 && (
                <div className="text-xs text-gray-500 italic">
                    Add speakers to visualize coverage
                </div>
            )}

            {speakerCount > 0 && (
                <>
                    {/* Measurement Height */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-xs text-gray-400">Measurement Height</label>
                            <span className="text-xs font-mono text-blue-400">{splMeasurementHeight?.toFixed(1)}m</span>
                        </div>
                        <input
                            type="range"
                            min="0.5"
                            max="3.0"
                            step="0.1"
                            value={splMeasurementHeight || 1.7}
                            onChange={(e) => setSPLMeasurementHeight?.(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <div className="flex justify-between text-[10px] text-gray-500">
                            <span>Floor (0.5m)</span>
                            <span>Ear (1.7m)</span>
                            <span>High (3.0m)</span>
                        </div>
                    </div>

                    {/* Grid Resolution */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-xs text-gray-400">Grid Resolution</label>
                            <span className="text-xs font-mono text-blue-400">{splResolution?.toFixed(1)}m</span>
                        </div>
                        <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.5"
                            value={splResolution || 1.0}
                            onChange={(e) => setSPLResolution?.(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <div className="flex justify-between text-[10px] text-gray-500">
                            <span>Fine (0.5m)</span>
                            <span>Medium (1.0m)</span>
                            <span>Coarse (2.0m)</span>
                        </div>
                    </div>

                    {/* Frequency */}
                    <div className="space-y-2">
                        <label className="text-xs text-gray-400 block">Analysis Frequency</label>
                        <div className="grid grid-cols-4 gap-1">
                            <button
                                onClick={() => setSPLFrequency?.(0)} // 0 = Composite
                                className={`col-span-4 py-1.5 mb-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${splFrequency === 0
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                                    }`}
                            >
                                Composite (A-Weighted)
                            </button>
                            {[125, 250, 500, 1000, 2000, 4000, 8000].map(freq => (
                                <button
                                    key={freq}
                                    onClick={() => setSPLFrequency?.(freq)}
                                    className={`py-1.5 rounded text-[10px] font-mono transition-all ${splFrequency === freq
                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                        : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    {freq >= 1000 ? `${freq / 1000}k` : freq}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Advanced Acoustics Toggles */}
                    <div className="space-y-2">
                        <label className="text-xs text-gray-400 block">Advanced Acoustics</label>
                        <div className="flex flex-col gap-1.5">
                            <button
                                onClick={toggleReflections}
                                className={`flex items-center justify-between px-3 py-1.5 rounded text-xs transition-all ${showReflections
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-white/5 text-gray-500 border border-white/10 hover:bg-white/10'
                                    }`}
                            >
                                <span>Room Reflections</span>
                                <span className={`text-[10px] font-mono ${showReflections ? 'text-emerald-400' : 'text-gray-600'}`}>
                                    {showReflections ? 'ON' : 'OFF'}
                                </span>
                            </button>
                            <button
                                onClick={toggleOcclusion}
                                className={`flex items-center justify-between px-3 py-1.5 rounded text-xs transition-all ${showOcclusion
                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                    : 'bg-white/5 text-gray-500 border border-white/10 hover:bg-white/10'
                                    }`}
                            >
                                <span>Obstacle Occlusion</span>
                                <span className={`text-[10px] font-mono ${showOcclusion ? 'text-amber-400' : 'text-gray-600'}`}>
                                    {showOcclusion ? 'ON' : 'OFF'}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Frequency Response Chart */}
                    {chartData.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-white/5">
                            <div className="text-xs text-gray-400">Frequency Response</div>
                            <div className="bg-white/[0.02] rounded border border-white/5 p-1">
                                <FrequencyResponseChart data={chartData} />
                            </div>
                            {/* Legend */}
                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                                {chartData.map((d, i) => (
                                    <div key={i} className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                                        <span className="text-[9px] text-gray-500">{d.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SPL Legend */}
                    {showSPLCoverage && (
                        <div className="space-y-2 pt-3 border-t border-white/5">
                            <div className="text-xs text-gray-400 mb-2">SPL Coverage Legend</div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }} />
                                    <span className="text-[10px] text-gray-400">\u003c 85 dB - Poor</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f59e0b' }} />
                                    <span className="text-[10px] text-gray-400">85-90 dB - Acceptable</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#22c55e' }} />
                                    <span className="text-[10px] text-gray-400">90-100 dB - Good</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10b981' }} />
                                    <span className="text-[10px] text-gray-400">100-105 dB - Excellent</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#dc2626' }} />
                                    <span className="text-[10px] text-gray-400">\u003e 105 dB - Excessive</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Info */}
                    <div className="text-[10px] text-gray-500 italic pt-2 border-t border-white/5">
                        <Activity size={10} className="inline mr-1" />
                        {speakerCount} speaker{speakerCount !== 1 ? 's' : ''} active
                    </div>
                </>
            )}
        </div>
    );
};
