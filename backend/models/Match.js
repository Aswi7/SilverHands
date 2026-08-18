const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  opportunity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest',
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  scoreBreakdown: {
    skillSimilarity: { type: Number, default: 0 },
    proximityScore: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    experienceLevel: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CONTACTED', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  },
  respondedAt: { type: Date },
  acceptedAt: { type: Date },
  rejectedAt: { type: Date },
  contactedAt: { type: Date }
}, { timestamps: true });

// Ensure we don't duplicate matches for the same provider + opportunity
MatchSchema.index({ opportunity: 1, provider: 1 }, { unique: true });

// Index for querying matches by opportunity sorted by score
MatchSchema.index({ opportunity: 1, score: -1 });

module.exports = mongoose.model('Match', MatchSchema);
