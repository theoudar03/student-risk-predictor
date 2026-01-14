const express = require('express');
const axios = require('axios');
const router = express.Router();

// Direct Proxy to Python ML Service
router.post('/', async (req, res) => {
    try {
        const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8001';
        
        // Forward to the correct FastAPI endpoint
        const response = await axios.post(
            `${mlServiceUrl}/api/ml/calculate-risk`,
            req.body,
            { timeout: 5000 }
        );

        res.json(response.data);
    } catch (error) {
        console.error("ML Microservice Proxy Error:", error.message);
        res.status(502).json({ 
            error: "ML service unavailable or failed", 
            details: error.message 
        });
    }
});

module.exports = router;
