const User = require('../models/User');

// @desc    Update user profile details (language preference, bio, status)
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.preferredLanguage = req.body.preferredLanguage || user.preferredLanguage;
      
      // Update provider specific details
      if (user.role === 'provider') {
        user.skills = req.body.skills || user.skills;
        user.bio = req.body.bio || user.bio;
        if (req.body.availability !== undefined) {
          user.availability = req.body.availability;
        }
      }

      const updatedUser = await user.save();
      res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        role: updatedUser.role,
        preferredLanguage: updatedUser.preferredLanguage,
        location: updatedUser.location,
        skills: updatedUser.skills,
        bio: updatedUser.bio,
        availability: updatedUser.availability
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user's location coordinates manually
// @route   PUT /api/users/location
// @access  Private
const updateUserLocation = async (req, res) => {
  try {
    const { longitude, latitude } = req.body;
    
    if (longitude === undefined || latitude === undefined) {
      return res.status(400).json({ message: 'Longitude and latitude are required' });
    }

    const user = await User.findById(req.user._id);

    if (user) {
      user.location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
      
      await user.save();
      res.status(200).json({
        message: 'Location updated successfully',
        location: user.location
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update location error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  updateUserProfile,
  updateUserLocation
};
