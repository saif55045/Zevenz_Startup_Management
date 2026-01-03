const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.get('/messages', getMessages);
router.post('/messages', sendMessage);

module.exports = router;
