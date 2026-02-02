import { ArrayConfig } from '../types';

// We define the worker code as a string to avoid bundler complexity with separate worker files
const workerCode = `
    importScripts('https://unpkg.com/three@0.164.1/build/three.min.js');

    self.onmessage = function(e) {
        const { id, config, boxHeight } = e.data;
        
        // RE-IMPLEMENTATION OF LOGIC INSIDE WORKER
        // We cannot import the function from the main thread easily in this setup
        
        const { boxCount, splayAngles, siteAngle } = config;
        const items = [];
        
        let currentPos = new THREE.Vector3(0, 0, 0);
        let currentAngleRad = THREE.MathUtils.degToRad(siteAngle); 

        for (let i = 0; i < boxCount; i++) {
            const splay = splayAngles[i] || 0;
            const splayRad = THREE.MathUtils.degToRad(splay);
            currentAngleRad += splayRad;

            const rotation = new THREE.Euler(currentAngleRad, 0, 0);
            
            // Serialize vectors to arrays for transfer
            items.push({
                index: i,
                position: [currentPos.x, currentPos.y, currentPos.z],
                rotation: [rotation.x, rotation.y, rotation.z]
            });

            const yOffset = -boxHeight * Math.cos(currentAngleRad);
            const zOffset = boxHeight * Math.sin(currentAngleRad); 
            currentPos.add(new THREE.Vector3(0, yOffset, zOffset));
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