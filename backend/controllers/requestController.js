const ServiceRequest = require('../models/ServiceRequest');

// @desc    Create a new service request
// @route   POST /api/requests
// @access  Private (Customer only)
const createServiceRequest = async (req, res) => {
  try {
    const { title, description, category, location, rate, mode } = req.body;

    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can create service requests' });
    }

    if (!title || !description || !category || !location || location.longitude === undefined || location.latitude === undefined) {
      return res.status(400).json({ message: 'Please provide all required fields including location coordinates' });
    }

    const request = await ServiceRequest.create({
      customer: req.user._id,
      title,
      description,
      category,
      rate,
      mode,
      location: {
        type: 'Point',
        coordinates: [parseFloat(location.longitude), parseFloat(location.latitude)]
      }
    });

    res.status(201).json(request);
  } catch (error) {
    console.error('Create request error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get nearby pending service requests
// @route   GET /api/requests/nearby
// @access  Private (Provider only)
const getNearbyRequests = async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can view nearby requests' });
    }

    // Default coordinates: fall back to provider's saved location coordinates
    let longitude = req.query.longitude || (req.user.location && req.user.location.coordinates[0]);
    let latitude = req.query.latitude || (req.user.location && req.user.location.coordinates[1]);
    
    // Default search radius: 5000 meters (5km)
    let maxDistance = req.query.maxDistance || 5000;

    if (longitude === undefined || latitude === undefined) {
      return res.status(400).json({ message: 'Provider coordinates are not available. Please specify longitude/latitude query parameters or update your profile location.' });
    }

    // Find pending requests sorted by distance from the coordinate point using $near
    const requests = await ServiceRequest.find({
      status: 'pending',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    }).populate('customer', 'name phone');

    res.status(200).json(requests);
  } catch (error) {
    console.error('Fetch nearby requests error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createServiceRequest,
  getNearbyRequests
};
