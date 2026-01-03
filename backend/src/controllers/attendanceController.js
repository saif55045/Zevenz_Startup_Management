const Attendance = require('../models/Attendance');
const User = require('../models/User');

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
};

// @desc    Get my attendance records
// @route   GET /api/attendance/me
// @access  Private
const getMyAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.find({ user: req.user._id })
            .sort({ date: -1 })
            .limit(30);
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all founders' attendance for a date range
// @route   GET /api/attendance/team
// @access  Private
const getTeamAttendance = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateStr = startDate.toISOString().split('T')[0];

        const attendance = await Attendance.find({
            date: { $gte: startDateStr }
        })
            .populate('user', 'name email status')
            .sort({ date: -1 });

        // Get all users
        const users = await User.find().select('name email status');

        // Group by date
        const grouped = {};
        attendance.forEach(record => {
            if (!grouped[record.date]) {
                grouped[record.date] = {};
            }
            grouped[record.date][record.user._id.toString()] = record;
        });

        res.json({ attendance: grouped, users });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Submit absence reason
// @route   POST /api/attendance/reason
// @access  Private
const submitAbsenceReason = async (req, res) => {
    try {
        const { date, reason, reasonText } = req.body;

        const attendance = await Attendance.findOneAndUpdate(
            { user: req.user._id, date },
            { reason, reasonText },
            { new: true }
        );

        if (attendance) {
            // Clear pending absence reason flag
            req.user.pendingAbsenceReason = false;
            await req.user.save();
        }

        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Request leave
// @route   POST /api/attendance/leave
// @access  Private (ACTIVE only)
const requestLeave = async (req, res) => {
    try {
        const { date, reason, reasonText } = req.body;

        const attendance = await Attendance.findOneAndUpdate(
            { user: req.user._id, date },
            { user: req.user._id, date, status: 'LEAVE', reason, reasonText },
            { upsert: true, new: true }
        );

        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get attendance stats for dashboard
// @route   GET /api/attendance/stats
// @access  Private
const getAttendanceStats = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const startDateStr = thirtyDaysAgo.toISOString().split('T')[0];

        const myAttendance = await Attendance.find({
            user: req.user._id,
            date: { $gte: startDateStr }
        }).sort({ date: 1 });

        const presentDays = myAttendance.filter(a => a.status === 'PRESENT').length;
        const absentDays = myAttendance.filter(a => a.status === 'ABSENT').length;
        const leaveDays = myAttendance.filter(a => a.status === 'LEAVE').length;

        res.json({
            totalDays: myAttendance.length,
            presentDays,
            absentDays,
            leaveDays,
            records: myAttendance
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getMyAttendance,
    getTeamAttendance,
    submitAbsenceReason,
    requestLeave,
    getAttendanceStats
};
