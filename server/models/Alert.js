const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Linked to mentor (Optional)
  studentName: { type: String }, // Optional snapshot
  riskLevel: { type: String, enum: ['Medium', 'High'], required: true },
  riskScore: { type: Number }, // Store score for context
  message: { type: String }, // Human readable reason
  alertType: { type: String, required: true, default: 'RISK', index: true }, // 'RISK' or 'ATTENDANCE'
  active: { type: Boolean, default: true, index: true },
  lastEvaluatedAt: { type: Date, default: Date.now },
  lastUpdatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'riskAlerts', timestamps: true });

AlertSchema.index({ studentId: 1, mentorId: 1 }, { unique: false }); // Allow history, but app logic enforces singular active

module.exports = mongoose.model('RiskAlert', AlertSchema);