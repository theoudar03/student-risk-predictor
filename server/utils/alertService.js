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
            
            // Resolve Mentor (Best Effort)
            let mentorObjectId = null;
            if (assignedMentorId) {
                 const mentorUser = await User.findOne({ mentorId: assignedMentorId });
                 if (mentorUser) {
                     mentorObjectId = mentorUser._id;
                 } else {
                     console.warn(`[AlertService] ⚠️ Mentor ID ${assignedMentorId} not found for student ${name}. Alert will be unassigned.`);
                 }
            }

            // B1. No active RISK alert -> CREATE
            // We specifically look for alertType 'RISK' to differentiate from others
            const activeRiskAlert = activeAlert && activeAlert.alertType === 'RISK' ? activeAlert : null;

            if (!activeRiskAlert) {
                await Alert.create({
                    studentId: _id,
                    studentName: name,
                    mentorId: mentorObjectId, // Can be null now
                    riskLevel: riskLevel,
                    riskScore: riskScore,
                    message: `Risk is ${riskLevel} (${Math.round(riskScore)}%)`,
                    alertType: 'RISK',
                    active: true,
                    createdAt: new Date(),
                    lastEvaluatedAt: new Date(),
                    lastUpdatedAt: new Date()
                });
                console.log(`[AlertService] 🔔 Created NEW ${riskLevel} alert for ${name}`);
                return;
            }

            // B2. Active alert exists -> CHECK FOR CHANGE
            if (activeRiskAlert) {
                const oldLevel = activeRiskAlert.riskLevel;
                
                // Update timestamp to show we checked it
                activeRiskAlert.lastEvaluatedAt = new Date();
                activeRiskAlert.riskScore = riskScore; // Keep score fresh

                // Logic: If Level Changed (e.g. Medium -> High), update it.
                if (oldLevel !== riskLevel) {
                    activeRiskAlert.riskLevel = riskLevel;
                    activeRiskAlert.message = `Risk changed to ${riskLevel} (${Math.round(riskScore)}%)`;
                    activeRiskAlert.lastUpdatedAt = new Date(); // Only update this on meaningful change
                    console.log(`[AlertService] 🔄 Updated alert for ${name}: ${oldLevel} -> ${riskLevel}`);
                }
                
                // Ensure mentor is linked if previously missing but now available
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

module.exports = { syncStudentAlert };
