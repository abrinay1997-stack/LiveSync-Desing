import React, { useRef } from 'react';
import { useStore } from '../../store';
import { StorageService } from '../../services/StorageService';
import { 
    BoxSelect, Download, Search,
    PanelLeft, PanelBottom, Settings2, Layers, Upload, Cloud
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
        const data = StorageService.serializeProject(state);
        StorageService.downloadProject(data);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const data = await StorageService.importProject(file);
            loadProject(data);
        } catch (err) {
            console.error("Import failed", err);
            alert("Failed to load project file. Please check the format.");
        }
        
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
                    <span className="text-sm font-semibold tracking-wide text-gray-200">LiveSync <span className="text-gray-600 font-normal">Desing</span></span>
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
                    <button 
                        className="flex items-center gap-2 px-3 py-1.5 bg-aether-accent/10 border border-aether-accent/20 text-aether-accent hover:bg-aether-accent/20 rounded-md text-xs font-semibold transition-all"
                        title="Cloud Sync (Enterprise)"
                    >
                        <Cloud size={14} />
                    </button>
                </div>
            </div>
        </div>
    )
};