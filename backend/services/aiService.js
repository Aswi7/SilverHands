const { callGemini } = require('../config/gemini');

// Load prompt templates
const skillExtraction = require('../config/ai-prompts/skillExtraction');
const bioGeneration = require('../config/ai-prompts/bioGeneration');
const listingStructuring = require('../config/ai-prompts/listingStructuring');
const matchExplanation = require('../config/ai-prompts/matchExplanation');
const sakhiChat = require('../config/ai-prompts/sakhiChat');
const forecastRanking = require('../config/ai-prompts/forecastRanking');

const taskMap = {
  'skillExtraction': skillExtraction,
  'bioGeneration': bioGeneration,
  'listingStructuring': listingStructuring,
  'matchExplanation': matchExplanation,
  'sakhiChat': sakhiChat,
  'forecastRanking': forecastRanking
};

/**
 * Universal AI Task Runner for SilverHands
 * @param {string} taskType - One of: skillExtraction, bioGeneration, listingStructuring, matchExplanation
 * @param {object} inputData - Data required by the specific task's prompt template
 * @returns {object} - The structured JSON response from Gemini
 */
const runAITask = async (taskType, inputData) => {
  const task = taskMap[taskType];
  
  if (!task) {
    throw new Error(`Unsupported taskType: ${taskType}`);
  }

  const systemPrompt = task.getPrompt(inputData);
  const responseSchema = task.schema;

  try {
    const userInput = inputData.userInput || '';
    const result = await callGemini(systemPrompt, userInput, responseSchema);
    return result;
  } catch (error) {
    console.error(`AI Task '${taskType}' Failed:`, error.message);
    
    // Fallback logic for skillExtraction if AI fails (e.g. rate limit / 429)
    if (taskType === 'skillExtraction') {
      console.log('Using rule-based fallback for skill extraction...');
      return getRuleBasedSkills(inputData.bio);
    }
    
    // Fallback logic for listingStructuring if AI fails
    if (taskType === 'listingStructuring') {
      console.log('Using rule-based fallback for listing structuring...');
      return getRuleBasedListing(inputData.requestText);
    }
    
    throw error;
  }
};

const getRuleBasedSkills = (bio) => {
  const text = (bio || '').toLowerCase();
  const extracted = [];
  
  const rules = [
    {
      keywords: ['cook', 'baking', 'bake', 'sweets', 'meal', 'food', 'kitchen', 'cooking', 'खाना', 'सமையல்'],
      category: 'cooking',
      skillName: 'Cooking'
    },
    {
      keywords: ['sew', 'stitch', 'knit', 'tailor', 'embroidery', 'craft', 'दर्जी', 'தையல்'],
      category: 'tailoring',
      skillName: 'Tailoring & Sewing'
    },
    {
      keywords: ['teach', 'tutor', 'student', 'homework', 'school', 'math', 'science', 'languages', 'english', 'tamil', 'hindi', 'शिक्षक', 'பாடம்'],
      category: 'tutoring',
      skillName: 'Tutoring & Teaching'
    },
    {
      keywords: ['crafts', 'pottery', 'painting', 'draw', 'art'],
      category: 'traditional-crafts',
      skillName: 'Traditional Crafts'
    },
    {
      keywords: ['care', 'babysit', 'child', 'elderly', 'senior', 'nurse', 'baby'],
      category: 'caregiving',
      skillName: 'Caregiving'
    },
    {
      keywords: ['garden', 'plant', 'lawn', 'gardening', 'flower'],
      category: 'gardening',
      skillName: 'Gardening'
    },
    {
      keywords: ['tech', 'smartphone', 'mobile', 'computer', 'whatsapp', 'digital', 'phone'],
      category: 'tech-support',
      skillName: 'Smartphones & Tech Support'
    },
    {
      keywords: ['errand', 'grocery', 'groceries', 'medicine', 'market', 'carry', 'buy', 'shopping'],
      category: 'errands',
      skillName: 'Errands & Shopping'
    },
    {
      keywords: ['clean', 'plumb', 'repair', 'electric', 'paint', 'house', 'home'],
      category: 'home-services',
      skillName: 'Home Services'
    }
  ];

  rules.forEach(rule => {
    const matched = rule.keywords.some(kw => text.includes(kw));
    if (matched) {
      extracted.push({
        category: rule.category,
        skillName: rule.skillName,
        experienceLevel: 'Intermediate',
        confidence: 0.90
      });
    }
  });

  // Default fallback if no keywords matched
  if (extracted.length === 0) {
    extracted.push({
      category: 'other',
      skillName: 'General Assistance',
      experienceLevel: 'Intermediate',
      confidence: 0.80
    });
  }

  return { skills: extracted };
};

const getRuleBasedListing = (text) => {
  const title = text.split('\n')[0].slice(0, 50) || 'Service Opportunity';
  
  // Try to determine category based on keywords
  let category = 'other';
  const textLower = text.toLowerCase();
  if (textLower.includes('cook') || textLower.includes('food') || textLower.includes('meal')) category = 'cooking';
  else if (textLower.includes('teach') || textLower.includes('tutor') || textLower.includes('student')) category = 'tutoring';
  else if (textLower.includes('phone') || textLower.includes('smartphone') || textLower.includes('tech')) category = 'tech-support';
  else if (textLower.includes('garden') || textLower.includes('plant')) category = 'gardening';
  else if (textLower.includes('grocery') || textLower.includes('errand') || textLower.includes('market')) category = 'errands';
  else if (textLower.includes('care') || textLower.includes('elderly') || textLower.includes('child')) category = 'caregiving';

  return {
    title,
    category,
    cleanedDescription: text,
    suggestedPayRange: 'Negotiable',
    suggestedTiming: 'Flexible'
  };
};

module.exports = { runAITask };
