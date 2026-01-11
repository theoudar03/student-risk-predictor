const express = require('express');
const router = express.Router();
const { calculateRisk } = require('../utils/riskEngine');
const Student = require('../models/Student');

// Trigger Risk Calculation Manually
router.post('/calculate/:studentId', async (req, res) => {
    try {
        const student = await Student.findOne({ studentId: req.params.studentId });
        if (!student) {
            // Try by _id if studentId not found
            const byId = await Student.findById(req.params.studentId);
            if (!byId) return res.status(404).json({ error: "Student not found" });
        }

        const targetId = student ? student._id : req.params.studentId;

        // Trigger calculation
        // We can await it here to give immediate feedback to the caller (e.g. Admin clicking "Retry")
        await calculateRisk(targetId);
        
        const updatedStudent = await Student.findById(targetId);
        res.json(updatedStudent);

    } catch (e) {
        console.error("Risk Route Error:", e);
        res.status(500).json({ error: "Server Error" });
    }
});

// Bulk Recalculate (Batch Optimized)
router.post('/recalculate-all', async (req, res) => {
    try {
        const { calculateAllRiskBatch } = require('../utils/riskEngine');
        const result = await calculateAllRiskBatch();
        res.json(result);
    } catch (e) {
        console.error("Batch Risk Error:", e);
        res.status(500).json({ error: "Batch Calculation Failed" });
    }
});

module.exports = router;
