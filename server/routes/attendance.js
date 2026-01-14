const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/authMiddleware');
const { predictRisk } = require('../utils/mlService');

router.use(authenticateToken);

/**
 * @desc Get available history dates for the mentor's department
 * @route GET /api/attendance/history
 */
// ... existing imports ...
const moment = require('moment'); // Ensure moment is available or use vanilla JS

// ... router setup ...

/**
 * @desc Get Weekly Average Attendance for the current month
 * @route GET /api/attendance/stats/weekly
 */
router.get('/stats/weekly', async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        if (!currentUser || !currentUser.department) {
            return res.json([]); // Return empty if no dept context
        }

        const startOfMonth = moment().startOf('month').format('YYYY-MM-DD');
        const endOfMonth = moment().endOf('month').format('YYYY-MM-DD');

        const records = await Attendance.find({
            department: currentUser.department,
            date: { $gte: startOfMonth, $lte: endOfMonth }
        });

        // Initialize 5 weeks
        const weeks = {
            1: { total: 0, present: 0 },
            2: { total: 0, present: 0 },
            3: { total: 0, present: 0 },
            4: { total: 0, present: 0 },
            5: { total: 0, present: 0 }
        };

        records.forEach(rec => {
            const dayOfMonth = parseInt(rec.date.split('-')[2]);
            const weekNum = Math.ceil(dayOfMonth / 7); // Simple 1-7=W1, 8-14=W2...
            
            if (weeks[weekNum]) {
                weeks[weekNum].total++;
                if (rec.status === 'Present') weeks[weekNum].present++;
            }
        });

        // Format for Recharts
        const chartData = Object.keys(weeks).map(w => {
            const weekData = weeks[w];
            const avg = weekData.total > 0 
                ? Math.round((weekData.present / weekData.total) * 100) 
                : 0;
            
            return {
                name: `Week ${w}`,
                Attendance: avg, // Capitalized for Label
                hasData: weekData.total > 0
            };
        });

        res.json(chartData);

    } catch (err) {
        console.error("Weekly Stats Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
});

/**
 * @desc Get available history dates for the mentor's department
 * @route GET /api/attendance/history
 */
router.get('/history', async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        if (!currentUser || !currentUser.department) {
            return res.status(400).json({ message: "User department not defined" });
        }

        // Find distinct dates where attendance exists for this department
        // Valid from Jan 1, 2026 as per rules
        const dates = await Attendance.find({ 
            department: currentUser.department,
            date: { $gte: '2026-01-01' }
        }).distinct('date');

        res.json(dates.sort().reverse()); // Newest first
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
});

// ... (previous code)

/**
 * @desc Check daily status for notification
 * @route GET /api/attendance/status/today
 */
router.get('/status/today', async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        if (!currentUser || !currentUser.department) {
            return res.json({ showReminder: false });
        }

        const today = moment().format('YYYY-MM-DD');
        const count = await Attendance.countDocuments({
            department: currentUser.department,
            date: today
        });

        // Show reminder if NO attendance exists for today
        res.json({ showReminder: count === 0 });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
});

/**
 * @desc Auto-freeze attendance for the day (Called by system/admin or trigger)
 * @route POST /api/attendance/auto-freeze
 */
router.post('/auto-freeze', async (req, res) => {
    try {
        const { date } = req.body;
        const currentUser = await User.findById(req.user.id); // Or admin

        // 1. Check if already exists
        const exists = await Attendance.exists({ 
            department: currentUser.department, 
            date: date 
        });

        if (exists) {
            return res.status(400).json({ message: "Attendance already exists" });
        }

        // 2. Fetch all students in this department
        const students = await Student.find({ course: currentUser.department });

        // 3. Create 'Present' records for all
        const docs = students.map(s => ({
            studentId: s._id,
            studentName: s.name,
            studentRollId: s.studentId,
            department: currentUser.department,
            mentorId: req.user.id, // System action by this user
            status: 'Present', // Default Status
            date: date,
            month: date.substring(0, 7),
            year: parseInt(date.substring(0, 4))
        }));

        await Attendance.insertMany(docs);
        res.json({ success: true, message: "Auto-frozen successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
});

// ... (existing GET /check/:date)
router.get('/check/:date', async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const count = await Attendance.countDocuments({
            department: currentUser.department,
            date: req.params.date
        });

        res.json({ submitted: count > 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
});

/**
 * @desc Get attendance records for a specific date
 * @route GET /api/attendance/:date
 */
router.get('/:date', async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        
        // Fetch saved attendance
        const records = await Attendance.find({
            department: currentUser.department,
            date: req.params.date
        });

        res.json(records);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
});

/**
 * @desc Submit daily attendance (One-Time / Freeze Logic)
 * @route POST /api/attendance
 */
router.post('/', async (req, res) => {
    try {
        const { date, records } = req.body; // records: [{ studentId, status, name }]
        const currentUser = await User.findById(req.user.id);
        
        if (!currentUser || !currentUser.department) {
            return res.status(403).json({ message: "Unauthorized: No department found" });
        }

        // 1. Verify if attendance already exists (Freeze Rule)
        const exists = await Attendance.findOne({
            department: currentUser.department,
            date: date
        });

        if (exists) {
            return res.status(400).json({ message: "Attendance already submitted for this date." });
        }

        // 2. Prepare Data
        const attendanceDocs = records.map(r => ({
            studentId: r.studentId, // ObjectId
            studentName: r.name,
            studentRollId: r.studentRollId || "N/A", // Save the Readable ID
            department: currentUser.department,
            mentorId: req.user.id,
            status: r.status,
            date: date,
            month: date.substring(0, 7), // YYYY-MM
            year: parseInt(date.substring(0, 4))
        }));

        // 3. Save to DB
        await Attendance.insertMany(attendanceDocs);

        res.status(201).json({ success: true, message: "Attendance saved successfully" });

        // 4. Async: Update Student Risk Scores based on new attendance
        records.forEach(async (record) => {
            try {
                // Get Total & Present Counts
                const totalDays = await Attendance.countDocuments({ studentId: record.studentId });
                const presentDays = await Attendance.countDocuments({ studentId: record.studentId, status: 'Present' });
                
                const newPercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

                const student = await Student.findById(record.studentId);
                if (student) {
                    // Call Python ML Service
                    // We must handle the error if ML is down, but since we already sent response, just log it.
                    try {
                        const analysis = await predictRisk(
                            newPercentage, // Use NEW attendance
                            Number(student.cgpa || 0),
                            Number(student.feeDelayDays || 0),
                            Number(student.classParticipationScore || 0),
                            Number(student.assignmentsCompleted || 85)
                        );

                        // Update Student
                        student.attendancePercentage = newPercentage;
                        student.riskScore = analysis.riskScore;
                        student.riskLevel = analysis.riskLevel;
                        student.riskFactors = analysis.riskFactors;
                        await student.save();
                    } catch (mlErr) {
                         console.error(`ML Update Failed for ${record.name}:`, mlErr.message);
                         // Still update attendance % even if ML fails? 
                         // User said "Node.js must fail gracefully". 
                         // Here we are in background. Best to update stats at least.
                         student.attendancePercentage = newPercentage;
                         await student.save();
                    }
                }
            } catch (err) {
                console.error("Background Risk Update Error:", err);
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: `Server Error: ${err.message}` });
    }
});

module.exports = router;
