const mongoose = require('mongoose');

const UserProfileSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    name: {
      type: String,
      trim: true,
      default: 'Job Seeker'
    },
    extractedSkills: {
      type: [String],
      default: []
    },
    experienceLevel: {
      type: String,
      enum: ['Entry', 'Mid', 'Senior', 'Lead', 'Unknown'],
      default: 'Mid'
    },
    preferredLocations: {
      type: [String],
      default: []
    },
    targetRoles: {
      type: [String],
      default: []
    },
    resumeRawText: {
      type: String,
      default: ''
    },
    matchThreshold: {
      type: Number,
      default: 70,
      min: 0,
      max: 100
    },
    lastJobAlertSent: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Helpful instance method to check if user is eligible for a new job alert digest
UserProfileSchema.methods.isEligibleForAlert = function (cooldownHours = 24) {
  if (!this.lastJobAlertSent) return true;
  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  return Date.now() - new Date(this.lastJobAlertSent).getTime() > cooldownMs;
};

module.exports = mongoose.model('UserProfile', UserProfileSchema);
