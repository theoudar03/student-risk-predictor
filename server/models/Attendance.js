const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  studentName: { type: String, required: true },
  studentRollId: { type: String, required: true }, // Verified Student ID (e.g., S2024101)
  department: { type: String, required: true }, // Filter/Isolation Key
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who marked it
  
  status: { type: String, enum: ['Present', 'Absent'], required: true },
  
  // Date Fields for easy querying
  date: { type: String, required: true }, // YYYY-MM-DD
  month: { type: String }, // For monthly aggregation if needed
  year: { type: Number },
  
}, { timestamps: true });

// Ensure unique record per student per day
AttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
// Optimize checking if department attendance exists for a date
AttendanceSchema.index({ department: 1, date: 1 });

module.exports = mongoose.model('Attendance', AttendanceSchema);
