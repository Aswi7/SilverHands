const ServiceRequest = require('../models/ServiceRequest');
const { generateEmbedding } = require('../config/gemini');
const { findMatches } = require('../services/matchingEngine');
const Match = require('../models/Match');

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

    console.log(`[MATCHMAKING LOG] New Request Created by Customer ID: ${req.user._id}`);
    console.log(`[MATCHMAKING LOG] Request details -> Title: "${title}", Category: "${category}"`);
    console.log(`[MATCHMAKING LOG] Embedding generated: ${embedding ? embedding.length : 0} dimensions`);

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

    console.log(`[MATCHMAKING LOG] Saved ServiceRequest to MongoDB -> Request ID: ${request._id}`);

    // Immediately trigger matchmaking engine from the backend
    await findMatches(request._id);

    // Fetch created match documents from MongoDB
    const populatedMatches = await Match.find({ opportunity: request._id })
      .populate('provider', 'name phone location skills bio availability age category preferredLanguage')
      .sort({ score: -1 })
      .lean();

    console.log(`[MATCHMAKING LOG] Summary for Request ID ${request._id}:`);
    console.log(`  - Customer ID: ${req.user._id}`);
    console.log(`  - Request ID: ${request._id}`);
    console.log(`  - Matches Created: ${populatedMatches.length}`);
    populatedMatches.forEach(m => {
      console.log(`  - Match ID: ${m._id} | Customer ID: ${req.user._id} | Provider ID: ${m.provider?._id || m.provider} | Score: ${m.score}`);
    });

    res.status(201).json({
      ...request.toObject(),
      applicantsCount: populatedMatches.length,
      matches: populatedMatches
    });
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

    // Compute matches for all retrieved opportunities to ensure they exist in DB
    for (const reqObj of requests) {
      try {
        await findMatches(reqObj._id);
      } catch (matchErr) {
        console.error(`Failed to compute matches for request ${reqObj._id}:`, matchErr.message);
      }
    }

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
        matchId: matchDoc ? matchDoc._id : null,
        matchStatus: matchDoc ? (matchDoc.status || 'PENDING') : 'PENDING',
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



// @desc    Get matches for a specific opportunity
// @route   GET /api/requests/:id/matches
// @access  Private
const getOpportunityMatches = async (req, res) => {
  try {
    const opportunityId = req.params.id;
    
    // Fetch persisted matches directly from MongoDB Match collection
    const matches = await Match.find({ opportunity: opportunityId })
      .populate('provider', 'name phone location skills bio availability age category preferredLanguage')
      .sort({ score: -1 })
      .lean();

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
    const requests = await ServiceRequest.find({ customer: req.user._id }).sort({ createdAt: -1 }).lean();

    const enrichedRequests = await Promise.all(requests.map(async (request) => {
      const matchCount = await Match.countDocuments({ opportunity: request._id });
      return {
        ...request,
        applicantsCount: matchCount
      };
    }));

    res.status(200).json(enrichedRequests);
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
