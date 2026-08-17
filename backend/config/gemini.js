const { GoogleGenerativeAI } = require('@google/generative-ai');

// Model configuration constant for easy swapping
const DEFAULT_MODEL = "gemini-3.5-flash"; // Fallback to "gemini-3.5-flash-lite" if rate limits are hit

let genAI = null;

/**
 * Initializes the Gemini client
 */
const initGemini = () => {
  if (genAI) return genAI;
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }

  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
};

/**
 * Low-level wrapper for calling Gemini with structured JSON output.
 * 
 * @param {string} systemPrompt - Instructions for the AI's behavior.
 * @param {string} userInput - The user data to process.
 * @param {object} responseSchema - The JSON schema describing the expected output structure.
 * @returns {Promise<object>} - Parsed JSON object matching the schema.
 */
const callGemini = async (systemPrompt, userInput, responseSchema) => {
  try {
    const ai = initGemini();
    
    // Using gemini-2.5-flash which supports responseSchema
    const model = ai.getGenerativeModel({
      model: DEFAULT_MODEL,
      systemInstruction: systemPrompt,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const result = await model.generateContent(userInput);
    const responseText = result.response.text();
    
    // Attempt to parse the structured JSON
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      const error = new Error('Failed to parse Gemini response as JSON');
      error.type = 'PARSE_ERROR';
      error.rawResponse = responseText;
      throw error;
    }

  } catch (err) {
    // Determine the type of Gemini API error for easier debugging
    if (err.type === 'PARSE_ERROR') throw err;
    
    const errorMessage = err.message || '';
    const customError = new Error(err.message);
    
    if (errorMessage.includes('API key not valid') || errorMessage.includes('API key expired') || errorMessage.includes('UNAUTHENTICATED')) {
      customError.type = 'AUTH_ERROR';
    } else if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
      customError.type = 'RATE_LIMIT_ERROR';
    } else if (errorMessage.includes('503') || errorMessage.includes('high demand') || errorMessage.includes('Service Unavailable')) {
      customError.type = 'SERVICE_UNAVAILABLE_ERROR';
    } else if (errorMessage.includes('400') || errorMessage.includes('INVALID_ARGUMENT')) {
      customError.type = 'BAD_REQUEST_ERROR';
    } else {
      customError.type = 'GEMINI_API_ERROR';
    }
    
    throw customError;
  }
};

/**
 * Generates an embedding vector for a given text using text-embedding-004.
 * 
 * @param {string} text - The input string to embed.
 * @returns {Promise<Array<number>>} - The embedding vector (768 dimensions).
 */
const generateEmbedding = async (text) => {
  try {
    const ai = initGemini();
    const model = ai.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (err) {
    console.error('Failed to generate embedding:', err.message);
    // Return null or throw depending on how hard we want to fail
    return null;
  }
};

module.exports = {
  callGemini,
  generateEmbedding,
  DEFAULT_MODEL
};
