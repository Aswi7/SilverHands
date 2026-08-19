const { SchemaType } = require('@google/generative-ai');

const schema = {
  type: SchemaType.OBJECT,
  properties: {
    rankings: {
      type: SchemaType.ARRAY,
      description: "List of calculated forecast rankings",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING, description: "The ID of the forecast event (e.g. f1, f2, f3)" },
          relevanceScore: { type: SchemaType.INTEGER, description: "Relevance score from 0 to 100" },
          explanation: { type: SchemaType.STRING, description: "Personalized, warm, and natural-sounding explanation of why this seasonal forecast matches their profile and skills." }
        },
        required: ["id", "relevanceScore", "explanation"]
      }
    }
  },
  required: ["rankings"]
};

const getPrompt = (inputData) => {
  const langMap = { hi: 'Hindi', ta: 'Tamil', en: 'English' };
  const targetLang = langMap[inputData.language] || 'English';

  return `
You are a smart matching and seasonal demand forecasting assistant for SilverHands.
Your job is to analyze the provider's profile against upcoming seasonal events and calculate a personalized relevance score (0-100) and localized explanation for each event.

PROVIDER PROFILE:
- Name: ${inputData.userName}
- Skills: ${JSON.stringify(inputData.skills || [])}
- Bio: ${inputData.bio || 'Not specified'}
- Location (City): ${inputData.city || 'Not specified'}
- Availability: ${inputData.availability}

UPCOMING OPPORTUNITIES (EVENTS):
${JSON.stringify(inputData.forecasts)}

SCORING RULES:
1. Skill Match: Give high weight (up to 50 pts) if their skills match the services in demand for the event.
2. Bio Relevance: Match semantic concepts in their bio (up to 20 pts). E.g., cooking skills matching festive sweet demands.
3. Location Alignment: Give higher priority if the forecast lists location-specific metrics or if the provider is in a city where this seasonal pattern is highly active (up to 20 pts).
4. Availability: Adjust score based on provider availability status (up to 10 pts).

CRITICAL INSTRUCTIONS:
1. Explain WHY the event is recommended based on the provider's specific skills (e.g., "Recommended because your profile includes custom alterations, which see high demand during the festive wedding season").
2. Sound conversational and encouraging.
3. Generate the "explanation" text STRICTLY in ${targetLang}.
4. Respond ONLY with a JSON object matching the provided schema.
`;
};

module.exports = { schema, getPrompt };
