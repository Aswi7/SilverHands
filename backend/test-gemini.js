require('dotenv').config();
const { SchemaType } = require('@google/generative-ai');
const { callGemini } = require('./config/gemini');

const runTest = async () => {
  console.log('Testing Gemini API Integration...');
  
  // A trivial example as requested
  const systemPrompt = "You are a helpful assistant that extracts information from text.";
  const userInput = "The quick brown fox jumped over the lazy blue dog.";
  
  // Define a simple schema to extract colors mentioned
  const responseSchema = {
    type: SchemaType.OBJECT,
    properties: {
      colors: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.STRING
        },
        description: "List of colors mentioned in the text"
      },
      animal_count: {
        type: SchemaType.INTEGER,
        description: "The total number of animals mentioned in the text"
      }
    },
    required: ["colors", "animal_count"]
  };

  try {
    console.log(`Sending request using model: ${require('./config/gemini').DEFAULT_MODEL}...`);
    const result = await callGemini(systemPrompt, userInput, responseSchema);
    console.log('Success! Gemini returned:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Test Failed!');
    console.error(`Error Type: ${error.type}`);
    console.error(`Message: ${error.message}`);
    if (error.rawResponse) {
      console.error(`Raw Response: ${error.rawResponse}`);
    }
  }
};

runTest();
