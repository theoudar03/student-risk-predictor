const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const { readData } = require('../utils/db');

// Helper to generate a consistent random-ish status based on seed
const getMockStatus = (seed, probability) => {
    const x = Math.sin(seed) * 10000;
    const random = (x - Math.floor(x)) * 100;
    return random < probability ? 'Present' : 'Absent';
};

// GET /api/export/attendance?date=YYYY-MM-DD
router.get('/attendance', (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).send("Date is required");

        const students = readData('students');
        
        // Transform data for Excel
        const data = students.map(s => {
            // Create a seed based on Date string + Student ID to make it consistent for the same date request
            // This way, if they download twice for same date, they get same "random" results
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
router.get('/risk-report', (req, res) => {
    try {
        const students = readData('students');
        
        // Filter for Medium and High Risk
        const riskStudents = students.filter(s => s.riskLevel === 'High' || s.riskLevel === 'Medium')
                                     .sort((a,b) => b.riskScore - a.riskScore);

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
