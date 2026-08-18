const { SchemaType } = require('@google/generative-ai');

const schema = {
  type: SchemaType.OBJECT,
  properties: {
    explanation: { 
      type: SchemaType.STRING, 
      description: "One short, human-readable sentence explaining why they matched." 
    }
  },
  required: ["explanation"]
};

const getPrompt = (inputData) => {
  const langMap = { hi: 'Hindi', ta: 'Tamil', en: 'English' };
  const targetLang = langMap[inputData.language] || 'English';

  return `
You are an expert matchmaking assistant for SilverHands.
Explain to a user why they matched with a specific opportunity/provider using the following breakdown.

Match Breakdown:
- Skill Overlap: ${inputData.skillOverlap}%
- Distance: ${inputData.distance}
- Availability Overlap: ${inputData.availabilityOverlap ? 'Yes' : 'No'}

Rules:
1. Write EXACTLY ONE short, friendly, human-readable sentence.
2. Address the user directly (e.g., "This is a great match because...").
3. Synthesize the metrics into natural language (don't just list the stats robotically).
4. CRITICAL: Generate the explanation sentence in ${targetLang}.
`;
};

module.exports = { schema, getPrompt };
