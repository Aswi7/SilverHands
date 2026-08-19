const dotenv = require('dotenv');
dotenv.config({ path: 'backend/.env' });

const { callGemini, DEFAULT_MODEL } = require('../config/gemini');
const { schema } = require('../config/ai-prompts/sakhiChat');

console.log("Model Configured:", DEFAULT_MODEL);
console.log("API Key present:", !!process.env.GEMINI_API_KEY);

const run = async () => {
  try {
    const response = await callGemini(
      "You are a helpful AI assistant. Respond in English.",
      "Hello, how are you?",
      schema
    );
    console.log("Gemini API call succeeded! Response:", response);
  } catch (err) {
    console.error("Gemini API call failed! Error:", err.message);
  }
};

run();
