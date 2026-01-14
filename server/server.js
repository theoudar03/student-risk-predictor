require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

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

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/stayontrack')
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => {
        console.error("❌ MongoDB Connection Error:", err.message);
        // Only exit in production to allow retry logic by orchestrator, 
        // but for now logging is enough.
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

// Health Check
app.get('/', (req, res) => {
    res.send('Student Risk Predictor API Running');
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
