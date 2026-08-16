require('dotenv').config();
const { callGemini } = require('./config/gemini');
const { SKILL_EXTRACTION_SYSTEM_PROMPT } = require('./config/prompts');
const { SchemaType } = require('@google/generative-ai');

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    skills: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          category: { type: SchemaType.STRING },
          skillName: { type: SchemaType.STRING },
          experienceLevel: { type: SchemaType.STRING },
          confidence: { type: SchemaType.NUMBER }
        }
      }
    }
  }
};

const testBios = [
  "I have been a math teacher for 15 years. I also enjoy baking cakes for birthdays.",
  "I can help with fixing computers and setting up wifi routers. Done it for my family forever.",
  "I knit sweaters and can look after dogs.",
  "Just a person looking for work. I learn fast and work hard."
];

async function runTests() {
  for (let i = 0; i < testBios.length; i++) {
    console.log(`\n--- Test Bio ${i+1} ---`);
    console.log(`Bio: "${testBios[i]}"`);
    try {
      const result = await callGemini(SKILL_EXTRACTION_SYSTEM_PROMPT, testBios[i], responseSchema);
      console.log(JSON.stringify(result, null, 2));
    } catch (e) {
      console.error(e.message);
    }
  }
}

runTests();
