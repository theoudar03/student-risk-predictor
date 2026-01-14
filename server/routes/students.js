const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const User = require('../models/User');
const Alert = require('../models/Alert');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// Secure all routes in this file
router.use(authenticateToken);
router.use(authorizeRole(['mentor', 'admin']));

// --- Students Endpoints ---

// Get Students (Filtered by Department for Mentors)
router.get('/', async (req, res) => {
    try {
        let filter = {};

        if (req.user.role === 'mentor') {
            const currentUser = await User.findOne({ email: req.user.email });
            
            if (currentUser && currentUser.department) {
                // Filter students by course matching mentor's department
                filter = { course: currentUser.department };
            } else {
                return res.json([]); 
            }
        }

        // Admin sees all (filter remains empty)
        
        const students = await Student.find(filter).sort({ riskScore: -1 });
        
        // Presentation Mapping: Round Risk Scores for UI
        const presentationStudents = students.map(s => {
            const obj = s.toObject();
            if (obj.riskScore !== null && obj.riskScore !== undefined) {
                obj.riskScore = Math.round(obj.riskScore);
            }
            return obj;
        });

        res.json(presentationStudents);

    } catch (e) {
        console.error("Error fetching students:", e);
        res.status(500).json({ error: "Failed to fetch students" });
    }
});

// Stats (Filtered for Mentors)
router.get('/stats', async (req, res) => {
    try {
        let studentFilter = {};

        if (req.user.role === 'mentor') {
            const currentUser = await User.findOne({ email: req.user.email });
            if (currentUser && currentUser.department) {
                studentFilter = { course: currentUser.department };
            } else {
                return res.json({
                    total: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0, activeAlerts: 0
                });
            }
        }

        // We could use aggregations, but for simplicity/consistency:
        const students = await Student.find(studentFilter);
        
        // Find active alerts for these students
        // Create list of student IDs
        const studentIds = students.map(s => s._id);
        const activeAlertsCount = await Alert.countDocuments({ 
            studentId: { $in: studentIds },
            status: 'Active'
        });

        const stats = {
            total: students.length,
            highRisk: students.filter(s => s.riskLevel === 'High').length,
            mediumRisk: students.filter(s => s.riskLevel === 'Medium').length,
            lowRisk: students.filter(s => s.riskLevel === 'Low').length,
            activeAlerts: activeAlertsCount
        };
        res.json(stats);
    } catch (e) {
        console.error("Error fetching stats:", e);
        res.status(500).json({ error: "Server Error" });
    }
});

// --- Alerts Feature ---
router.get('/data/alerts', async (req, res) => {
    try {
        let alertFilter = {};

        if (req.user.role === 'mentor') {
            const currentUser = await User.findOne({ email: req.user.email });

            if (currentUser && currentUser.department) {
                // Get all students in this department
                const studentIds = await Student.find({ course: currentUser.department }).distinct('_id');
                alertFilter = { studentId: { $in: studentIds } };
            } else {
                return res.json([]);
            }
        }

        if (req.query.status) {
            alertFilter.status = req.query.status;
        }

        const alerts = await Alert.find(alertFilter).sort({ date: -1 });
        
        // 🔍 Mandatory Debug Log
        console.log(`[Alerts] Fetching for ${req.user.email} | Filter: ${JSON.stringify(alertFilter)} | Found: ${alerts.length}`);
        
        res.json(alerts);
    } catch (e) {
        console.error("Error fetching alerts:", e);
        res.json([]);
    }
});

router.post('/data/alerts/:id/resolve', async (req, res) => {
    try {
        const alert = await Alert.findByIdAndUpdate(
            req.params.id, 
            { 
                status: 'Resolved',
                resolvedAt: new Date().toISOString()
            },
            { new: true }
        );
        
        if (alert) {
            res.json(alert);
        } else {
            res.status(404).send('Alert not found');
        }
    } catch (e) {
        console.error("Error resolving alert:", e);
        res.status(500).send("Server Error");
    }
});

// Get Single Student
router.get('/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({message: 'Not found'});
        
        const obj = student.toObject();
        if (obj.riskScore !== null && obj.riskScore !== undefined) {
             obj.riskScore = Math.round(obj.riskScore);
        }
        res.json(obj);
    } catch (e) {
        // If ID is invalid ObjectId, findById throws error
        res.status(404).json({message: 'Not found'});
    }
});

module.exports = router;
