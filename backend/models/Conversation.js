const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
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
  timestamps: true
});

// Ensure a single conversation per match between customer and provider
ConversationSchema.index({ match: 1, customer: 1, provider: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', ConversationSchema);
