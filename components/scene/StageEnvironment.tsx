import React from 'react';
import { Environment } from '@react-three/drei';
import { useStore } from '../../store';

export const StageEnvironment = () => {
    const lightingPreset = useStore(state => state.lightingPreset);

    return (
        <>
            {lightingPreset === 'studio' && (
                <>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
                    <Environment preset="studio" />
                </>
            )}
            
            {lightingPreset === 'stage' && (
                <>
                    <ambientLight intensity={0.2} />
                    <spotLight position={[0, 20, 0]} angle={0.5} penumbra={1} intensity={2} color="#06b6d4" />
                    <spotLight position={[-10, 10, 5]} angle={0.4} penumbra={1} intensity={1} color="#f59e0b" />
                    <Environment preset="night" />
                </>
            )}

            {lightingPreset === 'outdoor' && (
                <>
                    <ambientLight intensity={0.8} />
                    <directionalLight position={[-5, 10, -10]} intensity={2} castShadow />
                    <Environment preset="park" />
                </>
            )}
        </>
    );
};