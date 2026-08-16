const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createServiceRequest, getNearbyRequests } = require('../controllers/requestController');

router.post('/', protect, createServiceRequest);
router.get('/nearby', protect, getNearbyRequests);

module.exports = router;
