const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Earning = require('../models/Earning');

// @desc    Get earnings aggregates and recent records for the logged-in provider
// @route   GET /api/earnings
// @access  Private (Provider only)
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can view earnings records' });
    }

    const providerId = req.user._id;

    // Fetch all completed earnings for the provider
    const earnings = await Earning.find({ providerId })
      .populate('customerId', 'name')
      .sort({ earnedAt: -1 });

    const totalEarnings = earnings.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // Calculate this month's earnings
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const thisMonthEarnings = earnings
      .filter(e => new Date(e.earnedAt) >= firstDayOfMonth)
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const completedServicesCount = earnings.length;

    res.status(200).json({
      totalEarnings,
      thisMonthEarnings,
      completedServicesCount,
      recentEarnings: earnings
    });
  } catch (error) {
    console.error('Fetch earnings error:', error.message);
    res.status(500).json({ message: 'Failed to retrieve earnings data' });
  }
});

module.exports = router;
