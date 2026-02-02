import React from 'react';
import { useStore } from '../store';
import { KeyboardManager } from './managers/KeyboardManager';
import { TopBar } from './ui/TopBar';
import { Toolbar } from './ui/Toolbar';
import { RightSidebar } from './layout/RightSidebar';
import { LibraryPanel } from './panels/LibraryPanel';

export const Interface = () => {
    const showLibrary = useStore(state => state.ui.showLibrary);
    
    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col overflow-hidden">
            <KeyboardManager />
            <TopBar />
            <Toolbar />
            <RightSidebar />
            
            {showLibrary && <LibraryPanel />}
        </div>
    )
};