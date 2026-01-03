const Activity = require('../models/Activity');
const User = require('../models/User');
const Plan = require('../models/Plan');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
const getStats = async (req, res) => {
    try {
        // Get last 30 days attendance for current user
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dateString = thirtyDaysAgo.toISOString().split('T')[0];

        const myActivities = await Activity.find({
            user: req.user._id,
            date: { $gte: dateString }
        }).sort({ date: 1 });

        // Build attendance data for last 30 days
        const attendanceData = [];
        const today = new Date().toISOString().split('T')[0];

        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dStr = d.toISOString().split('T')[0];

            // Only count days up to today (not future days)
            if (dStr > today) continue;

            const hasActivity = myActivities.some(a => a.date === dStr);
            attendanceData.push({
                date: dStr,
                day: d.toLocaleDateString('en-US', { weekday: 'short' }),
                present: hasActivity
            });
        }

        // Get team contribution data
        const allFounders = await User.find().select('name email status');
        const allPlans = await Plan.find();

        const contributionData = await Promise.all(
            allFounders.map(async (founder) => {
                const activityCount = await Activity.countDocuments({ user: founder._id });

                // Count tasks completed by this founder
                let tasksDone = 0;
                allPlans.forEach(plan => {
                    plan.tasks.forEach(task => {
                        if (task.completedBy && task.completedBy.toString() === founder._id.toString()) {
                            tasksDone++;
                        }
                    });
                });

                return {
                    _id: founder._id,
                    name: founder.name,
                    activities: activityCount,
                    tasksDone,
                    status: founder.status
                };
            })
        );

        // Count dead tasks (tasks not updated in 5+ days)
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        let deadTaskCount = 0;
        allPlans.forEach(plan => {
            plan.tasks.forEach(task => {
                if (task.status !== 'DONE' && task.lastUpdated <= fiveDaysAgo) {
                    deadTaskCount++;
                }
            });
        });

        res.json({
            attendance: attendanceData,
            contributions: contributionData,
            deadTasks: deadTaskCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get founder's contribution details
// @route   GET /api/dashboard/contributions/:id
// @access  Private
const getFounderContributions = async (req, res) => {
    try {
        const founder = await User.findById(req.params.id).select('name email status');
        if (!founder) {
            return res.status(404).json({ message: 'Founder not found' });
        }

        // Get recent activities
        const recentActivities = await Activity.find({ user: req.params.id })
            .sort({ date: -1 })
            .limit(10);

        // Get tasks completed by this founder
        const allPlans = await Plan.find();
        const completedTasks = [];

        allPlans.forEach(plan => {
            plan.tasks.forEach(task => {
                if (task.completedBy && task.completedBy.toString() === req.params.id) {
                    completedTasks.push({
                        taskTitle: task.title,
                        planTitle: plan.title,
                        completedAt: task.lastUpdated
                    });
                }
            });
        });

        res.json({
            founder: {
                _id: founder._id,
                name: founder.name,
                email: founder.email,
                status: founder.status
            },
            recentActivities,
            completedTasks
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getStats, getFounderContributions };

