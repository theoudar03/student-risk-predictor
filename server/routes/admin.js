const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const User = require('../models/User');
const Alert = require('../models/Alert');
const { predictRisk } = require('../utils/mlService');
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
router.post('/risk-recalc', async (req, res) => {
    // Extra role check just in case middleware fails or for explicit clarity
    if (req.user.role !== 'admin') {
         return res.status(403).json({ error: "Access denied. Admin rights required." });
    }

    try {
        const students = await Student.find({});
        console.log(`Starting bulk recalculation for ${students.length} students...`);

        const bulkOps = [];
        let successCount = 0;
        let failCount = 0;

        // Process in batches to avoid timeouts but respect concurrency
        const BATCH_SIZE = 5;
        const processBatch = async (batch) => {
             return Promise.all(batch.map(async (student) => {
                try {
                    // Fix: Use nullish coalescing to allow 0 as a valid value
                    const att = student.attendancePercentage ?? 0;
                    const cgpa = student.cgpa ?? 0;
                    const fee = student.feeDelayDays ?? 0;
                    const part = student.classParticipationScore ?? 0;
                    const assign = student.assignmentsCompleted ?? 85;

                    const analysis = await predictRisk(
                        Number(att),
                        Number(cgpa),
                        Number(fee),
                        Number(part),
                        Number(assign)
                    );
                    
                    // Direct update to ensure atomicity and avoid bulkWrite silent failures
                    await Student.findByIdAndUpdate(student._id, {
                        $set: {
                            riskScore: analysis.score,
                            riskLevel: analysis.level,
                            riskFactors: analysis.factors
                        }
                    });

                    console.log(`[Recalc] Updated ${student.name}: ${student.riskScore} -> ${analysis.score}`);
                    successCount++;
                } catch (mlError) {
                    console.error(`ML Failed for Student ${student.studentId}:`, mlError.message);
                    failCount++;
                }
             }));
        };

        for (let i = 0; i < students.length; i += BATCH_SIZE) {
            const batch = students.slice(i, i + BATCH_SIZE);
            await processBatch(batch);
        }
        // Removed bulkWrite logic in favor of direct updates

        res.json({
            success: true,
            message: `Recalculation complete. Updated: ${successCount}, Failed: ${failCount}`,
            total: students.length
        });
    } catch (e) {
        console.error("Bulk Recalc Error:", e);
        res.status(500).json({ error: "Server Error during recalculation" });
    }
});// Add Student (Admin Only)
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

        // AI Analysis
        // Ensure consistent parameter passing
        const analysis = await predictRisk(
            Number(attendancePercentage), 
            Number(cgpa), 
            Number(feeDelayDays), 
            Number(classParticipationScore),
            Number(assignmentsCompleted || 85)
        );
        
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
            riskScore: analysis.score,
            riskLevel: analysis.level,
            riskFactors: analysis.factors,
        });
        
        await newStudent.save();

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
        
        // Auto-Generate Alert if High Risk
        if (analysis.level === 'High') {
            await Alert.create({
                studentId: newStudent._id,
                studentName: newStudent.name,
                severity: 'High',
                message: `High dropout risk detected (${analysis.score}/100). Factors: ${analysis.factors.join(', ')}`,
                status: 'Active',
                date: new Date().toISOString()
            });
        }

        res.status(201).json(newStudent);
    } catch (e) {
        console.error(e);
        if (e.message === 'ML_SERVICE_UNAVAILABLE') {
            return res.status(503).json({ error: "Risk Analysis Service is offline. Cannot save student data without risk score." });
        }
        res.status(500).json({ error: "Server Error" });
    }
});

// Update Student
router.put('/students/:id', async (req, res) => {
    try {
        const { name, email, course, attendancePercentage, cgpa, feeDelayDays, classParticipationScore, assignmentsCompleted } = req.body;
        
        // AI Analysis Refresh
        // Using updated feature values for prediction
        const analysis = await predictRisk(
            Number(attendancePercentage), 
            Number(cgpa), 
            Number(feeDelayDays), 
            Number(classParticipationScore),
            Number(assignmentsCompleted || 85)
        );

        const updatedStudent = await Student.findByIdAndUpdate(req.params.id, {
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
        }, { new: true });

        if (!updatedStudent) return res.status(404).json({ error: "Student not found" });
        
        res.json(updatedStudent);
    } catch (e) {
        console.error("Update Student Error:", e);
        if (e.message === 'ML_SERVICE_UNAVAILABLE') {
            return res.status(503).json({ error: "Risk Analysis Service is offline. Cannot update student data." });
        }
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
