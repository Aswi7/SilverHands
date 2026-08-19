const Review = require('../models/Review');
const Match = require('../models/Match');
const ProviderProfile = require('../models/ProviderProfile');

// @desc    Create a new rating and review for a provider
// @route   POST /api/reviews
// @access  Private (Customer only)
const createReview = async (req, res) => {
  try {
    const { applicationId, rating, comment } = req.body;

    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can review providers' });
    }

    if (!applicationId || rating === undefined) {
      return res.status(400).json({ message: 'Application ID and rating are required' });
    }

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
    }
    const ratingVal = ratingNum;

    // Find match/application
    const match = await Match.findById(applicationId);
    if (!match) {
      return res.status(404).json({ message: 'Completed service match request not found' });
    }

    // Verify ownership and completed status
    const customerIdStr = (match.customerId || match.customer)?.toString();
    if (customerIdStr !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized: You are not the customer associated with this application' });
    }

    if (match.status !== 'COMPLETED') {
      return res.status(400).json({ message: 'Cannot review an incomplete service. Status must be COMPLETED' });
    }

    const providerId = match.providerId || match.provider;

    // Check duplicate
    const existing = await Review.findOne({
      reviewerId: req.user._id,
      targetUserId: providerId,
      applicationId
    });

    if (existing) {
      return res.status(400).json({ message: 'You have already submitted a review for this completed service' });
    }

    // Create review
    const reviewRecord = await Review.create({
      applicationId,
      reviewerId: req.user._id,
      targetUserId: providerId,
      rating: ratingVal,
      comment: comment || ''
    });

    // Recalculate average provider rating
    const allReviews = await Review.find({ targetUserId: providerId });
    let avg = 5.0;
    if (allReviews.length > 0) {
      const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
      avg = Math.round((sum / allReviews.length) * 10) / 10; // Round to 1 decimal place
    }

    // Persist to ProviderProfile
    await ProviderProfile.findOneAndUpdate(
      { userId: providerId },
      { $set: { rating: avg } },
      { upsert: true }
    );

    console.log(`[REVIEW CREATED] Review stored for match ${applicationId}. Recalculated provider ${providerId} average rating: ${avg}`);

    res.status(201).json(reviewRecord);
  } catch (error) {
    console.error('Create review error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all reviews and ratings for a provider
// @route   GET /api/reviews/provider/:providerId
// @access  Public
const getProviderReviews = async (req, res) => {
  try {
    const { providerId } = req.params;

    const reviews = await Review.find({ targetUserId: providerId })
      .populate('reviewerId', 'name city')
      .sort({ createdAt: -1 });

    let avg = 5.0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      avg = Math.round((sum / reviews.length) * 10) / 10;
    }

    res.status(200).json({
      reviews,
      averageRating: avg,
      count: reviews.length
    });
  } catch (error) {
    console.error('Get provider reviews error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get review for a specific match/application
// @route   GET /api/reviews/match/:matchId
// @access  Private
const getMatchReview = async (req, res) => {
  try {
    const { matchId } = req.params;
    const review = await Review.findOne({ applicationId: matchId }).populate('reviewerId', 'name');
    
    res.status(200).json(review || null);
  } catch (error) {
    console.error('Get match review error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createReview,
  getProviderReviews,
  getMatchReview
};
