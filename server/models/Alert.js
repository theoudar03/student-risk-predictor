const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Linked to mentor
  studentName: { type: String }, // Optional snapshot
  riskLevel: { type: String, enum: ['Medium', 'High'], required: true },
  riskScore: { type: Number }, // Store score for context
  message: { type: String }, // Human readable reason
  active: { type: Boolean, default: true, index: true },
  lastEvaluatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'riskAlerts', timestamps: true });

AlertSchema.index({ studentId: 1, mentorId: 1 }, { unique: false }); // Allow history, but app logic enforces singular active

module.exports = mongoose.model('RiskAlert', AlertSchema);