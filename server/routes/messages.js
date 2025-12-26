const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../utils/db');
const { authenticateToken } = require('../middleware/authMiddleware');

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

router.use(authenticateToken);

// Get Meeting Requests (Mentor View - Scoped)
router.get('/', async (req, res) => {
    try {
        const messages = await readData('messages');
        const students = await readData('students');
        const userId = req.user.id;
        
        let myRequests = [];

        if (req.user.role === 'mentor') {
            const mentors = await readData('mentors');
            const currentUser = mentors.find(m => m.email === req.user.email);
            
            if (currentUser && currentUser.department) {
                // Return requests where:
                // 1. Receiver is ME (explicitly assigned)
                // 2. Sender is a student from MY department (scoped visibility)
                
                myRequests = messages.filter(m => {
                    // Direct message check (Internal ID or Public Mentor ID)
                    if (m.receiverId === userId || m.receiverId === currentUser.mentorId) return true;

                    // Check if sender is a student in my department (Department Scoping)
                    const senderStudent = students.find(s => s._id === m.senderId);
                    return senderStudent && senderStudent.course === currentUser.department;
                });
            }
        } else {
            // Student/Parent/Admin logic (unchanged)
            myRequests = messages.filter(m => m.receiverId === userId || m.senderId === userId);
        }
        
        // Sort by date desc
        res.json(myRequests.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (e) {
        console.error("Error fetching messages:", e);
        res.status(500).json({ error: "Server Error" });
    }
});

// Request a Meeting (Student/Parent -> Mentor)
router.post('/', async (req, res) => {
    try {
        const { receiverId, receiverName, agenda, date, time } = req.body;
        
        if (!receiverId || !agenda || !date) {
            return res.status(400).json({ error: "Mentor, agenda, and preferred date are required" });
        }

        const newRequest = {
            id: generateId(),
            senderId: req.user.id,
            senderName: req.user.name,
            senderRole: req.user.role,
            receiverId: receiverId, 
            receiverName: receiverName || 'Mentor',
            agenda, 
            preferredDate: date,
            preferredTime: time || 'Flexible',
            status: 'Pending', // Pending, Viewed, Accepted, Declined
            timestamp: new Date().toISOString()
        };

        const messages = await readData('messages');
        messages.push(newRequest);
        await writeData('messages', messages);

        res.status(201).json(newRequest);
    } catch (e) {
        console.error("Error sending meeting request:", e);
        res.status(500).json({ error: "Server Error" });
    }
});

// Update Request Status (Mentor Only)
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['Viewed', 'Accepted', 'Declined'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const messages = await readData('messages');
        const msg = messages.find(m => m.id === req.params.id);
        
        // Find current mentor profile to check mentorId match
        const mentors = await readData('mentors');
        const currentUser = mentors.find(m => m.email === req.user.email);

        if (msg && (msg.receiverId === req.user.id || (currentUser && msg.receiverId === currentUser.mentorId))) {
            msg.status = status;
            await writeData('messages', messages);
            res.json({ success: true, status });
        } else {
            res.status(404).json({ error: "Request not found or unauthorized" });
        }
    } catch (e) {
        res.status(500).json({ error: "Server Error" });
    }
});

module.exports = router;
