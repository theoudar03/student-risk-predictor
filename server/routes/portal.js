const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Student = require('../models/Student');
const User = require('../models/User');
const Survey = require('../models/Survey');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// --- Helper Functions ---
const getInsightsAndRecommendations = (student) => {
    const insights = [];
    const recommendations = [];

    const addRec = (msg) => { if(!recommendations.includes(msg)) recommendations.push(msg); }

    // Attendance Logic
    if (student.attendancePercentage < 75) {
        insights.push("Attendance is critical");
        addRec("Aim for at least 80% attendance to improve academic standing.");
    } else if (student.attendancePercentage < 85) {
        insights.push("Attendance could be better");
        addRec("Try to maintain consistent attendance above 85%.");
    } else {
        insights.push("Great attendance record!");
    }

    // CGPA Logic
    if (student.cgpa < 6.0) {
        insights.push("CGPA requires attention");
        addRec("Consider scheduling a session with a mentor for academic support.");
    } else if (student.cgpa >= 8.5) {
        insights.push("Excellent academic performance");
    }

    // Assignment Logic
    if (student.assignmentsCompleted < 70) {
        insights.push("Assignment completion rate is low");
        addRec("Submit pending assignments to boost your internal marks.");
    }

    // Participation Logic
    if (student.classParticipationScore < 50) {
        addRec("Participate more in class discussions to improve your engagement score.");
    }

    return { insights, recommendations };
};

// --- Student Endpoints ---

// Get My Profile (Student View)
router.get('/student/profile', authorizeRole('student'), async (req, res) => {
    try {
        const studentId = req.user.studentId;
        if (!studentId) {
            return res.status(400).json({ message: "Student ID not linked to user account." });
        }

        // Flexible lookup logic
        let query = { studentId: studentId };
        if (mongoose.Types.ObjectId.isValid(studentId)) {
             query = { $or: [{ _id: studentId }, { studentId: studentId }] };
        }

        const student = await Student.findOne(query);

        if (!student) {
            return res.status(404).json({ message: "Student profile not found." });
        }

        const { insights, recommendations } = getInsightsAndRecommendations(student);

        const safeProfile = {
            name: student.name,
            department: student.course || 'General',
            attendancePercentage: student.attendancePercentage,
            cgpa: student.cgpa,
            assignmentsCompleted: student.assignmentsCompleted,
            classParticipationScore: student.classParticipationScore,
            insights,
            recommendations
        };

        res.json(safeProfile);

    } catch (error) {
        console.error("Error fetching student profile:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// List Mentors for Selection
router.get('/list-mentors', authorizeRole('student'), async (req, res) => {
    try {
        // Select specific fields
        const mentors = await User.find({ role: 'mentor' }, 'id name department mentorId email'); 
        // Map to clean structure (handling mixed id usage)
        const cleanMentors = mentors.map(m => ({
            id: m._id,
            name: m.name,
            department: m.department || 'General',
            email: m.email,
            mentorId: m.mentorId
        }));
        res.json(cleanMentors);
    } catch (e) {
        res.status(500).json({ error: "Server Error" });
    }
});

// Submit Self-Assessment Survey
router.post('/student/survey', authorizeRole('student'), async (req, res) => {
    try {
        const { stressLevel, learningDifficulty, motivation, notes, mentorId } = req.body;
        const studentId = req.user.studentId;

        const newSurvey = new Survey({
            studentId,
            mentorId: mentorId || null,
            stressLevel: Number(stressLevel),
            learningDifficulty: Number(learningDifficulty),
            motivation: Number(motivation),
            notes
        });

        await newSurvey.save();

        res.json({ success: true, message: "Survey submitted successfully." });
    } catch (error) {
        console.error("Error submitting survey:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Get Mentor's Assessment Inbox
router.get('/mentor/assessments', authorizeRole('mentor'), async (req, res) => {
    try {
        // req.user.id is the _id from Token (User collection)
        // Check if messages use currentUser.mentorId or _id? message logic used both.
        // Survey uses mentorId passed from frontend List Mentors.
        // List Mentors returned _id and mentorId.
        // We check both.
        
        const currentUser = await User.findById(req.user.id);
        const mentorIds = [req.user.id];
        if (currentUser && currentUser.mentorId) mentorIds.push(currentUser.mentorId);

        const surveys = await Survey.find({ mentorId: { $in: mentorIds } }).sort({ createdAt: -1 });

        // Enrich with Student Name
        // We'll fetch all students referenced to optimize
        const studentIds = [...new Set(surveys.map(s => s.studentId))];
        const validObjectIds = studentIds.filter(id => mongoose.Types.ObjectId.isValid(id));
        const otherIds = studentIds.filter(id => !mongoose.Types.ObjectId.isValid(id));

        const students = await Student.find({ 
            $or: [
                { _id: { $in: validObjectIds } }, 
                { studentId: { $in: studentIds } } // Match checks both just in case
            ] 
        });

        const enrichedSurveys = surveys.map(s => {
            const student = students.find(stud => 
                String(stud._id) === String(s.studentId) || stud.studentId === s.studentId
            );
            return {
                ...s.toObject(),
                id: s._id,
                timestamp: s.createdAt,
                studentName: student ? student.name : 'Unknown Student',
                studentRiskLevel: student ? student.riskLevel : 'N/A' // Survey on schema doesn't have it, but we add it here
            };
        });

        res.json(enrichedSurveys);
    } catch (e) {
        console.error("Error fetching mentor assessments:", e);
        res.status(500).json({ error: "Server Error" });
    }
});


// --- Parent Endpoints ---

// Get Child Profile (Parent View)
router.get('/parent/child-profile', authorizeRole('parent'), async (req, res) => {
    try {
        const studentId = req.user.studentId;
        if (!studentId) {
            return res.status(400).json({ message: "Student ID not linked to parent account." });
        }

        let query = { studentId: studentId };
        if (mongoose.Types.ObjectId.isValid(studentId)) {
             query = { $or: [{ _id: studentId }, { studentId: studentId }] };
        }

        const student = await Student.findOne(query);

        if (!student) {
            return res.status(404).json({ message: "Student profile not found." });
        }

        // Parent specific logic
        let concernLevel = "Normal";
        let concernMessage = "Your child is performing well.";
        
        if (student.riskLevel === 'High') {
            concernLevel = "Needs Attention";
            concernMessage = "We recommend scheduling a meeting with a mentor.";
        } else if (student.riskLevel === 'Medium') {
            concernLevel = "Monitor Closely";
            concernMessage = "some performance metrics are declining.";
        }

        // Find assigned mentor based on Department
        const course = student.course || student.department || 'CSE'; // default?
        // Find FIRST mentor in that department
        const assignedMentor = await User.findOne({ role: 'mentor', department: course });
        // Fallback to any mentor
        const fallbackMentor = await User.findOne({ role: 'mentor' });
        
        const finalMentor = assignedMentor || fallbackMentor || { name: 'Admin', email: 'admin@university.edu', mentorId: 'admin' };

        const safeProfile = {
            name: student.name,
            department: course,
            attendancePercentage: student.attendancePercentage,
            cgpa: student.cgpa,
            performanceTrend: student.cgpa >= 7.5 ? 'Improving' : 'Needs Support', 
            concernLevel,
            concernMessage,
            mentorContact: {
                id: finalMentor.mentorId || finalMentor._id,
                name: finalMentor.name,
                email: finalMentor.email
            }
        };

        res.json(safeProfile);

    } catch (error) {
        console.error("Error fetching child profile for parent:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;
