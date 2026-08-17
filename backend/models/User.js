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
    required: true 
  }, // hashed password
  role: { 
    type: String, 
    enum: ['provider', 'customer'], 
    required: true 
  },
  preferredLanguage: { 
    type: String, 
    enum: ['en', 'hi', 'ta'], 
    default: 'en' 
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
  }
}, { timestamps: true });

// Index location for geospatial queries
UserSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', UserSchema);
