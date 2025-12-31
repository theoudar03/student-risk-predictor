const express = require('express');
const axios = require('axios');
const router = express.Router();

// Direct Proxy to Python ML Service
router.post('/', async (req, res) => {
    try {
        // Forward the entire body to the Python Microservice
        const response = await axios.post(
            "http://127.0.0.1:8000/predict-risk",
            req.body
        );

        res.json(response.data);
    } catch (error) {
        console.error("ML Microservice Error:", error.message);
        // Fallback or Error
        res.status(500).json({ 
            error: "ML service unavailable", 
            details: error.message 
        });
    }
});

module.exports = router;
