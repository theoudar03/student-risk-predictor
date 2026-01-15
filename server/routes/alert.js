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
        // Open access to 'mentor' AND 'admin'
        if (req.user.role !== 'mentor' && req.user.role !== 'admin') {
            return res.status(403).json({ error: "Access denied" });
        }

        let filter = {
            active: true,
            alertType: 'RISK' // Strict type
        };

        // If Mentor, restrict to their department/students
        if (req.user.role === 'mentor') {
            const currentUser = await User.findById(req.user.id);
            if (!currentUser || !currentUser.department) {
                return res.json([]);
            }
            // Find students in mentor's department
            const deptStudents = await Student.find({ course: currentUser.department }, '_id');
            const deptStudentIds = deptStudents.map(s => s._id);
            filter.studentId = { $in: deptStudentIds };
        }
        // If Admin, no extra filter needed (they see all active alerts)

        const alerts = await Alert.find(filter).sort({ lastUpdatedAt: -1 }); // Sort by latest update
        // Actually, let's trust the FE to sort or sort clearly here.
        // Severity Enum: High, Medium, Low. 
        // We want High first.
        
        // Let's sort manually in JS to be safe
        // Sort: High > Medium
        const sortedAlerts = alerts.sort((a, b) => {
             const priorities = { 'High': 2, 'Medium': 1 };
             return (priorities[b.riskLevel] || 0) - (priorities[a.riskLevel] || 0);
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
