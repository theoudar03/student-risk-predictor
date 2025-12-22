const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Helper to read mentors from JSON file
const getMentors = () => {
    try {
        const filePath = path.join(__dirname, '../data/mentors.json');
        if (!fs.existsSync(filePath)) {
            return [];
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading mentors data:", error);
        return [];
    }
};

router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;
        const mentors = getMentors();
        
        const user = mentors.find(u => u.email === email && u.password === password);
        
        if (user) {
            // Don't send password back
            const safeUser = { 
                name: user.name, 
                email: user.email, 
                role: user.role,
                department: user.department 
            };
            res.json({ success: true, user: safeUser });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error("Login Server Error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

module.exports = router;
