const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../utils/db');
const { predictRisk } = require('../utils/mlService');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

router.use(authenticateToken);
router.use(authorizeRole('admin'));

// --- Dashboard Stats ---
router.get('/stats', async (req, res) => {
    try {
        const students = await readData('students');
        const users = await readData('users');
        const mentors = users.filter(u => u.role === 'mentor');
        const allAlerts = await readData('alerts');
        const alerts = allAlerts.filter(a => a.status === 'Active');

        const stats = {
            totalStudents: students.length,
            totalMentors: mentors.length,
            highRiskCount: students.filter(s => s.riskLevel === 'High').length,
            activeAlerts: alerts.length
        };
        res.json(stats);
    } catch (e) {
        res.status(500).json({ error: "Server Error" });
    }
});

// --- Student Management ---

// Add Student (Admin Only)
// --- Student Management ---

const generateStudentId = (students) => {
    // pattern: 272xxx
    const ids = students
        .map(s => parseInt(s.studentId))
        .filter(id => !isNaN(id) && id >= 272000);
    
    const maxId = ids.length > 0 ? Math.max(...ids) : 272000;
    return (maxId + 1).toString();
};

// Add Student (Admin Only)
router.post('/students', async (req, res) => {
    try {
        const { name, email, course, attendancePercentage, cgpa, feeDelayDays, classParticipationScore, assignmentsCompleted } = req.body;
        
        const students = await readData('students');
        const newId = generateStudentId(students); // Sequential ID

        // AI Analysis
        const analysis = predictRisk(
            Number(attendancePercentage), 
            Number(cgpa), 
            Number(feeDelayDays), 
            Number(classParticipationScore),
            Number(assignmentsCompleted || 85)
        );
        
        const newStudent = {
            _id: generateId(), // Internal DB ID (guid)
            studentId: newId,   // Official Sequential ID
            name, 
            email, 
            course,
            enrollmentYear: new Date().getFullYear(),
            attendancePercentage: Number(attendancePercentage), 
            cgpa: Number(cgpa), 
            feeDelayDays: Number(feeDelayDays), 
            classParticipationScore: Number(classParticipationScore),
            assignmentsCompleted: Number(assignmentsCompleted || 85),
            riskScore: analysis.score,
            riskLevel: analysis.level,
            riskFactors: analysis.factors,
            createdAt: new Date().toISOString()
        };
        
        students.push(newStudent);
        await writeData('students', students);
        
        // Auto-Generate Alert if High Risk
        if (analysis.level === 'High') {
            const alerts = await readData('alerts');
            alerts.push({
                _id: generateId(),
                studentId: newStudent._id,
                studentName: newStudent.name,
                severity: 'High',
                message: `High dropout risk detected (${analysis.score}/100). Factors: ${analysis.factors.join(', ')}`,
                status: 'Active',
                date: new Date().toISOString()
            });
            await writeData('alerts', alerts);
        }

        // Check for users linkage (optional for now, can create user account later)
        
        res.status(201).json(newStudent);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Server Error" });
    }
});

// Update Student
router.put('/students/:id', async (req, res) => {
    try {
        const { name, email, course, attendancePercentage, cgpa, feeDelayDays, classParticipationScore, assignmentsCompleted } = req.body;
        const students = await readData('students');
        const index = students.findIndex(s => s._id === req.params.id);
        
        if (index === -1) return res.status(404).json({ error: "Student not found" });

        // AI Analysis Refresh
        const analysis = predictRisk(
            Number(attendancePercentage), 
            Number(cgpa), 
            Number(feeDelayDays), 
            Number(classParticipationScore),
            Number(assignmentsCompleted || 85)
        );

        students[index] = {
            ...students[index],
            name, 
            email, 
            course,
            attendancePercentage: Number(attendancePercentage), 
            cgpa: Number(cgpa), 
            feeDelayDays: Number(feeDelayDays), 
            classParticipationScore: Number(classParticipationScore),
            assignmentsCompleted: Number(assignmentsCompleted || 85),
            riskScore: analysis.score,
            riskLevel: analysis.level,
            riskFactors: analysis.factors
        };
        
        await writeData('students', students);
        res.json(students[index]);
    } catch (e) {
        res.status(500).json({ error: "Server Error" });
    }
});

// Delete Student
router.delete('/students/:id', async (req, res) => {
    try {
        const students = await readData('students');
        const newStudents = students.filter(s => s._id !== req.params.id);
        if (students.length === newStudents.length) return res.status(404).json({ error: "Student not found" });
        
        await writeData('students', newStudents);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Server Error" });
    }
});


// --- Mentor Management ---

// Get All Mentors
router.get('/mentors', async (req, res) => {
    try {
        const mentors = await readData('mentors');
        res.json(mentors);
    } catch (e) {
        res.status(500).json({ error: "Server Error" });
    }
});

const generateMentorId = (mentors) => {
    // pattern: M2024xxx
    const ids = mentors
        .map(m => parseInt(m.mentorId?.replace('M2024', '') || '0'))
        .filter(id => !isNaN(id));
    
    const maxId = ids.length > 0 ? Math.max(...ids) : 100;
    return `M2024${maxId + 1}`;
};

// Add Mentor
router.post('/mentors', async (req, res) => {
    try {
        const { name, email, department, phone } = req.body;
        const mentors = await readData('mentors');
        const users = await readData('users');

        if (users.find(u => u.email === email)) {
            return res.status(400).json({ error: "User already exists" });
        }

        const newMentorId = generateMentorId(users.filter(u => u.role === 'mentor'));

        const newMentor = {
            id: generateId(),
            name, email, department, phone, role: 'Mentor',
            mentorId: newMentorId
        };
        
        // Add to mentors.json
        mentors.push(newMentor);
        await writeData('mentors', mentors);

        // Add to users.json for login
        users.push({
            id: newMentor.id,
            mentorId: newMentorId, // Authentication ID
            role: 'mentor',
            name: name,
            email: email
            // No username/password fields for mentors anymore
        });
        await writeData('users', users);

        res.status(201).json(newMentor);
    } catch (e) {
        res.status(500).json({ error: "Server Error" });
    }
});

// Update Mentor
router.put('/mentors/:email', async (req, res) => {
    try {
        const { name, email, department, phone } = req.body;
        const targetEmail = req.params.email;
        
        let mentors = await readData('mentors');
        let users = await readData('users');

        const mIndex = mentors.findIndex(m => m.email === targetEmail);
        const uIndex = users.findIndex(u => u.mentorId === mentors[mIndex]?.mentorId); // Look up by ID to be safe or email
        
        if (mIndex === -1) return res.status(404).json({ error: "Mentor not found" });

        mentors[mIndex] = { ...mentors[mIndex], name, email, department, phone };
        
        if (uIndex !== -1) {
            users[uIndex] = { ...users[uIndex], name, email };
        }
        
        await writeData('mentors', mentors);
        await writeData('users', users);
        
        res.json(mentors[mIndex]);
    } catch (e) {
        res.status(500).json({ error: "Server Error" });
    }
});

// Delete Mentor
router.delete('/mentors/:email', async (req, res) => {
    try {
        const email = req.params.email;
        let mentors = await readData('mentors');
        let users = await readData('users');

        mentors = mentors.filter(m => m.email !== email);
        users = users.filter(u => u.username !== email); // Assuming username is email

        await writeData('mentors', mentors);
        await writeData('users', users);

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Server Error" });
    }
});

module.exports = router;
