const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../utils/db');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.use(authorizeRole('mentor')); // Only mentors need to see raw logs

// Get system logs
router.get('/', (req, res) => {
    try {
        const logs = readData('logs') || [];
        res.json(logs.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 100)); // Last 100 logs
    } catch (e) {
         res.json([]);
    }
});

// Helper to log actions
const logAction = (action, user, details) => {
    try {
        const logs = readData('logs') || [];
        logs.push({
            id: Date.now().toString(),
            action,
            user,
            details,
            timestamp: new Date().toISOString()
        });
        // Keep only last 1000 logs
        if (logs.length > 1000) logs.shift();
        writeData('logs', logs);
    } catch (e) {
        console.error("Logging failed", e);
    }
};

module.exports = { router, logAction };
