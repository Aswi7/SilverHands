const dotenv = require('dotenv');
dotenv.config({ path: 'backend/.env' });

const { GoogleGenerativeAI } = require('@google/generative-ai');

const testModels = async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API key");
    process.exit(1);
  }

  const ai = new GoogleGenerativeAI(apiKey);
  const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.5-flash"];

  for (const modelName of models) {
    try {
      console.log(`\nTesting model: ${modelName}`);
      const model = ai.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json" }
      });
      const result = await model.generateContent("Respond with JSON: {\"status\": \"ok\"}");
      console.log(`Success with ${modelName}! Response:`, result.response.text());
    } catch (err) {
      console.log(`Failed with ${modelName}:`, err.message);
    }
  }
  process.exit(0);
};

testModels();
