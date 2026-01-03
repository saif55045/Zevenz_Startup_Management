const express = require('express');
const router = express.Router();
const {
    createActivity,
    getMyActivities,
    getAllActivities,
    getTodayActivity
} = require('../controllers/activityController');
const { protect, requireActive } = require('../middleware/auth');
const { validateActivity } = require('../middleware/validation');

// All routes require authentication
router.use(protect);

router.get('/today', getTodayActivity);
router.get('/all', getAllActivities);
router.get('/', getMyActivities);
router.post('/', requireActive, validateActivity, createActivity);

module.exports = router;
