const ServiceListing = require('../models/ServiceListing');

// @desc    Create a new service listing
// @route   POST /api/listings
// @access  Private
const createListing = async (req, res) => {
  try {
    const { title, category, description, rateType, rateAmount, packageDuration } = req.body;

    // Validate required fields
    if (!title || !category || !description || !rateAmount) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const listing = await ServiceListing.create({
      provider: req.user._id,
      title,
      category,
      description,
      rateType: rateType || 'daily',
      rateAmount,
      packageDuration
    });

    res.status(201).json(listing);
  } catch (error) {
    console.error('Create listing error:', error.message);
    res.status(500).json({ message: 'Server error creating listing' });
  }
};

// @desc    Get all listings for a specific provider
// @route   GET /api/listings/provider/:id
// @access  Public (or Private depending on needs, we will use Public for viewing profiles)
const getProviderListings = async (req, res) => {
  try {
    const { id } = req.params;
    
    const listings = await ServiceListing.find({ provider: id, isActive: true })
      .sort({ createdAt: -1 });
      
    res.status(200).json(listings);
  } catch (error) {
    console.error('Fetch listings error:', error.message);
    res.status(500).json({ message: 'Server error fetching listings' });
  }
};

module.exports = {
  createListing,
  getProviderListings
};
