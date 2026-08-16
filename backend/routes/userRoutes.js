const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { updateUserProfile, updateUserLocation } = require('../controllers/userController');

router.put('/profile', protect, updateUserProfile);
router.put('/location', protect, updateUserLocation);

module.exports = router;
