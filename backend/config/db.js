const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Primary Connection Error: ${error.message}`);
    console.log('Attempting to fallback to local MongoDB instance...');
    try {
      const localUri = 'mongodb://127.0.0.1:27017/silverhands_local';
      const localConn = await mongoose.connect(localUri);
      console.log(`MongoDB Fallback Connected: ${localConn.connection.host}`);
    } catch (localError) {
      console.error(`MongoDB Fallback Connection Error: ${localError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
