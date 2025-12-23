const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../utils/db');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

router.use(authenticateToken);
router.use(authorizeRole('mentor')); // Only mentors manage interventions

// Get Interventions for a Student
router.get('/:studentId', (req, res) => {
    try {
        const interventions = readData('interventions');
        const studentInterventions = interventions.filter(i => i.studentId === req.params.studentId);
        res.json(studentInterventions.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (e) {
        console.error("Error fetching interventions:", e);
        res.status(500).json({ error: "Server Error" });
    }
});

// Create New Intervention
router.post('/', (req, res) => {
    try {
        const { studentId, riskScoreAtTime, riskLevel, actionTaken, notes, followUpDate } = req.body;
        
        const newIntervention = {
            id: generateId(),
            studentId,
            riskScoreAtTime,
            riskLevel,
            actionTaken,
            notes,
            followUpDate,
            outcome: 'Pending',
            createdBy: req.user.name,
            timestamp: new Date().toISOString()
        };

        const interventions = readData('interventions');
        interventions.push(newIntervention);
        writeData('interventions', interventions);

        // Update Alert Status if exists
        const alerts = readData('alerts');
        const activeAlert = alerts.find(a => a.studentId === studentId && a.status === 'Active');
        if (activeAlert) {
            activeAlert.status = 'Action Taken';
            activeAlert.lastAction = actionTaken;
            writeData('alerts', alerts);
        }

        res.status(201).json(newIntervention);

    } catch (e) {
        console.error("Error creating intervention:", e);
        res.status(500).json({ error: "Server Error" });
    }
});

// Update Outcome (Close the loop & Feed AI)
router.patch('/:id/outcome', (req, res) => {
    try {
        const { outcome, resolveAlert } = req.body;
        const interventions = readData('interventions');
        const idx = interventions.findIndex(i => i.id === req.params.id);

        if (idx === -1) return res.status(404).json({ error: "Intervention not found" });

        const intervention = interventions[idx];
        const studentId = intervention.studentId;

        // 1. Fetch current student state
        const students = readData('students');
        const student = students.find(s => s._id === studentId || s.studentId === studentId);
        
        let currentRiskScore = intervention.riskScoreAtTime; // fallback
        if (student) {
            currentRiskScore = student.riskScore;
        }

        // 2. Update Intervention Record
        interventions[idx].outcome = outcome;
        interventions[idx].riskScoreAfter = currentRiskScore;
        interventions[idx].closedAt = new Date().toISOString();
        writeData('interventions', interventions);

        // 3. Resolve Alert if requested
        if (resolveAlert) {
             const alerts = readData('alerts');
             const alertIdx = alerts.findIndex(a => a.studentId === studentId && a.status !== 'Resolved');
             if (alertIdx !== -1) {
                 alerts[alertIdx].status = 'Resolved';
                 alerts[alertIdx].resolvedAt = new Date().toISOString();
                 writeData('alerts', alerts);
             }
        }

        // 4. ML FEEDBACK LOOP (Store data for future training)
        // Only store if we have a valid outcome
        if (outcome === 'Effective' || outcome === 'No Change') {
            const feedbackData = {
                id: generateId(),
                studentId,
                actionTaken: intervention.actionTaken,
                initialRisk: intervention.riskScoreAtTime,
                finalRisk: currentRiskScore,
                riskReduction: intervention.riskScoreAtTime - currentRiskScore,
                outcome, // Label
                timestamp: new Date().toISOString()
            };

            try {
                const mlData = readData('ml_feedback_loop');
                mlData.push(feedbackData);
                writeData('ml_feedback_loop', mlData);
                console.log("ML Feedback Loop: Data point captured for retraining.");
            } catch (err) {
                console.error("Failed to write to ML feedback loop:", err);
            }
        }

        res.json(interventions[idx]);
    } catch (e) {
        console.error("Error updating intervention outcome:", e);
        res.status(500).json({ error: "Server Error" });
    }
});

module.exports = router;
