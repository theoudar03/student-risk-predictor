const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Student = require('../models/Student');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_change_in_production';

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Check for Admin or Mentor (User Collection)
        // Check username or verify if mentorId is being used as username
        const user = await User.findOne({
            $or: [{ username: username }, { mentorId: username }]
        });
        
        if (user) {
             let isMatch = false;

             if (user.role === 'admin') {
                 // Simple password check (In production use bcrypt)
                 isMatch = user.password === password;
             } 
             else if (user.role === 'mentor') {
                 // Mentor Logic: Password equals Username (Legacy)
                 // Or check real password if available
                 isMatch = (user.mentorId === username || user.username === username) && (password === username);
             }
             else if (user.role === 'student') {
                 // Student Logic
                 isMatch = user.password === password;
             }
             else if (user.role === 'parent') {
                 // Parent Logic
                 isMatch = user.password === password;
             }
             
             if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });
             
             // Construct Token Payload
             const payload = {
                 id: user._id,
                 role: user.role,
                 name: user.name,
                 email: user.email
             };

             // Add role-specific fields
             if (user.role === 'student') {
                 payload.studentId = user.username; // Assuming username matches studentId
             } else if (user.role === 'parent') {
                 payload.studentId = user.studentId;
             } else if (user.role === 'mentor') {
                 payload.mentorId = user.mentorId;
             }

             const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
             
             return res.json({ 
                 success: true, 
                 token, 
                 user: payload 
             });
        }

        // 2. Student Login
        const student = await Student.findOne({ studentId: username });
        
        if (student) {
            if (password !== username) return res.status(401).json({ success: false, message: 'Invalid credentials' });
            
            const token = jwt.sign({ id: student._id, role: 'student', name: student.name, studentId: student.studentId }, JWT_SECRET, { expiresIn: '24h' });
            return res.json({ success: true, token, user: { id: student._id, name: student.name, role: 'student', studentId: student.studentId } });
        }

        // 3. Parent Login
        if (username.startsWith('p_')) {
            const targetStudentId = username.substring(2);
            const targetStudent = await Student.findOne({ studentId: targetStudentId });
            
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
