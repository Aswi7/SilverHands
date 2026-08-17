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

// Earth radius in km
const EARTH_RADIUS_KM = 6378.1;
const DEFAULT_RADIUS_KM = 10;

/**
 * Core AI Matching Logic for SilverHands
 * 
 * 1. Executes Atlas $vectorSearch to find semantically matching providers.
 * 2. Applies $geoWithin hard filter for offline requests.
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
    // We request up to 100 candidates to give us enough buffer to filter down later by distance.
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

    // Pipeline Stage 2: Geo Filter (Hard Filter)
    // If the mode is 'offline', we only want providers within the 10km radius.
    const matchStage = {};
    if (opportunity.mode === 'offline' && opportunity.location) {
      const [lon, lat] = opportunity.location.coordinates;
      // MongoDB $centerSphere uses radians. 
      // 10km radius / 6378.1 km earth radius
      const radiusInRadians = DEFAULT_RADIUS_KM / EARTH_RADIUS_KM;
      
      matchStage.location = {
        $geoWithin: {
          $centerSphere: [[lon, lat], radiusInRadians]
        }
      };
    }

    // Pipeline Stage 3: Projection to extract the vector search score
    const projectStage = {
      $set: {
        searchScore: { $meta: "vectorSearchScore" }
      }
    };

    // Build the aggregation pipeline
    const pipeline = [vectorSearchStage];
    
    // Add geo filter if applicable (and not empty)
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }
    
    pipeline.push(projectStage);

    // Run the aggregation on the User model
    const candidates = await User.aggregate(pipeline);

    const newMatches = [];
    const oppLon = opportunity.location?.coordinates?.[0] || 0;
    const oppLat = opportunity.location?.coordinates?.[1] || 0;

    // Helper: Haversine distance in km
    const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Radius of the earth in km
      const dLat = (lat2 - lat1) * (Math.PI / 180);  
      const dLon = (lon2 - lon1) * (Math.PI / 180); 
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2); 
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
      return R * c; // Distance in km
    };

    for (const provider of candidates) {
      // 1. Skill Similarity (0 to 100)
      // Vector search cosine similarity ranges from -1 to 1, or 0 to 1 depending on model. 
      // text-embedding-004 usually returns dot product which is between -1 and 1.
      // Math.max(0, score) normalizes negative vectors to 0.
      const rawVectorScore = provider.searchScore || 0;
      const skillScore = Math.max(0, rawVectorScore) * 100;

      // 2. Proximity Score (0 to 100)
      let proximityScore = 100;
      if (opportunity.mode === 'offline' && provider.location) {
        const pLon = provider.location.coordinates[0];
        const pLat = provider.location.coordinates[1];
        const distanceKm = getDistanceFromLatLonInKm(oppLat, oppLon, pLat, pLon);
        // Map 0km -> 100, 10km -> 0. Anything over 10km is 0 (though already filtered).
        proximityScore = Math.max(0, 100 - (distanceKm * 10));
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
