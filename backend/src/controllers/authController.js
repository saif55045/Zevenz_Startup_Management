const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const crypto = require('crypto');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

// Generate random reset code (8 characters, uppercase alphanumeric)
const generateResetCode = () => {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        const user = await User.findOne({ email });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = generateToken(user._id);

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            status: user.status,
            consistencyScore: user.consistencyScore,
            pendingAbsenceReason: user.pendingAbsenceReason,
            token
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Request password reset (generates a code)
// @route   POST /api/auth/request-reset
// @access  Public
const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Please provide your email' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'No account found with this email' });
        }

        // Delete any existing reset codes for this user
        await PasswordReset.deleteMany({ user: user._id });

        // Generate new reset code
        const code = generateResetCode();

        // Save reset request
        await PasswordReset.create({
            user: user._id,
            code,
            email: user.email,
            userName: user.name
        });

        res.json({
            message: 'Reset code generated successfully',
            code,
            userName: user.name,
            instructions: 'Share this code with any logged-in founder to reset your password. Code expires in 24 hours.'
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Reset password using code (by another founder)
// @route   POST /api/auth/reset-password
// @access  Private (requires logged-in founder)
const resetPassword = async (req, res) => {
    try {
        const { code, newPassword } = req.body;

        if (!code || !newPassword) {
            return res.status(400).json({ message: 'Please provide reset code and new password' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Find the reset request
        const resetRequest = await PasswordReset.findOne({
            code: code.toUpperCase(),
            used: false,
            expiresAt: { $gt: new Date() }
        });

        if (!resetRequest) {
            return res.status(400).json({ message: 'Invalid or expired reset code' });
        }

        // Find the user to reset password for
        const userToReset = await User.findById(resetRequest.user);

        if (!userToReset) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update password
        userToReset.password = newPassword;
        await userToReset.save();

        // Mark reset code as used
        resetRequest.used = true;
        await resetRequest.save();

        res.json({
            message: `Password has been reset successfully for ${userToReset.name}`,
            userName: userToReset.name,
            email: userToReset.email
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get pending reset requests (for logged-in founders to see)
// @route   GET /api/auth/pending-resets
// @access  Private
const getPendingResets = async (req, res) => {
    try {
        const pendingResets = await PasswordReset.find({
            used: false,
            expiresAt: { $gt: new Date() }
        }).select('userName email createdAt expiresAt');

        res.json(pendingResets);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { login, getMe, requestPasswordReset, resetPassword, getPendingResets };
