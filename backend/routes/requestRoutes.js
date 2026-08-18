const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  createServiceRequest, 
  getNearbyRequests, 
  getOpportunityMatches, 
  getMyRequests,
  updateServiceRequest,
  deleteServiceRequest
} = require('../controllers/requestController');

router.post('/', protect, createServiceRequest);
router.get('/my', protect, getMyRequests);
router.get('/nearby', protect, getNearbyRequests);
router.get('/:id/matches', protect, getOpportunityMatches);
router.put('/:id', protect, updateServiceRequest);
router.delete('/:id', protect, deleteServiceRequest);

module.exports = router;
