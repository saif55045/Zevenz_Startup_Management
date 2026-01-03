const Activity = require('../models/Activity');
const Attendance = require('../models/Attendance');

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
};

// @desc    Create or update today's activity
// @route   POST /api/activities
// @access  Private (ACTIVE only)
const createActivity = async (req, res) => {
    try {
        const { content } = req.body;
        const today = getTodayDate();

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ message: 'Activity content is required' });
        }

        // Check if user already has activity for today
        let activity = await Activity.findOne({ user: req.user._id, date: today });

        if (activity) {
            // Update existing activity
            activity.content = content;
            await activity.save();
        } else {
            // Create new activity
            activity = await Activity.create({
                user: req.user._id,
                content,
                date: today
            });
        }

        // Mark attendance as PRESENT for today
        await Attendance.findOneAndUpdate(
            { user: req.user._id, date: today },
            { user: req.user._id, date: today, status: 'PRESENT' },
            { upsert: true, new: true }
        );

        // Reset consecutive absences
        req.user.consecutiveAbsences = 0;
        await req.user.save();

        res.status(201).json(activity);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all activities for current user
// @route   GET /api/activities
// @access  Private
const getMyActivities = async (req, res) => {
    try {
        const activities = await Activity.find({ user: req.user._id })
            .sort({ date: -1 })
            .limit(30);
        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all activities (for all founders)
// @route   GET /api/activities/all
// @access  Private
const getAllActivities = async (req, res) => {
    try {
        const { date } = req.query; // Optional date filter (YYYY-MM-DD)

        const query = {};
        if (date) {
            query.date = date;
        }

        const activities = await Activity.find(query)
            .populate('user', 'name email avatar')
            .sort({ date: -1, createdAt: -1 })
            .limit(date ? 100 : 50); // Show more results when filtering by date
        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get today's activity for current user
// @route   GET /api/activities/today
// @access  Private
const getTodayActivity = async (req, res) => {
    try {
        const today = getTodayDate();
        const activity = await Activity.findOne({ user: req.user._id, date: today });
        res.json(activity || null);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { createActivity, getMyActivities, getAllActivities, getTodayActivity };
