const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  studentId: { type: String, required: true, unique: true }, // e.g. S2024101
  email: { type: String, required: true },
  course: { type: String, default: 'General' },
  assignedMentorId: { type: String, default: null },
  enrollmentYear: { type: Number, default: new Date().getFullYear() },
  
  // Academic & Behavioral Data
  attendancePercentage: { type: Number, required: true }, // 0-100
  cgpa: { type: Number, required: true }, // 0-10 scale
  assignmentsCompleted: { type: Number, default: 0 }, // percentage
  classParticipationScore: { type: Number, default: 5 }, // 1-10
  
  // Financial
  feeDelayDays: { type: Number, default: 0 },
  
  // Risk Metrics (Output of ML)
  riskScore: { type: Number, default: null }, // 0-100
  riskLevel: { type: String, enum: ['Low', 'Medium', 'High', 'Pending', null], default: null },
  riskStatus: { type: String, enum: ['PENDING', 'PROCESSING', 'CALCULATED', 'FAILED'], default: 'PENDING' },
  riskModel: { type: String, default: null },
  riskUpdatedAt: { type: Date },
  riskFactors: [{ type: String }], // Explanations
  
}, { timestamps: true });

module.exports = mongoose.model('Student', StudentSchema);
