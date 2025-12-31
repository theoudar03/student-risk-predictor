const mongoose = require('mongoose');

const MLFeedbackSchema = new mongoose.Schema({
    studentId: String,
    actionTaken: String,
    initialRisk: Number,
    finalRisk: Number,
    riskReduction: Number,
    outcome: String,
}, { timestamps: true });

module.exports = mongoose.model('MLFeedback', MLFeedbackSchema);
