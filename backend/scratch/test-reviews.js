const dotenv = require('dotenv');
dotenv.config({ path: 'backend/.env' });

const mongoose = require('mongoose');
const User = require('../models/User');
const Match = require('../models/Match');
const Review = require('../models/Review');
const ProviderProfile = require('../models/ProviderProfile');
const { createReview } = require('../controllers/reviewController');

console.log("Simulating Provider Ratings and Reviews integration...");

const runReviewTest = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/silverhands_local');
    console.log('MongoDB Connected.');

    // 1. Setup mock customer and provider
    let customer = await User.findOne({ role: 'customer' });
    if (!customer) {
      customer = await User.create({
        name: "Test Customer",
        email: `cust_${Date.now()}@example.com`,
        password: "password123",
        role: "customer",
        phone: `999000${Math.floor(1000 + Math.random()*9000)}`,
        city: "delhi",
        location: { type: "Point", coordinates: [77.1025, 28.7041] }
      });
    }

    let provider = await User.findOne({ role: 'provider' });
    if (!provider) {
      provider = await User.create({
        name: "Test Provider",
        email: `prov_${Date.now()}@example.com`,
        password: "password123",
        role: "provider",
        phone: `888000${Math.floor(1000 + Math.random()*9000)}`,
        city: "delhi",
        location: { type: "Point", coordinates: [77.1025, 28.7041] }
      });
    }

    // Reset old data to avoid clutter
    await Review.deleteMany({ targetUserId: provider._id });
    await ProviderProfile.deleteMany({ userId: provider._id });
    await Match.deleteMany({ providerId: provider._id });

    // Mock response simulator
    const simulateReviewCall = async (body) => {
      const req = {
        user: customer,
        body
      };
      let resData = null;
      let statusCode = 200;
      const res = {
        status: (code) => {
          statusCode = code;
          return {
            json: (data) => {
              resData = data;
              return res;
            }
          };
        }
      };
      await createReview(req, res);
      return { statusCode, data: resData };
    };

    const ServiceRequest = require('../models/ServiceRequest');
    const createMockRequest = async (title) => {
      return await ServiceRequest.create({
        customerId: customer._id,
        title,
        category: "cooking",
        description: "Need help learning baking",
        location: { type: "Point", coordinates: [77.1025, 28.7041] },
        city: "delhi",
        timing: "Morning",
        mode: "offline"
      });
    };

    const mockRequest1 = await createMockRequest("Request 1");
    const mockRequest2 = await createMockRequest("Request 2");
    const mockRequest3 = await createMockRequest("Request 3");

    // Step 1: Create completed match
    const completedMatch1 = await Match.create({
      customerId: customer._id,
      providerId: provider._id,
      requestId: mockRequest1._id,
      status: "COMPLETED",
      score: 95
    });
    console.log(`Created completed Match 1: ${completedMatch1._id}`);

    // Step 2: Attempt invalid rating (rating = 6)
    console.log("\n--- Test A: Invalid Rating Validation (Value: 6) ---");
    const testA = await simulateReviewCall({
      applicationId: completedMatch1._id,
      rating: 6,
      comment: "Superb!"
    });
    if (testA.statusCode === 400) {
      console.log("Success: validation rejected rating of 6.");
    } else {
      throw new Error(`Failed: expected 400 validation error, got ${testA.statusCode}`);
    }

    // Step 3: Attempt invalid rating (rating = 4.5)
    console.log("\n--- Test B: Invalid Rating Validation (Value: 4.5) ---");
    const testB = await simulateReviewCall({
      applicationId: completedMatch1._id,
      rating: 4.5,
      comment: "Superb!"
    });
    if (testB.statusCode === 400) {
      console.log("Success: validation rejected decimal rating of 4.5.");
    } else {
      throw new Error(`Failed: expected 400 validation error, got ${testB.statusCode}`);
    }

    // Step 4: Submit a valid 5-star review
    console.log("\n--- Test C: Submit Valid 5-Star Review ---");
    const testC = await simulateReviewCall({
      applicationId: completedMatch1._id,
      rating: 5,
      comment: "Very helpful and professional."
    });
    if (testC.statusCode === 201) {
      console.log("Success: Review posted!");
      // Check average rating
      const profile = await ProviderProfile.findOne({ userId: provider._id });
      console.log(`Saved rating average in ProviderProfile: ${profile.rating} ★`);
      if (profile.rating !== 5.0) {
        throw new Error(`Failed: Expected average rating to be 5.0, got ${profile.rating}`);
      }
    } else {
      throw new Error(`Failed: expected 201 created, got ${testC.statusCode}: ${testC.data.message}`);
    }

    // Step 5: Duplicate review prevention
    console.log("\n--- Test D: Duplicate Review Submission Prevention ---");
    const testD = await simulateReviewCall({
      applicationId: completedMatch1._id,
      rating: 4,
      comment: "Attempting duplicate review"
    });
    if (testD.statusCode === 400) {
      console.log(`Success: duplicate rejected with message "${testD.data.message}"`);
    } else {
      throw new Error(`Failed: expected 400 duplicate error, got ${testD.statusCode}`);
    }

    // Step 6: Verify match status COMPLETED requirement
    console.log("\n--- Test E: Incomplete Match Review Rejection ---");
    const activeMatch = await Match.create({
      customerId: customer._id,
      providerId: provider._id,
      requestId: mockRequest2._id,
      status: "CONFIRMED",
      score: 80
    });
    const testE = await simulateReviewCall({
      applicationId: activeMatch._id,
      rating: 5,
      comment: "Reviewing active gig"
    });
    if (testE.statusCode === 400) {
      console.log(`Success: rejected review for CONFIRMED status with message: "${testE.data.message}"`);
    } else {
      throw new Error(`Failed: expected 400 status error, got ${testE.statusCode}`);
    }

    // Step 7: Post a second valid review and verify average recalculation
    console.log("\n--- Test F: Average Rating Recalculation (5.0 + 3.0 = 4.0) ---");
    const completedMatch2 = await Match.create({
      customerId: customer._id,
      providerId: provider._id,
      requestId: mockRequest3._id,
      status: "COMPLETED",
      score: 90
    });
    const testF = await simulateReviewCall({
      applicationId: completedMatch2._id,
      rating: 3,
      comment: "Average service this time."
    });
    if (testF.statusCode === 201) {
      const profile = await ProviderProfile.findOne({ userId: provider._id });
      console.log(`New rating average in ProviderProfile: ${profile.rating} ★`);
      if (profile.rating !== 4.0) {
        throw new Error(`Failed: expected recalculated rating average 4.0, got ${profile.rating}`);
      }
      console.log("Success: average rating calculated and updated correctly!");
    } else {
      throw new Error(`Failed: expected 201 created, got ${testF.statusCode}: ${testF.data.message}`);
    }

    console.log("\n==============================================");
    console.log("ALL Ratings & Reviews Integration Tests Passed!");
    console.log("==============================================");
    process.exit(0);
  } catch (err) {
    console.error("Test execution failed:", err.message);
    process.exit(1);
  }
};

runReviewTest();
