const Alert = require('../models/Alert');
const Student = require('../models/Student');
const moment = require('moment'); // Timezone safe string handling

/**
 * 🟢 Centralized Alert Management
 * Ensures alerts are generated STRICTLY for the current day.
 * Old alerts are automatically deactivated to prevent staleness.
 */

// Define thresholds based on strict ML logic (v4.0)
const RISK_THRESHOLDS = {
    HIGH: 50,
    MEDIUM: 25
};

const getTodayStr = () => moment().format('YYYY-MM-DD');

const syncStudentAlert = async (student) => {
    try {
        const { riskScore, _id, name, assignedMentorId, course } = student;
        const todayStr = getTodayStr();

        console.log(`[AlertService] Syncing for ${name} (Score: ${riskScore}) on ${todayStr}`);

        // 1. CLEANUP: Deactivate ALL active alerts for this student that are NOT from today
        // This ensures the bell icon never shows "yesterday's news"
        await Alert.updateMany(
            { 
                studentId: _id, 
                status: 'Active',
                dateOnly: { $ne: todayStr } 
            },
            { $set: { status: 'Resolved', resolvedAt: new Date() } }
        );

        // 2. Determine Current Risk Level
        let newSeverity = null;
        if (riskScore > RISK_THRESHOLDS.HIGH) newSeverity = 'High';
        else if (riskScore > RISK_THRESHOLDS.MEDIUM) newSeverity = 'Medium';

        // 3. Check for TODAY'S Active Alert
        const todayAlert = await Alert.findOne({ 
            studentId: _id, 
            status: 'Active',
            dateOnly: todayStr
        });

        if (newSeverity) {
            // RISK EXISTS (Medium/High)
            if (todayAlert) {
                // Update existing alert only if severity escalates or changes
                if (todayAlert.severity !== newSeverity) {
                    todayAlert.severity = newSeverity;
                    todayAlert.message = `Risk updated to ${newSeverity} (${Math.round(riskScore)}%)`;
                    todayAlert.riskScore = riskScore; // Keep score current (float)
                    await todayAlert.save();
                    console.log(`[AlertService] Updated today's alert for ${name} -> ${newSeverity}`);
                }
            } else {
                // CREATE FRESH ALERT FOR TODAY
                await Alert.create({
                    studentId: _id,
                    studentName: name,
                    mentorId: assignedMentorId, 
                    department: course,
                    severity: newSeverity,
                    message: `Risk Level is ${newSeverity} (${Math.round(riskScore)}%)`,
                    riskScore: riskScore,
                    status: 'Active',
                    date: new Date(),
                    dateOnly: todayStr // Partition Key
                });
                console.log(`[AlertService] Created fresh alert for ${name} (${todayStr})`);
            }
        } else {
            // LOW RISK implies no alert needed
            if (todayAlert) {
                todayAlert.status = 'Resolved';
                todayAlert.resolvedAt = new Date();
                todayAlert.message = `Risk dropped to Low (${Math.round(riskScore)}%)`;
                await todayAlert.save();
                console.log(`[AlertService] Resolved today's alert for ${name}`);
            }
        }

    } catch (error) {
        console.error("Alert Sync Error:", error);
    }
};

module.exports = { syncStudentAlert };
