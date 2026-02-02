import React from 'react';
import { useStore } from '../../store';
import { 
    MousePointer2, Move, RotateCw, Grid, Monitor, Magnet,
    Ruler, Tag, Cable, Eraser, Pencil
} from 'lucide-react';

const ToolButton = ({ icon: Icon, active, onClick, tooltip, disabled = false }: any) => (
    <button 
        onClick={disabled ? undefined : onClick}
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all mb-2 relative group ${
            active 
            ? 'bg-aether-accent text-aether-900 shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)]' 
            : disabled 
                ? 'text-gray-700 cursor-not-allowed opacity-50'
                : 'text-gray-500 hover:text-white hover:bg-white/5'
        }`}
        title={disabled ? "Coming Soon" : tooltip}
    >
        <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
        <span className="absolute left-12 bg-black/90 backdrop-blur text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-white/10">
            {disabled ? `${tooltip} (Coming Soon)` : tooltip}
        </span>
    </button>
);

export const Toolbar = () => {
    const activeTool = useStore(state => state.activeTool);
    const setTool = useStore(state => state.setTool);
    const viewMode = useStore(state => state.viewMode);
    const setViewMode = useStore(state => state.setViewMode);
    const snapping = useStore(state => state.snappingEnabled);
    const toggleSnapping = useStore(state => state.toggleSnapping);
    const continuousPlacement = useStore(state => state.continuousPlacement);
    const toggleContinuousPlacement = useStore(state => state.toggleContinuousPlacement);
    const visible = useStore(state => state.ui.showToolbar);

    if (!visible) return null;

    return (
        <div className="absolute left-4 top-20 bottom-20 w-12 flex flex-col items-center z-40 pointer-events-auto">
            <div className="bg-[#09090b]/90 backdrop-blur-md border border-white/5 rounded-2xl p-1 flex flex-col gap-1 shadow-2xl">
                <ToolButton icon={MousePointer2} active={activeTool === 'select'} onClick={() => setTool('select')} tooltip="Select (V)" />
                <ToolButton icon={Move} active={activeTool === 'move'} onClick={() => setTool('move')} tooltip="Move (G)" />
                <ToolButton icon={RotateCw} active={activeTool === 'rotate'} onClick={() => setTool('rotate')} tooltip="Rotate (R)" />
                
                <div className="w-8 h-px bg-white/5 my-1 mx-auto"></div>
                
                <ToolButton icon={Pencil} active={continuousPlacement} onClick={toggleContinuousPlacement} tooltip="Pencil Mode (Continuous Place)" />
                <ToolButton icon={Eraser} active={activeTool === 'eraser'} onClick={() => setTool('eraser')} tooltip="Eraser" />

                <div className="w-8 h-px bg-white/5 my-1 mx-auto"></div>

                <ToolButton icon={Ruler} active={activeTool === 'tape'} onClick={() => setTool('tape')} tooltip="Tape Measure" />
                <ToolButton icon={Tag} active={activeTool === 'label'} onClick={() => setTool('label')} tooltip="Add Label" disabled={true} />
                <ToolButton icon={Cable} active={activeTool === 'cable'} onClick={() => setTool('cable')} tooltip="Patch Cable" />
            </div>

            <div className="mt-auto bg-[#09090b]/90 backdrop-blur-md border border-white/5 rounded-2xl p-1 flex flex-col gap-1 shadow-2xl">
                <ToolButton icon={Grid} active={viewMode === 'top'} onClick={() => setViewMode(viewMode === 'top' ? 'perspective' : 'top')} tooltip="Top View" />
                <ToolButton icon={Monitor} active={viewMode === 'side'} onClick={() => setViewMode(viewMode === 'side' ? 'perspective' : 'side')} tooltip="Side View" />
                <ToolButton icon={Magnet} active={snapping} onClick={toggleSnapping} tooltip="Snapping" />
            </div>
        </div>
    )
};