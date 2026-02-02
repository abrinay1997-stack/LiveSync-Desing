import React from 'react';
import { useStore } from '../store';
import { KeyboardManager } from './managers/KeyboardManager';
import { TopBar, Toolbar } from './ui/Navigation';
import { PropertiesPanel } from './panels/PropertiesPanel';
import { LayersPanel } from './panels/LayersPanel';
import { LibraryPanel } from './panels/LibraryPanel';

const RightSidebar = () => {
    const ui = useStore(state => state.ui);
    const setRightTab = useStore(state => state.setRightTab);

    if (!ui.showInspector) return null;

    return (
        <div className="absolute top-12 right-0 bottom-0 w-80 bg-[#09090b] border-l border-white/5 flex flex-col z-40 pointer-events-auto">
             {/* Tab Header (redundant with TopBar but good for context if TopBar is far) - Let's simplify and rely on TopBar toggles or keep simple tabs */}
             <div className="flex border-b border-white/5 bg-[#18181b]">
                 <button 
                    onClick={() => setRightTab('inspector')}
                    className={`flex-1 py-2 text-xs font-medium transition-all ${ui.activeRightTab === 'inspector' ? 'text-aether-accent border-b-2 border-aether-accent bg-white/5' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Inspector
                 </button>
                 <button 
                    onClick={() => setRightTab('layers')}
                    className={`flex-1 py-2 text-xs font-medium transition-all ${ui.activeRightTab === 'layers' ? 'text-aether-accent border-b-2 border-aether-accent bg-white/5' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Layers
                 </button>
             </div>
             
             <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#09090b]">
                 {ui.activeRightTab === 'inspector' ? <PropertiesPanel /> : <LayersPanel />}
             </div>
        </div>
    )
}

export const Interface = () => {
    const showLibrary = useStore(state => state.ui.showLibrary);
    
    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col overflow-hidden">
            <KeyboardManager />
            <TopBar />
            <Toolbar />
            <RightSidebar />
            
            {/* Library Container - Animating height/transform could be nice but conditional render is safer for now */}
            {showLibrary && <LibraryPanel />}
        </div>
    )
};