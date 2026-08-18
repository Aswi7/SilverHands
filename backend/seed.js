const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const ServiceRequest = require('./models/ServiceRequest');
const { generateEmbedding } = require('./config/gemini');

dotenv.config();

const seed = async () => {
  try {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('MongoDB Connected for seeding...');
    } catch (dbErr) {
      console.warn('MongoDB Primary Connection Error during seeding:', dbErr.message);
      console.log('Attempting to fallback to local MongoDB instance...');
      await mongoose.connect('mongodb://127.0.0.1:27017/silverhands_local');
      console.log('MongoDB Fallback Connected: 127.0.0.1');
    }

    // Clear existing data
    await User.deleteMany({});
    await ServiceRequest.deleteMany({});
    console.log('Cleared existing data.');

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Create Customer (Ramesh in Connaught Place, Delhi)
    const customer = await User.create({
      name: 'Ramesh Kumar',
      phone: '9876543210',
      password: hashedPassword,
      role: 'customer',
      preferredLanguage: 'hi',
      city: 'Delhi',
      location: {
        type: 'Point',
        coordinates: [77.2197, 28.6304] // [longitude, latitude]
      }
    });
    console.log('Created customer:', customer.name);

    // Generate Suresh embedding
    console.log('Generating embedding for Suresh Patel...');
    const sureshText = "Skills: Smartphones, Errands. Bio: Retired teacher, happy to help with technology support and daily tasks.";
    const sureshEmbedding = await generateEmbedding(sureshText).catch(() => null);

    // Create Provider 1 (Suresh - 500m away from Ramesh)
    const providerNearby = await User.create({
      name: 'Suresh Patel',
      phone: '8888888888',
      password: hashedPassword,
      role: 'provider',
      preferredLanguage: 'en',
      city: 'Delhi',
      location: {
        type: 'Point',
        coordinates: [77.2150, 28.6280] // [longitude, latitude]
      },
      skills: [
        { skillName: 'Smartphones', experienceLevel: 'Expert', confidence: 1.0 },
        { skillName: 'Errands', experienceLevel: 'Intermediate', confidence: 1.0 }
      ],
      bio: 'Retired teacher, happy to help with technology support and daily tasks.',
      availability: true,
      isOnboarded: true,
      embedding: sureshEmbedding
    });
    console.log('Created nearby provider:', providerNearby.name);

    // Generate Amit embedding
    console.log('Generating embedding for Amit Sharma...');
    const amitText = "Skills: Gardening. Bio: Homemaker who loves gardening and can help you maintain your plants.";
    const amitEmbedding = await generateEmbedding(amitText).catch(() => null);

    // Create Provider 2 (Amit - 10km away from Ramesh)
    const providerFar = await User.create({
      name: 'Amit Sharma',
      phone: '7777777777',
      password: hashedPassword,
      role: 'provider',
      preferredLanguage: 'en',
      city: 'Pune',
      location: {
        type: 'Point',
        coordinates: [77.3000, 28.6000] // [longitude, latitude]
      },
      skills: [
        { skillName: 'Gardening', experienceLevel: 'Expert', confidence: 1.0 }
      ],
      bio: 'Homemaker who loves gardening and can help you maintain your plants.',
      availability: true,
      isOnboarded: true,
      embedding: amitEmbedding
    });
    console.log('Created far provider:', providerFar.name);

    // Generate embeddings for requests
    console.log('Generating embedding for Request 1...');
    const req1Text = "Category: tech. Description: Need someone to explain WhatsApp and digital payments step by step.";
    const req1Embedding = await generateEmbedding(req1Text).catch(() => null);

    // Create Service Requests by Ramesh
    const req1 = await ServiceRequest.create({
      customer: customer._id,
      title: 'Need help setting up a smartphone',
      description: 'Need someone to explain WhatsApp and digital payments step by step.',
      category: 'tech',
      city: 'Delhi',
      location: {
        type: 'Point',
        coordinates: [77.2197, 28.6304]
      },
      status: 'pending',
      embedding: req1Embedding
    });

    console.log('Generating embedding for Request 2...');
    const req2Text = "Category: errands. Description: Looking for assistance to carry heavy groceries from the local market.";
    const req2Embedding = await generateEmbedding(req2Text).catch(() => null);

    const req2 = await ServiceRequest.create({
      customer: customer._id,
      title: 'Need help buying groceries',
      description: 'Looking for assistance to carry heavy groceries from the local market.',
      category: 'errands',
      city: 'Delhi',
      location: {
        type: 'Point',
        coordinates: [77.2197, 28.6304]
      },
      status: 'pending',
      embedding: req2Embedding
    });
    console.log('Created service requests:', [req1.title, req2.title]);

    console.log('Seeding complete. Exit code 0.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

seed();
