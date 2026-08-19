const dotenv = require('dotenv');
dotenv.config({ path: 'backend/.env' });

const forecasts = [
  {
    id: "f1",
    eventKey: "diwali",
    eventName: "🪔 Diwali",
    relevantCategories: ["cooking"]
  },
  {
    id: "f3",
    eventKey: "back_to_school",
    eventName: "🎒 Back to School",
    relevantCategories: ["tutoring"]
  }
];

// Verify local scoring fallback logic directly
const runFallbackTest = () => {
  console.log("Running local fallback scoring test...");
  
  const mockUser = {
    name: "Asha Devi",
    skills: [{ category: "cooking", skillName: "Cooking Diwali Sweets", experienceLevel: "Expert" }],
    bio: "I love cooking home-cooked sweets and traditional snacks.",
    city: "Chennai",
    availability: true
  };

  const rankings = forecasts.map(event => {
    let score = 30;
    const userCategories = mockUser.skills.map(s => s.category.toLowerCase());
    const userSkills = mockUser.skills.map(s => s.skillName.toLowerCase());
    const userBio = mockUser.bio.toLowerCase();

    const hasCategoryMatch = event.relevantCategories.some(cat => userCategories.includes(cat.toLowerCase()));
    const hasSkillMatch = event.relevantCategories.some(cat => userSkills.some(sk => sk.includes(cat.toLowerCase())));

    if (hasCategoryMatch || hasSkillMatch) score += 45;
    if (userBio.includes(event.eventKey)) score += 15;
    if (mockUser.availability) score += 5;

    return {
      id: event.id,
      relevanceScore: score,
      explanation: `Matched because of ${event.relevantCategories[0]}`
    };
  });

  console.log("Calculated mock fallback rankings:", rankings);
  if (rankings[0].relevanceScore === 95 && rankings[1].relevanceScore === 35) {
    console.log("SUCCESS: Fallback scoring weights are perfectly balanced!");
  } else {
    console.warn("WARNING: Fallback scoring mismatch. Got:", rankings[0].relevanceScore);
  }
};

runFallbackTest();
