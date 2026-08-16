const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { runAITask } = require('../services/aiService');

// POST /api/ai/extract-skills
router.post('/extract-skills', protect, async (req, res) => {
  try {
    const { bio } = req.body;
    if (!bio || typeof bio !== 'string' || bio.trim().length === 0) {
      return res.status(400).json({ message: 'Please provide bio text' });
    }
    const result = await runAITask('skillExtraction', { bio });
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
    const result = await runAITask('bioGeneration', { name, age, skills, availability });
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
    const result = await runAITask('listingStructuring', { requestText });
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
    const result = await runAITask('matchExplanation', { skillOverlap, distance, availabilityOverlap });
    res.status(200).json(result);
  } catch (error) {
    if (error.type === 'RATE_LIMIT_ERROR' || error.type === 'SERVICE_UNAVAILABLE_ERROR') {
       return res.status(503).json({ message: 'AI busy' });
    }
    res.status(500).json({ message: 'Failed to explain match' });
  }
});

module.exports = router;
