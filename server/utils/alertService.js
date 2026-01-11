const Alert = require('../models/Alert');
const Student = require('../models/Student');

/**
 * 🟢 Centralized Alert Management
 * Ensures alerts are always in sync with student risk data.
 */

// Define thresholds based on strict ML logic (v4.0)
const RISK_THRESHOLDS = {
    HIGH: 50,
    MEDIUM: 20
};

const syncStudentAlert = async (student) => {
    try {
        const { riskScore, _id, name, assignedMentorId, course } = student;
        
        console.log(`[AlertService] Syncing for ${name} (Score: ${riskScore})`);

        // 1. Determine Risk Level
        let newSeverity = null;
        if (riskScore > RISK_THRESHOLDS.HIGH) newSeverity = 'High';
        else if (riskScore > RISK_THRESHOLDS.MEDIUM) newSeverity = 'Medium';

        // 2. Fetch Existing Active Alert
        const existingAlert = await Alert.findOne({ 
            studentId: _id, 
            status: 'Active' 
        });

        // 3. Logic Matrix
        if (newSeverity) {
            // Case A: Risk exists (Medium or High)
            if (existingAlert) {
                if (existingAlert.severity !== newSeverity) {
                    // Update Severity if changed
                    existingAlert.severity = newSeverity;
                    existingAlert.message = `Auto-Update: Risk is now ${newSeverity} (${riskScore}%)`;
                    existingAlert.date = new Date(); // Bump timestamp
                    await existingAlert.save();
                    console.log(`[AlertService] Updated alert for ${name}: ${newSeverity}`);
                }
                // If severity matches, do nothing (idempotent)
            } else {
                // Create New Alert
                await Alert.create({
                    studentId: _id,
                    studentName: name,
                    mentorId: assignedMentorId, // Can be null, filtered in frontend
                    department: course,
                    severity: newSeverity,
                    message: `Risk Level escalated to ${newSeverity} (${riskScore}%)`,
                    riskScore: riskScore,
                    status: 'Active',
                    date: new Date()
                });
                console.log(`[AlertService] Created new ${newSeverity} alert for ${name}`);
            }
        } else {
            // Case B: No Risk (Low)
            if (existingAlert) {
                // Resolve existing alert
                existingAlert.status = 'Resolved';
                existingAlert.resolvedAt = new Date();
                await existingAlert.save();
                console.log(`[AlertService] Resolved alert for ${name}`);
            }
        }

    } catch (error) {
        console.error("Alert Sync Error:", error);
    }
};

module.exports = { syncStudentAlert };
