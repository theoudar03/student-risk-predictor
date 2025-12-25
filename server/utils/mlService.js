const ML = require('ml-regression');
const MultivariateLinearRegression = ML.MultivariateLinearRegression;

let model;
let ready = false;

// Enhanced Training Data
// Inputs: [Attendance(%), CGPA(0-10), FeeDelayDays, Participation(0-10), Assignments(0-100)]
// Output: [RiskScore(0-100)]
const trainX = [
    [95, 9.5, 0, 9, 100], [88, 8.5, 0, 8, 90], [92, 9.0, 5, 8.5, 95], // Low Risk
    [75, 7.5, 10, 6, 80], [70, 7.0, 15, 6, 75], [65, 6.5, 0, 5, 70],  // Medium Risk Features
    [50, 5.0, 30, 4, 50], [40, 4.0, 60, 2, 30], [20, 2.0, 90, 1, 10], // High Risk Features
    [85, 6.0, 0, 7, 85],  // Mixed (Good attendance, ok grades)
    [60, 8.0, 0, 5, 60]   // Mixed (Ok attendance, good grades)
];

const trainY = [
    [5], [10], [8], // Low
    [35], [45], [55], // Medium 
    [80], [90], [98], // High
    [25], // Mixed -> Low/Med
    [40] // Mixed -> Medium
];

const trainModel = () => {
    try {
        model = new MultivariateLinearRegression(trainX, trainY);
        ready = true;

    } catch (error) {
        console.error('Model Training Failed:', error);
    }
};

const predictRisk = (attendance, cgpa, feeDelay, participation, assignments = 80) => {
    if (!ready) trainModel();
    
    // Normalize inputs if necessary or raw usage
    const inputs = [attendance, cgpa, feeDelay, participation, assignments];
    const prediction = model.predict(inputs);
    
    let riskScore = prediction[0];
    
    // Manual Heuristics to override/correction ML anomalies (Hybrid Approach)
    if (attendance < 50) riskScore += 20; // Severe attendance penalty
    if (feeDelay > 60) riskScore += 15; // Severe financial penalty
    
    // Clamping
    riskScore = Math.max(0, Math.min(100, riskScore));
    
    // Determine Level
    let level = 'Low';
    if (riskScore > 35) level = 'Medium';
    if (riskScore > 70) level = 'High';

    // Generate Explainable Factors
    const factors = [];
    if (attendance < 75) factors.push(`Low Attendance (${attendance}%)`);
    if (cgpa < 6.0) factors.push(`Low CGPA (${cgpa})`);
    if (feeDelay > 15) factors.push(`Fee Payment Overdue (${feeDelay} days)`);
    if (participation < 5) factors.push('Low Class Participation');
    if (assignments < 60) factors.push('Poor Assignment Completion');
    if (riskScore > 80 && factors.length === 0) factors.push('Complex Risk Pattern Detected');

    return {
        score: Math.round(riskScore),
        level,
        factors
    };
};

module.exports = { predictRisk };
