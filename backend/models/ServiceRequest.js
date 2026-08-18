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

const ServiceRequestSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
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
  rate: {
    type: String,
    trim: true,
    default: 'Negotiable'
  },
  timing: {
    type: String,
    trim: true,
    default: 'Not specified'
  },
  mode: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'completed', 'cancelled'],
    default: 'pending'
  },
  embedding: {
    type: [Number],
    default: null
  }
}, { 
  timestamps: true,
  collection: 'customerRequests',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Alias & Populate Virtuals
ServiceRequestSchema.virtual('customerUser', {
  ref: 'User',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

// Indexes
ServiceRequestSchema.index({ location: '2dsphere' });
ServiceRequestSchema.index({ customerId: 1 });
ServiceRequestSchema.index({ status: 1 });

module.exports = mongoose.model('ServiceRequest', ServiceRequestSchema);
