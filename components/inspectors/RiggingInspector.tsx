/**
 * Rigging Inspector
 * Real-time rigging calculations using physics worker
 */

import React, { useEffect, useState } from 'react';
import { Section } from './Section';
import { useStore } from '../../store';
import { usePhysicsWorker } from '../../hooks/usePhysicsWorker';
import { ASSETS } from '../../data/library';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import type { LoadDistributionParams, LoadDistributionResult } from '../../utils/physics/loadDistribution';

export const RiggingInspector = () => {
    const objects = useStore(state => state.objects);
    const selectedIds = useStore(state => state.selectedIds);
    const { calculate, isReady } = usePhysicsWorker();

    const [result, setResult] = useState<LoadDistributionResult | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selection = objects.filter(o => selectedIds.includes(o.id));

    // Calculate total weight of selection
    const totalSelectedWeight = selection.reduce((acc, obj) => {
        const asset = ASSETS[obj.model];
        return acc + (asset?.weight || 0);
    }, 0);

    // Check if selection contains rigging infrastructure
    const hasRigging = selection.some(o => o.type === 'motor' || o.type === 'truss');
    const hasSpeakers = selection.some(o => o.type === 'speaker' || o.type === 'sub');

    // Run calculation when selection changes
    useEffect(() => {
        if (!isReady || !hasRigging || selection.length === 0) {
            setResult(null);
            return;
        }

        setIsCalculating(true);
        setError(null);

        // Build rigging points from motors/trusses
        const riggingPoints = selection
            .filter(o => o.type === 'motor' || o.type === 'truss')
            .map(o => {
                const asset = ASSETS[o.model];
                return {
                    id: o.id,
                    position: o.position,
                    type: o.type as 'motor' | 'truss',
                    capacity: asset?.capacity // WLL in kg
                };
            });

        // Build suspended loads from speakers
        const loads = selection
            .filter(o => o.type === 'speaker' || o.type === 'sub')
            .map(o => {
                const asset = ASSETS[o.model];
                // Find closest rigging point (simplified - would need proper attachment logic)
                const closestRigging = riggingPoints[0]; // For MVP, attach to first rigging point

                return {
                    id: o.id,
                    weight: asset?.weight || 0,
                    position: o.position,
                    attachedTo: closestRigging ? [closestRigging.id] : []
                };
            });

        const params: LoadDistributionParams = {
            riggingPoints,
            loads
        };

        calculate<LoadDistributionResult>('loadDistribution', params)
            .then(res => {
                setResult(res);
                setIsCalculating(false);
            })
            .catch(err => {
                setError(err.message);
                setIsCalculating(false);
            });

    }, [selection, isReady, calculate, hasRigging]);

    if (!hasRigging) return null;

    return (
        <Section title="Rigging Analysis">
            <div className="space-y-3">
                {/* Total Weight */}
                <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Total Weight</span>
                    <span className="text-xs font-mono text-amber-500">{totalSelectedWeight.toFixed(1)} kg</span>
                </div>

                {/* Calculation Status */}
                {isCalculating && (
                    <div className="flex items-center gap-2 text-xs text-blue-400">
                        <Loader2 size={14} className="animate-spin" />
                        <span>Calculating...</span>
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 p-2 rounded">
                        <AlertTriangle size={14} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Results */}
                {result && !isCalculating && (
                    <>
                        {/* Safety Factor */}
                        <div className="bg-black/30 p-3 rounded border border-white/5">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-gray-400">Safety Factor (BGV-C1)</span>
                                <span className={`text-sm font-mono font-bold ${result.safetyFactor >= 5 ? 'text-green-500' :
                                        result.safetyFactor >= 3 ? 'text-amber-500' :
                                            'text-red-500'
                                    }`}>
                                    {result.safetyFactor > 0 ? `${result.safetyFactor.toFixed(1)}:1` : 'N/A'}
                                </span>
                            </div>

                            {/* Status Badge */}
                            <div className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${result.safe ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                }`}>
                                {result.safe ? (
                                    <>
                                        <CheckCircle2 size={12} />
                                        <span>Compliant (≥5:1)</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle size={12} />
                                        <span>Non-compliant (\u003c5:1)</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Load Distribution */}
                        {result.pointLoads.length > 0 && (
                            <div className="space-y-2">
                                <span className="text-xs text-gray-500 uppercase">Load per Point</span>
                                {result.pointLoads.map(point => {
                                    const obj = objects.find(o => o.id === point.pointId);
                                    return (
                                        <div key={point.pointId} className="bg-black/20 p-2 rounded text-xs">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-gray-400">{obj?.name || 'Unknown'}</span>
                                                <span className="text-amber-500 font-mono">{point.dynamicLoad.toFixed(1)} kg</span>
                                            </div>
                                            {point.utilization > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all ${point.utilization > 100 ? 'bg-red-500' :
                                                                    point.utilization > 80 ? 'bg-amber-500' :
                                                                        'bg-green-500'
                                                                }`}
                                                            style={{ width: `${Math.min(point.utilization, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-[10px] font-mono ${point.utilization > 100 ? 'text-red-400' :
                                                            point.utilization > 80 ? 'text-amber-400' :
                                                                'text-green-400'
                                                        }`}>
                                                        {point.utilization.toFixed(0)}%
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Warnings */}
                        {result.warnings.length > 0 && (
                            <div className="space-y-1">
                                {result.warnings.map((warning, i) => (
                                    <div key={i} className="flex items-start gap-2 text-[10px] text-amber-400 bg-amber-500/5 p-2 rounded">
                                        <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                                        <span>{warning}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Info Note */}
                <div className="text-[10px] text-gray-500 italic pt-2 border-t border-white/5">
                    Real-time physics calculations using BGV-C1 standards. Dynamic load factor: 1.5x.
                </div>
            </div>
        </Section>
    );
};
