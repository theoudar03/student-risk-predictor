require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');

const { connectDB, isDbConnected } = require('./utils/db');

// Import Routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const adminRoutes = require('./routes/admin');
const attendanceRoutes = require('./routes/attendance');
const riskRoutes = require('./routes/risk');
const mlRoutes = require('./routes/ml');
const interventionRoutes = require('./routes/interventions');
const messageRoutes = require('./routes/messages');
const portalRoutes = require('./routes/portal');
const exportRoutes = require('./routes/export');
const alertRoutes = require('./routes/alert');
const healthRoute = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(compression());
app.use(express.json());
app.use(cors());


// Database Connection
connectDB();

// Database Readiness Guard Middleware
app.use('/api', (req, res, next) => {
    if (!isDbConnected()) {
        return res.status(503).json({
            success: false,
            message: 'Database connection is currently unavailable. Please verify MONGO_URI configuration in MongoDB Atlas / Render settings.',
            code: 'DB_DISCONNECTED'
        });
    }
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/interventions', interventionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/alerts', alertRoutes); // New Alerts Route
app.use('/', healthRoute); // Lightweight Health Ping Route

// Scheduled Jobs
const cron = require('node-cron');
const { calculateAllRiskBatch } = require('./utils/riskEngine');

// 🕛 Daily Midnight Risk Recalculation (00:00)
// Ensures risk scores and alerts are fresh for the new day
cron.schedule('0 0 * * *', async () => {
    console.log('[SCHEDULER] 🕛 Starting Daily Midnight Risk Recalculation...');
    try {
        const result = await calculateAllRiskBatch('BatchScheduler');
        console.log(`[SCHEDULER] ✅ Daily Recalculation Complete. Processed: ${result.processed}`);
    } catch (err) {
        console.error('[SCHEDULER] ❌ Daily Recalculation Failed:', err);
    }
}, {
    timezone: "Asia/Kolkata" // Explicit timezone to match user context or server needs
});

// Health Check
app.get('/', (req, res) => {
    res.send('Student Risk Predictor API Running');
});

// Global Process Protection (Prevents Server Crashes & Shutdowns)
process.on('uncaughtException', (err) => {
    console.error('❌ [CRASH GUARD] Uncaught Exception caught:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ [CRASH GUARD] Unhandled Promise Rejection caught:', reason);
});

// Anti-Sleep Keep-Alive Ping (Prevents free cloud host shutdowns e.g. Render/Railway)
const axios = require('axios');
const externalUrl = process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL;
if (externalUrl) {
    console.log(`[KEEP-ALIVE] Enabling keep-alive ping for ${externalUrl}`);
    setInterval(async () => {
        try {
            await axios.get(`${externalUrl}/health`);
            console.log(`[KEEP-ALIVE] Automated ping to ${externalUrl}/health successful`);
        } catch (err) {
            console.warn('[KEEP-ALIVE] Ping attempt failed, will retry next cycle...');
        }
    }, 14 * 60 * 1000); // Every 14 minutes
}

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`[LIFECYCLE] Server started at: ${new Date().toISOString()}`); // Track cold starts
});

