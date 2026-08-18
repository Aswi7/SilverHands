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
    required: false
  },
  role: { 
    type: String, 
    enum: ['provider', 'customer', 'employer'],
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
  // Legacy / Embedded provider fields for backward compatibility
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
    trim: true,
    default: ''
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
}, { 
  timestamps: true,
  collection: 'users',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate reference to ProviderProfile
UserSchema.virtual('providerProfile', {
  ref: 'ProviderProfile',
  localField: '_id',
  foreignField: 'userId',
  justOne: true
});

// Indexes
UserSchema.index({ location: '2dsphere' });
UserSchema.index({ role: 1 });

module.exports = mongoose.model('User', UserSchema);
