const dotenv = require('dotenv');
dotenv.config({ path: 'backend/.env' });

const mongoose = require('mongoose');
const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');
const { updateUserProfile } = require('../controllers/userController');
const { createServiceRequest, updateServiceRequest } = require('../controllers/requestController');

console.log("Simulating Customer profile updates and matchmaking request synchronization...");

const runProfileTest = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/silverhands_local');
    console.log('MongoDB Connected.');

    // 1. Setup mock customer
    let customer = await User.findOne({ role: 'customer' });
    if (!customer) {
      console.log("Creating temporary test customer...");
      customer = await User.create({
        name: "Old Name",
        email: `customer_${Date.now()}@example.com`,
        password: "password123",
        role: "customer",
        phone: "0987654321",
        city: "delhi",
        location: { type: "Point", coordinates: [77.1025, 28.7041] }
      });
    }

    // 2. Clear old request
    await ServiceRequest.deleteMany({ customerId: customer._id });

    // Mock response helper
    const simulateCall = async (handler, reqBody, params = {}) => {
      const req = {
        user: customer,
        body: reqBody,
        params
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
      await handler(req, res);
      if (statusCode >= 400) {
        throw new Error(`Handler failed with code ${statusCode}: ${resData?.message || JSON.stringify(resData)}`);
      }
      return resData;
    };

    // Step A: Update customer profile details
    console.log("\n--- Step A: Update User Profile Details ---");
    const updatedUser = await simulateCall(updateUserProfile, {
      name: "Meera Krishnan",
      city: "coimbatore",
      phone: customer.phone,
      email: customer.email
    });
    console.log(`Success: updated name in DB to "${updatedUser.name}" and city to "${updatedUser.city}"`);

    // Reload customer
    customer = await User.findById(customer._id);

    // Step B: Create a service request to simulate profile's service details
    console.log("\n--- Step B: Create Service Request ---");
    const newRequest = await simulateCall(createServiceRequest, {
      title: "Home Cooking & Assistance",
      category: "cooking",
      description: "Looking for help with lunch prep and kitchen activities.",
      location: { longitude: 76.9558, latitude: 11.0168 },
      rate: "₹1,500",
      timing: "Morning",
      mode: "offline",
      city: "coimbatore"
    });
    console.log(`Success: created request ID ${newRequest._id} with title "${newRequest.title}"`);

    // Step C: Update the request details (simulating editing profile again)
    console.log("\n--- Step C: Update Service Request (matchmaking sync) ---");
    const updatedRequest = await simulateCall(updateServiceRequest, {
      title: "Premium Home Cooking",
      category: "cooking",
      description: "Need help preparing South Indian vegetarian food.",
      rate: "₹2,000",
      timing: "Morning",
      mode: "offline",
      city: "coimbatore"
    }, { id: newRequest._id });

    console.log(`Success: updated request title to "${updatedRequest.title}"`);
    console.log(`Success: requirements updated to: "${updatedRequest.description}"`);

    console.log("\n==============================================");
    console.log("Customer Profile Save and Matchmaking Recalculation simulation passed!");
    console.log("==============================================");
    process.exit(0);

  } catch (err) {
    console.error("Simulation script failed:", err);
    process.exit(1);
  }
};

runProfileTest();
