import React from 'react';
import { useStore } from '../../store';
import { ASSETS } from '../../data/library';
import { Cable } from '../../types';
import { Cable as CableIcon, Link, Power, ArrowRight, X } from 'lucide-react';

export const ConnectionPanel = () => {
    const selectedIds = useStore(state => state.selectedIds);
    const objects = useStore(state => state.objects);
    const cables = useStore(state => state.system.cables); // Phase 6: System cables
    const startCable = useStore(state => state.startCable);
    const pendingCableStartId = useStore(state => state.pendingCableStartId);
    const removeCable = useStore(state => state.removeCable);

    if (selectedIds.length === 0) {
        return (
            <div className="p-4 text-gray-500 text-sm italic text-center">
                Select an object to view connections
            </div>
        );
    }

    if (selectedIds.length > 1) {
        return (
            <div className="p-4 text-gray-500 text-sm italic text-center">
                Select a single object to patch
            </div>
        );
    }

    const object = objects.find(o => o.id === selectedIds[0]);
    if (!object) return null;

    const asset = ASSETS[object.model];
    if (!asset || !asset.ports) {
        return (
            <div className="p-4 text-gray-500 text-sm italic text-center">
                This object has no connection ports.
            </div>
        );
    }

    // Helper to find cable connected to a specific connection/port
    // For now we assume one cable per port (except possibly 'bi'??)
    const getCableForPort = (direction: string, portId: string): Cable | undefined => {
        // This logic is simplified. In a real system, we'd match portId.
        // Since V1 Cable doesn't enforce portId in the interface strongly yet (optional),
        // we might just list all cables connected to the object for now, or match if portId is present.

        return cables.find(c =>
            (c.startObjectId === object.id && c.startPortId === portId) ||
            (c.endObjectId === object.id && c.endPortId === portId)
        );
    };

    // Group ports
    const inputs = asset.ports.filter(p => p.direction === 'in');
    const outputs = asset.ports.filter(p => p.direction === 'out');
    const bi = asset.ports.filter(p => p.direction === 'bi');

    const renderPort = (port: any) => {
        const connectedCable = getCableForPort(port.direction, port.id);
        const isPending = pendingCableStartId && pendingCableStartId === object.id; // We don't track startPortId yet in state, validation gap

        return (
            <div key={port.id} className="bg-white/5 p-2 rounded mb-2 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {port.type === 'powercon' ? <Power size={14} className="text-yellow-500" /> :
                        port.type === 'ethercon' ? <Link size={14} className="text-blue-500" /> :
                            <CableIcon size={14} className="text-emerald-500" />}
                    <div>
                        <div className="text-xs font-medium text-gray-200">{port.label || port.name}</div>
                        <div className="text-[10px] text-gray-500 uppercase">{port.type}</div>
                    </div>
                </div>

                {connectedCable ? (
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            Connected
                        </span>
                        <button
                            onClick={() => removeCable(connectedCable.id)}
                            className="text-gray-500 hover:text-red-400 p-1"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => startCable(object.id)} // In V2 we would pass port.id
                        disabled={!!pendingCableStartId}
                        className={`text-[10px] px-2 py-1 rounded transition-colors ${pendingCableStartId
                            ? 'opacity-50 cursor-not-allowed text-gray-500'
                            : 'bg-aether-accent/20 text-aether-accent hover:bg-aether-accent/30 border border-aether-accent/30'}`}
                    >
                        {pendingCableStartId ? 'Patching...' : 'Patch'}
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="p-4 space-y-6">
            <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Device Info</h3>
                <div className="text-sm font-medium text-white mb-0.5">{asset.name}</div>
                <div className="text-xs text-gray-500">{object.name}</div>
                {asset.power && <div className="text-xs text-gray-500 mt-1">{asset.power}W Power Draw</div>}
            </div>

            {inputs.length > 0 && (
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <ArrowRight size={12} /> Inputs
                    </h3>
                    {inputs.map(renderPort)}
                </div>
            )}

            {outputs.length > 0 && (
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        Outputs <ArrowRight size={12} />
                    </h3>
                    {outputs.map(renderPort)}
                </div>
            )}

            {bi.length > 0 && (
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        Network / Data
                    </h3>
                    {bi.map(renderPort)}
                </div>
            )}
        </div>
    );
};
