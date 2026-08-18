const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastMessage: {
    type: String,
    default: ''
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'conversations',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
ConversationSchema.index({ matchId: 1 }, { unique: true });
ConversationSchema.index({ customerId: 1 });
ConversationSchema.index({ providerId: 1 });
ConversationSchema.index({ customerId: 1, providerId: 1 });

// Backward compatibility virtuals/getters/setters
ConversationSchema.virtual('match').get(function() {
  return this.matchId;
}).set(function(v) {
  this.matchId = v;
});

ConversationSchema.virtual('customer').get(function() {
  return this.customerId;
}).set(function(v) {
  this.customerId = v;
});

ConversationSchema.virtual('provider').get(function() {
  return this.providerId;
}).set(function(v) {
  this.providerId = v;
});

module.exports = mongoose.model('Conversation', ConversationSchema);
