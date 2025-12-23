const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../utils/db');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// --- Helper Functions ---
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const getInsightsAndRecommendations = (student) => {
    const insights = [];
    const recommendations = [];

    // Helper to add if not present
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
router.get('/student/profile', authorizeRole('student'), (req, res) => {
    try {
        const studentId = req.user.studentId;
        if (!studentId) {
            return res.status(400).json({ message: "Student ID not linked to user account." });
        }

        const students = readData('students');
        // Flexible lookup: checks internal _id OR official studentId
        const student = students.find(s => s._id === studentId || s.studentId === studentId);

        if (!student) {
            return res.status(404).json({ message: "Student profile not found." });
        }

        // derived insights
        const { insights, recommendations } = getInsightsAndRecommendations(student);

        // Filter sensitive data
        const safeProfile = {
            name: student.name,
            department: student.department || 'General',
            attendancePercentage: student.attendancePercentage,
            cgpa: student.cgpa,
            assignmentsCompleted: student.assignmentsCompleted,
            classParticipationScore: student.classParticipationScore,
            insights,
            recommendations
            // EXCLUDE: riskScore, riskLevel, feeDelayDays (maybe sensitive?), riskFactors
        };

        res.json(safeProfile);

    } catch (error) {
        console.error("Error fetching student profile:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// List Mentors for Selection
router.get('/list-mentors', authorizeRole('student'), (req, res) => {
    try {
        const users = readData('users');
        const mentors = users.filter(u => u.role === 'mentor').map(m => ({
            id: m.id,
            name: m.name,
            department: m.department || 'General'
        }));
        res.json(mentors);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Server Error" });
    }
});

// Submit Self-Assessment Survey
router.post('/student/survey', authorizeRole('student'), (req, res) => {
    try {
        const { stressLevel, learningDifficulty, motivation, notes, mentorId } = req.body;
        const studentId = req.user.studentId;

        const surveyData = {
            id: generateId(),
            studentId,
            mentorId: mentorId || null, // Assigned mentor for this survey
            stressLevel: Number(stressLevel),
            learningDifficulty: Number(learningDifficulty),
            motivation: Number(motivation),
            notes,
            timestamp: new Date().toISOString()
        };

        const surveys = readData('student_surveys');
        surveys.push(surveyData);
        writeData('student_surveys', surveys);

        res.json({ success: true, message: "Survey submitted successfully." });
    } catch (error) {
        console.error("Error submitting survey:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Get Mentor's Assessment Inbox
router.get('/mentor/assessments', authorizeRole('mentor'), (req, res) => {
    try {
        const mentorId = req.user.id;
        const surveys = readData('student_surveys');
        const students = readData('students');

        // Filter surveys for this mentor
        const mySurveys = surveys.filter(s => s.mentorId === mentorId);

        // Map to include student details
        const enrichedSurveys = mySurveys.map(s => {
            const student = students.find(stud => stud._id === s.studentId || stud.studentId === s.studentId);
            return {
                ...s,
                studentName: student ? student.name : 'Unknown Student',
                studentRiskLevel: student ? student.riskLevel : 'N/A'
            };
        });

        res.json(enrichedSurveys.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (e) {
        console.error("Error fetching mentor assessments:", e);
        res.status(500).json({ error: "Server Error" });
    }
});


// --- Parent Endpoints ---

// Get Child Profile (Parent View)
router.get('/parent/child-profile', authorizeRole('parent'), (req, res) => {
    try {
        const studentId = req.user.studentId;
        if (!studentId) {
            return res.status(400).json({ message: "Student ID not linked to parent account." });
        }

        const students = readData('students');
        const student = students.find(s => s._id === studentId || s.studentId === studentId);

        if (!student) {
            return res.status(404).json({ message: "Student profile not found." });
        }

        // Parent specific logic
        let concernLevel = "Normal";
        let concernMessage = "Your child is performing well.";
        
        // Simple heuristic for parent concern (hiding raw scores)
        if (student.riskLevel === 'High') {
            concernLevel = "Needs Attention";
            concernMessage = "We recommend scheduling a meeting with a mentor.";
        } else if (student.riskLevel === 'Medium') {
            concernLevel = "Monitor Closely";
            concernMessage = "some performance metrics are declining.";
        }

        // Find assigned mentor based on Department
        const mentors = readData('mentors');
        const course = student.course || student.department || 'CSE';
        const assignedMentor = mentors.find(m => m.department === course) || mentors[0];

        const safeProfile = {
            name: student.name,
            department: course,
            attendancePercentage: student.attendancePercentage,
            cgpa: student.cgpa,
            performanceTrend: student.cgpa >= 7.5 ? 'Improving' : 'Needs Support', // Mock trend
            concernLevel,
            concernMessage,
            mentorContact: {
                id: assignedMentor.mentorId || assignedMentor.id || "m1",
                name: assignedMentor.name,
                email: assignedMentor.email
            }
        };

        res.json(safeProfile);

    } catch (error) {
        console.error("Error fetching child profile for parent:", error);
        res.status(500).json({ message: "Server Error" });
    }
});


module.exports = router;
