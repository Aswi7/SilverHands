const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createServiceRequest, getNearbyRequests, getOpportunityMatches, getMyRequests } = require('../controllers/requestController');

router.post('/', protect, createServiceRequest);
router.get('/my', protect, getMyRequests);
router.get('/nearby', protect, getNearbyRequests);
router.get('/:id/matches', protect, getOpportunityMatches);

module.exports = router;
