const Match = require('../models/Match');
const Conversation = require('../models/Conversation');
const ServiceRequest = require('../models/ServiceRequest');
const Earning = require('../models/Earning');

// Valid state transitions dictionary for the 4 main user-facing stages
const VALID_TRANSITIONS = {
  APPLIED: ['ACCEPTED', 'REJECTED'],
  PENDING: ['ACCEPTED', 'REJECTED'], // Backward compatibility alias for APPLIED
  ACCEPTED: ['CONFIRMED', 'REJECTED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'REJECTED', 'CANCELLED'],
  REJECTED: [],
  COMPLETED: [],
  CANCELLED: []
};

// @desc    Update match request status (APPLIED -> ACCEPTED -> CONFIRMED -> COMPLETED)
// @route   PUT /api/matches/:id/status
// @access  Private
const updateMatchStatus = async (req, res) => {
  try {
    const { status, paymentReceived, agreedAmount } = req.body;
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

    // Role-based permission & ownership check
    const userIdStr = req.user._id.toString();
    const providerIdStr = (match.providerId || match.provider)?._id?.toString() || (match.providerId || match.provider)?.toString();
    const customerIdStr = (match.customerId || match.customer)?._id?.toString() || (match.customerId || match.customer)?.toString();

    const now = new Date();

    // 1. APPLIED -> ACCEPTED / REJECTED
    if (['APPLIED', 'PENDING'].includes(currentStatus)) {
      if (['CONFIRMED', 'COMPLETED'].includes(status)) {
        return res.status(400).json({ 
          message: `Stage skipping forbidden: Cannot transition from '${currentStatus}' directly to '${status}'. Application must be accepted first.` 
        });
      }
      if (req.user.role !== 'provider' || userIdStr !== providerIdStr) {
        return res.status(403).json({ message: 'Unauthorized: Only the assigned Provider can Accept or Reject an applied request' });
      }

      if (status === 'ACCEPTED') {
        match.status = 'ACCEPTED';
        match.respondedAt = now;
        match.acceptedAt = now;

        // Auto create Conversation
        try {
          const existingConv = await Conversation.findOne({
            $or: [{ matchId: match._id }, { match: match._id }]
          });
          if (!existingConv) {
            await Conversation.create({
              customerId: match.customerId._id || match.customerId,
              providerId: match.providerId._id || match.providerId,
              matchId: match._id,
              lastMessage: 'Connection accepted! You can now contact each other.',
              lastMessageAt: now
            });
          }
        } catch (convErr) {
          console.error('Conversation creation error:', convErr.message);
        }
      } else if (status === 'REJECTED') {
        match.status = 'REJECTED';
        match.respondedAt = now;
        match.rejectedAt = now;
      }
    }

    // 2. CONFIRMATION STAGE (ACCEPTED -> CONFIRMED / REJECTED)
    else if (currentStatus === 'ACCEPTED') {
      if (status === 'COMPLETED') {
        return res.status(400).json({ 
          message: `Stage skipping forbidden: Cannot transition from 'ACCEPTED' directly to 'COMPLETED'. Service must be confirmed first.` 
        });
      }

      if (userIdStr !== customerIdStr && userIdStr !== providerIdStr) {
        return res.status(403).json({ message: 'Unauthorized to confirm or reject this match connection' });
      }

      if (status === 'REJECTED') {
        // Immediate rejection by either party
        match.status = 'REJECTED';
        match.rejectedAt = now;
      } else if (status === 'CONFIRMED') {
        // Update confirmation flag for the calling user
        if (userIdStr === providerIdStr) {
          match.providerConfirmed = true;
        } else if (userIdStr === customerIdStr) {
          match.customerConfirmed = true;
        }

        // If both confirmed, transition status to CONFIRMED
        if (match.providerConfirmed && match.customerConfirmed) {
          match.status = 'CONFIRMED';
        }
      }
    }

    // 3. CONFIRMED STAGE (CONFIRMED -> COMPLETED / REJECTED)
    else if (currentStatus === 'CONFIRMED') {
      if (userIdStr !== customerIdStr && userIdStr !== providerIdStr) {
        return res.status(403).json({ message: 'Unauthorized to update this match connection' });
      }

      if (status === 'REJECTED') {
        // Immediate rejection by either party
        match.status = 'REJECTED';
        match.rejectedAt = now;
      } else if (status === 'COMPLETED') {
        // Only the assigned Provider can mark completed & confirm payment
        if (req.user.role !== 'provider' || userIdStr !== providerIdStr) {
          return res.status(403).json({ message: 'Unauthorized: Only the assigned Provider can complete this service and verify payment' });
        }

        if (paymentReceived !== true) {
          return res.status(400).json({ message: 'Payment verification is required to complete the service' });
        }

        match.status = 'COMPLETED';
        match.paymentReceived = true;
        match.completedAt = now;
        match.completedBy = 'provider';

        if (agreedAmount !== undefined) {
          match.agreedAmount = agreedAmount;
        }

        // Parse default amount from rate string if not explicitly set
        let finalAmount = match.agreedAmount || agreedAmount || 0;
        if (!finalAmount) {
          const rateStr = match.requestId?.rate || '1500';
          const parsed = parseInt(rateStr.replace(/[^0-9]/g, ''), 10);
          finalAmount = isNaN(parsed) ? 1500 : parsed;
        }
        match.agreedAmount = finalAmount;

        // Idempotent Earnings Record Generation
        try {
          const existingEarning = await Earning.findOne({ applicationId: match._id });
          if (!existingEarning) {
            await Earning.create({
              providerId: match.providerId._id || match.providerId,
              applicationId: match._id,
              customerId: match.customerId._id || match.customerId,
              amount: finalAmount,
              serviceName: match.requestId?.title || 'Service Connection',
              paymentReceived: true,
              earnedAt: now
            });
            console.log(`[EARNING CREATED] persistent Earning record added for match ${match._id}: ₹${finalAmount}`);
          }
        } catch (earningErr) {
          console.error('Idempotent earnings generation error:', earningErr.message);
        }
      }
    } else {
      return res.status(400).json({ message: `Cannot change status of a terminal ${currentStatus} application` });
    }

    await match.save();
    console.log(`[MATCH STATUS UPDATE] Match ${match._id} updated from '${currentStatus}' to status '${match.status}' by User ${req.user._id}`);
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
