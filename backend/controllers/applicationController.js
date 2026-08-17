const Application = require('../models/Application');
const Review = require('../models/Review');
const User = require('../models/User');

// Helper for Mock Guardian Notifications
const triggerGuardianNotification = async (type, payload) => {
  console.log(`[GUARDIAN NOTIFICATION] Type: ${type}`);
  console.log(JSON.stringify(payload, null, 2));
  // In a real system, this would push to FCM or Twilio
};

// @desc    Create a new application
// @route   POST /api/applications
// @access  Private
exports.createApplication = async (req, res) => {
  try {
    const { opportunityId, providerId, employerId } = req.body;
    
    if (!providerId || !employerId) {
      return res.status(400).json({ message: 'Missing providerId or employerId' });
    }

    const application = new Application({
      opportunityId,
      providerId,
      employerId,
      status: 'applied'
    });

    await application.save();

    await triggerGuardianNotification('NEW_APPLICATION', {
      applicationId: application._id,
      message: 'A new application has been started.'
    });

    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create application', error: error.message });
  }
};

// @desc    Update status manually (applied, contacted, cancelled)
// @route   PATCH /api/applications/:id/status
// @access  Private
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Validation Rules
    if (status === 'completed') {
      return res.status(400).json({ message: 'Use /complete endpoint for completion' });
    }
    if (status === 'confirmed') {
      return res.status(400).json({ message: 'Use /confirm endpoint for confirmation' });
    }
    if (status === 'in_progress') {
      return res.status(400).json({ message: 'Use /check-in endpoint to start in progress' });
    }

    // Forward transition rule for contacted
    if (status === 'contacted' && application.status !== 'applied') {
      return res.status(400).json({ message: 'Can only transition to contacted from applied' });
    }

    application.status = status;
    await application.save();

    res.status(200).json(application);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status', error: error.message });
  }
};

// @desc    Confirm application with terms
// @route   PATCH /api/applications/:id/confirm
// @access  Private
exports.confirmApplication = async (req, res) => {
  try {
    const { confirmedTerms } = req.body;
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (!['applied', 'contacted', 'completed'].includes(application.status)) {
       return res.status(400).json({ message: 'Invalid current status for confirmation' });
    }

    if (!confirmedTerms || !confirmedTerms.rate || !confirmedTerms.date || !confirmedTerms.taskDescription) {
      return res.status(400).json({ message: 'Missing required confirmed terms' });
    }

    application.status = 'confirmed';
    application.confirmedTerms = confirmedTerms;
    await application.save();

    await triggerGuardianNotification('TERMS_CONFIRMED', {
      applicationId: application._id,
      terms: confirmedTerms
    });

    res.status(200).json(application);
  } catch (error) {
    res.status(500).json({ message: 'Failed to confirm application', error: error.message });
  }
};

// @desc    Check-in / Start progress
// @route   PATCH /api/applications/:id/check-in
// @access  Private
exports.checkInApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate('providerId employerId');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'confirmed') {
      return res.status(400).json({ message: 'Can only check-in confirmed applications' });
    }

    application.status = 'in_progress';
    application.startedAt = new Date();
    await application.save();

    await triggerGuardianNotification('CHECK_IN', {
      applicationId: application._id,
      summary: `Provider ${application.providerId.name} checked in at ${application.startedAt} for ${application.employerId.name}.`
    });

    res.status(200).json(application);
  } catch (error) {
    res.status(500).json({ message: 'Failed to check in', error: error.message });
  }
};

// @desc    Dual-confirmation completion
// @route   PATCH /api/applications/:id/complete
// @access  Private
exports.completeApplication = async (req, res) => {
  try {
    const { role } = req.user; // assuming auth middleware attaches user
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'in_progress') {
      return res.status(400).json({ message: 'Can only complete an in_progress application' });
    }

    if (role === 'provider') {
      application.providerConfirmedComplete = true;
    } else {
      application.employerConfirmedComplete = true;
    }

    if (application.providerConfirmedComplete && application.employerConfirmedComplete) {
      application.status = 'completed';
      application.completedAt = new Date();
      
      await triggerGuardianNotification('JOB_COMPLETED', {
        applicationId: application._id,
        message: 'Job marked completed by both parties.'
      });
    }

    await application.save();
    res.status(200).json(application);
  } catch (error) {
    res.status(500).json({ message: 'Failed to complete', error: error.message });
  }
};

// @desc    Get user applications
// @route   GET /api/applications/user/:userId
// @access  Private
exports.getUserApplications = async (req, res) => {
  try {
    const apps = await Application.find({
      $or: [{ providerId: req.params.userId }, { employerId: req.params.userId }]
    }).populate('providerId employerId opportunityId').sort({ createdAt: -1 });

    res.status(200).json(apps);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch applications', error: error.message });
  }
};

// @desc    Submit a review
// @route   POST /api/applications/:id/review
// @access  Private
exports.submitReview = async (req, res) => {
  try {
    const { targetUserId, rating, comment } = req.body;
    const applicationId = req.params.id;

    if (!rating || !targetUserId) {
      return res.status(400).json({ message: 'Missing rating or targetUserId' });
    }

    const application = await Application.findById(applicationId);
    if (!application || application.status !== 'completed') {
       return res.status(400).json({ message: 'Can only review completed applications' });
    }

    const review = new Review({
      applicationId,
      reviewerId: req.user._id,
      targetUserId,
      rating,
      comment
    });

    await review.save();

    // Optionally update target user aggregate rating
    const targetUser = await User.findById(targetUserId);
    if (targetUser) {
      const allReviews = await Review.find({ targetUserId });
      const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      targetUser.averageRating = avg;
      await targetUser.save();
    }

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit review', error: error.message });
  }
};
