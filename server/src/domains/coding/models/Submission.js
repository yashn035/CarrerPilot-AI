import mongoose from 'mongoose';

const SubmissionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  problemId: { type: String, required: true, index: true },
  code: { type: String, required: true },
  language: { type: String, required: true },
  passed: { type: Boolean, required: true },
  passedCount: { type: Number, default: 0 },
  totalCount: { type: Number, default: 0 },
  runtimeMs: { type: Number, default: 0 },
  memoryMb: { type: Number, default: 0 },
  error: { type: String },
  autopsy: {
    timeComplexity: { type: String, default: 'O(N)' },
    spaceComplexity: { type: String, default: 'O(1)' },
    explanation: { type: String, default: '' },
    runtimePercentile: { type: Number, default: 85 },
    followUpQuestions: [{ type: String }]
  }
}, { timestamps: true });

export const Submission = mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema);
export default Submission;
