const mongoose = require('mongoose');

const ProviderProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
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
  rating: {
    type: Number,
    default: 5.0,
    min: 0,
    max: 5
  },
  experienceYears: {
    type: Number,
    default: 0
  },
  embedding: {
    type: [Number],
    default: null
  }
}, {
  timestamps: true,
  collection: 'providerProfiles'
});

module.exports = mongoose.model('ProviderProfile', ProviderProfileSchema);
