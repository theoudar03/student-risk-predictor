const express = require('express');
const cors = require('cors');
require('dotenv').config();

const studentRoutes = require('./routes/students');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5005;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/students', studentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/portal', require('./routes/portal'));
app.use('/api/interventions', require('./routes/interventions'));
app.use('/api/logs', require('./services/logger').router);
app.use('/api/messages', require('./routes/messages'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/export', require('./routes/export'));

app.get('/', (req, res) => {
  res.send('Student Risk Predictor API is Running (Local JSON Mode)');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Running in Local JSON Mode (No MongoDB required)');
});
