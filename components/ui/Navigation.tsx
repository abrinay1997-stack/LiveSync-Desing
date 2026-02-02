import React, { useRef } from 'react';
import { useStore } from '../../store';
import { 
    BoxSelect, Download, MousePointer2, Move, RotateCw, Grid, Monitor, Magnet, Search,
    PanelLeft, PanelBottom, Settings2, Layers, Ruler, Tag, Cable, ChevronDown, Upload
} from 'lucide-react';

export const TopBar = () => {
    const ui = useStore(state => state.ui);
    const toggleUI = useStore(state => state.toggleUI);
    const setRightTab = useStore(state => state.setRightTab);
    const loadProject = useStore(state => state.loadProject);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const toggleInspector = () => {
        if (ui.showInspector && ui.activeRightTab === 'inspector') toggleUI('showInspector');
        else setRightTab('inspector');
    }

    const toggleLayers = () => {
        if (ui.showInspector && ui.activeRightTab === 'layers') toggleUI('showInspector');
        else setRightTab('layers');
    }

    const handleExport = () => {
        const state = useStore.getState();
        const projectData = {
            version: "1.0",
            timestamp: new Date().toISOString(),
            objects: state.objects,
            layers: state.layers,
            measurements: state.measurements,
            cameraTarget: state.cameraTarget,
            lightingPreset: state.lightingPreset
        };

        const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aether-project-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                loadProject(json);
            } catch (err) {
                console.error("Failed to parse project file", err);
                alert("Invalid project file");
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    return (
        <div className="absolute top-0 left-0 w-full h-14 bg-[#09090b]/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 z-50 select-none shadow-sm pointer-events-auto">
            {/* Left: Branding & Menu */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-aether-accent font-bold tracking-tighter">
                    <div className="w-6 h-6 bg-gradient-to-br from-aether-accent to-blue-600 rounded flex items-center justify-center text-black">
                        <BoxSelect size={14} strokeWidth={3} />
                    </div>
                    <span className="text-sm font-semibold tracking-wide text-gray-200">Aether<span className="text-gray-600 font-normal">CAD</span></span>
                </div>
                
                <div className="h-6 w-px bg-white/5"></div>

                <div className="flex gap-1">
                    {['File', 'Edit', 'View', 'Connect'].map(label => (
                        <button key={label} className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors">
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Center: Command Search */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 group-hover:text-aether-accent transition-colors" size={14} />
                    <input 
                        type="text" 
                        placeholder="Search assets, tools, or commands..." 
                        className="w-full bg-[#18181b] border border-white/5 rounded-full py-1.5 pl-9 pr-4 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-aether-accent/30 focus:bg-[#202022] transition-all shadow-inner"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                        <span className="text-[9px] text-gray-600 border border-white/5 rounded px-1">⌘K</span>
                    </div>
                </div>
            </div>
            
            {/* Right: Toggles & Export */}
            <div className="flex items-center gap-4">
                 <div className="flex items-center gap-1 bg-[#18181b] p-0.5 rounded-lg border border-white/5">
                    <button onClick={() => toggleUI('showToolbar')} className={`p-1.5 rounded-md transition ${ui.showToolbar ? 'text-aether-accent bg-white/5' : 'text-gray-500 hover:text-gray-300'}`}><PanelLeft size={16} /></button>
                    <button onClick={() => toggleUI('showLibrary')} className={`p-1.5 rounded-md transition ${ui.showLibrary ? 'text-aether-accent bg-white/5' : 'text-gray-500 hover:text-gray-300'}`}><PanelBottom size={16} /></button>
                    <div className="w-px h-3 bg-white/10 mx-1"></div>
                    <button onClick={toggleInspector} className={`p-1.5 rounded-md transition ${ui.activeRightTab === 'inspector' && ui.showInspector ? 'text-aether-accent bg-white/5' : 'text-gray-500 hover:text-gray-300'}`}><Settings2 size={16} /></button>
                    <button onClick={toggleLayers} className={`p-1.5 rounded-md transition ${ui.activeRightTab === 'layers' && ui.showInspector ? 'text-aether-accent bg-white/5' : 'text-gray-500 hover:text-gray-300'}`}><Layers size={16} /></button>
                </div>

                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImport} 
                    accept=".json" 
                    className="hidden" 
                />

                <div className="flex gap-2">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#18181b] border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white rounded-md text-xs font-semibold transition-all"
                    >
                        <Upload size={14} />
                        <span>Import</span>
                    </button>
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white text-black hover:bg-gray-200 rounded-md text-xs font-semibold transition-all shadow-lg shadow-white/5"
                    >
                        <Download size={14} />
                        <span>Export</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

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
    const visible = useStore(state => state.ui.showToolbar);

    if (!visible) return null;

    return (
        <div className="absolute left-4 top-20 bottom-20 w-12 flex flex-col items-center z-40 pointer-events-auto">
            <div className="bg-[#09090b]/90 backdrop-blur-md border border-white/5 rounded-2xl p-1 flex flex-col gap-1 shadow-2xl">
                <ToolButton icon={MousePointer2} active={activeTool === 'select'} onClick={() => setTool('select')} tooltip="Select (V)" />
                <ToolButton icon={Move} active={activeTool === 'move'} onClick={() => setTool('move')} tooltip="Move (G)" />
                <ToolButton icon={RotateCw} active={activeTool === 'rotate'} onClick={() => setTool('rotate')} tooltip="Rotate (R)" />
                <div className="w-8 h-px bg-white/5 my-1 mx-auto"></div>
                <ToolButton icon={Ruler} active={activeTool === 'tape'} onClick={() => setTool('tape')} tooltip="Tape Measure" />
                <ToolButton icon={Tag} active={activeTool === 'label'} onClick={() => setTool('label')} tooltip="Add Label" disabled={true} />
                <ToolButton icon={Cable} active={activeTool === 'cable'} onClick={() => setTool('cable')} tooltip="Patch Cable" disabled={true} />
            </div>

            <div className="mt-auto bg-[#09090b]/90 backdrop-blur-md border border-white/5 rounded-2xl p-1 flex flex-col gap-1 shadow-2xl">
                <ToolButton icon={Grid} active={viewMode === 'top'} onClick={() => setViewMode(viewMode === 'top' ? 'perspective' : 'top')} tooltip="Top View" />
                <ToolButton icon={Monitor} active={viewMode === 'side'} onClick={() => setViewMode(viewMode === 'side' ? 'perspective' : 'side')} tooltip="Side View" />
                <ToolButton icon={Magnet} active={snapping} onClick={toggleSnapping} tooltip="Snapping" />
            </div>
        </div>
    )
};