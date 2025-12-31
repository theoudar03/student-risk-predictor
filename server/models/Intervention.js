const mongoose = require('mongoose');

const InterventionSchema = new mongoose.Schema({
  studentId: { type: String, required: true }, // Should technically be ObjectId ref but legacy uses String ID or generated ID? 
  // Code uses `studentId` from body.
  // We can use String for flexibility or Ref. Let's use String as per existing flow to avoid lookup complexity right now.
  
  riskScoreAtTime: Number,
  riskLevel: String,
  actionTaken: String,
  notes: String,
  followUpDate: Date,
  outcome: { type: String, default: 'Pending' },
  createdBy: String,
  riskScoreAfter: Number,
  closedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Intervention', InterventionSchema);
