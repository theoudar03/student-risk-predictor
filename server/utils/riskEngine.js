const Student = require('../models/Student');
const { predictRisk } = require('./mlService');
const { syncStudentAlert } = require('./alertService');

const calculateRisk = async (studentId) => {
    console.log(`[RiskEngine] Starting calculation for Student ID: ${studentId}`);
    
    try {
        const student = await Student.findById(studentId);
        if (!student) {
            console.error(`[RiskEngine] Student not found: ${studentId}`);
            return;
        }

        // 1. Prepare Data for ML
        // Use nullish coalescing to ensure we send numbers
        const att = student.attendancePercentage ?? 0;
        const cgpa = student.cgpa ?? 0;
        const fee = student.feeDelayDays ?? 0;
        const part = student.classParticipationScore ?? 0;
        const assign = student.assignmentsCompleted ?? 85;

        // 2. Call ML Service
        const analysis = await predictRisk(
            Number(att),
            Number(cgpa),
            Number(fee),
            Number(part),
            Number(assign)
        );

        // 3. Update Student Record
        student.riskScore = analysis.score;
        student.riskLevel = analysis.level;
        student.riskFactors = analysis.factors;
        student.riskStatus = 'CALCULATED';
        student.riskModel = 'extreme_dropout_v4';
        
        await student.save();
        console.log(`[RiskEngine] Risk calculated for ${student.name}: ${analysis.score} (${analysis.level})`);

        // 4. Trigger Alerts (Only after successful calculation)
        await syncStudentAlert(student);

    } catch (error) {
        console.error(`[RiskEngine] Failed for Student ${studentId}:`, error.message);
        
        // Update status to keep it PENDING or mark as FAILED?
        // User says: "If ML service is unavailable: Keep riskStatus = PENDING"
        // So we might not need to update anything in DB if we want it to stay pending for retry.
        // However, logging is crucial.
        
        // Optional: We could update a lastAttempted timestamp if we want to implement backoff later.
        // For now, ensuring we don't crash is key.
    }
};

module.exports = { calculateRisk };
