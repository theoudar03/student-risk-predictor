const axios = require('axios');

const predictRisk = async (attendance, cgpa, feeDelay, participation, assignments = 80) => {
    // Call Python ML Service
    try {
        const response = await axios.post('http://127.0.0.1:8000/predict-risk', {
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
        // Fallback to safe default if service is down, to prevent app crash
        return { score: 0, level: 'Low', factors: ['ML Service Unavailable'] };
    }
};

module.exports = { predictRisk };
