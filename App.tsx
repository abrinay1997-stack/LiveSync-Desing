import React from 'react';
import { Scene3D } from './components/Scene3D';
import { Interface } from './components/Interface';

const App = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-aether-900 select-none">
        {/* 3D Viewport Layer */}
        <div className="absolute inset-0 z-0">
             <Scene3D />
        </div>
        
        {/* UI Overlay Layer - CRITICAL: Must be pointer-events-none to let clicks pass to canvas */}
        <div className="absolute inset-0 z-10 pointer-events-none">
            <Interface />
        </div>
        
        {/* Decorative corner markers to enhance technical feel */}
        <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-white/20 pointer-events-none z-20"></div>
        <div className="absolute top-16 left-4 w-4 h-4 border-t border-l border-white/20 pointer-events-none z-20"></div>
        <div className="absolute bottom-4 right-84 w-4 h-4 border-b border-r border-white/20 pointer-events-none z-20"></div>
    </div>
  );
};

export default App;