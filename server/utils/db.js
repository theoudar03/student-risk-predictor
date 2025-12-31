const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        console.log("Attempting to connect to MongoDB...");
        const uri = process.env.MONGO_URI;
        
        console.log(`MONGO_URI detected: ${uri ? 'YES' : 'NO'}`);
        
        if (!uri) {
            console.error("❌ CRITICAL ERROR: MONGO_URI environment variable is not defined.");
            console.error("   The app is attempting to connect to localhost, which WILL FAIL in Render/Docker.");
            console.error("   Please add MONGO_URI to your Render Environment Variables.");
        }

        const conn = await mongoose.connect(uri || 'mongodb://127.0.0.1:27017/student-risk-predictor', {
            // Options
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
