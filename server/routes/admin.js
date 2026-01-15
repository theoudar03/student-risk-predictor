const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const User = require('../models/User');
const Alert = require('../models/Alert');
const { predictRisk } = require('../utils/mlService');
const { calculateRisk } = require('../utils/riskEngine');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.use(authorizeRole('admin'));

// --- Dashboard Stats ---
router.get('/stats', async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments();
        const totalMentors = await User.countDocuments({ role: 'mentor' });
        const highRiskCount = await Student.countDocuments({ riskLevel: 'High' });
        const activeAlerts = await Alert.countDocuments({ status: 'Active' });

        const stats = {
            totalStudents,
            totalMentors,
            highRiskCount,
            activeAlerts
        };
        res.json(stats);
    } catch (e) {
        console.error("Stats Error:", e);
        res.status(500).json({ error: "Server Error" });
    }
});

// --- Student Management ---

const generateStudentId = async () => {
    // Attempting to maintain '272xxx' pattern or fallback to S2024xxx max
    // Efficiency: Retrieve only studentIds
    const students = await Student.find({}, 'studentId');
    const ids = students
        .map(s => parseInt(s.studentId))
        .filter(id => !isNaN(id) && id >= 272000);
    
    const maxId = ids.length > 0 ? Math.max(...ids) : 272000;
    return (maxId + 1).toString();
};

// Bulk Recalculate Risk (Admin Trigger)
router.post('/risk-recalculate', async (req, res) => {
    try {
        console.log("[Admin] 🔄 Manually triggering batch risk recalculation...");
        const { calculateAllRiskBatch } = require('../utils/riskEngine');
        
        // Blocking call to ensure UI waits for completion, per requirements
        const result = await calculateAllRiskBatch('AdminManualTrigger');
        
        res.json({
            success: true,
            message: `Batch Recalculation Complete. Processed: ${result.processed}`,
            processed: result.processed,
            durationMs: result.durationMs
        });
    } catch (e) {
        console.error("Bulk Recalc Error:", e);
        res.status(500).json({ error: "Server Error during recalculation" });
    }
});

// Admin: Get All Students (with Sorting)
router.get('/students', async (req, res) => {
    try {
        const { sortBy = 'updatedAt', sortOrder = 'desc' } = req.query;
        
        // Allowed sort fields whitelist
        const validSortFields = ['name', 'studentId', 'course', 'riskScore', 'riskLevel', 'updatedAt', 'attendancePercentage', 'cgpa'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'updatedAt';
        const sortDir = sortOrder === 'asc' ? 1 : -1;

        const students = await Student.find({})
            .sort({ [sortField]: sortDir })
            .lean(); // Faster query

        // Presentation Mapping
        const presentationStudents = students.map(s => {
            if (s.riskScore !== null && s.riskScore !== undefined) {
                s.riskScore = Math.round(s.riskScore);
            }
            return s;
        });

        res.json(presentationStudents);
    } catch (e) {
        console.error("Admin Fetch Students Error:", e);
        res.status(500).json({ error: "Server Error" });
    }
});

// Add Student (Admin Only)
router.post('/students', async (req, res) => {
    try {
        const { name, email, course, attendancePercentage, cgpa, feeDelayDays, classParticipationScore, assignmentsCompleted, mentorId, studentId } = req.body;
        
        // Validate Course & Mentor
        if (!course) return res.status(400).json({ error: "Course is required" });
        if (!mentorId) return res.status(400).json({ error: "Mentor is required" });

        // Verify Mentor exists and matches course
        const mentor = await User.findOne({ mentorId: mentorId, role: 'mentor' });
        if (!mentor) {
            return res.status(400).json({ error: "Selected mentor not found" });
        }
        if (mentor.department !== course) {
            return res.status(400).json({ error: `Mentor ${mentor.name} does not belong to ${course}` });
        }

        // Determine Student ID (Manual Input or Auto-Generated)
        let newId;
        if (studentId) {
            const existing = await Student.findOne({ studentId });
            if (existing) return res.status(400).json({ error: "Student ID already exists" });
            newId = studentId;
        } else {
            newId = await generateStudentId(); 
        }

        // Initial Save (Risk Calculation is Async)
        const newStudent = new Student({
            studentId: newId,   // Official ID
            name, 
            email, 
            course,
            assignedMentorId: mentorId, // Explicit Assignment
            enrollmentYear: new Date().getFullYear(),
            attendancePercentage: Number(attendancePercentage), 
            cgpa: Number(cgpa), 
            feeDelayDays: Number(feeDelayDays), 
            classParticipationScore: Number(classParticipationScore),
            assignmentsCompleted: Number(assignmentsCompleted || 85),
            riskScore: null,
            riskLevel: null,
            riskStatus: 'PENDING',
            riskModel: 'extreme_dropout_v4',
            riskFactors: [],
        });
        
        
        await newStudent.save();

        // 🚀 Trigger Async Risk Calculation (Decoupled)
        // Fire and forget - do not await
        calculateRisk(newStudent._id).catch(err => console.error("Async Risk Calc Failed:", err));

        // Note: Alerts are generated in riskEngine now

        // 1. Create Student User Account
        await User.create({
            username: newId,
            password: newId, // Default password = Student ID
            role: 'student',
            name: name,
            email: email,
            studentId: newId
        });

        // 2. Create Parent User Account
        await User.create({
            username: `p_${newId}`,
            password: `p_${newId}`, // Default = p_StudentId
            role: 'parent',
            name: `Parent of ${name}`,
            email: `parent.${email}`, // Mock email or ask user input if available
            studentId: newId
        });
        


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
        
        const updatedStudent = await Student.findByIdAndUpdate(req.params.id, {
            name, 
            email, 
            course,
            attendancePercentage: Number(attendancePercentage), 
            cgpa: Number(cgpa), 
            feeDelayDays: Number(feeDelayDays), 
            classParticipationScore: Number(classParticipationScore),
            assignmentsCompleted: Number(assignmentsCompleted || 85),
            riskStatus: 'PENDING',
            riskModel: 'extreme_dropout_v4'
        }, { new: true });
        
        // 🚀 Trigger Async Risk Calculation
        calculateRisk(req.params.id).catch(err => console.error("Async Risk Calc Failed:", err));

        if (!updatedStudent) return res.status(404).json({ error: "Student not found" });
        
        res.json(updatedStudent);
    } catch (e) {
        console.error("Update Student Error:", e);
        res.status(500).json({ error: "Server Error" });
    }
});

// Delete Student
// Delete Student
router.delete('/students/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ error: "Student not found" });
        
        // 1. Delete Student Profile
        await Student.findByIdAndDelete(req.params.id);

        // 2. Delete Linked Users (Student Login & Parent Login)
        // We look for users linked to this studentId
        await User.deleteMany({ studentId: student.studentId });
        
        // 3. Delete associated alerts
        await Alert.deleteMany({ studentId: req.params.id }); 

        res.json({ success: true });
    } catch (e) {
        console.error("Delete Error:", e);
        res.status(500).json({ error: "Server Error" });
    }
});


// --- Mentor Management ---

// Get All Mentors
router.get('/mentors', async (req, res) => {
    try {
        const mentors = await User.find({ role: 'mentor' });
        res.json(mentors);
    } catch (e) {
        res.status(500).json({ error: "Server Error" });
    }
});

const generateMentorId = async () => {
    // pattern: M2024xxx
    const mentors = await User.find({ role: 'mentor' }, 'mentorId');
    const ids = mentors
        .map(m => parseInt(m.mentorId?.replace('M2024', '') || '0'))
        .filter(id => !isNaN(id));
    
    const maxId = ids.length > 0 ? Math.max(...ids) : 100;
    return `M2024${maxId + 1}`;
};

// Add Mentor
router.post('/mentors', async (req, res) => {
    try {
        const { name, email, department, phone, mentorId } = req.body;
        
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: "User already exists" });
        }

        let newMentorId;
        if (mentorId) {
            // Check if provided ID already exists
            const existingId = await User.findOne({ mentorId });
            if (existingId) return res.status(400).json({ error: "Mentor ID already exists" });
            newMentorId = mentorId;
        } else {
             newMentorId = await generateMentorId();
        }

        const newMentor = await User.create({
            mentorId: newMentorId,
            role: 'mentor',
            name, email, department, 
            phone, // Ensure phone is saved if schema supports, assuming yes or just generic
            // In original code, password logic was implicit or separate. 
            // We set default password same as ID for uniformity with legacy system.
            password: newMentorId, 
            username: newMentorId 
        });
        
        res.status(201).json(newMentor);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Server Error" });
    }
});

// Update Mentor
router.put('/mentors/:email', async (req, res) => {
    try {
        const { name, email, department, phone } = req.body;
        const targetEmail = req.params.email;
        
        const updatedUser = await User.findOneAndUpdate(
            { email: targetEmail },
            { name, email, department },
            { new: true }
        );
        
        if (!updatedUser) return res.status(404).json({ error: "Mentor not found" });
        
        res.json(updatedUser);
    } catch (e) {
        res.status(500).json({ error: "Server Error" });
    }
});

// Delete Mentor
// Delete Mentor
router.delete('/mentors/:email', async (req, res) => {
    try {
        const email = req.params.email;
        
        // 1. Find the mentor to identify department
        const mentor = await User.findOne({ email: email, role: 'mentor' });
        if (!mentor) return res.status(404).json({ error: "Mentor not found" });

        // 2. Check coverage for this department
        const count = await User.countDocuments({ role: 'mentor', department: mentor.department });

        if (count <= 1) {
            return res.status(400).json({ 
                success: false,
                error: "MIN_MENTOR_REQUIRED", 
                message: "At least one mentor should be in a course" 
            });
        }

        // 3. Proceed with deletion
        await User.findOneAndDelete({ email: email });

        res.json({ success: true });
    } catch (e) {
        console.error("Delete Mentor Error:", e);
        res.status(500).json({ error: "Server Error" });
    }
});

module.exports = router;
