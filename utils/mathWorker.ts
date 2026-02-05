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

        // In a line array:
        // - The bumper/grid is at (0, 0, 0)
        // - Boxes hang down (negative Y direction when angle is 0)
        // - siteAngle: Tilt of the entire array (negative = forward tilt toward audience)
        // - splayAngles[i]: Inter-element angle AFTER box i (between box i and i+1)
        //
        // The rotation is around X axis:
        // - 0° = box hangs straight down
        // - Positive X rotation = front of box tilts down (toward audience)
        //
        // CORRECT PHYSICS:
        // 1. Box 0 starts at bumper with rotation = siteAngle
        // 2. Each subsequent box connects at the BOTTOM of the previous box
        // 3. The connection point rotates with the box
        // 4. Splay angle is added BETWEEN boxes

        // Current position (where next box will connect)
        let cx = 0, cy = 0, cz = 0;

        // Current cumulative rotation
        let currentAngleRad = degToRad(siteAngle);

        for (let i = 0; i < boxCount; i++) {
            // Store current box with current angle and position
            items.push({
                index: i,
                position: [cx, cy, cz],
                rotation: [currentAngleRad, 0, 0]
            });

            // Calculate where this box ENDS (bottom connection point)
            // The box hangs down by boxHeight in the direction of its rotation
            // When angle = 0: offset is (0, -boxHeight, 0)
            // When angle > 0: offset rotates forward (negative Y + positive Z)
            const yOffset = -boxHeight * Math.cos(currentAngleRad);
            const zOffset = -boxHeight * Math.sin(currentAngleRad);

            cy += yOffset;
            cz += zOffset;

            // Add splay angle for NEXT box (inter-element angle)
            // Splay angle opens the array - positive splay adds more forward tilt
            const splay = splayAngles[i] || 0;
            currentAngleRad += degToRad(splay);
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
