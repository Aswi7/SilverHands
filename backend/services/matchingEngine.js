const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');
const Match = require('../models/Match');

// Configurable weights (Total = 1.0)
const WEIGHTS = {
  w1_skill: 0.50,
  w2_proximity: 0.20,
  w3_rating: 0.20,
  w4_experience: 0.10
};

// Nearby cities lookup map for matching
const NEARBY_CITIES_MAP = {
  'delhi': ['delhi', 'noida', 'gurugram'],
  'noida': ['noida', 'delhi', 'gurugram'],
  'gurugram': ['gurugram', 'delhi', 'noida'],
  'mumbai': ['mumbai', 'pune'],
  'pune': ['pune', 'mumbai'],
  'bengaluru': ['bengaluru'],
  'chennai': ['chennai'],
  'hyderabad': ['hyderabad'],
  'kolkata': ['kolkata']
};

const getNearbyCities = (city) => {
  const normalized = (city || '').trim().toLowerCase();
  return NEARBY_CITIES_MAP[normalized] || [normalized];
};

/**
 * Core AI Matching Logic for SilverHands
 * 
 * 1. Executes Atlas $vectorSearch to find semantically matching providers.
 * 2. Applies city filter for offline requests.
 * 3. Calculates the combined score based on weights.
 * 4. Saves results to the Match collection.
 * 
 * @param {string} opportunityId - The ID of the ServiceRequest
 * @returns {Array} - The ranked array of Match documents
 */
const findMatches = async (opportunityId) => {
  try {
    const opportunity = await ServiceRequest.findById(opportunityId);
    if (!opportunity) {
      throw new Error(`Opportunity not found: ${opportunityId}`);
    }

    if (!opportunity.embedding || opportunity.embedding.length === 0) {
      console.warn(`Opportunity ${opportunityId} lacks an embedding. Skipping semantic search.`);
      return [];
    }

    // Pipeline Stage 1: Vector Search
    // We must run $vectorSearch first due to MongoDB Atlas constraints.
    const vectorSearchStage = {
      $vectorSearch: {
        index: "vector_index",
        path: "embedding",
        queryVector: opportunity.embedding,
        numCandidates: 100,
        limit: 100,
        filter: {
          role: "provider"
        }
      }
    };

    // Pipeline Stage 2: City Filter (Hard Filter)
    // If the mode is 'offline', we only want providers within same or nearby cities.
    const matchStage = {};
    if (opportunity.mode === 'offline' && opportunity.city) {
      const allowedCities = getNearbyCities(opportunity.city);
      matchStage.city = { $in: allowedCities };
    }

    // Pipeline Stage 3: Projection to extract the vector search score
    const projectStage = {
      $set: {
        searchScore: { $meta: "vectorSearchScore" }
      }
    };

    // Build the aggregation pipeline
    const pipeline = [vectorSearchStage];
    
    // Add city filter if applicable
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }
    
    pipeline.push(projectStage);

    // Run the aggregation on the User model
    const candidates = await User.aggregate(pipeline);

    const newMatches = [];

    for (const provider of candidates) {
      // 1. Skill Similarity (0 to 100)
      const rawVectorScore = provider.searchScore || 0;
      const skillScore = Math.max(0, rawVectorScore) * 100;

      // 2. Proximity Score (0 to 100) based on city matching
      let proximityScore = 100;
      if (opportunity.mode === 'offline') {
        const oppCity = (opportunity.city || '').trim().toLowerCase();
        const provCity = (provider.city || '').trim().toLowerCase();
        
        if (oppCity === provCity) {
          proximityScore = 100; // Same City
        } else {
          const allowed = NEARBY_CITIES_MAP[oppCity] || [];
          if (allowed.includes(provCity)) {
            proximityScore = 70; // Nearby City
          } else {
            proximityScore = 0; // Far City
          }
        }
      }

      // 3. Rating Score (0 to 100)
      // Since ratings aren't implemented in the DB yet, assume a strong default (4.5/5 -> 90)
      const ratingScore = 90;

      // 4. Experience Level (0 to 100)
      let experienceScore = 50; // Default
      if (provider.skills && Array.isArray(provider.skills)) {
        // Find if the provider has a skill matching the opportunity's category
        const matchingSkill = provider.skills.find(s => s.category === opportunity.category);
        if (matchingSkill) {
          const lvl = (matchingSkill.experienceLevel || '').toLowerCase();
          if (lvl.includes('expert') || lvl.includes('senior') || lvl.includes('advanced')) experienceScore = 100;
          else if (lvl.includes('intermediate') || lvl.includes('mid')) experienceScore = 75;
          else if (lvl.includes('beginner') || lvl.includes('junior')) experienceScore = 40;
          else experienceScore = 60;
        }
      }

      // Compute final weighted score
      const finalScore = (
        (skillScore * WEIGHTS.w1_skill) +
        (proximityScore * WEIGHTS.w2_proximity) +
        (ratingScore * WEIGHTS.w3_rating) +
        (experienceScore * WEIGHTS.w4_experience)
      );

      const scoreBreakdown = {
        skillSimilarity: Math.round(skillScore),
        proximityScore: Math.round(proximityScore),
        rating: Math.round(ratingScore),
        experienceLevel: Math.round(experienceScore)
      };

      // Upsert the Match document
      const matchDoc = await Match.findOneAndUpdate(
        { opportunity: opportunity._id, provider: provider._id },
        {
          score: Math.round(finalScore),
          scoreBreakdown
        },
        { upsert: true, new: true }
      );

      newMatches.push(matchDoc);
    }

    // Return matches sorted by score descending
    newMatches.sort((a, b) => b.score - a.score);
    return newMatches;

  } catch (error) {
    console.error('Error in findMatches:', error);
    throw error;
  }
};

module.exports = {
  findMatches,
  WEIGHTS
};
