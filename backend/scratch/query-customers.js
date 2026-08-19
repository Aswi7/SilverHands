const dotenv = require('dotenv');
dotenv.config({ path: 'backend/.env' });

const mongoose = require('mongoose');
const User = require('../models/User');

const query = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/silverhands_local');
    const customers = await User.find({ role: 'customer' });
    console.log("Found customers:");
    customers.forEach(c => {
      console.log(`ID: ${c._id} | Name: "${c.name}" | Email: "${c.email}" | Phone: "${c.phone}" | City: "${c.city}"`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

query();
