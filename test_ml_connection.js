const { predictRisk } = require('./server/utils/mlService');

async function testML() {
    console.log("Testing ML Connection...");
    try {
        const result = await predictRisk(
            75.5, // attendance
            8.2,  // cgpa
            0,    // feeDelay
            8,    // participation (engagement)
            90    // assignments
        );
        console.log("✅ ML Prediction Success:", result);
    } catch (error) {
        console.error("❌ ML Prediction Failed:", error.message);
    }
}

testML();
