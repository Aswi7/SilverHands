require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');
const Application = require('../models/Application');

const run = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/silverhands_local');
    console.log('MongoDB Connected.');

    // Find the provider user
    const provider = await User.findOne({ role: 'provider' });
    if (!provider) {
      console.log('No provider found.');
      process.exit(0);
    }
    console.log(`Provider: ${provider.name} (ID: ${provider._id}, Onboarded: ${provider.isOnboarded}, City: ${provider.city})`);

    // Let's test what getNearbyRequests logic does:
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

    const userCity = provider.city || 'delhi';
    const allowedCities = getNearbyCities(userCity);
    console.log('Allowed cities:', allowedCities);

    const requests = await ServiceRequest.find({
      status: 'pending',
      city: { $in: allowedCities }
    }).populate('customer', 'name phone').lean();

    console.log(`Found ${requests.length} pending requests in allowed cities.`);
    requests.forEach(r => {
      console.log(`- Request: ${r.title} (ID: ${r._id}, City: ${r.city}, Customer: ${r.customer?.name})`);
    });

    // Test applications for this provider
    const apps = await Application.find({
      $or: [{ providerId: provider._id }, { employerId: provider._id }]
    }).populate('providerId employerId opportunityId').lean();

    console.log(`Found ${apps.length} applications for provider.`);
    apps.forEach(app => {
      console.log(`- App ID: ${app._id}, Status: ${app.status}, Provider populated: ${!!app.providerId}, Employer populated: ${!!app.employerId}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

run();
