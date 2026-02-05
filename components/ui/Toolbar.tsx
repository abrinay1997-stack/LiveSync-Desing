import React from 'react';
import { useStore } from '../../store';
import {
    MousePointer2, Move, RotateCw, Grid, Monitor, Magnet,
    Ruler, Tag, Cable, Eraser, Pencil, Square, Lasso, ChevronDown,
    Boxes, Speaker, Cog, Theater, Users
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

// Selection tool submenu component
const SelectionToolGroup = ({ activeTool, setTool }: { activeTool: string, setTool: (tool: any) => void }) => {
    const [showSubmenu, setShowSubmenu] = React.useState(false);
    const objects = useStore(state => state.objects);
    const isSelectionTool = ['select', 'box-select', 'lasso-select'].includes(activeTool);

    const getActiveIcon = () => {
        switch (activeTool) {
            case 'box-select': return Square;
            case 'lasso-select': return Lasso;
            default: return MousePointer2;
        }
    };

    const ActiveIcon = getActiveIcon();

    // Select by type helper
    const selectByType = (type: string) => {
        const ids = objects.filter(o => o.type === type).map(o => o.id);
        useStore.setState({ selectedIds: ids });
        setShowSubmenu(false);
    };

    // Count objects by type
    const countByType = (type: string) => objects.filter(o => o.type === type).length;

    return (
        <div className="relative">
            <div className="flex items-center">
                <button
                    onClick={() => setTool(activeTool === 'select' ? 'select' : activeTool)}
                    onContextMenu={(e) => { e.preventDefault(); setShowSubmenu(!showSubmenu); }}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all relative group ${
                        isSelectionTool
                            ? 'bg-aether-accent text-aether-900 shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)]'
                            : 'text-gray-500 hover:text-white hover:bg-white/5'
                    }`}
                    title="Selection Tools (Right-click for options)"
                >
                    <ActiveIcon size={20} strokeWidth={isSelectionTool ? 2.5 : 1.5} />
                    <ChevronDown size={8} className="absolute bottom-1 right-1 opacity-50" />
                </button>
            </div>

            {/* Submenu */}
            {showSubmenu && (
                <div className="absolute left-12 top-0 bg-[#18181b] border border-white/10 rounded-lg shadow-xl z-50 py-1 min-w-[180px]">
                    {/* Selection Tools Section */}
                    <div className="px-3 py-1 text-[10px] text-gray-500 uppercase tracking-wider">Selection Tools</div>
                    <button
                        onClick={() => { setTool('select'); setShowSubmenu(false); }}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-white/5 ${activeTool === 'select' ? 'text-cyan-400' : 'text-gray-300'}`}
                    >
                        <MousePointer2 size={14} /> Click Select (V)
                    </button>
                    <button
                        onClick={() => { setTool('box-select'); setShowSubmenu(false); }}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-white/5 ${activeTool === 'box-select' ? 'text-cyan-400' : 'text-gray-300'}`}
                    >
                        <Square size={14} /> Box Select (B)
                    </button>
                    <button
                        onClick={() => { setTool('lasso-select'); setShowSubmenu(false); }}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-white/5 ${activeTool === 'lasso-select' ? 'text-cyan-400' : 'text-gray-300'}`}
                    >
                        <Lasso size={14} /> Lasso Select (L)
                    </button>

                    {/* Divider */}
                    <div className="h-px bg-white/10 my-1" />

                    {/* Select by Type Section */}
                    <div className="px-3 py-1 text-[10px] text-gray-500 uppercase tracking-wider">Select by Type</div>
                    <button
                        onClick={() => selectByType('truss')}
                        disabled={countByType('truss') === 0}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-white/5 ${countByType('truss') === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300'}`}
                    >
                        <span className="flex items-center gap-2"><Boxes size={14} /> All Trusses</span>
                        <span className="text-[10px] text-gray-500">{countByType('truss')} (⇧1)</span>
                    </button>
                    <button
                        onClick={() => selectByType('speaker')}
                        disabled={countByType('speaker') === 0}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-white/5 ${countByType('speaker') === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300'}`}
                    >
                        <span className="flex items-center gap-2"><Speaker size={14} /> All Speakers</span>
                        <span className="text-[10px] text-gray-500">{countByType('speaker')} (⇧2)</span>
                    </button>
                    <button
                        onClick={() => selectByType('motor')}
                        disabled={countByType('motor') === 0}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-white/5 ${countByType('motor') === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300'}`}
                    >
                        <span className="flex items-center gap-2"><Cog size={14} /> All Motors</span>
                        <span className="text-[10px] text-gray-500">{countByType('motor')} (⇧3)</span>
                    </button>
                    <button
                        onClick={() => selectByType('stage')}
                        disabled={countByType('stage') === 0}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-white/5 ${countByType('stage') === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300'}`}
                    >
                        <span className="flex items-center gap-2"><Theater size={14} /> All Stage</span>
                        <span className="text-[10px] text-gray-500">{countByType('stage')} (⇧4)</span>
                    </button>
                    <button
                        onClick={() => selectByType('audience')}
                        disabled={countByType('audience') === 0}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-white/5 ${countByType('audience') === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300'}`}
                    >
                        <span className="flex items-center gap-2"><Users size={14} /> All Audience</span>
                        <span className="text-[10px] text-gray-500">{countByType('audience')} (⇧5)</span>
                    </button>
                </div>
            )}

            {/* Click outside to close */}
            {showSubmenu && (
                <div className="fixed inset-0 z-40" onClick={() => setShowSubmenu(false)} />
            )}
        </div>
    );
};

// Axis constraint indicator component
const AxisConstraintIndicator = () => {
    const transformAxisConstraint = useStore(state => state.transformAxisConstraint);
    const setTransformAxisConstraint = useStore(state => state.setTransformAxisConstraint);
    const activeTool = useStore(state => state.activeTool);
    const selectedIds = useStore(state => state.selectedIds);

    // Only show when move or rotate tool is active and something is selected
    if (!['move', 'rotate'].includes(activeTool) || selectedIds.length === 0) {
        return null;
    }

    const axisColors = {
        x: '#ef4444', // red
        y: '#22c55e', // green
        z: '#3b82f6'  // blue
    };

    return (
        <div className="bg-[#09090b]/90 backdrop-blur-md border border-white/5 rounded-lg p-2 shadow-2xl">
            <div className="text-[9px] text-gray-500 mb-1 text-center">AXIS LOCK</div>
            <div className="flex gap-1">
                {(['x', 'y', 'z'] as const).map((axis) => (
                    <button
                        key={axis}
                        onClick={() => setTransformAxisConstraint(transformAxisConstraint === axis ? null : axis)}
                        className={`w-6 h-6 rounded font-bold text-xs flex items-center justify-center transition-all ${
                            transformAxisConstraint === axis
                                ? 'ring-2 ring-white/30'
                                : 'opacity-50 hover:opacity-100'
                        }`}
                        style={{
                            backgroundColor: transformAxisConstraint === axis ? axisColors[axis] : 'transparent',
                            color: transformAxisConstraint === axis ? 'white' : axisColors[axis],
                            border: `1px solid ${axisColors[axis]}`
                        }}
                        title={`Lock to ${axis.toUpperCase()} axis (${axis.toUpperCase()})`}
                    >
                        {axis.toUpperCase()}
                    </button>
                ))}
            </div>
        </div>
    );
};

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
                {/* Selection Tools Group */}
                <SelectionToolGroup activeTool={activeTool} setTool={setTool} />

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

            {/* Axis Constraint Indicator */}
            <div className="mt-2">
                <AxisConstraintIndicator />
            </div>

            <div className="mt-auto bg-[#09090b]/90 backdrop-blur-md border border-white/5 rounded-2xl p-1 flex flex-col gap-1 shadow-2xl">
                <ToolButton icon={Grid} active={viewMode === 'top'} onClick={() => setViewMode(viewMode === 'top' ? 'perspective' : 'top')} tooltip="Top View" />
                <ToolButton icon={Monitor} active={viewMode === 'side'} onClick={() => setViewMode(viewMode === 'side' ? 'perspective' : 'side')} tooltip="Side View" />
                <ToolButton icon={Magnet} active={snapping} onClick={toggleSnapping} tooltip="Snapping" />
            </div>
        </div>
    )
};