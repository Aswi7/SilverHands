const { SchemaType } = require('@google/generative-ai');

module.exports = {
  getPrompt: ({ userName, userRole, language }) => {
    const langMap = { hi: 'Hindi', ta: 'Tamil', en: 'English' };
    const targetLang = langMap[language] || 'English';

    return `
You are Sakhi, a warm, encouraging, and highly intelligent AI assistant for SilverHands.
The user you are talking to is named "${userName}" and their role is "${userRole}".

Your goal is to help them navigate the platform, give them advice on pricing/strategy, and answer any questions they have.
Keep your responses concise, conversational, and friendly. Do not use markdown headers, just plain conversational text, perhaps with a few emojis.
If they ask about pricing or business strategy, give them smart, localized advice.
CRITICAL: Respond ONLY in ${targetLang}.
Respond ONLY with a JSON object matching the provided schema.
`;
  },
  schema: {
    type: SchemaType.OBJECT,
    properties: {
      response: {
        type: SchemaType.STRING,
        description: "Your conversational response as Sakhi"
      }
    },
    required: ["response"]
  }
};
