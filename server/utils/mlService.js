const axios = require('axios');

// Default JS Fallback Model (Keep for redundancy)
const ML = require('ml-regression');
const MultivariateLinearRegression = ML.MultivariateLinearRegression;
let model;
let ready = false;

// Fallback Training Data
const trainX = [
    [95, 9.5, 0, 9, 100], [88, 8.5, 0, 8, 90], [92, 9.0, 5, 8.5, 95], 
    [75, 7.5, 10, 6, 80], [70, 7.0, 15, 6, 75], [65, 6.5, 0, 5, 70], 
    [50, 5.0, 30, 4, 50], [40, 4.0, 60, 2, 30], [20, 2.0, 90, 1, 10]
];
const trainY = [[5], [10], [8], [35], [45], [55], [80], [90], [98]];

const trainJSModel = () => {
    try {
        model = new MultivariateLinearRegression(trainX, trainY);
        ready = true;
    } catch (error) {
        console.error('JS Model Training Failed:', error);
    }
};

const predictRisk = async (attendance, cgpa, feeDelay, participation, assignments = 80) => {
    // 1. Try Python ML Service
    try {
        const response = await axios.post('http://127.0.0.1:8000/predict-risk', {
            attendancePercentage: attendance,
            cgpa: cgpa,
            feeDelayDays: feeDelay,
            classParticipationScore: participation,
            assignmentsCompleted: assignments
        });
        
        if (response.data) {
             console.log("✅ Using Python ML Prediction");
             const { riskScore, riskLevel } = response.data;
             
             // Generate Factors (Shared Logic)
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
        console.warn("⚠️ Python ML Service unavailable, falling back to Node.js model...");
    }

    // 2. Fallback to JS Model
    if (!ready) trainJSModel();
    const inputs = [attendance, cgpa, feeDelay, participation, assignments];
    const prediction = model.predict(inputs);
    let riskScore = prediction[0];
    
    // Heuristics
    if (attendance < 50) riskScore += 20;
    if (feeDelay > 60) riskScore += 15;
    riskScore = Math.max(0, Math.min(100, riskScore));
    
    let level = 'Low';
    if (riskScore > 35) level = 'Medium';
    if (riskScore > 70) level = 'High';

    const factors = [];
    if (attendance < 75) factors.push(`Low Attendance (${attendance}%)`);
    if (cgpa < 6.0) factors.push(`Low CGPA (${cgpa})`);
    if (feeDelay > 15) factors.push(`Fee Payment Overdue (${feeDelay} days)`);

    return {
        score: Math.round(riskScore),
        level,
        factors
    };
};

module.exports = { predictRisk };
