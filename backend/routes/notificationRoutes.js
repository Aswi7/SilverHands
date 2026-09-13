const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getUserNotifications,
  markAllRead,
  markSingleRead,
  deleteNotification
} = require('../controllers/notificationController');

router.get('/', protect, getUserNotifications);
router.patch('/read-all', protect, markAllRead);
router.patch('/:id/read', protect, markSingleRead);
router.delete('/:id', protect, deleteNotification);

module.exports = router;
