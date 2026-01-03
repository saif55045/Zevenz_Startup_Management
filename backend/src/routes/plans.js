const express = require('express');
const router = express.Router();
const {
    createPlan,
    getAllPlans,
    getPlan,
    addTask,
    updateTask,
    deleteTask
} = require('../controllers/planController');
const { protect, requireActive } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.get('/', getAllPlans);
router.get('/:id', getPlan);
router.post('/', requireActive, createPlan);
router.post('/:id/tasks', requireActive, addTask);
router.patch('/:planId/tasks/:taskId', requireActive, updateTask);
router.delete('/:planId/tasks/:taskId', requireActive, deleteTask);

module.exports = router;
