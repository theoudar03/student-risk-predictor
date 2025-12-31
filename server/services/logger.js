const express = require('express');
const router = express.Router();
const Log = require('../models/Log');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.use(authorizeRole('mentor'));

// Get system logs
router.get('/', async (req, res) => {
    try {
        const logs = await Log.find().sort({ createdAt: -1 }).limit(100);
        res.json(logs);
    } catch (e) {
         res.json([]);
    }
});

// Helper to log actions
const logAction = async (action, user, details) => {
    try {
        await Log.create({
            action,
            user,
            details
        });
        // cleanup old logs? Mongo TTL index is better for this.
    } catch (e) {
        console.error("Logging failed", e);
    }
};

module.exports = { router, logAction };
