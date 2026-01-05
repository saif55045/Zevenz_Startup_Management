/**
 * Resync Script - Recalculates consecutiveAbsences for all users
 * Run once to fix existing data discrepancies
 * Usage: node resyncAttendance.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Attendance = require('./src/models/Attendance');

const resyncConsecutiveAbsences = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const users = await User.find();
        console.log(`\nResyncing ${users.length} users...\n`);

        for (const user of users) {
            // Get attendance records sorted by date descending (most recent first)
            const attendanceRecords = await Attendance.find({ user: user._id })
                .sort({ date: -1 });

            // Count consecutive absences from most recent going backwards
            let consecutiveAbsences = 0;
            for (const record of attendanceRecords) {
                if (record.status === 'ABSENT') {
                    consecutiveAbsences++;
                } else {
                    // Break on first non-ABSENT (PRESENT or LEAVE)
                    break;
                }
            }

            // Update user if different
            const oldValue = user.consecutiveAbsences || 0;
            if (oldValue !== consecutiveAbsences) {
                user.consecutiveAbsences = consecutiveAbsences;
                await user.save();
                console.log(`[UPDATED] ${user.name}: ${oldValue} -> ${consecutiveAbsences}`);
            } else {
                console.log(`[OK] ${user.name}: ${consecutiveAbsences} (no change)`);
            }
        }

        console.log('\n✅ Resync complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

resyncConsecutiveAbsences();
