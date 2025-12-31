const mongoose = require('mongoose');

const SurveySchema = new mongoose.Schema({
  studentId: String, // ID or ObjectId string
  mentorId: String,  // ID or ObjectId string
  stressLevel: Number,
  learningDifficulty: Number,
  motivation: Number,
  notes: String,
}, { timestamps: true });

module.exports = mongoose.model('Survey', SurveySchema);
