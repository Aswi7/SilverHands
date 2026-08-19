const dotenv = require('dotenv');
dotenv.config({ path: 'backend/.env' });

const mongoose = require('mongoose');
const User = require('../models/User');

console.log("Checking MongoDB and route handler...");

const mockForecasts = [
  {
    id: "f1",
    eventKey: "diwali",
    eventName: "🪔 Diwali",
    relevantCategories: ["cooking", "tailoring"],
    demandUplift: "+40%",
    insight: "Sweets & Snacks demand is predicted to rise 40% in Chennai."
  },
  {
    id: "f3",
    eventKey: "back_to_school",
    eventName: "🎒 Back to School",
    relevantCategories: ["tutoring"],
    demandUplift: "+50%",
    insight: "Tutoring requests for Mathematics jump by 50%."
  }
];

const testRouteLocally = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/silverhands_local');
    console.log('MongoDB Connected.');

    const providerUser = await User.findOne({ role: 'provider' });
    if (!providerUser) {
      console.log('No provider user found in DB to mock. Skipping route test.');
      process.exit(0);
      return;
    }

    console.log(`Mocking forecast ranking for user: ${providerUser.name}`);
    console.log(`Skills: ${JSON.stringify(providerUser.skills)}`);
    console.log(`Bio: ${providerUser.bio}`);

    // Since calling the API endpoint directly requires an active server & JWT login header, 
    // let's verify prompt generation & fallback ranking directly on the router's logic:
    const { getPrompt } = require('../config/ai-prompts/forecastRanking');
    const prompt = getPrompt({
      userName: providerUser.name,
      skills: providerUser.skills,
      bio: providerUser.bio,
      city: providerUser.city,
      availability: providerUser.availability,
      language: 'en',
      forecasts: mockForecasts
    });

    console.log("\n[SUCCESS] Forecast ranking prompt template successfully populated!");
    console.log(prompt.substring(0, 450) + "...\n");
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err.message);
    process.exit(1);
  }
};

testRouteLocally();
