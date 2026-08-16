const { SchemaType } = require('@google/generative-ai');

const schema = {
  type: SchemaType.OBJECT,
  properties: {
    generatedBio: { 
      type: SchemaType.STRING, 
      description: "A warm, natural, human-readable paragraph describing the provider" 
    }
  },
  required: ["generatedBio"]
};

const getPrompt = (inputData) => `
You are an expert profile writer for SilverHands, a platform connecting senior citizens and homemakers with local service opportunities.
Write a warm, natural, single-paragraph biography for a provider using the following details.

Details:
- Name: ${inputData.name}
- Age: ${inputData.age}
- Skills: ${inputData.skills.join(', ')}
- Availability: ${inputData.availability}

Rules:
1. Write from the first-person perspective ("I am...").
2. Keep it to one concise paragraph.
3. Highlight their life experience and eagerness to help based on their skills.
4. Tone should be friendly, respectful, and trustworthy.
`;

module.exports = { schema, getPrompt };
