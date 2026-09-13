const express = require('express');
const router = express.Router();
const { isDbConnected } = require('../utils/db');
const cacheService = require('../utils/cache');

router.get('/health', (req, res) => {
    // Lightweight logging to verify the warmup cron ping
    console.log(`[WARM-UP] Health ping received: ${new Date().toISOString()}`);
    const dbConnected = isDbConnected();
    const cacheType = cacheService.getCacheType();
    res.status(dbConnected ? 200 : 503).json({
        status: dbConnected ? 'ok' : 'degraded',
        dbConnected,
        cacheType,
        service: 'student-risk-backend',
        timestamp: Date.now()
    });
});

module.exports = router;


