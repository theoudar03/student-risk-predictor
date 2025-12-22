const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  studentId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  course: { type: String, default: 'General' },
  enrollmentYear: { type: Number, required: true },
  
  // Academic & Behavioral Data
  attendancePercentage: { type: Number, required: true }, // 0-100
  cgpa: { type: Number, required: true }, // 0-10 scale
  assignmentsCompleted: { type: Number, default: 0 }, // percentage
  classParticipationScore: { type: Number, default: 5 }, // 1-10
  
  // Financial
  feeDelayDays: { type: Number, default: 0 },
  
  // Risk Metrics (Output of ML)
  riskScore: { type: Number, default: 0 }, // 0-100
  riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  riskFactors: [{ type: String }], // Explanations, e.g., "Low Attendance"
  
  // Metadata
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Student', StudentSchema);
