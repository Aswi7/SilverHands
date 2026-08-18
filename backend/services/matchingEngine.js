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

    let candidates = [];
    try {
      // Run the aggregation on the User model (Atlas Vector Search)
      candidates = await User.aggregate(pipeline);
    } catch (aggErr) {
      console.warn("Atlas Vector search failed, using fallback query engine:", aggErr.message);
    }

    // Fallback if vector search returns 0 candidates or fails
    if (!candidates || candidates.length === 0) {
      const filter = { role: 'provider' };
      if (opportunity.mode === 'offline' && opportunity.city) {
        const allowedCities = getNearbyCities(opportunity.city);
        filter.city = { $in: allowedCities.map(c => new RegExp(`^${c.trim()}$`, 'i')) };
      }
      candidates = await User.find(filter).lean();
    }

    console.log(`[MATCHMAKING ENGINE] Executing findMatches for Opportunity ID: ${opportunity._id}`);
    console.log(`[MATCHMAKING ENGINE] Customer ID: ${opportunity.customer} | Category: "${opportunity.category}" | Mode: "${opportunity.mode}" | City: "${opportunity.city}"`);
    console.log(`[MATCHMAKING ENGINE] Provider candidates evaluated: ${candidates.length}`);

    const newMatches = [];

    for (const provider of candidates) {
      // 1. Skill Similarity (0 to 100)
      let skillScore = 0;
      if (provider.searchScore !== undefined) {
        const rawVectorScore = provider.searchScore || 0;
        skillScore = Math.max(0, rawVectorScore) * 100;
      } else {
        // Fallback: simple text keyword matching based on skills category or name
        const oppCategory = (opportunity.category || '').toLowerCase();
        const oppTitle = (opportunity.title || '').toLowerCase();
        const oppDesc = (opportunity.description || '').toLowerCase();
        
        const hasSkill = provider.skills && provider.skills.some(s => {
          const sName = (s.skillName || '').toLowerCase();
          const sCat = (s.category || '').toLowerCase();
          return sName.includes(oppCategory) || sCat.includes(oppCategory) ||
                 oppTitle.includes(sName) || oppDesc.includes(sName);
        });
        skillScore = hasSkill ? 95 : 30;
      }

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

      // Upsert the Match document (preserve status if document already exists)
      const matchDoc = await Match.findOneAndUpdate(
        {
          $or: [
            { customerId: opportunity.customerId || opportunity.customer, providerId: provider._id, requestId: opportunity._id },
            { opportunity: opportunity._id, provider: provider._id }
          ]
        },
        {
          $set: {
            customerId: opportunity.customerId || opportunity.customer,
            providerId: provider._id,
            requestId: opportunity._id,
            score: Math.round(finalScore),
            scoreBreakdown
          },
          $setOnInsert: {
            status: 'PENDING'
          }
        },
        { upsert: true, new: true }
      );

      newMatches.push(matchDoc);
      console.log(`[MATCHMAKING ENGINE] Created Match -> Match ID: ${matchDoc._id} | Request ID: ${opportunity._id} | Customer ID: ${opportunity.customer} | Provider ID: ${provider._id} | Score: ${matchDoc.score}`);
    }

    console.log(`[MATCHMAKING ENGINE] Completed findMatches for Request ID ${opportunity._id} -> Persisted ${newMatches.length} matches in MongoDB.`);

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
