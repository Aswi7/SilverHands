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

// POST /api/ai/forecasts - Rank and personalize seasonal forecasts for Provider
router.post('/forecasts', protect, async (req, res) => {
  try {
    const { forecasts } = req.body;
    if (!forecasts || !Array.isArray(forecasts)) {
      return res.status(400).json({ message: 'Forecasts array is required' });
    }

    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can fetch personalized forecasts' });
    }

    const language = getReqLanguage(req);

    try {
      const result = await runAITask('forecastRanking', {
        userName: req.user.name,
        skills: req.user.skills,
        bio: req.user.bio,
        city: req.user.city,
        availability: req.user.availability,
        language,
        forecasts
      });
      return res.status(200).json(result);
    } catch (aiErr) {
      console.warn('Gemini forecast ranking failed, running fallback scoring rules:', aiErr.message);
      
      // Rule-based Fallback Scoring & Explanation Generator
      const userSkills = (req.user.skills || []).map(s => (s.skillName || '').toLowerCase());
      const userCategories = (req.user.skills || []).map(s => (s.category || '').toLowerCase());
      const userBio = (req.user.bio || '').toLowerCase();
      const userCity = (req.user.city || '').toLowerCase();

      const rankings = forecasts.map(event => {
        let score = 30; // base score
        let reason = '';

        // Match categories
        const hasCategoryMatch = event.relevantCategories.some(cat => 
          userCategories.includes(cat.toLowerCase())
        );

        // Match skills text
        const hasSkillMatch = event.relevantCategories.some(cat => 
          userSkills.some(sk => sk.includes(cat.toLowerCase()) || cat.toLowerCase().includes(sk))
        );

        if (hasCategoryMatch || hasSkillMatch) {
          score += 45;
        }

        // Bio relevance
        const eventKeywords = [event.eventKey, ...(event.relevantCategories || [])];
        const bioHit = eventKeywords.some(kw => userBio.includes(kw.toLowerCase()));
        if (bioHit) {
          score += 15;
        }

        // Location / City alignment
        if (userCity && event.insight && event.insight.toLowerCase().includes('area')) {
          score += 5;
        }

        if (req.user.availability) {
          score += 5;
        }

        // Standardized fallback explanations in selected language
        if (score >= 70) {
          if (language === 'ta') {
            reason = `உங்களது ${event.relevantCategories[0] || 'வேலை'} திறன்கள் இந்த ${event.eventName || 'வாய்ப்பிற்கு'} மிகவும் பொருத்தமாக இருப்பதால் பரிந்துரைக்கப்படுகிறது.`;
          } else if (language === 'hi') {
            reason = `आपके ${event.relevantCategories[0] || 'कौशल'} इस ${event.eventName || 'अवसर'} के लिए अत्यधिक प्रासंगिक हैं।`;
          } else {
            reason = `Highly relevant to your profile because wedding, festive, or tutoring demands match your ${event.relevantCategories[0] || 'skills'} category.`;
          }
        } else {
          if (language === 'ta') {
            reason = `வழக்கமான பருவகால வாய்ப்பு.`;
          } else if (language === 'hi') {
            reason = `सामान्य मौसमी अवसर।`;
          } else {
            reason = `General upcoming seasonal opportunity in your region.`;
          }
        }

        return {
          id: event.id,
          relevanceScore: Math.min(score, 100),
          explanation: reason
        };
      });

      return res.status(200).json({ rankings });
    }
  } catch (error) {
    console.error('Forecast ranking route error:', error.message);
    res.status(500).json({ message: 'Failed to personalize forecasts' });
  }
});

module.exports = router;
