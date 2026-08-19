const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { runAITask } = require('../services/aiService');

// Helper to determine language from request body or user profile
const getReqLanguage = (req) => {
  return req.body.language || req.user?.preferredLanguage || 'en';
};

// POST /api/ai/extract-skills
router.post('/extract-skills', protect, async (req, res) => {
  try {
    const { bio } = req.body;
    if (!bio || typeof bio !== 'string' || bio.trim().length === 0) {
      return res.status(400).json({ message: 'Please provide bio text' });
    }
    const language = getReqLanguage(req);
    const result = await runAITask('skillExtraction', { bio, language });
    res.status(200).json(result);
  } catch (error) {
    if (error.type === 'RATE_LIMIT_ERROR' || error.type === 'SERVICE_UNAVAILABLE_ERROR') {
       return res.status(503).json({ message: 'AI busy' });
    }
    res.status(500).json({ message: 'Failed to extract skills' });
  }
});

// POST /api/ai/generate-bio
router.post('/generate-bio', protect, async (req, res) => {
  try {
    const { name, age, skills, availability } = req.body;
    if (!name || !skills) {
      return res.status(400).json({ message: 'Missing required profile data' });
    }
    const language = getReqLanguage(req);
    const result = await runAITask('bioGeneration', { name, age, skills, availability, language });
    res.status(200).json(result);
  } catch (error) {
    if (error.type === 'RATE_LIMIT_ERROR' || error.type === 'SERVICE_UNAVAILABLE_ERROR') {
       return res.status(503).json({ message: 'AI busy' });
    }
    res.status(500).json({ message: 'Failed to generate bio' });
  }
});

// POST /api/ai/structure-listing
router.post('/structure-listing', protect, async (req, res) => {
  try {
    const { requestText } = req.body;
    if (!requestText || requestText.trim().length === 0) {
      return res.status(400).json({ message: 'Please provide request text' });
    }
    const language = getReqLanguage(req);
    const result = await runAITask('listingStructuring', { requestText, language });
    res.status(200).json(result);
  } catch (error) {
    if (error.type === 'RATE_LIMIT_ERROR' || error.type === 'SERVICE_UNAVAILABLE_ERROR') {
       return res.status(503).json({ message: 'AI busy' });
    }
    res.status(500).json({ message: 'Failed to structure listing' });
  }
});

// POST /api/ai/explain-match
router.post('/explain-match', protect, async (req, res) => {
  try {
    const { skillOverlap, distance, availabilityOverlap } = req.body;
    if (skillOverlap === undefined) {
      return res.status(400).json({ message: 'Missing match metrics' });
    }
    const language = getReqLanguage(req);
    const result = await runAITask('matchExplanation', { skillOverlap, distance, availabilityOverlap, language });
    res.status(200).json(result);
  } catch (error) {
    if (error.type === 'RATE_LIMIT_ERROR' || error.type === 'SERVICE_UNAVAILABLE_ERROR') {
       return res.status(503).json({ message: 'AI busy' });
    }
    res.status(500).json({ message: 'Failed to explain match' });
  }
});

// POST /api/ai/chat
router.post('/chat', protect, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Missing message' });
    }
    const language = getReqLanguage(req);
    
    // Pass user context, language, user profile context and message to Gemini
    const result = await runAITask('sakhiChat', { 
      userName: req.user.name, 
      userRole: req.user.role,
      language,
      userProfile: {
        skills: req.user.skills,
        city: req.user.city,
        availability: req.user.availability,
        bio: req.user.bio
      },
      userInput: message 
    });
    
    res.status(200).json(result);
  } catch (error) {
    if (error.type === 'RATE_LIMIT_ERROR' || error.type === 'SERVICE_UNAVAILABLE_ERROR') {
       return res.status(503).json({ message: 'AI busy' });
    }
    res.status(500).json({ message: 'Failed to chat with Sakhi' });
  }
});

module.exports = router;
