const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'mentor', 'student', 'parent'], required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  
  // Specific to Mentors
  mentorId: { type: String },
  department: { type: String }, // e.g., "Computer Science"

  // Specific to Parents (if we choose to store them here)
  studentId: { type: String } 

}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
