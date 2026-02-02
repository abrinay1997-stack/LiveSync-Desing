import React from 'react';
import { useStore } from '../../store';
import { 
    BoxSelect, Download, MousePointer2, Move, RotateCw, Grid, Monitor, Magnet, Mouse,
    PanelLeft, PanelBottom, Settings2, Layers, Ruler, Tag, Cable
} from 'lucide-react';

export const TopBar = () => {
    const ui = useStore(state => state.ui);
    const toggleUI = useStore(state => state.toggleUI);
    const setRightTab = useStore(state => state.setRightTab);

    // Helpers to handle toggle logic specifically for the dual-tab right sidebar
    const toggleInspector = () => {
        if (ui.showInspector && ui.activeRightTab === 'inspector') {
            toggleUI('showInspector');
        } else {
            setRightTab('inspector');
        }
    }

    const toggleLayers = () => {
        if (ui.showInspector && ui.activeRightTab === 'layers') {
            toggleUI('showInspector');
        } else {
            setRightTab('layers');
        }
    }

    return (
        <div className="absolute top-0 left-0 w-full h-12 bg-[#09090b] border-b border-white/5 flex items-center justify-between px-4 z-50 select-none shadow-md pointer-events-auto">
            {/* Left: Branding & Menu */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-aether-accent font-bold tracking-tighter mr-4">
                    <BoxSelect size={20} />
                    <span className="text-lg">LiveSync<span className="text-white font-light">Design</span></span>
                </div>
                
                <div className="flex gap-1">
                    <button className="px-3 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded transition">File</button>
                    <button className="px-3 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded transition">Edit</button>
                    <button className="px-3 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded transition">View</button>
                    <button className="px-3 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded transition">Window</button>
                </div>
            </div>
            
            {/* Center: Window Toggles (DAW Style) */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-1 bg-[#18181b] p-1 rounded-md border border-white/5">
                <button 
                    onClick={() => toggleUI('showToolbar')}
                    className={`p-1.5 rounded transition ${ui.showToolbar ? 'bg-aether-accent text-black' : 'text-gray-500 hover:text-gray-300'}`}
                    title="Toggle Toolbar"
                >
                    <PanelLeft size={16} />
                </button>
                <div className="w-px h-4 bg-white/10 mx-1"></div>
                <button 
                    onClick={() => toggleUI('showLibrary')}
                    className={`p-1.5 rounded transition ${ui.showLibrary ? 'bg-aether-accent text-black' : 'text-gray-500 hover:text-gray-300'}`}
                    title="Toggle Asset Library"
                >
                    <PanelBottom size={16} />
                </button>
                <div className="w-px h-4 bg-white/10 mx-1"></div>
                <button 
                    onClick={toggleInspector}
                    className={`p-1.5 rounded transition ${ui.showInspector && ui.activeRightTab === 'inspector' ? 'bg-aether-accent text-black' : 'text-gray-500 hover:text-gray-300'}`}
                    title="Toggle Inspector"
                >
                    <Settings2 size={16} />
                </button>
                <button 
                    onClick={toggleLayers}
                    className={`p-1.5 rounded transition ${ui.showInspector && ui.activeRightTab === 'layers' ? 'bg-aether-accent text-black' : 'text-gray-500 hover:text-gray-300'}`}
                    title="Toggle Layers"
                >
                    <Layers size={16} />
                </button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-3 py-1 bg-aether-accent/10 hover:bg-aether-accent/20 text-aether-accent border border-aether-accent/20 rounded text-xs font-medium transition-all group">
                    <Download size={14} />
                    <span>Export Project</span>
                </button>
            </div>
        </div>
    )
}

const ToolButton = ({ icon: Icon, active, onClick, tooltip, disabled = false }: any) => (
    <button 
        onClick={disabled ? undefined : onClick}
        className={`w-9 h-9 flex items-center justify-center rounded transition-all mb-1 relative group ${
            active 
            ? 'bg-aether-accent text-aether-900' 
            : disabled 
                ? 'text-gray-700 cursor-not-allowed'
                : 'text-aether-500 hover:text-white hover:bg-white/10'
        }`}
    >
        <Icon size={18} strokeWidth={active ? 2.5 : 2} />
        {!disabled && (
            <span className="absolute left-10 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition whitespace-nowrap z-50 border border-white/10 shadow-xl">
                {tooltip}
            </span>
        )}
    </button>
);

export const Toolbar = () => {
    const activeTool = useStore(state => state.activeTool);
    const setTool = useStore(state => state.setTool);
    const viewMode = useStore(state => state.viewMode);
    const setViewMode = useStore(state => state.setViewMode);
    const snapping = useStore(state => state.snappingEnabled);
    const toggleSnapping = useStore(state => state.toggleSnapping);
    const visible = useStore(state => state.ui.showToolbar);

    if (!visible) return null;

    return (
        <div className="absolute left-0 top-12 bottom-0 w-12 bg-[#09090b] border-r border-white/5 flex flex-col items-center py-4 z-40 pointer-events-auto">
            {/* Primary Tools */}
            <div className="flex flex-col gap-1 w-full px-1.5">
                <ToolButton icon={MousePointer2} active={activeTool === 'select'} onClick={() => setTool('select')} tooltip="Select (V)" />
                <ToolButton icon={Move} active={activeTool === 'move'} onClick={() => setTool('move')} tooltip="Move (G)" />
                <ToolButton icon={RotateCw} active={activeTool === 'rotate'} onClick={() => setTool('rotate')} tooltip="Rotate (R)" />
                <div className="w-full h-px bg-white/10 my-2"></div>
                <ToolButton icon={Ruler} active={activeTool === 'tape'} onClick={() => setTool('tape')} tooltip="Tape Measure" />
                <ToolButton icon={Tag} active={activeTool === 'label'} onClick={() => setTool('label')} tooltip="Add Label" />
                <ToolButton icon={Cable} active={activeTool === 'cable'} onClick={() => setTool('cable')} tooltip="Patch Cable" />
            </div>

            {/* View Controls (Bottom aligned via flex-1 spacer if needed, but here just grouped) */}
            <div className="mt-auto flex flex-col gap-1 w-full px-1.5 pb-4">
                <div className="w-full h-px bg-white/10 my-2"></div>
                <ToolButton icon={Grid} active={viewMode === 'top'} onClick={() => setViewMode(viewMode === 'top' ? 'perspective' : 'top')} tooltip="Top View (T)" />
                <ToolButton icon={Monitor} active={viewMode === 'side'} onClick={() => setViewMode(viewMode === 'side' ? 'perspective' : 'side')} tooltip="Side View" />
                <ToolButton icon={Magnet} active={snapping} onClick={toggleSnapping} tooltip="Smart Snapping" />
            </div>
        </div>
    )
};