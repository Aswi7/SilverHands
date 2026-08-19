const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getForecasts,
  getUpcomingForecasts,
  getRelevantForecasts
} = require('../controllers/forecastController');

router.get('/', protect, getForecasts);
router.get('/upcoming', protect, getUpcomingForecasts);
router.get('/relevant', protect, getRelevantForecasts);

module.exports = router;
