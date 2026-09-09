import mongoose from 'mongoose';

const OASessionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  company: { type: String, default: 'General' },
  problems: [{ type: Object }], // Store problem objects or problemIds
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  answers: { type: Object, default: {} }, // problemId -> { code, language }
  warnings: { type: Number, default: 0 }, // focus lost / tab switch warnings
  score: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  report: {
    passedProblemsCount: { type: Number, default: 0 },
    totalProblemsCount: { type: Number, default: 3 },
    feedback: String
  }
}, { timestamps: true });

export const OASession = mongoose.models.OASession || mongoose.model('OASession', OASessionSchema);
export default OASession;
