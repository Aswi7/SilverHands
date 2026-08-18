const ServiceRequest = require('../models/ServiceRequest');
const { generateEmbedding } = require('../config/gemini');

// @desc    Create a new service request
// @route   POST /api/requests
// @access  Private (Customer only)
const createServiceRequest = async (req, res) => {
  try {
    const { title, description, category, location, rate, timing, mode, city } = req.body;

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
      city: city || req.user.city || 'Delhi',
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

    const NEARBY_CITIES_MAP = {
      'delhi': ['delhi', 'noida', 'gurugram'],
      'noida': ['noida', 'delhi', 'gurugram'],
      'gurugram': ['gurugram', 'delhi', 'noida'],
      'mumbai': ['mumbai', 'pune'],
      'pune': ['pune', 'mumbai'],
      'bengaluru': ['bengaluru'],
      'chennai': ['chennai'],
      'hyderabad': ['hyderabad'],
      'kolkata': ['kolkata']
    };

    const getNearbyCities = (city) => {
      const normalized = (city || '').trim().toLowerCase();
      return NEARBY_CITIES_MAP[normalized] || [normalized];
    };

    const userCity = req.user.city || 'delhi';
    const allowedCities = getNearbyCities(userCity);

    // Find pending requests that match the provider's nearby cities list
    const requests = await ServiceRequest.find({
      status: 'pending',
      city: { $in: allowedCities }
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

// @desc    Get service requests created by the logged-in customer
// @route   GET /api/requests/my
// @access  Private (Customer only)
const getMyRequests = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can view their requests' });
    }
    const requests = await ServiceRequest.find({ customer: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    console.error('Get my requests error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createServiceRequest,
  getNearbyRequests,
  getOpportunityMatches,
  getMyRequests
};
