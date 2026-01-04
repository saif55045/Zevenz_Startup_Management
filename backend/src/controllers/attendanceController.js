const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { processAttendance } = require('../jobs/attendanceCron');

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

// @desc    Run attendance processing for a specific date (manual trigger)
// @route   POST /api/attendance/run-manual
// @access  Private (ACTIVE only)
const runManualAttendance = async (req, res) => {
    try {
        const { date } = req.body;

        if (!date) {
            return res.status(400).json({ message: 'Date is required (YYYY-MM-DD format)' });
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
        }

        // Don't allow today or future dates - only allow yesterday or earlier
        const today = getTodayDate();
        if (date >= today) {
            return res.status(400).json({ message: 'Cannot run attendance for today. Only past dates allowed.' });
        }

        // Don't allow dates older than 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
        if (date < sevenDaysAgoStr) {
            return res.status(400).json({ message: 'Cannot run attendance for dates older than 7 days' });
        }

        console.log(`[Manual Attendance] Triggered by ${req.user.name} for date: ${date}`);

        await processAttendance(date);

        res.json({ message: `Attendance processed successfully for ${date}` });
    } catch (error) {
        console.error('[Manual Attendance] Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getMyAttendance,
    getTeamAttendance,
    submitAbsenceReason,
    requestLeave,
    getAttendanceStats,
    runManualAttendance
};
