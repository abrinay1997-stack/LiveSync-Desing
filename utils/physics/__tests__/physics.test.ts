/**
 * Unit Tests for Physics Calculations
 * 
 * Run with: npm test
 */

import { calculateCatenary, validateCableSafety } from '../catenary';
import { calculateLoadDistribution } from '../loadDistribution';

describe('Catenary Curve Calculations', () => {
    test('calculates sag for suspended cable', () => {
        const result = calculateCatenary({
            span: 10, // 10m span
            weight: 500, // 500kg suspended
            cableWeight: 2, // 2kg/m cable
            heightDiff: 0
        });

        expect(result.sag).toBeGreaterThan(0);
        expect(result.cableLength).toBeGreaterThan(10); // Cable longer than span
        expect(result.maxTension).toBeGreaterThan(result.minTension);
        expect(result.curve.length).toBe(21); // 21 points for visualization
    });

    test('cable safety validation', () => {
        const safeResult = validateCableSafety(
            50000, // 50kN breaking load
            10000, // 10kN tension
            5 // 5:1 safety factor required
        );

        expect(safeResult.safe).toBe(true);
        expect(safeResult.actualSafetyFactor).toBe(5);

        const unsafeResult = validateCableSafety(
            10000, // 10kN breaking load
            8000, // 8kN tension
            5
        );

        expect(unsafeResult.safe).toBe(false);
        expect(unsafeResult.warnings.length).toBeGreaterThan(0);
    });
});

describe('Load Distribution Calculations', () => {
    test('distributes load across multiple rigging points', () => {
        const result = calculateLoadDistribution({
            riggingPoints: [
                {
                    id: 'motor1',
                    position: [0, 10, 0],
                    type: 'motor',
                    capacity: 1000 // 1 ton WLL
                },
                {
                    id: 'motor2',
                    position: [5, 10, 0],
                    type: 'motor',
                    capacity: 1000
                }
            ],
            loads: [
                {
                    id: 'speaker1',
                    weight: 600, // 600kg total
                    position: [2.5, 5, 0],
                    attachedTo: ['motor1', 'motor2']
                }
            ]
        });

        expect(result.totalWeight).toBe(600);
        expect(result.pointLoads.length).toBe(2);

        // Each motor should hold ~300kg static (600/2)
        // With 1.5x dynamic factor = 450kg
        expect(result.pointLoads[0].staticLoad).toBe(300);
        expect(result.pointLoads[0].dynamicLoad).toBe(450);
        expect(result.pointLoads[0].utilization).toBe(45); // 450/1000 * 100

        expect(result.safe).toBe(true); // 450kg < 1000kg WLL
        expect(result.safetyFactor).toBeGreaterThanOrEqual(5);
    });

    test('detects overload condition', () => {
        const result = calculateLoadDistribution({
            riggingPoints: [
                {
                    id: 'motor1',
                    position: [0, 10, 0],
                    type: 'motor',
                    capacity: 500 // Only 500kg capacity
                }
            ],
            loads: [
                {
                    id: 'speaker1',
                    weight: 800, // 800kg exceeds capacity with dynamic factor
                    position: [0, 5, 0],
                    attachedTo: ['motor1']
                }
            ]
        });

        // 800kg * 1.5 dynamic = 1200kg > 500kg WLL
        expect(result.safe).toBe(false);
        expect(result.maxUtilization).toBeGreaterThan(100);
        expect(result.warnings.length).toBeGreaterThan(0);
    });
});
