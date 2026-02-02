import React from 'react';

interface AssetGeometryProps {
    type: string;
    dimensions?: { w: number; h: number; d: number };
    color: string;
    isGhost?: boolean;
}

export const AssetGeometry: React.FC<AssetGeometryProps> = ({ type, dimensions, color, isGhost = false }) => {
    const w = dimensions?.w || 1;
    const h = dimensions?.h || 1;
    const d = dimensions?.d || 1;

    const materialProps = {
        color: isGhost ? color : color,
        transparent: isGhost,
        opacity: isGhost ? 0.5 : 1,
        roughness: 0.4,
        metalness: 0.6
    };

    // Truss Geometry (Estructural)
    if (type === 'truss') {
        return (
            <group>
                <mesh>
                   <boxGeometry args={[w, h, d]} />
                   <meshStandardMaterial {...materialProps} wireframe={true} color={isGhost ? color : "#ffffff"} />
                </mesh>
                <mesh>
                   <boxGeometry args={[w - 0.05, h - 0.05, d - 0.05]} />
                   <meshStandardMaterial {...materialProps} color={color} />
                </mesh>
            </group>
        )
    }
    
    // Speaker/Generic Geometry
    return (
      <group>
        {/* Cuerpo Principal */}
        <mesh>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial {...materialProps} />
        </mesh>

        {/* UX FIX: Indicador de Dirección (Frontal / Grill) */}
        {/* Asumimos que Z positivo es el frente para altavoces en este sistema de coordenadas, o Z negativo dependiendo del motor. 
            Visualmente pondremos la rejilla en una cara para distinguirla. */}
        {!isGhost && (
            <>
                {/* Rejilla Frontal (La cara que "emite" sonido) */}
                <mesh position={[0, 0, d / 2 + 0.001]}>
                    <planeGeometry args={[w * 0.9, h * 0.9]} />
                    <meshStandardMaterial 
                        color="#111" 
                        roughness={0.8} 
                        metalness={0.5}
                        side={2} // Double side
                    />
                    {/* Detalles de rejilla simulados con geometría simple si fuera necesario, 
                        pero el color oscuro mate contrasta bien con el case */}
                </mesh>

                {/* Back Plate (Conectores) - para distinguir atrás */}
                <mesh position={[0, 0, -d / 2 - 0.001]} rotation={[0, Math.PI, 0]}>
                    <planeGeometry args={[w * 0.6, h * 0.6]} />
                    <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
                </mesh>
                
                {/* Etiqueta visual de dirección (opcional, una pequeña muesca amarilla arriba) */}
                 <mesh position={[0, h/2 + 0.001, d/2 - 0.05]} rotation={[-Math.PI/2, 0, 0]}>
                    <planeGeometry args={[0.05, 0.05]} />
                    <meshBasicMaterial color="#facc15" />
                </mesh>
            </>
        )}
      </group>
    );
};