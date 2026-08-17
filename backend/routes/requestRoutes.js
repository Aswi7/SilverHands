const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createServiceRequest, getNearbyRequests, getOpportunityMatches } = require('../controllers/requestController');

router.post('/', protect, createServiceRequest);
router.get('/nearby', protect, getNearbyRequests);
router.get('/:id/matches', protect, getOpportunityMatches);

module.exports = router;
