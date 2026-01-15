const Alert = require('../models/Alert');
// Alert model is now 'RiskAlert' based on previous edit, but requiring file returns the model
const Student = require('../models/Student');
const User = require('../models/User');

/**
 * 🟢 Centralized RISK-BASED Alert Management
 * 
 * Logic (Idempotent & State-Based):
 * 1. Low Risk -> Resolve any active alert.
 * 2. Medium/High Risk:
 *    - If no active alert -> Create NEW.
 *    - If active alert exists:
 *      - If risk level changed -> Update alert.
 *      - If risk level same -> Do nothing (Throttle).
 *    - Update lastEvaluatedAt.
 */

const syncStudentAlert = async (student) => {
    // ... (keep existing implementation) ...
    try {
        const { riskScore, _id, name, assignedMentorId, course, riskLevel } = student;
        // Re-use the batch logic for single, or keep as is. Keeping as is for safety.
        // ... (existing code) ...
        // Note: For brevity in this replace block, I am trusting the previous logic is sound.
        // I will just paste the NEW function and the export updates.
        
        console.log(`[AlertService] Syncing for ${name} (Lvl: ${riskLevel}, Score: ${riskScore})`);

        // 1. Find ACTIVE alert for this student
        const activeAlert = await Alert.findOne({
            studentId: _id,
            active: true
        });

        if (riskLevel === 'Low') {
            if (activeAlert) {
                activeAlert.active = false;
                activeAlert.message = `Risk resolved (Score: ${Math.round(riskScore)}%)`;
                activeAlert.lastEvaluatedAt = new Date();
                await activeAlert.save();
            }
            return;
        }

        if (riskLevel === 'Medium' || riskLevel === 'High') {
             // Resolve Mentor (Best Effort)
             let mentorObjectId = null;
             if (assignedMentorId) {
                  const mentorUser = await User.findOne({ mentorId: assignedMentorId });
                  if (mentorUser) {
                      mentorObjectId = mentorUser._id;
                  }
             }

             const activeRiskAlert = activeAlert && activeAlert.alertType === 'RISK' ? activeAlert : null;

             if (!activeRiskAlert) {
                 await Alert.create({
                     studentId: _id,
                     studentName: name,
                     mentorId: mentorObjectId,
                     riskLevel: riskLevel,
                     riskScore: riskScore,
                     message: `Risk is ${riskLevel} (${Math.round(riskScore)}%)`,
                     alertType: 'RISK',
                     active: true,
                     createdAt: new Date(),
                     lastEvaluatedAt: new Date(),
                     lastUpdatedAt: new Date()
                 });
                 return;
             }

             if (activeRiskAlert) {
                 const oldLevel = activeRiskAlert.riskLevel;
                 activeRiskAlert.lastEvaluatedAt = new Date();
                 activeRiskAlert.riskScore = riskScore;

                 if (oldLevel !== riskLevel) {
                     activeRiskAlert.riskLevel = riskLevel;
                     activeRiskAlert.message = `Risk changed to ${riskLevel} (${Math.round(riskScore)}%)`;
                     activeRiskAlert.lastUpdatedAt = new Date();
                 }
                 if (!activeRiskAlert.mentorId && mentorObjectId) {
                     activeRiskAlert.mentorId = mentorObjectId;
                 }
                 await activeRiskAlert.save();
             }
        }
    } catch (error) {
        console.error("Alert Sync Error:", error);
    }
};

/**
 * ⚡ Optimized Batch Alert Sync
 * Reduces DB calls from N*3 to ~3 total queries
 */
const syncAlertsBatch = async (students, riskResultsMap) => {
    try {
        if (!students || students.length === 0) return 0;
        console.log(`[AlertService] 🚀 Starting Batch Sync for ${students.length} students...`);

        // 1. Prefetch Context Data (Mentors & Existing Alerts)
        const studentIds = students.map(s => s._id);
        const mentorIds = [...new Set(students.map(s => s.assignedMentorId).filter(Boolean))];

        const [mentors, existingAlerts] = await Promise.all([
            User.find({ mentorId: { $in: mentorIds } }).lean(),
            Alert.find({ studentId: { $in: studentIds }, active: true, alertType: 'RISK' })
        ]);

        // Create Lookup Maps
        const mentorMap = new Map(mentors.map(m => [m.mentorId, m._id])); // String ID -> ObjectId
        // Map: StudentID (string) -> Alert Document
        const alertMap = new Map(existingAlerts.map(a => [a.studentId.toString(), a]));

        const bulkOps = [];

        // 2. Iterate and Decide
        for (const student of students) {
            const riskData = riskResultsMap.get(student._id.toString());
            // If no fresh risk calculation, skip or use current? 
            // We assume riskEngine passed us students WHO HAVE valid results.
            if (!riskData) continue; 

            const { riskLevel, riskScore } = riskData;
            const existingAlert = alertMap.get(student._id.toString());
            const mentorObjectId = student.assignedMentorId ? mentorMap.get(student.assignedMentorId) : null;

            // Scenario A: Low Risk -> Deactivate if exists
            if (riskLevel === 'Low') {
                if (existingAlert) {
                    bulkOps.push({
                        updateOne: {
                            filter: { _id: existingAlert._id },
                            update: { 
                                $set: { 
                                    active: false,
                                    lastEvaluatedAt: new Date(),
                                    message: `Risk resolved (Score: ${Math.round(riskScore)}%)`
                                }
                            }
                        }
                    });
                }
                continue;
            }

            // Scenario B: Medium/High Risk
            if (riskLevel === 'Medium' || riskLevel === 'High') {
                const message = `Risk is ${riskLevel} (${Math.round(riskScore)}%)`;
                
                if (!existingAlert) {
                    // Create NEW
                    bulkOps.push({
                        insertOne: {
                            document: {
                                studentId: student._id,
                                studentName: student.name,
                                mentorId: mentorObjectId, // Can be null
                                riskLevel: riskLevel,
                                riskScore: riskScore,
                                message: message,
                                alertType: 'RISK',
                                active: true,
                                createdAt: new Date(),
                                lastEvaluatedAt: new Date(),
                                lastUpdatedAt: new Date()
                            }
                        }
                    });
                } else {
                    // Update Existing
                    const levelChanged = existingAlert.riskLevel !== riskLevel;
                    const updateFields = {
                        lastEvaluatedAt: new Date(),
                        riskScore: riskScore
                    };
                    
                    if (levelChanged) {
                        updateFields.riskLevel = riskLevel;
                        updateFields.message = `Risk changed to ${riskLevel} (${Math.round(riskScore)}%)`;
                        updateFields.lastUpdatedAt = new Date();
                    }

                    // Fix missing mentor link if available
                    if (!existingAlert.mentorId && mentorObjectId) {
                        updateFields.mentorId = mentorObjectId;
                    }

                    bulkOps.push({
                        updateOne: {
                            filter: { _id: existingAlert._id },
                            update: { $set: updateFields }
                        }
                    });
                }
            }
        }

        // 3. Execute Bulk Write
        if (bulkOps.length > 0) {
            const res = await Alert.bulkWrite(bulkOps);
            console.log(`[AlertService] 💾 Batch Alert Update: ${res.modifiedCount} updated, ${res.insertedCount} created.`);
            return (res.modifiedCount || 0) + (res.insertedCount || 0);
        }
        return 0;

    } catch (error) {
        console.error("Batch Alert Sync Error:", error);
        return 0;
    }
};

module.exports = { syncStudentAlert, syncAlertsBatch };
