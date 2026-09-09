import mongoose from 'mongoose';

const ResumeResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    default: null
  },
  jobTitle: {
    type: String,
    default: 'General Software Engineer'
  },
  jobDescription: {
    type: String,
    default: ''
  },
  overallScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  breakdown: {
    formattingScore: { type: Number, default: 0 },
    keywordScore: { type: Number, default: 0 },
    contentScore: { type: Number, default: 0 },
    impactScore: { type: Number, default: 0 }
  },
  foundKeywords: [{ type: String }],
  missingKeywords: [{ type: String }],
  bulletSuggestions: [{
    original: { type: String },
    improved: { type: String },
    reason: { type: String }
  }],
  sectionFeedback: {
    summary: { type: String, default: '' },
    experience: { type: String, default: '' },
    skills: { type: String, default: '' },
    education: { type: String, default: '' }
  },
  rawParsedText: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export const ResumeResult = mongoose.models.ResumeResult || mongoose.model('ResumeResult', ResumeResultSchema);
export default ResumeResult;
