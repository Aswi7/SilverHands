const dotenv = require('dotenv');
dotenv.config({ path: 'backend/.env' });

const mongoose = require('mongoose');
const Match = require('../models/Match');
const Earning = require('../models/Earning');
const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');

console.log("Simulating SilverHands upgraded state machine transitions and persistent earnings...");

const runWorkflowTest = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/silverhands_local');
    console.log('MongoDB Connected.');

    // 1. Setup mock provider, customer, service request
    let provider = await User.findOne({ role: 'provider' });
    let customer = await User.findOne({ role: 'customer' });

    if (!provider || !customer) {
      console.log("Creating temporary test users...");
      provider = provider || await User.create({
        name: "Test Provider",
        email: `provider_${Date.now()}@example.com`,
        password: "password123",
        role: "provider",
        phone: "1234567890",
        city: "Delhi"
      });
      customer = customer || await User.create({
        name: "Test Customer",
        email: `customer_${Date.now()}@example.com`,
        password: "password123",
        role: "customer",
        phone: "0987654321",
        city: "Delhi"
      });
    }

    let request = await ServiceRequest.findOne({ customerId: customer._id });
    if (!request) {
      console.log("Creating temporary test request...");
      request = await ServiceRequest.create({
        customerId: customer._id,
        title: "Test Meal Prep",
        description: "Need home cooking services",
        category: "cooking",
        rate: "₹1,500",
        location: { type: "Point", coordinates: [77.1025, 28.7041] }
      });
    }

    // 2. Clean previous test matches
    await Match.deleteMany({ requestId: request._id });
    await Earning.deleteMany({ customerId: customer._id });

    // 3. Create fresh match in APPLIED status
    const match = await Match.create({
      requestId: request._id,
      providerId: provider._id,
      customerId: customer._id,
      score: 95,
      status: 'APPLIED',
      providerConfirmed: false,
      customerConfirmed: false,
      paymentReceived: false
    });
    console.log(`Created match in state: ${match.status}`);

    // Mock request validation handler (simulating updateMatchStatus logic)
    const simulateStatusUpdate = async (matchId, statusVal, userObj, bodyParams = {}) => {
      // Simulate backend endpoint PUT /api/matches/:id/status
      const req = {
        params: { id: matchId },
        body: { status: statusVal, ...bodyParams },
        user: userObj
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

      // Import updateMatchStatus directly from controller for absolute realism
      const { updateMatchStatus } = require('../controllers/matchController');
      await updateMatchStatus(req, res);
      
      if (statusCode !== 200) {
        throw new Error(`Simulation failed with status ${statusCode}: ${resData?.message || JSON.stringify(resData)}`);
      }
      return resData;
    };

    // Test transition 1: Provider accepts APPLIED
    console.log("\n--- Testing: APPLIED -> ACCEPTED ---");
    let updated = await simulateStatusUpdate(match._id, 'ACCEPTED', provider);
    console.log(`Success: status is now ${updated.status}`);

    // Test transition 2: Provider confirms (stage ACCEPTED, providerConfirmed=true, customerConfirmed=false, status remains ACCEPTED)
    console.log("\n--- Testing: Provider Confirms ---");
    updated = await simulateStatusUpdate(match._id, 'CONFIRMED', provider);
    console.log(`Success: status remains ${updated.status}. providerConfirmed=${updated.providerConfirmed}, customerConfirmed=${updated.customerConfirmed}`);
    if (updated.status !== 'ACCEPTED') {
      throw new Error("FAIL: status should remain ACCEPTED until customer also confirms.");
    }

    // Test transition 3: Customer confirms (both true -> status automatically becomes CONFIRMED)
    console.log("\n--- Testing: Customer Confirms ---");
    updated = await simulateStatusUpdate(match._id, 'CONFIRMED', customer);
    console.log(`Success: status is now ${updated.status}. providerConfirmed=${updated.providerConfirmed}, customerConfirmed=${updated.customerConfirmed}`);
    if (updated.status !== 'CONFIRMED') {
      throw new Error("FAIL: status should be CONFIRMED since both parties confirmed.");
    }

    // Test transition 4: Provider marks COMPLETED without paymentReceived flag (should fail)
    console.log("\n--- Testing: Provider Completes without paymentReceived flag (Should Fail) ---");
    try {
      await simulateStatusUpdate(match._id, 'COMPLETED', provider, { paymentReceived: false });
      console.error("FAIL: backend allowed completion without paymentReceived!");
      process.exit(1);
    } catch (err) {
      console.log(`Expected error caught: ${err.message}`);
    }

    // Test transition 5: Customer marks COMPLETED (should fail - role restriction)
    console.log("\n--- Testing: Customer Completes (Should Fail) ---");
    try {
      await simulateStatusUpdate(match._id, 'COMPLETED', customer, { paymentReceived: true });
      console.error("FAIL: backend allowed customer to mark service completed!");
      process.exit(1);
    } catch (err) {
      console.log(`Expected error caught: ${err.message}`);
    }

    // Test transition 6: Provider marks COMPLETED + paymentReceived = true (should succeed, create Earning)
    console.log("\n--- Testing: Provider Completes + Payment Received ---");
    updated = await simulateStatusUpdate(match._id, 'COMPLETED', provider, { paymentReceived: true });
    console.log(`Success: status is now ${updated.status}. paymentReceived=${updated.paymentReceived}, agreedAmount=${updated.agreedAmount}`);
    
    // Verify earning record in database
    const earnings = await Earning.find({ applicationId: match._id });
    console.log(`Earnings records found in DB: ${earnings.length}`);
    if (earnings.length !== 1) {
      throw new Error(`FAIL: Expected exactly 1 Earning record, found ${earnings.length}`);
    }
    const earning = earnings[0];
    console.log(`Verified Earning: Amount = ₹${earning.amount}, Service = "${earning.serviceName}", customerId = ${earning.customerId}`);

    // Test transition 7: Duplicate completion request (should be idempotent, no extra Earning)
    console.log("\n--- Testing: Duplicate Completion (Idempotency) ---");
    try {
      await simulateStatusUpdate(match._id, 'COMPLETED', provider, { paymentReceived: true });
      console.log("Duplicate request handled cleanly.");
    } catch (err) {
      console.log("Notice: duplicate update match status request returned error as terminal state, which is also fine.");
    }
    const finalEarnings = await Earning.find({ applicationId: match._id });
    console.log(`Earning records count after retry: ${finalEarnings.length}`);
    if (finalEarnings.length !== 1) {
      throw new Error(`FAIL: Idempotency check failed! Earnings record was duplicated. Count is ${finalEarnings.length}`);
    }
    console.log("SUCCESS: Idempotency test passed (0 duplicates created).");

    // Test transition 8: Rejection during confirmation stage (ACCEPTED -> REJECTED)
    console.log("\n--- Testing: Immediate Rejection from ACCEPTED stage ---");
    await Match.deleteMany({ requestId: request._id });
    const match2 = await Match.create({
      requestId: request._id,
      providerId: provider._id,
      customerId: customer._id,
      score: 90,
      status: 'ACCEPTED',
      providerConfirmed: false,
      customerConfirmed: false
    });
    
    // Customer rejects
    const rejectedMatch = await simulateStatusUpdate(match2._id, 'REJECTED', customer);
    console.log(`Success: status is now ${rejectedMatch.status}`);
    if (rejectedMatch.status !== 'REJECTED') {
      throw new Error(`FAIL: Match should have transitioned to REJECTED immediately.`);
    }

    console.log("\n==============================================");
    console.log("ALL Upgraded State Machine workflow tests PASSED!");
    console.log("==============================================");
    process.exit(0);

  } catch (err) {
    console.error("Simulation script failed:", err);
    process.exit(1);
  }
};

runWorkflowTest();
