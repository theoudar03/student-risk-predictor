const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Message = require('../models/Message');
const Student = require('../models/Student');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// Get Meeting Requests (Mentor View - Scoped)
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        
        let messages = [];

        if (req.user.role === 'mentor') {
            const currentUser = await User.findOne({ email: req.user.email });
            
            if (currentUser && currentUser.department) {
                // Return requests where:
                // 1. Receiver is ME (explicitly assigned)
                // 2. Sender is a student from MY department (scoped visibility)
                
                // Get IDs of students in my department
                const deptStudents = await Student.find({ course: currentUser.department }, '_id');
                const deptStudentIds = deptStudents.map(s => s._id.toString());
                
                messages = await Message.find({
                    $or: [
                        { receiverId: userId },
                        { receiverId: currentUser.mentorId },
                        { senderId: { $in: deptStudentIds } } 
                    ]
                }).sort({ createdAt: -1 });

            }
        } else {
            // Student/Parent/Admin logic
            messages = await Message.find({
                $or: [
                    { receiverId: userId },
                    { senderId: userId }
                ]
            }).sort({ createdAt: -1 });
        }
        
        const safeMessages = messages.map(m => ({
            ...m.toObject(),
            id: m._id,
            preferredDate: m.preferredDate || m.createdAt // Fallback to createdAt if no date preference
        }));
        
        res.json(safeMessages);
    } catch (e) {
        console.error("Error fetching messages:", e);
        res.status(500).json({ error: "Server Error" });
    }
});

// Request a Meeting (Student/Parent -> Mentor)
router.post('/', async (req, res) => {
    try {
        if (req.user.role !== 'parent') {
            return res.status(403).json({ error: "Only parents can request meetings." });
        }

        const { receiverId, receiverName, agenda, date, time } = req.body;
        
        if (!receiverId || !agenda || !date) {
            return res.status(400).json({ error: "Mentor, agenda, and preferred date are required" });
        }

        const newRequest = new Message({
            senderId: req.user.id,
            senderName: req.user.name,
            senderRole: req.user.role,
            receiverId: receiverId, 
            receiverName: receiverName || 'Mentor',
            agenda, 
            preferredDate: date,
            preferredTime: time || 'Flexible',
            status: 'Pending'
        });

        await newRequest.save();

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

        // Check ownership
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid Request ID" });
        }
        const msg = await Message.findById(req.params.id);
        if (!msg) return res.status(404).json({ error: "Request not found" });

        const currentUser = await User.findOne({ email: req.user.email });

        // Authorization Check
        const isAuthorized = (msg.receiverId === req.user.id) || 
                             (currentUser && msg.receiverId === currentUser.mentorId);

        if (isAuthorized) {
            msg.status = status;
            await msg.save();
            res.json({ success: true, status });
        } else {
            res.status(403).json({ error: "Unauthorized" });
        }
    } catch (e) {
        res.status(500).json({ error: "Server Error" });
    }
});

module.exports = router;
