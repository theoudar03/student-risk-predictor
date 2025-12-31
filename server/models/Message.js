const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  senderId: String, // User/Student ID
  senderName: String,
  senderRole: String,
  receiverId: String, // Mentor ID
  receiverName: String,
  
  agenda: String,
  preferredDate: String, // Keeping as string to match existing "YYYY-MM-DD" or similar
  preferredTime: String,
  
  status: { type: String, enum: ['Pending', 'Viewed', 'Accepted', 'Declined'], default: 'Pending' },
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
