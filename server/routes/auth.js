const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_change_in_production';

// Helper to read users from JSON file
const getUsers = () => {
    try {
        const filePath = path.join(__dirname, '../data/users.json');
        if (!fs.existsSync(filePath)) {
            return [];
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading users data:", error);
        return [];
    }
};

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const users = getUsers();
        
        // 1. Check for Admin or existing user maps
        let user = users.find(u => u.username === username || u.mentorId === username);
        
        if (user) {
             let isMatch = false;

             // Admin (Legacy / Special) - keeps password
             if (user.role === 'admin') {
                 isMatch = user.password === password;
             } 
             // Mentor - ID based auth (Username=ID, Password=ID)
             else if (user.role === 'mentor') {
                 isMatch = (user.mentorId === username) && (password === username);
                 // Fallback if they try logging in with undefined mentorId but valid legacy username mechanism (should transition to ID)
             }
             
             if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });
             
             // Issue token
             const token = jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
             return res.json({ success: true, token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
        }

        // 2. Student Login (ID based)
        // Username == Student ID, Password == Student ID
        const students = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/students.json'), 'utf8'));
        const student = students.find(s => s.studentId === username);
        
        if (student) {
            if (password !== username) return res.status(401).json({ success: false, message: 'Invalid credentials' });
            
            const token = jwt.sign({ id: student._id, role: 'student', name: student.name, studentId: student.studentId }, JWT_SECRET, { expiresIn: '24h' });
            return res.json({ success: true, token, user: { id: student._id, name: student.name, role: 'student', studentId: student.studentId } });
        }

        // 3. Parent Login (Derived from Student ID)
        // Username starts with p_, then student ID. Password same.
        if (username.startsWith('p_')) {
            const targetStudentId = username.substring(2); // remove p_
            const targetStudent = students.find(s => s.studentId === targetStudentId);
            
            if (targetStudent) {
                if (password !== username) return res.status(401).json({ success: false, message: 'Invalid credentials' });
                
                const token = jwt.sign({ id: 'p_' + targetStudent._id, role: 'parent', name: 'Parent of ' + targetStudent.name, studentId: targetStudent.studentId }, JWT_SECRET, { expiresIn: '24h' });
                return res.json({ success: true, token, user: { id: 'p_' + targetStudent._id, name: 'Parent of ' + targetStudent.name, role: 'parent', studentId: targetStudent.studentId } });
            }
        }
        
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
        
    } catch (error) {
        console.error("Login Server Error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

module.exports = router;
