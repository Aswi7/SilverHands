const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  opportunityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest',
    required: false
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['applied', 'contacted', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'applied'
  },
  confirmedTerms: {
    rate: { type: Number },
    date: { type: String },
    time: { type: String },
    taskDescription: { type: String }
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  providerConfirmedComplete: {
    type: Boolean,
    default: false
  },
  employerConfirmedComplete: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
