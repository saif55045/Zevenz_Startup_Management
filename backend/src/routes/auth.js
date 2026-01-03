const express = require('express');
const router = express.Router();
const {
    login,
    getMe,
    requestPasswordReset,
    resetPassword,
    getPendingResets
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
    validateLogin,
    validateResetRequest,
    validatePasswordReset
} = require('../middleware/validation');

// Public routes with validation
router.post('/login', validateLogin, login);
router.post('/request-reset', validateResetRequest, requestPasswordReset);

// Protected routes
router.get('/me', protect, getMe);
router.post('/reset-password', protect, validatePasswordReset, resetPassword);
router.get('/pending-resets', protect, getPendingResets);

module.exports = router;
