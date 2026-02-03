/**
 * React Hook for Physics Worker Communication
 * 
 * Manages Web Worker lifecycle and provides async API for calculations
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { WorkerMessage, WorkerResponse } from '../workers/physics.worker';

type PendingRequest = {
    resolve: (result: any) => void;
    reject: (error: Error) => void;
};

export function usePhysicsWorker() {
    const workerRef = useRef<Worker | null>(null);
    const pendingRequests = useRef<Map<string, PendingRequest>>(new Map());
    const [isReady, setIsReady] = useState(false);

    // Initialize worker
    useEffect(() => {
        // Create worker from file
        const worker = new Worker(
            new URL('../workers/physics.worker.ts', import.meta.url),
            { type: 'module' }
        );

        // Handle messages from worker
        worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
            const { id, type, result, error } = e.data;

            // Handle ready signal
            if (type === 'ready') {
                setIsReady(true);
                return;
            }

            // Handle calculation responses
            const pending = pendingRequests.current.get(id);
            if (pending) {
                if (error) {
                    pending.reject(new Error(error));
                } else {
                    pending.resolve(result);
                }
                pendingRequests.current.delete(id);
            }
        };

        worker.onerror = (error) => {
            console.error('Physics worker error:', error);
            // Reject all pending requests
            pendingRequests.current.forEach(({ reject }) => {
                reject(new Error('Worker crashed'));
            });
            pendingRequests.current.clear();
        };

        workerRef.current = worker;

        // Cleanup on unmount
        return () => {
            worker.terminate();
            workerRef.current = null;
        };
    }, []);

    // Generic calculation function
    const calculate = useCallback(<T,>(type: string, payload: any): Promise<T> => {
        return new Promise((resolve, reject) => {
            if (!workerRef.current || !isReady) {
                reject(new Error('Worker not ready'));
                return;
            }

            const id = `${type}-${Date.now()}-${Math.random()}`;

            pendingRequests.current.set(id, { resolve, reject });

            const message: WorkerMessage = {
                id,
                type: type as any,
                payload
            };

            workerRef.current.postMessage(message);

            // Timeout after 10 seconds
            setTimeout(() => {
                const pending = pendingRequests.current.get(id);
                if (pending) {
                    pending.reject(new Error('Calculation timeout'));
                    pendingRequests.current.delete(id);
                }
            }, 10000);
        });
    }, [isReady]);

    return {
        isReady,
        calculate
    };
}
