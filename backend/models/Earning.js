const mongoose = require('mongoose');

const EarningSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
    unique: true // Idempotence check at database level
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  serviceName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'COMPLETED'
  },
  paymentReceived: {
    type: Boolean,
    default: true
  },
  earnedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'earnings'
});

module.exports = mongoose.model('Earning', EarningSchema);
