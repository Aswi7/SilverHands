const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { updateMatchStatus, getProviderMatchRequests, getCustomerMatchRequests, getMatchDetails } = require('../controllers/matchController');

router.get('/my-requests', protect, getProviderMatchRequests);
router.get('/customer-requests', protect, getCustomerMatchRequests);
router.get('/:id', protect, getMatchDetails);
router.put('/:id/status', protect, updateMatchStatus);

module.exports = router;
