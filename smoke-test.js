/**
 * Quick Smoke Test - Run this to verify basic functionality
 * 
 * Execute: node smoke-test.js
 */

// Test 1: Catenary calculation
console.log('🧪 Test 1: Catenary Calculation');
const catenary = require('./utils/physics/catenary');

try {
    const result = catenary.calculateCatenary({
        span: 10,
        weight: 500,
        cableWeight: 2,
        heightDiff: 0
    });

    console.log('✅ Catenary calculation successful');
    console.log(`   Sag: ${result.sag.toFixed(3)}m`);
    console.log(`   Max Tension: ${result.maxTension.toFixed(0)}N`);
} catch (e) {
    console.error('❌ Catenary test failed:', e.message);
}

// Test 2: Load distribution
console.log('\n🧪 Test 2: Load Distribution');
const loadDist = require('./utils/physics/loadDistribution');

try {
    const result = loadDist.calculateLoadDistribution({
        riggingPoints: [
            {
                id: 'motor1',
                position: [0, 10, 0],
                type: 'motor',
                capacity: 1000
            }
        ],
        loads: [
            {
                id: 'speaker1',
                weight: 500,
                position: [0, 5, 0],
                attachedTo: ['motor1']
            }
        ]
    });

    console.log('✅ Load distribution successful');
    console.log(`   Safety Factor: ${result.safetyFactor.toFixed(2)}:1`);
    console.log(`   Safe: ${result.safe ? 'Yes' : 'No'}`);
} catch (e) {
    console.error('❌ Load distribution test failed:', e.message);
}

// Test 3: Geometry analysis
console.log('\n🧪 Test 3: Geometry Analysis');
const geometry = require('./utils/physics/geometry');

try {
    const angle = geometry.calculateAngleFromVertical(
        { x: 0, y: 10, z: 0 },
        { x: 5, y: 5, z: 0 }
    );

    console.log('✅ Geometry calculation successful');
    console.log(`   Angle: ${angle.toFixed(1)}° from vertical`);
} catch (e) {
    console.error('❌ Geometry test failed:', e.message);
}

// Test 4: Deflection analysis
console.log('\n🧪 Test 4: Deflection Calculation');
const deflection = require('./utils/physics/deflection');

try {
    const result = deflection.calculatePointLoadDeflection(
        {
            length: 3,
            material: 'aluminum',
            crossSection: 'F34'
        },
        500
    );

    console.log('✅ Deflection calculation successful');
    console.log(`   Max Deflection: ${(result.maxDeflection * 1000).toFixed(2)}mm`);
    console.log(`   L/δ Ratio: ${result.deflectionRatio.toFixed(0)}`);
    console.log(`   Safe: ${result.safetyOk ? 'Yes' : 'No'}`);
} catch (e) {
    console.error('❌ Deflection test failed:', e.message);
}

console.log('\n✨ Smoke test complete!');
