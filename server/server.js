const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./utils/db');

const studentRoutes = require('./routes/students');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5005;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:5175', 
    'http://localhost:5176',
    'https://stayontrack-edu.web.app',
    'https://stayontrack-edu.firebaseapp.com'
  ],
  credentials: true
}));
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
app.use('/api/student-risk', require('./routes/ml'));

app.get('/', (req, res) => {
  res.send('Student Risk Predictor API is Running (MongoDB Mode)');
});

// Start Server
connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('MongoDB Mode Active');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Error: Port ${PORT} is already in use.`);
      console.error(`   Please stop the other server instance or change the PORT in .env\n`);
      process.exit(1);
    } else {
      throw err;
    }
  });
}).catch(err => {
    console.error("Failed to connect to DB", err);
});
