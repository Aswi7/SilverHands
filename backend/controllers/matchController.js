const Match = require('../models/Match');
const Conversation = require('../models/Conversation');
const ServiceRequest = require('../models/ServiceRequest');

// Valid state transitions dictionary for the 4 main user-facing stages
const VALID_TRANSITIONS = {
  APPLIED: ['ACCEPTED', 'REJECTED'],
  PENDING: ['ACCEPTED', 'REJECTED'], // Backward compatibility alias for APPLIED
  ACCEPTED: ['CONFIRMED', 'CANCELLED', 'CONTACTED'],
  CONTACTED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  REJECTED: [],
  COMPLETED: [],
  CANCELLED: []
};

// @desc    Update match request status (APPLIED -> ACCEPTED -> CONFIRMED -> COMPLETED)
// @route   PUT /api/matches/:id/status
// @access  Private
const updateMatchStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const matchId = req.params.id;

    if (!status) {
      return res.status(400).json({ message: 'Status field is required' });
    }

    const match = await Match.findById(matchId)
      .populate('requestId')
      .populate('providerId')
      .populate('customerId');

    if (!match) {
      return res.status(404).json({ message: 'Match request not found' });
    }

    const currentStatus = match.status || 'APPLIED';

    // Idempotent check: if already in the requested target status, return success
    if (currentStatus === status) {
      return res.status(200).json(match);
    }

    // Explicit Stage Skipping Checks as mandated by SilverHands requirements:
    // APPLIED -> CONFIRMED (FORBIDDEN)
    // APPLIED -> COMPLETED (FORBIDDEN)
    // ACCEPTED -> COMPLETED (FORBIDDEN)
    if (['APPLIED', 'PENDING'].includes(currentStatus) && ['CONFIRMED', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ 
        message: `Stage skipping forbidden: Cannot transition from '${currentStatus}' directly to '${status}'. Application must be accepted first.` 
      });
    }

    if (currentStatus === 'ACCEPTED' && status === 'COMPLETED') {
      return res.status(400).json({ 
        message: `Stage skipping forbidden: Cannot transition from 'ACCEPTED' directly to 'COMPLETED'. Service must be confirmed first.` 
      });
    }

    // State machine transition validation
    const allowedNext = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        message: `Invalid state transition from '${currentStatus}' to '${status}'. Allowed transitions: ${allowedNext.join(', ') || 'None (Terminal state)'}`
      });
    }

    // Role-based permission & ownership check
    const userIdStr = req.user._id.toString();
    const providerIdStr = (match.providerId || match.provider)?._id?.toString() || (match.providerId || match.provider)?.toString();
    const customerIdStr = (match.customerId || match.customer)?._id?.toString() || (match.customerId || match.customer)?.toString();

    if (['ACCEPTED', 'REJECTED'].includes(status) && ['APPLIED', 'PENDING'].includes(currentStatus)) {
      if (req.user.role !== 'provider' || userIdStr !== providerIdStr) {
        return res.status(403).json({ message: 'Unauthorized: Only the assigned Provider can Accept or Reject an applied request' });
      }
    }

    if (['CONFIRMED', 'COMPLETED', 'CANCELLED', 'CONTACTED'].includes(status)) {
      if (userIdStr !== customerIdStr && userIdStr !== providerIdStr) {
        return res.status(403).json({ message: 'Unauthorized: Not permitted to update this match request' });
      }
    }

    // Apply timestamps based on status
    const now = new Date();
    match.status = status;

    if (status === 'ACCEPTED') {
      match.respondedAt = now;
      match.acceptedAt = now;

      // Automatically create Conversation document for both users upon acceptance
      try {
        const existingConv = await Conversation.findOne({
          $or: [{ matchId: match._id }, { match: match._id }]
        });
        if (!existingConv) {
          await Conversation.create({
            customerId: match.customerId || match.customer._id || match.customer,
            providerId: match.providerId || match.provider._id || match.provider,
            matchId: match._id,
            lastMessage: 'Connection accepted! You can now contact each other.',
            lastMessageAt: now
          });
          console.log(`[CONVERSATION CREATED] Created conversation for match ${match._id}`);
        }
      } catch (convErr) {
        console.error('Auto conversation creation error:', convErr.message);
      }
    } else if (status === 'REJECTED') {
      match.respondedAt = now;
      match.rejectedAt = now;
    } else if (status === 'CONTACTED') {
      match.contactedAt = now;
    }

    await match.save();

    console.log(`[MATCH STATUS UPDATE] Match ${match._id} updated from '${currentStatus}' to '${status}' by User ${req.user._id}`);

    res.status(200).json(match);
  } catch (error) {
    console.error('Update match status error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get match requests for the logged-in provider
// @route   GET /api/matches/my-requests
// @access  Private (Provider only)
const getProviderMatchRequests = async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can view match requests' });
    }

    const matches = await Match.find({
      $or: [{ providerId: req.user._id }, { provider: req.user._id }]
    })
      .populate('requestId', 'title category rate timing mode city description createdAt')
      .populate('customerId', 'name phone preferredLanguage city')
      .sort({ score: -1, createdAt: -1 });

    res.status(200).json(matches);
  } catch (error) {
    console.error('Get provider match requests error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single match details
// @route   GET /api/matches/:id
// @access  Private
const getMatchDetails = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('requestId')
      .populate('providerId', 'name phone location skills bio availability age category preferredLanguage')
      .populate('customerId', 'name phone preferredLanguage city');

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    res.status(200).json(match);
  } catch (error) {
    console.error('Get match details error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get match requests created for the logged-in customer
// @route   GET /api/matches/customer-requests
// @access  Private (Customer only)
const getCustomerMatchRequests = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can view customer match requests' });
    }

    const matches = await Match.find({
      $or: [{ customerId: req.user._id }, { customer: req.user._id }]
    })
      .populate('requestId', 'title category rate timing mode city description createdAt')
      .populate('providerId', 'name phone skills bio city location availability age category preferredLanguage')
      .sort({ score: -1, updatedAt: -1 });

    res.status(200).json(matches);
  } catch (error) {
    console.error('Get customer match requests error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  updateMatchStatus,
  getProviderMatchRequests,
  getCustomerMatchRequests,
  getMatchDetails
};
