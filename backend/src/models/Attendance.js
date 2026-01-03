const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String, // Format: YYYY-MM-DD
        required: true
    },
    status: {
        type: String,
        enum: ['PRESENT', 'ABSENT', 'LEAVE'],
        default: 'ABSENT'
    },
    reason: {
        type: String,
        enum: ['Health', 'Personal', 'Work conflict', 'Burnout', 'Other', null],
        default: null
    },
    reasonText: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Compound index to ensure one attendance record per user per day
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
