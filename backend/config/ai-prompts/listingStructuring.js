const taxonomy = require('../taxonomy.json');
const { SchemaType } = require('@google/generative-ai');

const schema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING, description: "A short, clear title for the job listing" },
    category: { type: SchemaType.STRING, description: "Mapped taxonomy category" },
    cleanedDescription: { type: SchemaType.STRING, description: "Professional, clean version of the request" },
    suggestedPayRange: { type: SchemaType.STRING, description: "Suggested pay rate (e.g. ₹500/hour or Negotiable)" },
    suggestedTiming: { type: SchemaType.STRING, description: "Suggested timing or frequency extracted" }
  },
  required: ["title", "category", "cleanedDescription", "suggestedPayRange", "suggestedTiming"]
};

const getPrompt = (inputData) => {
  const langMap = { hi: 'Hindi', ta: 'Tamil', en: 'English' };
  const targetLang = langMap[inputData.language] || 'English';

  return `
You are an expert listing structurer for SilverHands. 
Analyze the following freeform job request from an employer and structure it for our database.

Map the job to exactly one of these fixed taxonomy categories:
[${taxonomy.join(', ')}]

Rules:
1. Do not invent new categories. Use "other" if none fit.
2. Provide a clear, professional 'title'.
3. Clean up the description to be professional but keep the core details ('cleanedDescription').
4. Extract or suggest a 'suggestedPayRange' (e.g., "₹500/hour", "Negotiable").
5. Extract or summarize the 'suggestedTiming' (e.g., "Weekends", "Daily 11am", "One-time").
6. CRITICAL: Generate title, cleanedDescription, suggestedPayRange, and suggestedTiming in ${targetLang}.

Employer's Request:
"""
${inputData.requestText}
"""
`;
};

module.exports = { schema, getPrompt };
