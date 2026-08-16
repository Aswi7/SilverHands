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
  customer: {
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
  location: {
    type: PointSchema,
    required: true
  },
  rate: {
    type: String,
    trim: true,
    default: 'Negotiable'
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
  }
}, { timestamps: true });

// Index location for geo searches
ServiceRequestSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('ServiceRequest', ServiceRequestSchema);
