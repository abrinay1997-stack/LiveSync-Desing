import React, { useMemo } from 'react';
import { AssetGeometry } from './AssetGeometry';
import { ArrayConfig, ASSETS } from '../../types';
import { calculateArrayMechanicalShape, generateDispersionGeometry } from '../../utils/arrayMath';

interface ArrayGeometryProps {
    type: string;
    dimensions?: { w: number; h: number; d: number };
    color: string;
    arrayConfig: ArrayConfig;
}

const CoverageCone = ({ 
    dispersion, 
    throwDistance, 
    color 
}: { 
    dispersion: { h: number, v: number }, 
    throwDistance: number, 
    color: string 
}) => {
    const geometry = useMemo(() => {
        return generateDispersionGeometry(dispersion, throwDistance);
    }, [dispersion, throwDistance]);

    return (
        <lineSegments geometry={geometry}>
            <lineBasicMaterial color={color} transparent opacity={0.3} depthTest={false} />
        </lineSegments>
    );
};

export const ArrayGeometry: React.FC<ArrayGeometryProps> = ({ type, dimensions, color, arrayConfig }) => {
    const height = dimensions?.h || 0.35;
    
    const assetSpec = ASSETS[type];
    const dispersion = assetSpec?.dispersion || { h: 90, v: 90 };

    // Use the decoupled math engine
    const boxes = useMemo(() => {
        return calculateArrayMechanicalShape(arrayConfig, height);
    }, [arrayConfig, height]);

    return (
        <group>
            {/* Bumper/Grid Reference */}
            <mesh position={[0, 0.1, 0]}>
                <boxGeometry args={[dimensions?.w || 1, 0.05, dimensions?.d || 1]} />
                <meshStandardMaterial color="#3f3f46" />
            </mesh>

            {boxes.map((box) => (
                <group key={box.index} position={box.position} rotation={box.rotation}>
                    <AssetGeometry 
                        type={type} 
                        dimensions={dimensions} 
                        color={color} 
                    />
                    
                    {/* ID Label */}
                    <mesh position={[(dimensions?.w || 1)/2 + 0.01, 0, 0]} rotation={[0, Math.PI/2, 0]}>
                         <planeGeometry args={[0.2, 0.1]} />
                         <meshBasicMaterial color="black" />
                    </mesh>

                    {arrayConfig.showThrowLines && (
                        <CoverageCone 
                            dispersion={dispersion} 
                            throwDistance={arrayConfig.throwDistance} 
                            color={box.index % 2 === 0 ? "#06b6d4" : "#a5f3fc"} 
                        />
                    )}
                </group>
            ))}
        </group>
    );
};