const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createReview, getProviderReviews, getMatchReview } = require('../controllers/reviewController');

router.post('/', protect, createReview);
router.get('/provider/:providerId', getProviderReviews);
router.get('/match/:matchId', protect, getMatchReview);

module.exports = router;
