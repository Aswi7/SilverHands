const mongoose = require('mongoose');

const PointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
    default: 'Point'
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true
  }
});

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  phone: { 
    type: String, 
    required: true,
    unique: true,
    trim: true 
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  password: { 
    type: String, 
    required: false // Optional now because we use OTP
  }, // hashed password (legacy)
  role: { 
    type: String, 
    enum: ['provider', 'customer', 'employer'], // Support both legacy customer and new employer role aliases
    required: true 
  },
  age: {
    type: Number,
    required: false
  },
  category: {
    type: String,
    enum: ['senior_citizen', 'homemaker', 'both', 'none'],
    required: false
  },
  preferredLanguage: { 
    type: String, 
    enum: ['en', 'hi', 'ta'], 
    default: 'en' 
  },
  city: {
    type: String,
    trim: true,
    lowercase: true,
    default: 'delhi'
  },
  location: {
    type: PointSchema,
    required: true
  },
  // Provider-specific fields (optional, active only if role is 'provider')
  skills: {
    type: [{
      category: { type: String, trim: true },
      skillName: { type: String, trim: true },
      experienceLevel: { type: String, trim: true },
      confidence: { type: Number, min: 0, max: 1 }
    }],
    default: []
  },
  bio: {
    type: String,
    trim: true
  },
  availability: {
    type: Boolean,
    default: true
  },
  embedding: {
    type: [Number],
    default: null
  },
  isOnboarded: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Index location for geospatial queries
UserSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', UserSchema);
