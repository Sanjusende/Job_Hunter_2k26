const mongoose = require('mongoose');

const JobListingSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: [true, 'Job ID is required'],
      unique: true,
      index: true,
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      index: true
    },
    company: {
      type: String,
      trim: true,
      default: 'Confidential'
    },
    location: {
      type: String,
      trim: true,
      default: 'Remote'
    },
    description: {
      type: String,
      default: ''
    },
    source: {
      type: String,
      trim: true,
      default: 'Aggregator'
    },
    applyUrl: {
      type: String,
      trim: true,
      default: '#'
    },
    salary: {
      type: String,
      trim: true,
      default: null
    },
    postedAt: {
      type: Date,
      default: Date.now
    },
    // TTL index for automated MongoDB cleanup after 14 days
    createdAt: {
      type: Date,
      expires: '14d',
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Text indexes to accelerate keyword search & description scanning
JobListingSchema.index({ title: 'text', description: 'text', company: 'text' });

module.exports = mongoose.model('JobListing', JobListingSchema);
