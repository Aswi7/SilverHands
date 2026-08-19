const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    default: ''
  }
}, { 
  timestamps: true,
  collection: 'reviews'
});

// Enforce single review per customer + provider + match at database layer
reviewSchema.index({ reviewerId: 1, targetUserId: 1, applicationId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
