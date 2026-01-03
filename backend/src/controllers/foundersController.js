const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get all founders
// @route   GET /api/founders
// @access  Private
const getFounders = async (req, res) => {
    try {
        const founders = await User.find()
            .select('name email status consistencyScore consecutiveAbsences createdAt')
            .sort({ status: 1, name: 1 });
        res.json(founders);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get founder profile with stats
// @route   GET /api/founders/:id
// @access  Private
const getFounderProfile = async (req, res) => {
    try {
        const founder = await User.findById(req.params.id)
            .select('-password');

        if (!founder) {
            return res.status(404).json({ message: 'Founder not found' });
        }

        res.json(founder);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Generate credentials for new founder
// @route   POST /api/founders/generate
// @access  Private (ACTIVE only)
const generateCredentials = async (req, res) => {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required' });
        }

        // Check if email already exists
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        // Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();

        // Create founder
        const founder = await User.create({
            name,
            email: email.toLowerCase(),
            password: tempPassword,
            status: 'ACTIVE'
        });

        res.status(201).json({
            message: 'Credentials generated successfully',
            credentials: {
                email: founder.email,
                password: tempPassword
            },
            founder: {
                _id: founder._id,
                name: founder.name,
                email: founder.email,
                status: founder.status
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getFounders, getFounderProfile, generateCredentials };

