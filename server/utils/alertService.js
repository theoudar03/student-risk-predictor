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
    try {
        const { riskScore, _id, name, assignedMentorId, course, riskLevel } = student;
        
        console.log(`[AlertService] Syncing for ${name} (Lvl: ${riskLevel}, Score: ${riskScore})`);

        // 1. Find ACTIVE alert for this student
        const activeAlert = await Alert.findOne({
            studentId: _id,
            active: true
        });

        // ------------------------------------------
        // SCENARIO A: Student is LOW Risk
        // Action: Resolve existing alert if found
        // ------------------------------------------
        if (riskLevel === 'Low') {
            if (activeAlert) {
                activeAlert.active = false;
                activeAlert.message = `Risk resolved (Score: ${Math.round(riskScore)}%)`;
                activeAlert.lastEvaluatedAt = new Date();
                await activeAlert.save();
                console.log(`[AlertService] 🟢 Resolved alert for ${name}`);
            }
            return;
        }

        // ------------------------------------------
        // SCENARIO B: Student is MEDIUM or HIGH Risk
        // Action: Create or Update based on state change
        // ------------------------------------------
        if (riskLevel === 'Medium' || riskLevel === 'High') {
            
            // B1. No active alert -> CREATE
            if (!activeAlert) {
                if (!assignedMentorId) {
                    console.log(`[AlertService] ⚠️ Cannot create alert for ${name}: No mentor assigned.`);
                    return;
                }

                // Resolve Mentor ObjectId from String ID
                const mentorUser = await User.findOne({ mentorId: assignedMentorId });
                if (!mentorUser) {
                     console.log(`[AlertService] ⚠️ Mentor not found for ID: ${assignedMentorId}`);
                     return;
                }

                await Alert.create({
                    studentId: _id,
                    studentName: name,
                    mentorId: mentorUser._id, // Use ObjectId
                    riskLevel: riskLevel,
                    riskScore: riskScore,
                    message: `Risk is ${riskLevel} (${Math.round(riskScore)}%)`,
                    active: true,
                    createdAt: new Date(),
                    lastEvaluatedAt: new Date()
                });
                console.log(`[AlertService] 🔔 Created NEW ${riskLevel} alert for ${name}`);
                return;
            }

            // B2. Active alert exists -> CHECK FOR CHANGE
            if (activeAlert) {
                const oldLevel = activeAlert.riskLevel;
                
                // Update timestamp to show we checked it
                activeAlert.lastEvaluatedAt = new Date();
                activeAlert.riskScore = riskScore; // Keep score fresh

                // Logic: If Level Changed (e.g. Medium -> High), update it.
                if (oldLevel !== riskLevel) {
                    activeAlert.riskLevel = riskLevel;
                    activeAlert.message = `Risk changed to ${riskLevel} (${Math.round(riskScore)}%)`;
                    console.log(`[AlertService] 🔄 Updated alert for ${name}: ${oldLevel} -> ${riskLevel}`);
                } else {
                    // Start throttling: Do nothing if level is same
                    // console.log(`[AlertService] 💤 IDLE: Risk level same (${riskLevel})`);
                }
                
                await activeAlert.save();
            }
        }

    } catch (error) {
        console.error("Alert Sync Error:", error);
    }
};

module.exports = { syncStudentAlert };
