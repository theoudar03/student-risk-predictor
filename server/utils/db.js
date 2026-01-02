const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Check if we already have a connection
        if (mongoose.connection.readyState === 1) {
            console.log("✅ Using existing MongoDB connection");
            return;
        }

        console.log("Attempting to connect to MongoDB...");
        const uri = process.env.MONGO_URI;
        
        console.log(`MONGO_URI detected: ${uri ? 'YES' : 'NO'}`);
        
        if (!uri) {
            console.error("❌ CRITICAL ERROR: MONGO_URI environment variable is not defined.");
            console.error("   The app is attempting to connect to localhost, which WILL FAIL in Render/Docker.");
            console.error("   Please add MONGO_URI to your Render Environment Variables.");
        }

        // Use Env Var or Fallback (only for local dev)
        const dbUri = uri || 'mongodb://127.0.0.1:27017/student-risk-predictor';
        
        const conn = await mongoose.connect(dbUri, {
            // Optimization: Connection Pooling
            maxPoolSize: 10,      // Maintain up to 10 socket connections
            minPoolSize: 1,       // Keep at least 1 socket open
            serverSelectionTimeoutMS: 5000, // Timeout faster if DB is unreachable
            socketTimeoutMS: 45000, // Close sockets after inactivity
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        // Do not exit process immediately in dev, but in prod it's fatal
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
};

module.exports = connectDB;
