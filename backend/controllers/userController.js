const User = require('../models/User');
const { generateEmbedding } = require('../config/gemini');

// @desc    Update user profile details (language preference, bio, status)
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      if (req.body.name !== undefined) user.name = req.body.name;
      if (req.body.preferredLanguage !== undefined) user.preferredLanguage = req.body.preferredLanguage;
      if (req.body.city !== undefined) user.city = req.body.city;
      if (req.body.age !== undefined) user.age = parseInt(req.body.age, 10);
      if (req.body.category !== undefined) user.category = req.body.category;
      
      // Update provider specific details
      if (user.role === 'provider') {
        const currentSkillsJson = JSON.stringify(user.skills || []);
        const newSkillsJson = req.body.skills !== undefined ? JSON.stringify(req.body.skills) : currentSkillsJson;
        
        const skillsChanged = currentSkillsJson !== newSkillsJson;
        const bioChanged = req.body.bio !== undefined && req.body.bio !== user.bio;

        if (req.body.skills !== undefined) user.skills = req.body.skills;
        if (req.body.bio !== undefined) user.bio = req.body.bio;
        if (req.body.availability !== undefined) user.availability = req.body.availability;

        // Check if embedding needs generation (changed skills/bio OR missing/invalid 768-dim vector)
        const needsEmbedding = skillsChanged || bioChanged || !user.embedding || !Array.isArray(user.embedding) || user.embedding.length !== 768;

        if (needsEmbedding) {
          const skillsStr = (user.skills || []).map(s => (typeof s === 'object' ? s.skillName : s)).filter(Boolean).join(', ');
          const textToEmbed = `Name: ${user.name}. Skills: ${skillsStr}. Bio: ${user.bio || ''}. City: ${user.city || ''}`;
          
          const newEmbedding = await generateEmbedding(textToEmbed);
          if (newEmbedding && Array.isArray(newEmbedding) && newEmbedding.length === 768) {
            user.embedding = newEmbedding;
          } else {
            console.warn('Gemini embedding generation did not return a 768-dimension vector. Skipping embedding overwrite.');
          }
        }
      }

      // Completion status evaluation for provider
      const hasMatchmakingData = !!(
        user.name &&
        user.skills &&
        user.skills.length > 0 &&
        user.bio &&
        user.bio.trim().length > 0 &&
        (user.city || (user.location && user.location.coordinates))
      );

      if (req.body.isOnboarded !== undefined) {
        user.isOnboarded = req.body.isOnboarded;
      } else if (user.role === 'provider') {
        user.isOnboarded = hasMatchmakingData;
      } else {
        user.isOnboarded = true;
      }

      const updatedUser = await user.save();
      res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        role: updatedUser.role === 'employer' ? 'customer' : updatedUser.role,
        age: updatedUser.age,
        category: updatedUser.category,
        preferredLanguage: updatedUser.preferredLanguage,
        city: updatedUser.city,
        location: updatedUser.location,
        skills: updatedUser.skills,
        bio: updatedUser.bio,
        availability: updatedUser.availability,
        isOnboarded: updatedUser.isOnboarded,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
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
