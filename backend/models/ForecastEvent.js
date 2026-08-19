const mongoose = require('mongoose');

const ForecastEventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  religion: {
    type: String,
    trim: true,
    default: 'None' // None, Hindu, Islamic, Christian, Sikh, Buddhist, Jain, etc.
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  region: {
    type: String,
    default: 'National' // National, South India, North India, Region-specific
  },
  description: {
    type: String,
    required: true
  },
  expectedDemand: {
    type: String,
    default: '+25%'
  },
  affectedServices: {
    type: [String],
    default: []
  },
  source: {
    type: String,
    default: 'Verified Calendar System'
  }
}, {
  timestamps: true,
  collection: 'forecast_events'
});

module.exports = mongoose.model('ForecastEvent', ForecastEventSchema);
