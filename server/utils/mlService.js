const axios = require('axios');

const predictRisk = async (attendance, cgpa, feeDelay, participation, assignments = 80) => {
    // Call Python ML Service
    let mlUrl = process.env.ML_SERVICE_URL;
    
    // In production, ensure we don't silently fallback to localhost
    if (process.env.NODE_ENV === 'production' && !mlUrl) {
         console.warn("⚠️ WARNING: ML_SERVICE_URL is not set in production! Defaulting to localhost may fail.");
    }
    
    mlUrl = mlUrl || 'http://127.0.0.1:8001';
    try {
        const response = await axios.post(`${mlUrl}/predict-risk`, {
            attendancePercentage: attendance,
            cgpa: cgpa,
            feeDelayDays: feeDelay,
            classParticipationScore: participation,
            assignmentsCompleted: assignments
        });
        
        if (response.data) {
             const { riskScore, riskLevel } = response.data;
             
             // Generate Factors for UI explanation
             const factors = [];
             if (attendance < 75) factors.push(`Low Attendance (${attendance}%)`);
             if (cgpa < 6.0) factors.push(`Low CGPA (${cgpa})`);
             if (feeDelay > 15) factors.push(`Fee Payment Overdue (${feeDelay} days)`);
             if (participation < 5) factors.push('Low Class Participation');
             if (assignments < 60) factors.push('Poor Assignment Completion');
             
             return {
                 score: Math.round(riskScore),
                 level: riskLevel,
                 factors
             };
        }
    } catch (error) {
        console.error("⚠️ Python ML Service unavailable:", error.message);
        // Requirement: No fake/default scores. Fail gracefully by notifying caller.
        throw new Error("ML_SERVICE_UNAVAILABLE");
    }
};

const predictRiskBatch = async (students) => {
    let mlUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8001';
    
    // Transform incoming student objects to match Python Pydantic schema
    const payload = students.map(s => ({
        attendancePercentage: Number(s.attendancePercentage || 0),
        cgpa: Number(s.cgpa || 0),
        feeDelayDays: Number(s.feeDelayDays || 0),
        classParticipationScore: Number(s.classParticipationScore || 0),
        assignmentsCompleted: Number(s.assignmentsCompleted || 85)
    }));

    try {
        const response = await axios.post(`${mlUrl}/predict-risk-batch`, payload);
        return response.data; // Returns Array<{ riskScore, riskLevel }>
    } catch (error) {
        console.error("⚠️ Python ML Batch Service unavailable:", error.message);
        throw new Error("ML_SERVICE_UNAVAILABLE");
    }
};

module.exports = { predictRisk, predictRiskBatch };
