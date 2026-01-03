const ReactivationRequest = require('../models/ReactivationRequest');
const User = require('../models/User');

// @desc    Get all pending reactivation requests
// @route   GET /api/reactivation
// @access  Private
const getRequests = async (req, res) => {
    try {
        const requests = await ReactivationRequest.find({ status: 'PENDING' })
            .populate('requester', 'name email')
            .populate('votes.voter', 'name')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get my reactivation request status
// @route   GET /api/reactivation/me
// @access  Private
const getMyRequest = async (req, res) => {
    try {
        const request = await ReactivationRequest.findOne({
            requester: req.user._id,
            status: 'PENDING'
        })
            .populate('votes.voter', 'name');
        res.json(request);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create reactivation request
// @route   POST /api/reactivation
// @access  Private (OUT founders only)
const createRequest = async (req, res) => {
    try {
        // Check if user is OUT
        if (req.user.status !== 'OUT') {
            return res.status(400).json({ message: 'Only OUT founders can request reactivation' });
        }

        // Check for existing pending request
        const existing = await ReactivationRequest.findOne({
            requester: req.user._id,
            status: 'PENDING'
        });

        if (existing) {
            return res.status(400).json({ message: 'You already have a pending request' });
        }

        const request = await ReactivationRequest.create({
            requester: req.user._id
        });

        await request.populate('requester', 'name email');
        res.status(201).json(request);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Vote on a reactivation request
// @route   POST /api/reactivation/:id/vote
// @access  Private (ACTIVE founders only)
const vote = async (req, res) => {
    try {
        const { vote } = req.body;

        if (!['YES', 'NO'].includes(vote)) {
            return res.status(400).json({ message: 'Vote must be YES or NO' });
        }

        const request = await ReactivationRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.status !== 'PENDING') {
            return res.status(400).json({ message: 'This request has already been resolved' });
        }

        // Check if already voted
        const existingVote = request.votes.find(
            v => v.voter.toString() === req.user._id.toString()
        );

        if (existingVote) {
            existingVote.vote = vote;
        } else {
            request.votes.push({ voter: req.user._id, vote });
        }

        // Get total active founders (excluding the requester)
        const activeFounders = await User.countDocuments({
            status: 'ACTIVE',
            _id: { $ne: request.requester }
        });

        // Check if resolution is reached
        const resolution = await request.checkResolution(activeFounders);

        if (resolution === 'APPROVED') {
            // Reactivate the founder
            await User.findByIdAndUpdate(request.requester, {
                status: 'ACTIVE',
                consecutiveAbsences: 0
            });
        }

        await request.save();
        await request.populate('requester', 'name email');
        await request.populate('votes.voter', 'name');

        res.json({ request, resolution });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getRequests, getMyRequest, createRequest, vote };
