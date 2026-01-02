require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./utils/db');

// Initialize Express App
const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Import Routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const adminRoutes = require('./routes/admin');
const messageRoutes = require('./routes/messages');
const interventionRoutes = require('./routes/interventions');
const exportRoutes = require('./routes/export');
const portalRoutes = require('./routes/portal');
const mlRoutes = require('./routes/ml');
const attendanceRoutes = require('./routes/attendance');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/interventions', interventionRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/attendance', attendanceRoutes);

// Health Check Route
app.get('/', (req, res) => {
    res.send('Student Risk Predictor API is running...');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
