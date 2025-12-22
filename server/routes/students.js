const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../utils/db');
const { predictRisk } = require('../utils/mlService');

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// --- Students Endpoints ---

// Get All
router.get('/', (req, res) => {
    try {
        console.log("Fetching all students...");
        const students = readData('students');
        console.log(`Found ${students.length} students.`);
        res.json(students.sort((a,b) => b.riskScore - a.riskScore));
    } catch (e) {
        console.error("Error fetching students:", e);
        res.status(500).json({ error: "Failed to fetch students" });
    }
});

// Stats
router.get('/stats', (req, res) => {
    const students = readData('students');
    const alerts = readData('alerts').filter(a => a.status === 'Active');
    
    const stats = {
        total: students.length,
        highRisk: students.filter(s => s.riskLevel === 'High').length,
        mediumRisk: students.filter(s => s.riskLevel === 'Medium').length,
        lowRisk: students.filter(s => s.riskLevel === 'Low').length,
        activeAlerts: alerts.length
    };
    res.json(stats);
});

// Add Student
router.post('/', (req, res) => {
    const { name, studentId, email, attendancePercentage, cgpa, feeDelayDays, classParticipationScore, assignmentsCompleted } = req.body;
    
    // AI Analysis
    const analysis = predictRisk(
        Number(attendancePercentage), 
        Number(cgpa), 
        Number(feeDelayDays), 
        Number(classParticipationScore),
        Number(assignmentsCompleted || 85)
    );
    
    const newStudent = {
        _id: generateId(),
        ...req.body,
        assignmentsCompleted: Number(assignmentsCompleted || 85),
        riskScore: analysis.score,
        riskLevel: analysis.level,
        riskFactors: analysis.factors,
        createdAt: new Date().toISOString()
    };
    
    const students = readData('students');
    students.push(newStudent);
    writeData('students', students);
    
    // Auto-Generate Alert if High Risk
    if (analysis.level === 'High') {
        const alerts = readData('alerts');
        alerts.push({
            _id: generateId(),
            studentId: newStudent._id,
            studentName: newStudent.name,
            severity: 'High',
            message: `High dropout risk detected (${analysis.score}/100). Factors: ${analysis.factors.join(', ')}`,
            status: 'Active',
            date: new Date().toISOString()
        });
        writeData('alerts', alerts);
        

    }
    
    res.status(201).json(newStudent);
});

// --- Alerts Feature (Must be before /:id to avoid collision) ---
router.get('/data/alerts', (req, res) => {
    try {
        const alerts = readData('alerts');
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
