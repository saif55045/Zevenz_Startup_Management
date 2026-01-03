const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['TODO', 'BLOCKED', 'DONE'],
        default: 'TODO'
    },
    blockedReason: {
        type: String,
        enum: ['Technical issue', 'Waiting on co-founder', 'External dependency', null],
        default: null
    },
    completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

const planSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED'],
        default: 'PENDING'
    },
    tasks: [taskSchema]
}, {
    timestamps: true
});

// Virtual for progress calculation
planSchema.virtual('progress').get(function () {
    if (this.tasks.length === 0) return 0;
    const done = this.tasks.filter(t => t.status === 'DONE').length;
    return Math.round((done / this.tasks.length) * 100);
});

// Virtual for dead tasks (no update in 5 days)
planSchema.virtual('deadTasksCount').get(function () {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    return this.tasks.filter(t =>
        t.status !== 'DONE' && t.lastUpdated < fiveDaysAgo
    ).length;
});

// Check if plan should be auto-completed
planSchema.methods.checkAutoComplete = function () {
    if (this.tasks.length > 0 && this.tasks.every(t => t.status === 'DONE')) {
        this.status = 'COMPLETED';
    }
};

// Ensure virtuals are included in JSON
planSchema.set('toJSON', { virtuals: true });
planSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Plan', planSchema);
