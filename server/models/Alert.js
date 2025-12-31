const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  studentName: { type: String }, // Snapshot of name at alert time
  severity: { type: String, enum: ['High', 'Medium', 'Low'], required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Resolved'], default: 'Active' },
  date: { type: Date, default: Date.now }, // Maps to 'date' in JSON
  resolvedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Alert', AlertSchema);
