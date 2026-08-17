const express = require('express');
const router = express.Router();
const { createListing, getProviderListings } = require('../controllers/listingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createListing);
router.get('/provider/:id', getProviderListings);

module.exports = router;
