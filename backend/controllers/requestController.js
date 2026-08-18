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
      customerId: req.user._id,
      customer: req.user._id,
      title,
      description,
      category,
      city: city || req.user.city || 'delhi',
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
    const populatedMatches = await Match.find({
      $or: [{ requestId: request._id }, { opportunity: request._id }]
    })
      .populate('providerId', 'name phone location skills bio availability age category preferredLanguage city')
      .sort({ score: -1 })
      .lean();

    console.log(`[MATCHMAKING LOG] Summary for Request ID ${request._id}:`);
    console.log(`  - Customer ID: ${req.user._id}`);
    console.log(`  - Request ID: ${request._id}`);
    console.log(`  - Matches Created: ${populatedMatches.length}`);
    populatedMatches.forEach(m => {
      console.log(`  - Match ID: ${m._id} | Customer ID: ${req.user._id} | Provider ID: ${m.providerId?._id || m.provider} | Score: ${m.score}`);
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

    // Find pending requests: either online mode OR in provider's nearby cities list
    const requests = await ServiceRequest.find({
      status: 'pending',
      $or: [
        { mode: 'online' },
        { city: { $in: allowedCities.map(c => new RegExp(`^${c.trim()}$`, 'i')) } }
      ]
    }).populate('customerId', 'name phone city').lean();

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
    let matches = [];
    if (requestIds.length > 0) {
      matches = await Match.find({
        $and: [
          { $or: [{ providerId: req.user._id }, { provider: req.user._id }] },
          { $or: [{ requestId: { $in: requestIds } }, { opportunity: { $in: requestIds } }] }
        ]
      }).lean();
    }

    const matchMap = {};
    matches.forEach(m => {
      const key = (m.requestId || m.opportunity)?.toString();
      if (key) matchMap[key] = m;
    });

    const enrichedRequests = requests.map(reqObj => {
      const matchDoc = matchMap[reqObj._id.toString()];
      return {
        ...reqObj,
        matchId: matchDoc ? matchDoc._id : null,
        matchStatus: matchDoc ? (matchDoc.status || 'PENDING') : 'PENDING',
        score: matchDoc ? matchDoc.score : 50,
        scoreBreakdown: matchDoc ? matchDoc.scoreBreakdown : null
      };
    });

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
    const matches = await Match.find({
      $or: [{ requestId: opportunityId }, { opportunity: opportunityId }]
    })
      .populate('providerId', 'name phone location skills bio availability age category preferredLanguage city')
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
    const requests = await ServiceRequest.find({
      $or: [{ customerId: req.user._id }, { customer: req.user._id }]
    }).sort({ createdAt: -1 }).lean();

    const enrichedRequests = await Promise.all(requests.map(async (request) => {
      const matchCount = await Match.countDocuments({
        $or: [{ requestId: request._id }, { opportunity: request._id }]
      });
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

// @desc    Update a service request
// @route   PUT /api/requests/:id
// @access  Private (Customer only, owner)
const updateServiceRequest = async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    const ownerId = request.customerId?.toString() || request.customer?.toString();
    if (req.user.role !== 'customer' || req.user._id.toString() !== ownerId) {
      return res.status(403).json({ message: 'Unauthorized: Only the creator can edit this request' });
    }

    const { title, description, category, rate, timing, mode, city } = req.body;

    if (title !== undefined) request.title = title;
    if (description !== undefined) request.description = description;
    if (category !== undefined) request.category = category;
    if (rate !== undefined) request.rate = rate;
    if (timing !== undefined) request.timing = timing;
    if (mode !== undefined) request.mode = mode;
    if (city !== undefined) request.city = city;

    // Regenerate embedding if title/description/category changed
    const textToEmbed = `Category: ${request.category}. Description: ${request.description}`;
    const newEmbedding = await generateEmbedding(textToEmbed);
    if (newEmbedding && Array.isArray(newEmbedding) && newEmbedding.length === 768) {
      request.embedding = newEmbedding;
    }

    const updatedRequest = await request.save();

    // Re-trigger matchmaking engine to update matches
    try {
      await findMatches(updatedRequest._id);
    } catch (mErr) {
      console.error('Re-match error on update:', mErr.message);
    }

    res.status(200).json(updatedRequest);
  } catch (error) {
    console.error('Update request error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a service request
// @route   DELETE /api/requests/:id
// @access  Private (Customer only, owner)
const deleteServiceRequest = async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    const ownerId = request.customerId?.toString() || request.customer?.toString();
    if (req.user.role !== 'customer' || req.user._id.toString() !== ownerId) {
      return res.status(403).json({ message: 'Unauthorized: Only the creator can delete this request' });
    }

    await ServiceRequest.deleteOne({ _id: request._id });

    // Clean up associated matches
    await Match.deleteMany({
      $or: [{ requestId: request._id }, { opportunity: request._id }]
    });

    res.status(200).json({ message: 'Service request and associated matches deleted successfully', requestId: request._id });
  } catch (error) {
    console.error('Delete request error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createServiceRequest,
  getNearbyRequests,
  getOpportunityMatches,
  getMyRequests,
  updateServiceRequest,
  deleteServiceRequest
};
