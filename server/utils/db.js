const mongoose = require('mongoose');

const isDbConnected = () => {
    return mongoose.connection.readyState === 1;
};

const connectDB = async () => {
    try {
        // Check if we already have a connection
        if (isDbConnected()) {
            console.log("✅ Using existing MongoDB connection");
            return true;
        }

        console.log("Attempting to connect to MongoDB...");
        const uri = process.env.MONGO_URI;
        
        console.log(`MONGO_URI detected: ${uri ? 'YES' : 'NO'}`);
        
        if (!uri) {
            console.error("❌ CRITICAL ERROR: MONGO_URI environment variable is not defined.");
            console.error("   The app is attempting to connect to localhost, which WILL FAIL in Render/Docker.");
            console.error("   Please add MONGO_URI to your Render Environment Variables.");
        }

        // Use Env Var or Fallback (for local dev)
        const dbUri = uri || 'mongodb://127.0.0.1:27017/student-risk-predictor';
        
        const conn = await mongoose.connect(dbUri, {
            // Connection Options
            maxPoolSize: 10,
            minPoolSize: 1,
            serverSelectionTimeoutMS: 5000, // Fast fail if host unreachable
            socketTimeoutMS: 45000,
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return true;
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        if (error.message.includes('ENOTFOUND') || error.message.includes('querySrv')) {
            console.error("⚠️ DIAGNOSTIC HINT: MongoDB SRV DNS lookup failed.");
            console.error("   1. Verify your MONGO_URI hostname in Atlas/Render (e.g. cluster.xxxx.mongodb.net).");
            console.error("   2. Check if your MongoDB Atlas cluster is active and IP Access List includes 0.0.0.0/0.");
        }
        return false;
    }
};

module.exports = { connectDB, isDbConnected };

