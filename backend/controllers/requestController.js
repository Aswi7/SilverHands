const ServiceRequest = require('../models/ServiceRequest');
const { generateEmbedding } = require('../config/gemini');

// @desc    Create a new service request
// @route   POST /api/requests
// @access  Private (Customer only)
const createServiceRequest = async (req, res) => {
  try {
    const { title, description, category, location, rate, timing, mode } = req.body;

    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can create service requests' });
    }

    if (!title || !description || !category || !location || location.longitude === undefined || location.latitude === undefined) {
      return res.status(400).json({ message: 'Please provide all required fields including location coordinates' });
    }

    const textToEmbed = `Category: ${category}. Description: ${description}`;
    const embedding = await generateEmbedding(textToEmbed);

    const request = await ServiceRequest.create({
      customer: req.user._id,
      title,
      description,
      category,
      rate,
      timing,
      mode,
      location: {
        type: 'Point',
        coordinates: [parseFloat(location.longitude), parseFloat(location.latitude)]
      },
      embedding
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
    }).populate('customer', 'name phone').lean(); // Use .lean() to add fields easily

    // Fetch matches for this provider against these opportunities
    const requestIds = requests.map(r => r._id);
    const matches = await Match.find({
      provider: req.user._id,
      opportunity: { $in: requestIds }
    }).lean();

    const matchMap = {};
    matches.forEach(m => {
      matchMap[m.opportunity.toString()] = m;
    });

    const enrichedRequests = requests.map(req => {
      const matchDoc = matchMap[req._id.toString()];
      return {
        ...req,
        score: matchDoc ? matchDoc.score : 50, // default if no match computed
        scoreBreakdown: matchDoc ? matchDoc.scoreBreakdown : null
      };
    });

    // Sort by match score instead of just distance? The instruction says GET /api/requests/nearby returns nearby, but let's sort by score if we want best matches first.
    enrichedRequests.sort((a, b) => b.score - a.score);

    res.status(200).json(enrichedRequests);
  } catch (error) {
    console.error('Fetch nearby requests error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

const { findMatches } = require('../services/matchingEngine');
const Match = require('../models/Match');

// @desc    Get matches for a specific opportunity
// @route   GET /api/requests/:id/matches
// @access  Private
const getOpportunityMatches = async (req, res) => {
  try {
    const opportunityId = req.params.id;
    // We can call findMatches to refresh or just rely on it being called on creation/update.
    // For this implementation, we recompute matches on the fly to ensure freshness, 
    // or we could just fetch existing matches. Let's compute then fetch to be safe.
    await findMatches(opportunityId);

    const matches = await Match.find({ opportunity: opportunityId })
      .populate('provider', 'name phone location skills bio availability')
      .sort({ score: -1 })
      .limit(20);

    res.status(200).json(matches);
  } catch (error) {
    console.error('Fetch matches error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createServiceRequest,
  getNearbyRequests,
  getOpportunityMatches
};
