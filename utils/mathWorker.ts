import { ArrayConfig } from '../types';

// We define the worker code as a string to avoid bundler complexity with separate worker files
// REFACTOR: Removed importScripts('three') to avoid NetworkErrors and CORS issues.
// Replaced with vanilla JS math implementation.
const workerCode = `
    const degToRad = (deg) => deg * (Math.PI / 180);

    self.onmessage = function(e) {
        const { id, config, boxHeight } = e.data;
        
        const { boxCount, splayAngles, siteAngle } = config;
        const items = [];
        
        // Start position (0,0,0)
        let cx = 0, cy = 0, cz = 0;
        
        let currentAngleRad = degToRad(siteAngle); 

        for (let i = 0; i < boxCount; i++) {
            const splay = splayAngles[i] || 0;
            const splayRad = degToRad(splay);
            currentAngleRad += splayRad;

            // Rotation (Euler x, y, z)
            // In the original logic: new THREE.Euler(currentAngleRad, 0, 0)
            const rx = currentAngleRad;
            const ry = 0;
            const rz = 0;
            
            items.push({
                index: i,
                position: [cx, cy, cz],
                rotation: [rx, ry, rz]
            });

            // Calculate offset for next box
            // The original logic:
            // yOffset = -boxHeight * Math.cos(currentAngleRad);
            // zOffset = boxHeight * Math.sin(currentAngleRad); 
            // currentPos.add(new THREE.Vector3(0, yOffset, zOffset));
            
            const yOffset = -boxHeight * Math.cos(currentAngleRad);
            const zOffset = boxHeight * Math.sin(currentAngleRad); 
            
            cy += yOffset;
            cz += zOffset;
        }

        self.postMessage({ id, items });
    };
`;

let workerInstance: Worker | null = null;

export const getMathWorker = () => {
    if (!workerInstance) {
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        workerInstance = new Worker(URL.createObjectURL(blob));
    }
    return workerInstance;
};

// Promise wrapper for the worker
export const calculateArrayInWorker = (config: ArrayConfig, boxHeight: number): Promise<any[]> => {
    return new Promise((resolve) => {
        const worker = getMathWorker();
        const id = Math.random().toString(36).substr(2, 9);
        
        const handler = (e: MessageEvent) => {
            if (e.data.id === id) {
                worker.removeEventListener('message', handler);
                resolve(e.data.items);
            }
        };
        
        worker.addEventListener('message', handler);
        worker.postMessage({ id, config, boxHeight });
    });
};