const Student = require('../models/Student');
const { predictRisk, predictRiskBatch } = require('./mlService');
const { syncStudentAlert } = require('./alertService');

const ML_TIMEOUT_MS = 5000; // Hard SLA: 5 Seconds

const calculateRisk = async (studentId, reason = 'RealtimeTrigger') => {
    // ... existing logic ...
    const startTime = Date.now();
    console.log(`[RiskEngine] 🕒 Starting calculation for Student ID: ${studentId} [Reason: ${reason}]`);
    
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

        // Call ML Service (Single)
        const analysis = await Promise.race([
            predictRisk(Number(att), Number(cgpa), Number(fee), Number(part), Number(assign)),
            new Promise((_, reject) => setTimeout(() => reject(new Error("ML_TIMEOUT_EXCEEDED")), ML_TIMEOUT_MS))
        ]);

        // STRICTLY use ML output
        student.riskScore = analysis.riskScore;
        student.riskLevel = analysis.riskLevel;
        student.riskFactors = analysis.riskFactors;
        student.riskStatus = 'CALCULATED';
        student.riskModel = 'risk_calc_model';
        student.riskModelVersion = '1.0';
        student.riskRecalculationReason = reason; // Use the dynamic reason
        student.riskUpdatedAt = new Date();
        
        await student.save();
        await syncStudentAlert(student);
        console.log(`[RiskEngine] ✅ Success for ${studentId}: Score ${student.riskScore} (${student.riskLevel})`);

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

        // 2. Call ML Batch API (Concurrent calls via mlService with chunks)
        console.log(`[RiskEngine] Sending ${students.length} students to Python ML...`);
        const results = await predictRiskBatch(students);
        
        // 3. Prepare Bulk Writes
        const bulkOps = [];
        
        results.forEach((result) => {
            if (result.success) {
                const { riskScore, riskLevel, riskFactors } = result.data;
                
                bulkOps.push({
                    updateOne: {
                        filter: { _id: result.studentId },
                        update: {
                            $set: {
                                riskScore: riskScore,
                                riskLevel: riskLevel,
                                riskFactors: riskFactors, // DIRECTLY FROM ML
                                riskStatus: 'CALCULATED',
                                riskModel: 'risk_calc_model_batch',
                                riskModelVersion: '1.0',
                                riskRecalculationReason: 'BatchScheduler',
                                riskUpdatedAt: new Date()
                            }
                        }
                    }
                });
            } else {
                 // Handle individual failures in batch
                 console.error(`[RiskEngine] Batch item failed for ${result.studentId}: ${result.error}`);
                 bulkOps.push({
                    updateOne: {
                        filter: { _id: result.studentId },
                        update: {
                            $set: { riskStatus: 'FAILED', riskUpdatedAt: new Date() }
                        }
                    }
                });
            }
        });

        // 4. Execute Bulk Write
        if (bulkOps.length > 0) {
            await Student.bulkWrite(bulkOps);
        }

        const duration = Date.now() - startTime;
        console.log(`[RiskEngine] ✅ Batch Processed in ${duration}ms | Count: ${students.length}`);
        
        return {
            processed: students.length,
            durationMs: duration,
            status: "success"
        };

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[RiskEngine] ❌ Batch System Failed after ${duration}ms:`, error.message);
        throw error;
    }
};

module.exports = { calculateRisk, calculateAllRiskBatch };

