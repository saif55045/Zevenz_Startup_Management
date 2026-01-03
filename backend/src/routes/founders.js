const express = require('express');
const router = express.Router();
const { getFounders, getFounderProfile, generateCredentials } = require('../controllers/foundersController');
const { protect, requireActive } = require('../middleware/auth');
const { validateCredentials } = require('../middleware/validation');

// All routes require authentication
router.use(protect);

router.get('/', getFounders);
router.get('/:id', getFounderProfile);
router.post('/generate', requireActive, validateCredentials, generateCredentials);

module.exports = router;
