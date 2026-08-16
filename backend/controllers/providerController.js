const { SchemaType } = require('@google/generative-ai');
const { callGemini } = require('../config/gemini');
const { SKILL_EXTRACTION_SYSTEM_PROMPT } = require('../config/prompts');

// @desc    Extract skills from a free-text bio using AI
// @route   POST /api/providers/:id/extract-skills
// @access  Private (Provider only)
const extractSkills = async (req, res) => {
  try {
    const { bio } = req.body;

    if (!bio || typeof bio !== 'string' || bio.trim().length === 0) {
      return res.status(400).json({ message: 'Please provide a bio text to extract skills from' });
    }

    // Define the schema for the AI output
    const responseSchema = {
      type: SchemaType.OBJECT,
      properties: {
        skills: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              category: {
                type: SchemaType.STRING,
                description: "The mapped category from the taxonomy"
              },
              skillName: {
                type: SchemaType.STRING,
                description: "The specific skill extracted from the text"
              },
              experienceLevel: {
                type: SchemaType.STRING,
                description: "The estimated experience level (e.g., Beginner, Expert, 10 years)"
              },
              confidence: {
                type: SchemaType.NUMBER,
                description: "Confidence score between 0.0 and 1.0"
              }
            },
            required: ["category", "skillName", "experienceLevel", "confidence"]
          }
        }
      },
      required: ["skills"]
    };

    // Call Gemini
    const result = await callGemini(SKILL_EXTRACTION_SYSTEM_PROMPT, bio, responseSchema);

    // Return the extracted skills array directly to the frontend for user review.
    // The frontend will allow editing before hitting the final "Save Profile" route.
    res.status(200).json(result);

  } catch (error) {
    console.error('Skill extraction error:', error.message);
    
    if (error.type === 'RATE_LIMIT_ERROR' || error.type === 'SERVICE_UNAVAILABLE_ERROR') {
       return res.status(503).json({ message: 'The AI service is currently busy. Please try again in a moment.' });
    }
    
    res.status(500).json({ message: 'Failed to extract skills. Please try again.' });
  }
};

module.exports = {
  extractSkills
};
