const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
    voter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    vote: {
        type: String,
        enum: ['YES', 'NO'],
        required: true
    }
}, { timestamps: true });

const reactivationRequestSchema = new mongoose.Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    },
    votes: [voteSchema],
    resolvedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Virtual for vote counts
reactivationRequestSchema.virtual('yesVotes').get(function () {
    return this.votes.filter(v => v.vote === 'YES').length;
});

reactivationRequestSchema.virtual('noVotes').get(function () {
    return this.votes.filter(v => v.vote === 'NO').length;
});

// Check if request should be resolved (majority vote)
reactivationRequestSchema.methods.checkResolution = async function (totalActiveFounders) {
    if (this.status !== 'PENDING') return false;

    const yesCount = this.votes.filter(v => v.vote === 'YES').length;
    const noCount = this.votes.filter(v => v.vote === 'NO').length;
    const majority = Math.ceil(totalActiveFounders / 2);

    if (yesCount >= majority) {
        this.status = 'APPROVED';
        this.resolvedAt = new Date();
        return 'APPROVED';
    } else if (noCount >= majority) {
        this.status = 'REJECTED';
        this.resolvedAt = new Date();
        return 'REJECTED';
    }
    return false;
};

reactivationRequestSchema.set('toJSON', { virtuals: true });
reactivationRequestSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ReactivationRequest', reactivationRequestSchema);
