const Plan = require('../models/Plan');

// @desc    Create a new plan
// @route   POST /api/plans
// @access  Private (ACTIVE only)
const createPlan = async (req, res) => {
    try {
        const { title, description, tasks } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Plan title is required' });
        }

        const plan = await Plan.create({
            title,
            description: description || '',
            createdBy: req.user._id,
            tasks: tasks || []
        });

        await plan.populate('createdBy', 'name email');
        res.status(201).json(plan);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all plans
// @route   GET /api/plans
// @access  Private
const getAllPlans = async (req, res) => {
    try {
        const plans = await Plan.find()
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });
        res.json(plans);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get single plan
// @route   GET /api/plans/:id
// @access  Private
const getPlan = async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        res.json(plan);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Add task to plan
// @route   POST /api/plans/:id/tasks
// @access  Private (ACTIVE only)
const addTask = async (req, res) => {
    try {
        const { title } = req.body;
        const plan = await Plan.findById(req.params.id);

        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        plan.tasks.push({ title });
        await plan.save();
        await plan.populate('createdBy', 'name email');

        res.json(plan);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update task status
// @route   PATCH /api/plans/:planId/tasks/:taskId
// @access  Private (ACTIVE only)
const updateTask = async (req, res) => {
    try {
        const { planId, taskId } = req.params;
        const { status, blockedReason } = req.body;

        const plan = await Plan.findById(planId);
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        const task = plan.tasks.id(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (status) {
            task.status = status;
            task.lastUpdated = new Date();

            // Track who completed the task
            if (status === 'DONE') {
                task.completedBy = req.user._id;
            } else {
                task.completedBy = null;
            }
        }

        if (status === 'BLOCKED' && blockedReason) {
            task.blockedReason = blockedReason;
        } else if (status !== 'BLOCKED') {
            task.blockedReason = null;
        }

        // Check for auto-complete
        plan.checkAutoComplete();

        await plan.save();
        await plan.populate('createdBy', 'name email');

        res.json(plan);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete task from plan
// @route   DELETE /api/plans/:planId/tasks/:taskId
// @access  Private (ACTIVE only)
const deleteTask = async (req, res) => {
    try {
        const { planId, taskId } = req.params;

        const plan = await Plan.findById(planId);
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        plan.tasks.pull(taskId);
        plan.checkAutoComplete();
        await plan.save();
        await plan.populate('createdBy', 'name email');

        res.json(plan);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { createPlan, getAllPlans, getPlan, addTask, updateTask, deleteTask };
