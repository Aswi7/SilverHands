const dotenv = require('dotenv');
dotenv.config({ path: 'backend/.env' });

const mongoose = require('mongoose');
const User = require('../models/User');

const restore = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/silverhands_local');
    
    // Find the user with phone "8908908908" or the customer ID we saw
    const user = await User.findById("6a849eb9cf7d18592ac7f771");
    if (user) {
      user.name = "Arya";
      user.city = "coimbatore"; // Or delhi, we can keep coimbatore since the user requested
      await user.save();
      console.log(`SUCCESS: Restored customer name to "${user.name}"`);
    } else {
      console.log("Customer not found.");
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

restore();
