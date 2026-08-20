const { GoogleGenerativeAI } = require('@google/generative-ai');

// Model configuration constant for easy swapping
const DEFAULT_MODEL = "gemini-3.1-flash-lite"; // Confirmed working model for this API key

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
    const model = ai.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.embedContent({
      content: {
        parts: [{ text }]
      },
      outputDimensionality: 768
    });
    return result.embedding.values;
  } catch (err) {
    console.error('Failed to generate embedding:', err.message);
    // Return null or throw depending on how hard we want to fail
    return null;
  }
};

/**
 * Multi-turn chat wrapper for Sakhi AI conversations.
 * Sends conversation history for context-aware responses.
 *
 * @param {string} systemPrompt - System instruction defining Sakhi's persona.
 * @param {Array}  history      - Array of {role: 'user'|'model', parts:[{text}]} objects (previous turns).
 * @param {string} userMessage  - The latest user message.
 * @param {object} responseSchema - The JSON schema describing the expected output structure.
 * @returns {Promise<object>} - Parsed JSON object matching the schema.
 */
const callGeminiChat = async (systemPrompt, history, userMessage, responseSchema) => {
  try {
    const ai = initGemini();

    const model = ai.getGenerativeModel({
      model: DEFAULT_MODEL,
      systemInstruction: systemPrompt,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.85,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });

    // Start a chat session with history for context continuity
    const chat = model.startChat({ history });

    const result = await chat.sendMessage(userMessage);
    const responseText = result.response.text();

    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      const error = new Error('Failed to parse Gemini chat response as JSON');
      error.type = 'PARSE_ERROR';
      error.rawResponse = responseText;
      throw error;
    }
  } catch (err) {
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

module.exports = {
  callGemini,
  callGeminiChat,
  generateEmbedding,
  DEFAULT_MODEL
};
