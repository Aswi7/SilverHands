const Match = require('../models/Match');
const Conversation = require('../models/Conversation');

// Valid state transitions dictionary
const VALID_TRANSITIONS = {
  PENDING: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED: ['CONTACTED', 'COMPLETED', 'CANCELLED'],
  REJECTED: [],
  CONTACTED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: []
};

// @desc    Update match request status (Accept/Reject by Provider, Contact/Cancel by Customer)
// @route   PUT /api/matches/:id/status
// @access  Private
const updateMatchStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const matchId = req.params.id;

    if (!status) {
      return res.status(400).json({ message: 'Status field is required' });
    }

    const match = await Match.findById(matchId).populate('opportunity provider customer');

    if (!match) {
      return res.status(404).json({ message: 'Match request not found' });
    }

    const currentStatus = match.status || 'PENDING';

    // Prevent duplicate accept/reject operations
    if (['ACCEPTED', 'REJECTED'].includes(status) && currentStatus === status) {
      return res.status(400).json({ message: `Match request has already been ${status.toLowerCase()}` });
    }

    if (['ACCEPTED', 'REJECTED'].includes(status) && currentStatus !== 'PENDING') {
      return res.status(400).json({ message: `Cannot change status from '${currentStatus}' to '${status}'` });
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

    if (['ACCEPTED', 'REJECTED'].includes(status)) {
      if (req.user.role !== 'provider' || userIdStr !== providerIdStr) {
        return res.status(403).json({ message: 'Unauthorized: Only the assigned Provider can Accept or Reject this match request' });
      }
    }

    if (['CONTACTED', 'CANCELLED'].includes(status)) {
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
            lastMessage: 'Connection accepted! Start chatting below.',
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

    console.log(`[MATCH STATUS UPDATE] Match ${match._id} updated from '${currentStatus}' to '${status}' by Provider/User ${req.user._id}`);

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
      .populate('opportunity', 'title category rate timing mode city description createdAt')
      .populate('customer', 'name phone preferredLanguage city')
      .sort({ createdAt: -1 });

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
      .populate('opportunity')
      .populate('provider', 'name phone location skills bio availability age category preferredLanguage')
      .populate('customer', 'name phone preferredLanguage city');

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
      .populate('opportunity', 'title category rate timing mode city description createdAt')
      .populate('provider', 'name phone skills bio city location availability age category preferredLanguage')
      .sort({ createdAt: -1 });

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
