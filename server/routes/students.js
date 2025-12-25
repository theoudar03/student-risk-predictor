const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../utils/db');
const { predictRisk } = require('../utils/mlService');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Secure all routes in this file
router.use(authenticateToken);
router.use(authorizeRole(['mentor', 'admin']));

// --- Students Endpoints ---

// Get Students (Filtered by Department for Mentors)
router.get('/', (req, res) => {
    try {
        const students = readData('students');
        
        if (req.user.role === 'mentor') {
            const mentors = readData('mentors');
            const currentUser = mentors.find(m => m.email === req.user.email);
            


            if (currentUser && currentUser.department) {
                // Filter students by course matching mentor's department
                const deptStudents = students.filter(s => s.course === currentUser.department);

                return res.json(deptStudents.sort((a,b) => b.riskScore - a.riskScore));
            } else {
                return res.json([]); 
            }
        }

        // Admin sees all
        if (req.user.role === 'admin') {
             return res.json(students.sort((a,b) => b.riskScore - a.riskScore));
        }
        
        res.json([]);
    } catch (e) {
        console.error("Error fetching students:", e);
        res.status(500).json({ error: "Failed to fetch students" });
    }
});

// Stats (Filtered for Mentors)
router.get('/stats', (req, res) => {
    try {
        const students = readData('students');
        const alerts = readData('alerts').filter(a => a.status === 'Active');

        let myStudents = students;

        if (req.user.role === 'mentor') {
            const mentors = readData('mentors');
            const currentUser = mentors.find(m => m.email === req.user.email);
            if (currentUser && currentUser.department) {
                myStudents = students.filter(s => s.course === currentUser.department);
            } else {
                myStudents = [];
            }
        }
        
        const stats = {
            total: myStudents.length,
            highRisk: myStudents.filter(s => s.riskLevel === 'High').length,
            mediumRisk: myStudents.filter(s => s.riskLevel === 'Medium').length,
            lowRisk: myStudents.filter(s => s.riskLevel === 'Low').length,
            activeAlerts: alerts.filter(a => myStudents.some(s => s._id === a.studentId)).length
        };
        res.json(stats);
    } catch (e) {
        console.error("Error fetching stats:", e);
        res.status(500).json({ error: "Server Error" });
    }
});

// --- Alerts Feature (Must be before /:id to avoid collision) ---
router.get('/data/alerts', (req, res) => {
    try {
        let alerts = readData('alerts');

        if (req.user.role === 'mentor') {
            const mentors = readData('mentors');
            const students = readData('students');
            const currentUser = mentors.find(m => m.email === req.user.email);

            if (currentUser && currentUser.department) {
                // Filter alerts: Only show if the linked student belongs to the mentor's department
                alerts = alerts.filter(alert => {
                    // Match alert's studentId to student's _id (or studentId field as fallback)
                    const student = students.find(s => s._id === alert.studentId || s.studentId === alert.studentId);
                    return student && student.course === currentUser.department;
                });
            } else {
                // If mentor has no department/profile, show nothing
                return res.json([]);
            }
        }

        res.json(alerts.sort((a,b) => new Date(b.date) - new Date(a.date)));
    } catch (e) {
        console.error("Error fetching alerts:", e);
        res.json([]);
    }
});

router.post('/data/alerts/:id/resolve', (req, res) => {
    let alerts = readData('alerts');
    const index = alerts.findIndex(a => a._id === req.params.id);
    if (index !== -1) {
        alerts[index].status = 'Resolved';
        alerts[index].resolvedAt = new Date().toISOString();
        writeData('alerts', alerts);
        res.json(alerts[index]);
    } else {
        res.status(404).send('Alert not found');
    }
});

// Get Single Student
router.get('/:id', (req, res) => {
    const students = readData('students');
    const student = students.find(s => s._id === req.params.id);
    if (!student) return res.status(404).json({message: 'Not found'});
    res.json(student);
});

module.exports = router;
