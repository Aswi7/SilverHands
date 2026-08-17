const { callGemini } = require('../config/gemini');

// Load prompt templates
const skillExtraction = require('../config/ai-prompts/skillExtraction');
const bioGeneration = require('../config/ai-prompts/bioGeneration');
const listingStructuring = require('../config/ai-prompts/listingStructuring');
const matchExplanation = require('../config/ai-prompts/matchExplanation');
const sakhiChat = require('../config/ai-prompts/sakhiChat');

const taskMap = {
  'skillExtraction': skillExtraction,
  'bioGeneration': bioGeneration,
  'listingStructuring': listingStructuring,
  'matchExplanation': matchExplanation,
  'sakhiChat': sakhiChat
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
    throw error;
  }
};

module.exports = { runAITask };
