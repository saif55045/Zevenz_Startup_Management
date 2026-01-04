const express = require('express');
const router = express.Router();
const {
    getMyAttendance,
    getTeamAttendance,
    submitAbsenceReason,
    requestLeave,
    getAttendanceStats,
    runManualAttendance
} = require('../controllers/attendanceController');
const { protect, requireActive } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.get('/me', getMyAttendance);
router.get('/team', getTeamAttendance);
router.get('/stats', getAttendanceStats);
router.post('/reason', submitAbsenceReason);
router.post('/leave', requireActive, requestLeave);
router.post('/run-manual', requireActive, runManualAttendance);

module.exports = router;

