const express = require('express');
const router = express.Router();
const {
    getProfile,
    updateProfile,
    changePassword,
    uploadAvatar,
    deleteAccount
} = require('../controllers/profileController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
    .get(getProfile)
    .put(updateProfile)
    .delete(deleteAccount);

router.put('/password', changePassword);
router.put('/avatar', uploadAvatar);

module.exports = router;
