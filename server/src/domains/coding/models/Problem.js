import mongoose from 'mongoose';

const ProblemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  titleSlug: { type: String, unique: true, required: true },
  acceptance: { type: Number, default: 50.0 },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  category: { type: String, required: true, default: 'Algorithms' },
  tags: [{ type: String }],
  description: { type: String, required: true },
  examples: [{
    input: String,
    output: String,
    explanation: String
  }],
  constraints: [{ type: String }],
  starterCode: {
    javascript: String,
    python: String,
    java: String,
    cpp: String
  },
  testCases: [{
    input: String,
    expectedOutput: String,
    isHidden: { type: Boolean, default: false }
  }]
}, { timestamps: true });

export const Problem = mongoose.models.Problem || mongoose.model('Problem', ProblemSchema);
export default Problem;
