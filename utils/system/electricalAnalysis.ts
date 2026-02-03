/**
 * Calculates total impedance of speakers connected in parallel
 * Formula: 1 / R_total = 1/R1 + 1/R2 + ...
 */
export function calculateParallelImpedance(speakers: number[]): number {
    if (speakers.length === 0) return 0;

    // Avoid division by zero if impedance is 0 (short circuit)
    if (speakers.some(z => z <= 0)) return 0;

    const sumInverse = speakers.reduce((acc, z) => acc + (1 / z), 0);
    return 1 / sumInverse;
}

// Alias for UI components
export const calculateChannelImpedance = calculateParallelImpedance;

/**
 * Calculates dB headroom based on amp power and speaker ratings
 */
export function calculateHeadroom(
    ampPowerWatts: number,
    speakerRMSWatts: number,
    speakerPeakWatts: number
): { headroomDB: number; status: 'safe' | 'limit' | 'clip' } {
    // If amp is underpowered vs RMS
    if (ampPowerWatts < speakerRMSWatts) {
        return { headroomDB: -3, status: 'clip' }; // Risk of clipping amp to reach volume
    }

    // Calculate headroom relative to Peak capability
    // This is a simplified check. Usually we want Amp ~ 2x RMS.

    const ratio = ampPowerWatts / speakerRMSWatts;
    const db = 10 * Math.log10(ratio);

    if (ampPowerWatts > speakerPeakWatts) {
        return { headroomDB: db, status: 'limit' }; // Risk of blowing speaker
    }

    return { headroomDB: db, status: 'safe' };
}
