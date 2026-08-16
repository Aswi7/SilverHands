const taxonomy = require('../taxonomy.json');
const { SchemaType } = require('@google/generative-ai');

const schema = {
  type: SchemaType.OBJECT,
  properties: {
    skills: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          category: { type: SchemaType.STRING, description: "Mapped taxonomy category" },
          skillName: { type: SchemaType.STRING, description: "Specific skill name extracted" },
          experienceLevel: { type: SchemaType.STRING, description: "Estimated experience level (e.g. Beginner, Expert, 15 years)" },
          confidence: { type: SchemaType.NUMBER, description: "Confidence score between 0.0 and 1.0" }
        },
        required: ["category", "skillName", "experienceLevel", "confidence"]
      }
    }
  },
  required: ["skills"]
};

const getPrompt = (inputData) => `
You are an expert AI assistant for SilverHands, a platform connecting senior citizens and homemakers with local service opportunities.
Analyze the following provider biography and extract a structured list of their skills.

Map each extracted skill to exactly one of these fixed taxonomy categories:
[${taxonomy.join(', ')}]

Rules:
1. Do not invent new categories. Use "other" if none fit perfectly.
2. Extract the specific skill into 'skillName'.
3. Estimate 'experienceLevel' (e.g. Beginner, Intermediate, Expert, or X years).
4. Provide a 'confidence' score (0.0 to 1.0).

User Bio:
"""
${inputData.bio}
"""
`;

module.exports = { schema, getPrompt };
