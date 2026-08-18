const mongoose = require('mongoose');
const User = require('../models/User');

const run = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/silverhands_local');
    console.log('MongoDB Connected.');

    const res = await User.findOneAndUpdate(
      { phone: '6708904503' },
      { role: 'customer' },
      { new: true }
    );
    if (!res) {
      console.log('User not found.');
    } else {
      console.log(`Successfully updated User 6708904503 role to: ${res.role}`);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
