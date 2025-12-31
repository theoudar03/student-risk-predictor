const express = require('express');
const router = express.Router();
const Intervention = require('../models/Intervention');
const Alert = require('../models/Alert');
const Student = require('../models/Student');
const MLFeedback = require('../models/MLFeedback');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.use(authorizeRole('mentor'));

// Get Interventions for a Student
router.get('/:studentId', async (req, res) => {
    try {
        const interventions = await Intervention.find({ studentId: req.params.studentId }).sort({ createdAt: -1 });
        res.json(interventions);
    } catch (e) {
        res.status(500).json({ error: "Server Error" });
    }
});

// Create New Intervention
router.post('/', async (req, res) => {
    try {
        const { studentId, riskScoreAtTime, riskLevel, actionTaken, notes, followUpDate } = req.body;
        
        const newIntervention = new Intervention({
            studentId,
            riskScoreAtTime,
            riskLevel,
            actionTaken,
            notes,
            followUpDate,
            createdBy: req.user.name,
        });

        await newIntervention.save();

        // Update Alert Status if exists
        // Find active alert for this student
        // Note: studentId in Alert is ObjectId link. 
        // req.body.studentId might be "S2024101" or ObjectId?
        // Let's assume frontend sends the _id or we need to look it up.
        // Existing logic used consistent ID.
        // We try to find Alert by studentId (if it's ObjectId) OR we query student to get ObjectId.
        
        // Simpler: Try to find alert assuming input studentId matches Alert's studentId field format.
        // If Alert uses ObjectId, and input is "S2024101", we need conversion.
        // But if frontend calls this from StudentProfile, it likely has the `_id`.
        
        await Alert.updateMany(
            { studentId: studentId, status: 'Active' }, 
            { status: 'Action Taken', lastAction: actionTaken }
        );

        res.status(201).json(newIntervention);

    } catch (e) {
        console.error("Error creating intervention:", e);
        res.status(500).json({ error: "Server Error" });
    }
});

// Update Outcome
router.patch('/:id/outcome', async (req, res) => {
    try {
        const { outcome, resolveAlert } = req.body;
        const intervention = await Intervention.findById(req.params.id);

        if (!intervention) return res.status(404).json({ error: "Intervention not found" });

        const studentId = intervention.studentId;
        
        // 1. Fetch current student state
        const student = await Student.findOne({ $or: [{ _id: studentId }, { studentId: studentId }] });
        
        let currentRiskScore = intervention.riskScoreAtTime; 
        if (student) {
            currentRiskScore = student.riskScore;
        }

        // 2. Update Intervention Record
        intervention.outcome = outcome;
        intervention.riskScoreAfter = currentRiskScore;
        intervention.closedAt = new Date();
        await intervention.save();

        // 3. Resolve Alert if requested
        if (resolveAlert) {
             await Alert.updateMany(
                 { studentId: studentId, status: { $ne: 'Resolved' } },
                 { status: 'Resolved', resolvedAt: new Date() }
             );
        }

        // 4. ML FEEDBACK LOOP
        if (outcome === 'Effective' || outcome === 'No Change') {
            await MLFeedback.create({
                studentId,
                actionTaken: intervention.actionTaken,
                initialRisk: intervention.riskScoreAtTime,
                finalRisk: currentRiskScore,
                riskReduction: intervention.riskScoreAtTime - currentRiskScore,
                outcome
            });
        }

        res.json(intervention);
    } catch (e) {
        console.error("Error updating outcome:", e);
        res.status(500).json({ error: "Server Error" });
    }
});

module.exports = router;
