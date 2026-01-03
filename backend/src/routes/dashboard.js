const express = require('express');
const router = express.Router();
const { getStats, getFounderContributions } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/stats', getStats);
router.get('/contributions/:id', getFounderContributions);

module.exports = router;

