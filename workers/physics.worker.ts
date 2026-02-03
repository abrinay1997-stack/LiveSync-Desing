/**
 * Physics Worker - Offloads heavy computational tasks from main thread
 * 
 * Handles:
 * - Catenary curve calculations (cable sag)
 * - Load distribution analysis
 * - Safety factor computations
 * - SPL mapping (future)
 */

import { calculateCatenary, CatenaryParams, CatenaryResult } from '../utils/physics/catenary';
import { calculateLoadDistribution, LoadDistributionParams, LoadDistributionResult } from '../utils/physics/loadDistribution';

export interface WorkerMessage {
    id: string;
    type: 'catenary' | 'loadDistribution' | 'spl';
    payload: any;
}

export interface WorkerResponse {
    id: string;
    type: string;
    result?: any;
    error?: string;
}

// Listen for messages from main thread
self.onmessage = (e: MessageEvent<WorkerMessage>) => {
    const { id, type, payload } = e.data;
    
    try {
        let result: any;
        
        switch (type) {
            case 'catenary':
                result = calculateCatenary(payload as CatenaryParams);
                break;
                
            case 'loadDistribution':
                result = calculateLoadDistribution(payload as LoadDistributionParams);
                break;
                
            case 'spl':
                // Future: SPL mapping
                throw new Error('SPL mapping not yet implemented');
                
            default:
                throw new Error(`Unknown calculation type: ${type}`);
        }
        
        const response: WorkerResponse = {
            id,
            type,
            result
        };
        
        self.postMessage(response);
        
    } catch (error) {
        const errorResponse: WorkerResponse = {
            id,
            type,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
        
        self.postMessage(errorResponse);
    }
};

// Signal ready
self.postMessage({ type: 'ready' });
