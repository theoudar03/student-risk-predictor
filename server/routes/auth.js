const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Student = require('../models/Student');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_change_in_production';

// 10. Router Definition
router.post('/login', async (req, res) => {
    console.time('LoginRequest'); // Performance monitoring
    try {
        const { username, password } = req.body;

        // Optimization: Execute queries in parallel to reduce latency
        // 1. User Query (Admin/Mentor)
        const userPromise = User.findOne({
            $or: [{ username: username }, { mentorId: username }]
        });

        // 2. Student Query
        const studentPromise = Student.findOne({ studentId: username });

        // 3. Parent Query (Conditional)
        let parentStudentPromise = Promise.resolve(null);
        if (username.startsWith('p_')) {
            const targetStudentId = username.substring(2);
            parentStudentPromise = Student.findOne({ studentId: targetStudentId });
        }

        // Await all DB operations simultaneously
        const [user, student, targetStudent] = await Promise.all([
            userPromise, 
            studentPromise, 
            parentStudentPromise
        ]);

        console.log(`Debug: UserFound: ${!!user}, StudentFound: ${!!student}, ParentTargetFound: ${!!targetStudent}`);

        // --- Logic Block 1: Admin / Mentor ---
        if (user) {
             let isMatch = false;

             if (user.role === 'admin') {
                 // Simple password check (In production use bcrypt)
                 isMatch = user.password === password;
             } 
             else if (user.role === 'mentor') {
                 // Mentor Logic: Password equals Username (Legacy) or Password Check
                 isMatch = (user.mentorId === username || user.username === username) && (password === username || user.password === password);
             }
             else if (user.role === 'student') {
                 // Fallback if student is in generic User collection
                 isMatch = user.password === password;
             }
             else if (user.role === 'parent') {
                 isMatch = user.password === password;
             }
             
             if (!isMatch) {
                 console.timeEnd('LoginRequest');
                 return res.status(401).json({ success: false, message: 'Invalid credentials' });
             }
             
             // Construct Token Payload
             const payload = {
                 id: user._id,
                 role: user.role,
                 name: user.name,
                 email: user.email
             };

             if (user.role === 'student') payload.studentId = user.username;
             else if (user.role === 'parent') payload.studentId = user.studentId;
             else if (user.role === 'mentor') payload.mentorId = user.mentorId;

             const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
             
             console.timeEnd('LoginRequest');
             return res.json({ 
                 success: true, 
                 token, 
                 user: payload 
             });
        }

        // --- Logic Block 2: Student Login ---
        if (student) {
            if (password !== username) {
                console.timeEnd('LoginRequest');
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
            
            const token = jwt.sign({ id: student._id, role: 'student', name: student.name, studentId: student.studentId }, JWT_SECRET, { expiresIn: '24h' });
            console.timeEnd('LoginRequest');
            return res.json({ success: true, token, user: { id: student._id, name: student.name, role: 'student', studentId: student.studentId } });
        }

        // --- Logic Block 3: Parent Login ---
        if (targetStudent) {
            // Parent username is "p_STUDENTID", password matches username (legacy logic from original code)
            if (password !== username) {
                console.timeEnd('LoginRequest');
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
            
            const token = jwt.sign({ id: 'p_' + targetStudent._id, role: 'parent', name: 'Parent of ' + targetStudent.name, studentId: targetStudent.studentId }, JWT_SECRET, { expiresIn: '24h' });
            console.timeEnd('LoginRequest');
            return res.json({ success: true, token, user: { id: 'p_' + targetStudent._id, name: 'Parent of ' + targetStudent.name, role: 'parent', studentId: targetStudent.studentId } });
        }
        
        console.timeEnd('LoginRequest');
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
        
    } catch (error) {
        console.error("Login Server Error:", error);
        console.timeEnd('LoginRequest');
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

module.exports = router;
