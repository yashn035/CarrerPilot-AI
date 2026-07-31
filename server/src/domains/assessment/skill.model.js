import mongoose from 'mongoose';

const SkillSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  // Each topic: { mean, variance, trials } for a Beta distribution (Thompson Sampling)
  skills: {
    type: Map,
    of: {
      mean: { type: Number, default: 0.5 },      // estimated success probability
      variance: { type: Number, default: 0.1 },  // uncertainty
      trials: { type: Number, default: 0 },      // total attempts
      successes: { type: Number, default: 0 },   // correct answers
    },
    default: {}
  },
  // Last updated timestamp
  updatedAt: { type: Date, default: Date.now }
});

export const Skill = mongoose.model('Skill', SkillSchema);
