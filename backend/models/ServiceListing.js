const mongoose = require('mongoose');

const ServiceListingSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  rateType: {
    type: String,
    enum: ['daily', 'package'],
    required: true,
    default: 'daily'
  },
  rateAmount: {
    type: String,
    required: true,
    trim: true
  },
  packageDuration: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('ServiceListing', ServiceListingSchema);
