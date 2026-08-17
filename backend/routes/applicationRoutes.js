const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createApplication,
  updateStatus,
  confirmApplication,
  checkInApplication,
  completeApplication,
  getUserApplications,
  submitReview
} = require('../controllers/applicationController');

router.post('/', protect, createApplication);
router.get('/user/:userId', protect, getUserApplications);
router.patch('/:id/status', protect, updateStatus);
router.patch('/:id/confirm', protect, confirmApplication);
router.patch('/:id/check-in', protect, checkInApplication);
router.patch('/:id/complete', protect, completeApplication);
router.post('/:id/review', protect, submitReview);

module.exports = router;
