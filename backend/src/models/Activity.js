const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: String, // Format: YYYY-MM-DD
        required: true
    }
}, {
    timestamps: true
});

// Compound index to ensure one activity per user per day
activitySchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Activity', activitySchema);
