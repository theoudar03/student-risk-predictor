const Student = require('../models/Student');
const { predictRisk } = require('./mlService');
const { syncStudentAlert } = require('./alertService');

const ML_TIMEOUT_MS = 5000; // Hard SLA: 5 Seconds

const calculateRisk = async (studentId) => {
    const startTime = Date.now();
    console.log(`[RiskEngine] 🕒 Starting calculation for Student ID: ${studentId}`);
    
    try {
        const student = await Student.findById(studentId);
        if (!student) {
            console.error(`[RiskEngine] Student not found: ${studentId}`);
            return;
        }

        // 1. Mark as PROCESSING immediately
        student.riskStatus = 'PROCESSING';
        await student.save();

        // 2. Prepare Data for ML
        const att = student.attendancePercentage ?? 0;
        const cgpa = student.cgpa ?? 0;
        const fee = student.feeDelayDays ?? 0;
        const part = student.classParticipationScore ?? 0;
        const assign = student.assignmentsCompleted ?? 85;

        // 3. Call ML Service with explicit TIMEOUT
        const mlPromise = predictRisk(
            Number(att),
            Number(cgpa),
            Number(fee),
            Number(part),
            Number(assign)
        );

        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("ML_TIMEOUT_EXCEEDED")), ML_TIMEOUT_MS)
        );

        // RACE: ML vs Time
        const analysis = await Promise.race([mlPromise, timeoutPromise]);

        // 4. Update Student Record (Success)
        const duration = (Date.now() - startTime) / 1000;
        
        student.riskScore = analysis.score;
        student.riskLevel = analysis.level;
        student.riskFactors = analysis.factors;
        student.riskStatus = 'CALCULATED';
        student.riskModel = 'extreme_dropout_v4';
        student.riskUpdatedAt = new Date();
        
        await student.save();
        console.log(`[RiskEngine] ✅ Success in ${duration}s | Score: ${analysis.score}`);

        // 5. Trigger Alerts
        await syncStudentAlert(student);

    } catch (error) {
        const duration = (Date.now() - startTime) / 1000;
        console.error(`[RiskEngine] ❌ Failed after ${duration}s:`, error.message);
        
        // Update status to FAILED
        try {
            await Student.findByIdAndUpdate(studentId, {
                riskStatus: 'FAILED',
                riskUpdatedAt: new Date()
            });
        } catch (dbErr) {
            console.error("[RiskEngine] Failed to update error status:", dbErr);
        }
    }
};

module.exports = { calculateRisk };
