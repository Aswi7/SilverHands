const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
}, { 
  timestamps: true,
  collection: 'matches',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound Unique Index: Prevent duplicate matches for customerId + providerId + requestId
MatchSchema.index({ customerId: 1, providerId: 1, requestId: 1 }, { unique: true });

// Single Field Indexes
MatchSchema.index({ customerId: 1 });
MatchSchema.index({ providerId: 1 });
MatchSchema.index({ requestId: 1 });
MatchSchema.index({ status: 1 });
MatchSchema.index({ requestId: 1, score: -1 });

// Backward compatibility virtuals/getters/setters
MatchSchema.virtual('opportunity').get(function() {
  return this.requestId;
}).set(function(v) {
  this.requestId = v;
});

MatchSchema.virtual('provider').get(function() {
  return this.providerId;
}).set(function(v) {
  this.providerId = v;
});

MatchSchema.virtual('customer').get(function() {
  return this.customerId;
}).set(function(v) {
  this.customerId = v;
});

module.exports = mongoose.model('Match', MatchSchema);
