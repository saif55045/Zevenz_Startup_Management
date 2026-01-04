const cron = require('node-cron');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Attendance = require('../models/Attendance');

// Get yesterday's date in YYYY-MM-DD format
const getYesterdayDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
};

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
};

// Process daily attendance for all users
const processAttendance = async (dateToProcess) => {
    console.log(`[Attendance Cron] Processing attendance for ${dateToProcess}`);

    try {
        // Get all ACTIVE users
        const users = await User.find({ status: 'ACTIVE' });

        for (const user of users) {
            // Check if user posted activity on this date
            const activity = await Activity.findOne({
                user: user._id,
                date: dateToProcess
            });

            // Check if attendance record already exists
            let attendance = await Attendance.findOne({
                user: user._id,
                date: dateToProcess
            });

            if (activity) {
                // User posted activity - mark PRESENT
                if (!attendance) {
                    attendance = await Attendance.create({
                        user: user._id,
                        date: dateToProcess,
                        status: 'PRESENT'
                    });
                } else if (attendance.status !== 'PRESENT') {
                    attendance.status = 'PRESENT';
                    await attendance.save();
                }

                // Reset consecutive absences
                if (user.consecutiveAbsences > 0) {
                    user.consecutiveAbsences = 0;
                    await user.save();
                }

                console.log(`[Attendance Cron] ${user.name}: PRESENT`);
            } else {
                // No activity - mark ABSENT
                if (!attendance) {
                    attendance = await Attendance.create({
                        user: user._id,
                        date: dateToProcess,
                        status: 'ABSENT'
                    });
                }

                // Increment consecutive absences
                user.consecutiveAbsences += 1;
                user.pendingAbsenceReason = true;

                console.log(`[Attendance Cron] ${user.name}: ABSENT (${user.consecutiveAbsences} consecutive)`);

                // Check if user should be marked OUT (3 consecutive absences)
                if (user.consecutiveAbsences >= 3) {
                    user.status = 'OUT';
                    console.log(`[Attendance Cron] ${user.name}: Marked as OUT due to 3 consecutive absences`);
                }

                await user.save();
            }
        }

        // Recalculate consistency scores for all users
        await recalculateConsistencyScores();

        console.log(`[Attendance Cron] Completed processing for ${dateToProcess}`);
    } catch (error) {
        console.error('[Attendance Cron] Error:', error);
    }
};

// Recalculate consistency score for all users
const recalculateConsistencyScores = async () => {
    const users = await User.find();

    for (const user of users) {
        const totalAttendance = await Attendance.countDocuments({ user: user._id });
        const presentDays = await Attendance.countDocuments({
            user: user._id,
            status: 'PRESENT'
        });

        if (totalAttendance > 0) {
            user.consistencyScore = Math.round((presentDays / totalAttendance) * 100);
            await user.save();
        }
    }
};

// Initialize cron job - runs at 11:59 PM every day
const initAttendanceCron = () => {
    // Run at 11:59 PM every day to process today's attendance
    cron.schedule('59 23 * * *', async () => {
        console.log('[Attendance Cron] Starting daily attendance check...');
        await processAttendance(getTodayDate());
    });

    console.log('[Attendance Cron] Scheduled to run at 11:59 PM daily');
};

module.exports = {
    initAttendanceCron,
    processAttendance // Export for manual API calls
};
