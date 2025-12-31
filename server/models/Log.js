const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
    action: String,
    user: String, // User Name or ID
    details: String,
}, { timestamps: true });

module.exports = mongoose.model('Log', LogSchema);
