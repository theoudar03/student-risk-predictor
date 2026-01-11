const Student = require('../models/Student');
const { predictRisk, predictRiskBatch } = require('./mlService');
const { syncStudentAlert } = require('./alertService');

const ML_TIMEOUT_MS = 5000; // Hard SLA: 5 Seconds

const calculateRisk = async (studentId) => {
    // ... existing logic ...
    const startTime = Date.now();
    console.log(`[RiskEngine] 🕒 Starting calculation for Student ID: ${studentId}`);
    
    try {
        const student = await Student.findById(studentId);
        if (!student) return;

        // 1. Mark as PROCESSING
        student.riskStatus = 'PROCESSING';
        await student.save();

        const att = student.attendancePercentage ?? 0;
        const cgpa = student.cgpa ?? 0;
        const fee = student.feeDelayDays ?? 0;
        const part = student.classParticipationScore ?? 0;
        const assign = student.assignmentsCompleted ?? 85;

        const analysis = await Promise.race([
            predictRisk(Number(att), Number(cgpa), Number(fee), Number(part), Number(assign)),
            new Promise((_, reject) => setTimeout(() => reject(new Error("ML_TIMEOUT_EXCEEDED")), ML_TIMEOUT_MS))
        ]);

        student.riskScore = analysis.score;
        student.riskLevel = analysis.level;
        student.riskFactors = analysis.factors;
        student.riskStatus = 'CALCULATED';
        student.riskModel = 'extreme_dropout_v4';
        student.riskUpdatedAt = new Date();
        await student.save();
        await syncStudentAlert(student);

    } catch (error) {
        console.error(`[RiskEngine] ❌ Failed ID ${studentId}:`, error.message);
        await Student.findByIdAndUpdate(studentId, { riskStatus: 'FAILED', riskUpdatedAt: new Date() });
    }
};

const calculateAllRiskBatch = async () => {
    const startTime = Date.now();
    console.log(`[RiskEngine] 🚀 Starting BATCH calculation for ALL students`);

    try {
        // 1. Fetch ALL students
        const students = await Student.find({});
        if (students.length === 0) return { processed: 0, durationMs: 0 };

        // 2. Call ML Batch API
        console.log(`[RiskEngine] Sending ${students.length} students to Python ML...`);
        const predictions = await predictRiskBatch(students);
        
        // 3. Prepare Bulk Writes
        // We need to map predictions back to student IDs. 
        // Order is preserved in Python list, so index i corresponds to students[i]
        
        const bulkOps = students.map((student, i) => {
            const pred = predictions[i];
            const factors = [];
            // Re-generate factors locally or trust updated logic. Keeping heuristic explanation logic here for UI consistency
            const att = student.attendancePercentage;
            if (att < 75) factors.push(`Low Attendance (${att}%)`);
            if (student.cgpa < 6.0) factors.push(`Low CGPA (${student.cgpa})`);
            if (student.feeDelayDays > 15) factors.push(`Fee Payment Overdue (${student.feeDelayDays} days)`);

            return {
                updateOne: {
                    filter: { _id: student._id },
                    update: {
                        $set: {
                            riskScore: pred.riskScore,
                            riskLevel: pred.riskLevel,
                            riskStatus: 'CALCULATED',
                            riskModel: 'extreme_dropout_v4_batch',
                            riskUpdatedAt: new Date(),
                            riskFactors: factors
                        }
                    }
                }
            };
        });

        // 4. Execute Bulk Write
        if (bulkOps.length > 0) {
            await Student.bulkWrite(bulkOps);
        }

        const duration = Date.now() - startTime;
        console.log(`[RiskEngine] ✅ Batch Success in ${duration}ms | Count: ${students.length}`);
        
        return {
            processed: students.length,
            durationMs: duration,
            status: "success"
        };

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[RiskEngine] ❌ Batch Failed after ${duration}ms:`, error.message);
        throw error;
    }
};

module.exports = { calculateRisk, calculateAllRiskBatch };
