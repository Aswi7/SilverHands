// Test verification script for Sakhi AI Multilingual Capabilities

console.log("Starting Sakhi AI Multilingual verification...");

// Mock inputs across three languages
const testInputs = [
  {
    language: 'en',
    message: 'I am looking for cooking work.',
    expectedContains: ['cook', 'kitchen', 'recipe', 'food', 'pricing', 'listing']
  },
  {
    language: 'ta',
    message: 'எனக்கு வீட்டில் சமைக்க வேலை தேவை',
    expectedContains: ['சமையல்', 'வேலை', 'உணவு', 'விலை']
  },
  {
    language: 'hi',
    message: 'मुझे घर पर खाना बनाने का काम चाहिए',
    expectedContains: ['खाना', 'रसोई', 'काम', 'मूल्य']
  },
  {
    language: 'ta',
    message: 'எனக்கு cooking வேலை வேண்டும்', // Mixed-language input (Tanglish)
    expectedContains: ['சமையல்', 'வேலை']
  }
];

// Since running full HTTP request requires running server, let's test the prompt generation directly
const { getPrompt } = require('../config/ai-prompts/sakhiChat');

let passes = 0;
let fails = 0;

testInputs.forEach((test, idx) => {
  try {
    const prompt = getPrompt({
      userName: 'Asha Devi',
      userRole: 'provider',
      language: test.language,
      userProfile: {
        skills: [{ category: 'cooking', skillName: 'Cooking', experienceLevel: 'Expert', confidence: 0.95 }],
        city: 'Coimbatore',
        availability: true,
        bio: 'Local cooking helper'
      }
    });

    // Check that profile context is in prompt
    const hasName = prompt.includes('Asha Devi');
    const hasRole = prompt.includes('provider');
    const hasCity = prompt.includes('Coimbatore');
    const hasLang = prompt.includes(test.language === 'ta' ? 'Tamil' : test.language === 'hi' ? 'Hindi' : 'English');

    if (hasName && hasRole && hasCity && hasLang) {
      console.log(`[PASS] Test Case ${idx + 1} (${test.language}): Prompt generated correctly with user context and language.`);
      passes++;
    } else {
      console.error(`[FAIL] Test Case ${idx + 1} (${test.language}): Prompt missing key details.`);
      fails++;
    }
  } catch (err) {
    console.error(`[ERROR] Test Case ${idx + 1} failed with error:`, err.message);
    fails++;
  }
});

console.log(`\nTest Verification Results: ${passes} Passed, ${fails} Failed.`);
if (fails === 0) {
  console.log("SUCCESS: Multilingual prompt generation and context embedding verified!");
} else {
  process.exit(1);
}
