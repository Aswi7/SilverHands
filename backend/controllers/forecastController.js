const ForecastEvent = require('../models/ForecastEvent');
const { runAITask } = require('../services/aiService');

/**
 * Helper to get language code from request headers/user profile
 */
const getReqLanguage = (req) => {
  return req.body?.language || req.query?.language || req.user?.preferredLanguage || 'en';
};

/**
 * GET /api/forecasts - Retrieve all normalized forecast events
 */
const getForecasts = async (req, res) => {
  try {
    const events = await ForecastEvent.find({}).sort({ startDate: 1 });
    res.status(200).json(events);
  } catch (error) {
    console.error('getForecasts error:', error.message);
    res.status(500).json({ message: 'Failed to retrieve forecasts' });
  }
};

/**
 * GET /api/forecasts/upcoming - Retrieve chronologically sorted upcoming events
 */
const getUpcomingForecasts = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingEvents = await ForecastEvent.find({
      endDate: { $gte: today }
    }).sort({ startDate: 1 });

    res.status(200).json(upcomingEvents);
  } catch (error) {
    console.error('getUpcomingForecasts error:', error.message);
    res.status(500).json({ message: 'Failed to retrieve upcoming forecasts' });
  }
};

/**
 * GET /api/forecasts/relevant - Personalized opportunity ranking for Provider
 */
const getRelevantForecasts = async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can retrieve personalized forecasts' });
    }

    const language = getReqLanguage(req);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get active forecast events
    const forecasts = await ForecastEvent.find({ endDate: { $gte: today } });

    if (forecasts.length === 0) {
      return res.status(200).json({ rankings: [] });
    }

    // Convert Mongoose documents to plain objects
    const plainForecasts = forecasts.map(f => ({
      id: f._id.toString(),
      eventName: f.name,
      eventKey: f.name.replace(/[^a-zA-Z]/g, '').toLowerCase(),
      relevantCategories: f.affectedServices,
      demandUplift: f.expectedDemand,
      insight: f.description,
      dateRange: f.startDate.toLocaleDateString() + ' to ' + f.endDate.toLocaleDateString()
    }));

    try {
      // Execute prompt-based LLM ranking
      const result = await runAITask('forecastRanking', {
        userName: req.user.name,
        skills: req.user.skills,
        bio: req.user.bio,
        city: req.user.city,
        availability: req.user.availability,
        language,
        forecasts: plainForecasts
      });
      
      return res.status(200).json(result);
    } catch (aiErr) {
      console.warn('Gemini forecast personalization failed, using robust fallback scoring engine:', aiErr.message);

      // Fallback weight calculator
      const userSkills = (req.user.skills || []).map(s => (s.skillName || '').toLowerCase());
      const userCategories = (req.user.skills || []).map(s => (s.category || '').toLowerCase());
      const userBio = (req.user.bio || '').toLowerCase();
      const userCity = (req.user.city || '').toLowerCase();

      const rankings = forecasts.map(event => {
        let score = 30; // base score
        let reason = '';

        const affectedLower = (event.affectedServices || []).map(s => s.toLowerCase());

        const hasCategoryMatch = affectedLower.some(cat => userCategories.includes(cat));
        const hasSkillMatch = affectedLower.some(cat => 
          userSkills.some(sk => sk.includes(cat) || cat.includes(sk))
        );

        if (hasCategoryMatch || hasSkillMatch) {
          score += 45;
        }

        const nameLower = event.name.toLowerCase();
        const descLower = event.description.toLowerCase();
        const isBioRelated = userBio.includes(nameLower) || userBio.includes(event.category.toLowerCase());
        if (isBioRelated) {
          score += 15;
        }

        if (req.user.availability) {
          score += 5;
        }

        if (userCity && event.region.toLowerCase().includes(userCity)) {
          score += 5;
        }

        // Generate fallback message in target language
        const mainService = event.affectedServices[0] || 'service';
        if (score >= 70) {
          if (language === 'ta') {
            reason = `உங்களது ${mainService} திறன்கள் இந்த ${event.name} காலத்தின் தேவைகளுடன் ஒத்துப்போவதால் இது பரிந்துரைக்கப்படுகிறது.`;
          } else if (language === 'hi') {
            reason = `आपके ${mainService} कौशल इस ${event.name} अवधि के लिए अत्यधिक अनुकूल हैं।`;
          } else {
            reason = `Highly recommended because your profile highlights ${mainService} skills which are in demand for ${event.name}.`;
          }
        } else {
          if (language === 'ta') {
            reason = `வழக்கமான பருவகால வாய்ப்பு.`;
          } else if (language === 'hi') {
            reason = `सामान्य मौसमी अवसर।`;
          } else {
            reason = `General upcoming seasonal opportunity.`;
          }
        }

        return {
          id: event._id.toString(),
          relevanceScore: Math.min(score, 100),
          explanation: reason
        };
      });

      return res.status(200).json({ rankings });
    }
  } catch (error) {
    console.error('getRelevantForecasts error:', error.message);
    res.status(500).json({ message: 'Failed to compute personalized forecasts' });
  }
};

module.exports = {
  getForecasts,
  getUpcomingForecasts,
  getRelevantForecasts
};
