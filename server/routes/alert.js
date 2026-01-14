const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const User = require('../models/User');
const Student = require('../models/Student');
const moment = require('moment');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get Alerts for Mentor (Today Only)
router.get('/', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'mentor') {
            return res.status(403).json({ error: "Access denied" });
        }

        const currentUser = await User.findById(req.user.id);
        if (!currentUser || !currentUser.department) {
            return res.json([]);
        }

        // Rule: Show ONLY alerts created/updated TODAY
        const todayStr = moment().format('YYYY-MM-DD');

        // Find students in mentor's department
        const deptStudents = await Student.find({ course: currentUser.department }, '_id');
        const deptStudentIds = deptStudents.map(s => s._id);

        const alerts = await Alert.find({
            studentId: { $in: deptStudentIds },
            status: 'Active',
            dateOnly: todayStr // STRICT DATE FILTER
        }).sort({ severity: 1, date: -1 }); // 'High' before 'Medium' (alphabetical h < m? No. High=H, Medium=M. H comes before M? Yes. Wait. 'High' vs 'Medium'. H is 8th, M is 13th. So 'High' comes first in ascending string sort. Wait, context says High/Medium logic.)
        // Actually, let's trust the FE to sort or sort clearly here.
        // Severity Enum: High, Medium, Low. 
        // We want High first.
        
        // Let's sort manually in JS to be safe
        const sortedAlerts = alerts.sort((a, b) => {
             const priorities = { 'High': 2, 'Medium': 1, 'Low': 0 };
             return priorities[b.severity] - priorities[a.severity];
        });

        // Presentation Mapping: Round Risk Score in Alert Object
        const presentationAlerts = sortedAlerts.map(a => {
            const obj = a.toObject();
            if (obj.riskScore !== null && obj.riskScore !== undefined) {
                obj.riskScore = Math.round(obj.riskScore);
            }
            return obj;
        });

        res.json(presentationAlerts);
    } catch (e) {
        console.error("Alert Fetch Error:", e);
        res.status(500).json({ error: "Server Error" });
    }
});

module.exports = router;
