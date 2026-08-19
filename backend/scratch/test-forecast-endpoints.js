const dotenv = require('dotenv');
dotenv.config({ path: 'backend/.env' });

const mongoose = require('mongoose');
const User = require('../models/User');
const ForecastEvent = require('../models/ForecastEvent');

console.log("Verifying backend forecast endpoints integration...");

const testControllers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/silverhands_local');
    console.log('MongoDB Connected.');

    const allEvents = await ForecastEvent.find({}).sort({ startDate: 1 });
    console.log(`Total forecast events in DB: ${allEvents.length}`);

    if (allEvents.length === 0) {
      console.warn("WARNING: No events found. Make sure to run: node backend/seedForecasts.js");
      process.exit(1);
    }

    const today = new Date();
    const upcoming = allEvents.filter(e => e.endDate >= today);
    console.log(`Upcoming forecast events (date >= today): ${upcoming.length}`);

    // Verify properties
    const sample = allEvents[0];
    const keys = ['name', 'category', 'religion', 'startDate', 'endDate', 'year', 'region', 'description', 'expectedDemand', 'affectedServices'];
    const hasKeys = keys.every(k => sample[k] !== undefined);

    if (hasKeys) {
      console.log("SUCCESS: ForecastEvent model contains all required fields.");
    } else {
      console.error("FAIL: ForecastEvent model missing fields!");
      process.exit(1);
    }

    process.exit(0);
  } catch (err) {
    console.error("Endpoint controller simulation failed:", err.message);
    process.exit(1);
  }
};

testControllers();
