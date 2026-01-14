const axios = require('axios');

// Enforce environment variable check in production
const getMlUrl = () => {
    const url = process.env.ML_SERVICE_URL;
    if (process.env.NODE_ENV === 'production' && !url) {
        console.error("🚨 CRITICAL: ML_SERVICE_URL is not set in production!");
        throw new Error("CONFIGURATION_ERROR: ML_SERVICE_URL missing");
    }
    return url || 'http://127.0.0.1:8001';
};

/**
 * Calls the Python ML Service to calculate risk for a single student.
 * 
 * Maps Node.js CamelCase fields -> Python snake_case
 * Maps Python response -> Node.js schema
 */
const predictRisk = async (attendance, cgpa, feeDelay, participation, assignments) => {
    const mlUrl = getMlUrl();
    
    // STRICT payload construction (Must match FastAPI RiskInput)
    const payload = {
        attendance: Number(attendance),
        cgpa: Number(cgpa),
        fee_delay: Number(feeDelay),
        assignments: Number(assignments),
        engagement: Number(participation)
    };

    try {
        console.log(`[ML Service] Sending request to ${mlUrl}/api/ml/calculate-risk`, payload);
        
        const makeRequest = async (retries = 1) => {
            try {
                return await axios.post(`${mlUrl}/api/ml/calculate-risk`, payload, {
                    timeout: 4000 // 4s timeout (Requirement: 3-5s)
                });
            } catch (err) {
                if (retries > 0 && (!err.response || err.response.status >= 500)) {
                    console.log(`[ML Service] Request failed, retrying... (${retries} attempts left)`);
                    return makeRequest(retries - 1);
                }
                throw err;
            }
        };

        const response = await makeRequest();
        const data = response.data;

        // Validation of response structure
        if (typeof data.risk_score !== 'number' || !data.risk_category || !Array.isArray(data.risk_reasons)) {
            console.error("[ML Service] Invalid response format:", data);
            throw new Error("INVALID_ML_RESPONSE");
        }

        return {
            riskScore: data.risk_score,
            riskLevel: data.risk_category, // Map risk_category -> riskLevel
            riskFactors: data.risk_reasons // Map risk_reasons -> riskFactors
        };

    } catch (error) {
        console.error("⚠️ ML Service Failure:", error.message);
        if (error.response) {
            console.error("   Status:", error.response.status);
            console.error("   Data:", error.response.data);
        }
        throw new Error("ML_SERVICE_UNAVAILABLE");
    }
};

/**
 * Batched prediction (Currently implemented as concurrent requests
 * because Python side only supports single-item prediction).
 */
/**
 * Batched prediction with concurrency limit (Chunk Size = 10)
 * Ensures ML service is not overloaded.
 */
const predictRiskBatch = async (students) => {
    const BATCH_SIZE = 10;
    const allResults = [];

    // Helper: Process a chunk
    const processChunk = async (chunk) => {
        const promises = chunk.map(student => {
            return predictRisk(
                student.attendancePercentage || 0,
                student.cgpa || 0,
                student.feeDelayDays || 0,
                student.classParticipationScore || 0,
                student.assignmentsCompleted || 85
            ).then(result => ({
                studentId: student._id,
                success: true,
                data: result
            })).catch(err => ({
                studentId: student._id,
                success: false,
                error: err.message
            }));
        });
        return Promise.all(promises);
    };

    // Process all chunks sequentially
    for (let i = 0; i < students.length; i += BATCH_SIZE) {
        const chunk = students.slice(i, i + BATCH_SIZE);
        console.log(`[ML Service] Processing batch chunk ${i / BATCH_SIZE + 1} of ${Math.ceil(students.length / BATCH_SIZE)}`);
        
        try {
            const chunkResults = await processChunk(chunk);
            allResults.push(...chunkResults);
        } catch (e) {
            console.error(`[ML Service] Chunk failed massively:`, e);
            // Fallback for catastrophic payload failure (unlikely given individual catch)
        }
    }

    return allResults;
};

module.exports = { predictRisk, predictRiskBatch };

