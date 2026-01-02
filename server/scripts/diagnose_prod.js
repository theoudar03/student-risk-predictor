const axios = require('axios');

// The Render URL
const BASE_URL = "https://stayontrack-lt3g.onrender.com";

console.log(`🔍 Diagnosing Backend Connection: ${BASE_URL}`);

(async () => {
    try {
        // 1. Check Root (Health)
        console.log("\n1. Pinging Root Endpoint (GET /)...");
        const rootRes = await axios.get(BASE_URL);
        console.log(`   ✅ Success! Status: ${rootRes.status}`);
        console.log(`   📄 Response: "${rootRes.data}"`);
    } catch (error) {
        console.error(`   ❌ Failed to connect to root: ${error.message}`);
        if(error.response) console.error(`      Server sent: ${error.response.status}`);
    }

    try {
        // 2. Check Login Endpoint (POST /api/auth/login)
        console.log("\n2. Pinging Login Endpoint (POST /api/auth/login)...");
        // Sending invalid creds just to see if server responds
        const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, { 
            username: "test", 
            password: "test" 
        });
        console.log(`   ✅ Endpoint is reachable (Unexpected code: ${loginRes.status})`);
    } catch (error) {
        if (error.response && error.response.status === 401) {
             console.log(`   ✅ Success! Server rejected invalid credentials with 401 (This is GOOD - logic is working)`);
             console.log(`      Msg: ${error.response.data.message}`);
        } else if (error.response && error.response.status === 500) {
             console.log(`   ❌ Server Error (500). The Code is running but crashed internally.`);
             console.log(`      Likely cause: DB Connection Failed.`);
        } else {
             console.error(`   ❌ Failed to reach endpoint: ${error.message}`);
        }
    }
})();
