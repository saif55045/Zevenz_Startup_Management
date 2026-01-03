const express = require('express');
const router = express.Router();
const {
    getRequests,
    getMyRequest,
    createRequest,
    vote
} = require('../controllers/reactivationController');
const { protect, requireActive } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.get('/', getRequests);
router.get('/me', getMyRequest);
router.post('/', createRequest);
router.post('/:id/vote', requireActive, vote);

module.exports = router;
