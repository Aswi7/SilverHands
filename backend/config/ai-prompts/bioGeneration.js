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

const getPrompt = (inputData) => {
  const langMap = { hi: 'Hindi', ta: 'Tamil', en: 'English' };
  const targetLang = langMap[inputData.language] || 'English';

  return `
You are an expert profile writer for SilverHands, a platform connecting senior citizens and homemakers with local service opportunities.
Write a warm, natural, single-paragraph biography for a provider using the following details.

Details:
- Name: ${inputData.name}
- Age: ${inputData.age}
- Skills: ${Array.isArray(inputData.skills) ? inputData.skills.join(', ') : inputData.skills}
- Availability: ${inputData.availability}

Rules:
1. Write from the first-person perspective ("I am...").
2. Keep it to one concise paragraph.
3. Highlight their life experience and eagerness to help based on their skills.
4. Tone should be friendly, respectful, and trustworthy.
5. CRITICAL: Generate the biography in ${targetLang}.
`;
};

module.exports = { schema, getPrompt };
