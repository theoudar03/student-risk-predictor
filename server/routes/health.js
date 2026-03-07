const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
    // Lightweight logging to verify the warmup cron ping
    console.log(`[WARM-UP] Health ping received: ${new Date().toISOString()}`);
    res.status(200).json({
        status: 'ok',
        service: 'student-risk-backend',
        timestamp: Date.now()
    });
});

module.exports = router;
