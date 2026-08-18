const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  readAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  }
}, {
  timestamps: true,
  collection: 'messages',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
MessageSchema.index({ conversationId: 1 });

// Backward compatibility virtuals/getters/setters
MessageSchema.virtual('conversation').get(function() {
  return this.conversationId;
}).set(function(v) {
  this.conversationId = v;
});

MessageSchema.virtual('sender').get(function() {
  return this.senderId;
}).set(function(v) {
  this.senderId = v;
});

MessageSchema.virtual('receiver').get(function() {
  return this.receiverId;
}).set(function(v) {
  this.receiverId = v;
});

module.exports = mongoose.model('Message', MessageSchema);
