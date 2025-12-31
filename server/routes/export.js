const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const Student = require('../models/Student');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// Helper to generate a consistent random-ish status based on seed
const getMockStatus = (seed, probability) => {
    const x = Math.sin(seed) * 10000;
    const random = (x - Math.floor(x)) * 100;
    return random < probability ? 'Present' : 'Absent';
};

// Helper: Build Mongo Filter based on User Role
const getStudentFilter = async (user) => {
    let filter = {};
    if (user.role === 'mentor') {
        const currentUser = await User.findOne({ email: user.email });
        if (currentUser && currentUser.department) {
            filter.course = currentUser.department;
        } else {
            // Mentor with no department sees nothing? Or all? 
            // Existing logic implied empty array.
            filter._id = null; // Forces empty result
        }
    }
    // Admin sees all (empty filter)
    return filter;
}

// GET /api/export/attendance?date=YYYY-MM-DD
router.get('/attendance', async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).send("Date is required");

        const filter = await getStudentFilter(req.user);
        const students = await Student.find(filter);
        
        // Transform data for Excel
        const data = students.map(s => {
            // Create a seed based on Date string + Student ID to make it consistent for the same date request
            const seed = date.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + 
                         s.studentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            
            const status = getMockStatus(seed, s.attendancePercentage);

            return {
                "Student Name": s.name,
                "Student ID": s.studentId,
                "Course": s.course,
                "Date": date,
                "Status": status,
                "Overall Attendance %": s.attendancePercentage
            };
        });

        // Create Workbook
        const ws = xlsx.utils.json_to_sheet(data);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Attendance");

        // Write to buffer
        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Attendance_Record_${date}.xlsx`);
        res.send(buffer);

    } catch (e) {
        console.error("Export Error:", e);
        res.status(500).send("Failed to export attendance");
    }
});

// GET /api/export/risk-report
router.get('/risk-report', async (req, res) => {
    try {
        const filter = await getStudentFilter(req.user);
        // Filter for Medium and High Risk
        // Merge with existing filter
        const riskFilter = { ...filter, riskLevel: { $in: ['High', 'Medium'] } };

        const riskStudents = await Student.find(riskFilter).sort({ riskScore: -1 });

        const data = riskStudents.map(s => ({
            "Student Name": s.name,
            "Student ID": s.studentId,
            "Course": s.course,
            "Risk Level": s.riskLevel,
            "Risk Score": s.riskScore,
            "Attendance %": s.attendancePercentage,
            "CGPA": s.cgpa,
            "Fee Delay (Days)": s.feeDelayDays,
            "Primary Risk Factors": s.riskFactors.join(", ")
        }));

        const ws = xlsx.utils.json_to_sheet(data);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Risk Report");

        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Risk_Analysis_Report_${new Date().toISOString().slice(0,10)}.xlsx`);
        res.send(buffer);

    } catch (e) {
        console.error("Export Error:", e);
        res.status(500).send("Failed to export risk report");
    }
});

module.exports = router;
